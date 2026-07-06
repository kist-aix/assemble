/**
 * skills.json을 기준으로 각 레포의 GitHub 정보·README를 미리 조회해
 * 정적 파일(data.json, readme/<repo>.md)로 굽는 스크립트.
 *
 * 목적: 방문자 브라우저가 GitHub API를 직접 호출하지 않게 하여
 *       rate limit(토큰 없는 IP당 시간당 60회) 문제를 근본적으로 제거한다.
 *       API 호출은 이 스크립트(워크플로우, GITHUB_TOKEN 사용, 5,000회/시간)가 대신 수행한다.
 *
 * 산출물:
 *   data.json          — 카드 그리드 렌더링에 필요한 모든 메타데이터
 *   readme/<repo>.md    — 레포별 README 원문 (카드 클릭 시 로드)
 */

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const SKILLS_FILE = path.join(ROOT, 'skills.json');
const DATA_FILE   = path.join(ROOT, 'data.json');
const README_DIR  = path.join(ROOT, 'readme');
const TOKEN       = process.env.GITHUB_TOKEN;

const SYSTEM_TOPICS = new Set(['skill', 'harness', 'claude', 'claude-code']);

function authHeaders(extra = {}) {
  const headers = { 'X-GitHub-Api-Version': '2022-11-28', ...extra };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  return headers;
}

async function ghFetch(url) {
  const res = await fetch(url, { headers: authHeaders({ Accept: 'application/vnd.github+json' }) });
  if (!res.ok) throw new Error(`GitHub API ${res.status} — ${url}`);
  return res.json();
}

async function fetchReadme(owner, repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers: authHeaders({ Accept: 'application/vnd.github.raw' }) }
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function getCategory(topics) {
  if (topics.includes('skill'))   return 'skill';
  if (topics.includes('harness')) return 'harness';
  return null;
}

function getSubTags(skill, topics) {
  if (skill.tags?.length) return skill.tags;
  return topics.filter(t => !SYSTEM_TOPICS.has(t));
}

/** README 원문에서 첫 H1 텍스트만 추출 (설명 폴백용) */
function readmeH1(text) {
  if (!text) return null;
  const m = text.match(/^#\s+(.+)$/m);
  if (!m) return null;
  return m[1]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
}

async function main() {
  const config = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf8'));
  const owner  = config.github_user;
  const skills = config.skills ?? [];

  if (!TOKEN) console.warn('[build-data] ⚠️  GITHUB_TOKEN 없음 — rate limit(60/시간)에 걸릴 수 있습니다.');
  console.log(`[build-data] ${owner} 계정의 스킬 ${skills.length}개를 굽습니다…`);

  // readme 디렉터리 초기화 (삭제된 스킬의 잔여 파일 제거)
  fs.rmSync(README_DIR, { recursive: true, force: true });
  fs.mkdirSync(README_DIR, { recursive: true });

  const built = [];

  for (const skill of skills) {
    const repo = skill.repo;
    try {
      const info   = await ghFetch(`https://api.github.com/repos/${owner}/${repo}`);
      // fork면 원본(parent)의 별·설명을 대표값으로 사용 (기존 브라우저 로직과 동일)
      const source = info.fork && info.parent ? info.parent : info;

      const readme = await fetchReadme(owner, repo);
      const hasReadme = !!readme;
      if (hasReadme) {
        fs.writeFileSync(path.join(README_DIR, `${repo}.md`), readme);
      }

      const topics = info.topics ?? [];
      const desc = skill.desc || source.description || readmeH1(readme) || '설명이 없습니다.';

      built.push({
        repo,
        emoji: skill.emoji ?? '✨',
        name: info.name ?? repo,
        desc,
        stars: source.stargazers_count ?? 0,
        category: getCategory(topics),
        subTags: getSubTags(skill, topics),
        url: `https://github.com/${owner}/${repo}`,
        hasReadme,
      });
      console.log(`  ✓ ${repo} [${getCategory(topics) ?? '분류없음'}] ★${source.stargazers_count ?? 0}`);
    } catch (err) {
      // 조회 실패해도 최소 정보로 카드는 나오게 (skills.json 값 사용)
      console.log(`  ! ${repo} — 조회 실패(${err.message}), 폴백 값 사용`);
      built.push({
        repo,
        emoji: skill.emoji ?? '✨',
        name: repo,
        desc: skill.desc || '설명을 불러오지 못했습니다.',
        stars: 0,
        category: null,
        subTags: skill.tags ?? [],
        url: `https://github.com/${owner}/${repo}`,
        hasReadme: false,
      });
    }
  }

  const data = { github_user: owner, skills: built };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`[build-data] 완료 — data.json + readme/ 생성 (${built.length}개)`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
