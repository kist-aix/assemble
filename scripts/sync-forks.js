/**
 * skills.json에 등록된 fork 레포들을 원본(upstream)과 자동으로 싱크합니다.
 *
 * 동작:
 *   1. skills.json의 각 repo에 대해 GitHub API로 레포 정보를 조회
 *   2. fork가 아니면 건너뜀 (원본 레포는 싱크 대상이 아님)
 *   3. fork면 GitHub의 merge-upstream API로 기본 브랜치를 upstream과 맞춤
 *      (fast-forward 가능한 경우에만 반영됨 — 충돌 시 수동 처리 안내)
 *
 * 필요 토큰:
 *   FORK_SYNC_TOKEN — 대상 fork 레포들에 contents:write 권한이 있는 PAT/App 토큰.
 *   (워크플로우 기본 GITHUB_TOKEN은 이 레포에만 쓰기 가능하므로 사용 불가)
 */

const fs   = require('fs');
const path = require('path');

const SKILLS_FILE = path.resolve(__dirname, '../skills.json');
const TOKEN       = process.env.FORK_SYNC_TOKEN || process.env.GITHUB_TOKEN;

function authHeaders(extra = {}) {
  const headers = { 'X-GitHub-Api-Version': '2022-11-28', ...extra };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  return headers;
}

async function getRepoInfo(owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: authHeaders({ Accept: 'application/vnd.github+json' }),
  });
  if (!res.ok) throw new Error(`레포 조회 실패 (${res.status})`);
  return res.json();
}

/** merge-upstream API로 fork의 branch를 upstream과 맞춤 */
async function mergeUpstream(owner, repo, branch) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/merge-upstream`,
    {
      method: 'POST',
      headers: authHeaders({ Accept: 'application/vnd.github+json' }),
      body: JSON.stringify({ branch }),
    }
  );
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const config = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf8'));
  const owner  = config.github_user;
  const skills = config.skills ?? [];

  if (!TOKEN) {
    console.warn('[sync-forks] ⚠️  토큰이 없습니다. 인증 없이 진행하면 쓰기 작업이 실패합니다.');
  }

  console.log(`[sync-forks] ${owner} 계정의 fork ${skills.length}개를 점검합니다…\n`);

  const summary = { synced: [], upToDate: [], skipped: [], conflict: [], error: [] };

  for (const skill of skills) {
    const repo = skill.repo;
    try {
      const info = await getRepoInfo(owner, repo);

      if (!info.fork) {
        console.log(`  ○ ${repo} — fork 아님, 건너뜀`);
        summary.skipped.push(repo);
        continue;
      }

      const branch = info.default_branch;
      const { status, body } = await mergeUpstream(owner, repo, branch);

      if (status === 200) {
        const type = body.merge_type; // 'fast-forward' | 'merge' | 'none'
        if (type === 'none') {
          console.log(`  ✓ ${repo} (${branch}) — 이미 최신`);
          summary.upToDate.push(repo);
        } else {
          console.log(`  ⬆ ${repo} (${branch}) — 싱크됨 [${type}]`);
          summary.synced.push(repo);
        }
      } else if (status === 409) {
        // 충돌 — fast-forward 불가 (fork에 독자 커밋이 있는 경우)
        console.log(`  ✗ ${repo} (${branch}) — 충돌, 수동 병합 필요`);
        summary.conflict.push(repo);
      } else {
        console.log(`  ! ${repo} — 실패 (${status}): ${body.message ?? ''}`);
        summary.error.push(repo);
      }
    } catch (err) {
      console.log(`  ! ${repo} — 오류: ${err.message}`);
      summary.error.push(repo);
    }
  }

  console.log('\n[sync-forks] 요약');
  console.log(`  싱크됨   : ${summary.synced.length}  ${summary.synced.join(', ')}`);
  console.log(`  최신     : ${summary.upToDate.length}`);
  console.log(`  건너뜀   : ${summary.skipped.length}  ${summary.skipped.join(', ')}`);
  console.log(`  충돌     : ${summary.conflict.length}  ${summary.conflict.join(', ')}`);
  console.log(`  오류     : ${summary.error.length}  ${summary.error.join(', ')}`);

  // 충돌·오류는 실패로 처리하지 않음(워크플로우가 계속 돌도록). 로그로만 노출.
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
