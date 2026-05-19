/**
 * 내 GitHub 계정의 레포를 조회해 skills.json을 자동 업데이트하는 스크립트.
 *
 * 탐색 기준 (skills.json의 auto_discover 설정):
 *   - topics       : 해당 GitHub topic이 붙은 레포
 *   - name_contains: 이름에 해당 문자열이 포함된 레포
 *
 * 새 레포는 기본 emoji로 추가되고, 기존 항목의 emoji/desc 오버라이드는 유지됩니다.
 * archived / private 레포는 자동 제외됩니다.
 */

const fs   = require('fs');
const path = require('path');

const SKILLS_FILE   = path.resolve(__dirname, '../skills.json');
const TOKEN         = process.env.GITHUB_TOKEN;
const DEFAULT_EMOJI = '✨';

async function ghFetch(url) {
  const headers = { 'X-GitHub-Api-Version': '2022-11-28' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} — ${url}`);
  return res.json();
}

/** 내 계정의 public 레포 전체를 페이지네이션으로 가져옵니다. */
async function fetchMyRepos(githubUser) {
  const repos = [];
  let page = 1;
  while (true) {
    const data = await ghFetch(
      `https://api.github.com/users/${githubUser}/repos?per_page=100&page=${page}&type=public`
    );
    if (!Array.isArray(data) || data.length === 0) break;
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return repos;
}

function matchesDiscoverRules(repo, autoDiscover) {
  if (repo.archived || repo.private) return false;

  const topics = repo.topics ?? [];
  if (autoDiscover.topics?.some(t => topics.includes(t))) return true;

  const name = repo.name.toLowerCase();
  if (autoDiscover.name_contains?.some(kw => name.includes(kw.toLowerCase()))) return true;

  return false;
}

async function main() {
  const config = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf8'));
  const { github_user, auto_discover, skills } = config;

  console.log(`[sync] ${github_user} 계정의 레포를 조회합니다…`);
  const myRepos = await fetchMyRepos(github_user);
  console.log(`[sync] public 레포 ${myRepos.length}개 발견`);

  const existingRepos = new Set(skills.map(s => s.repo));
  let added = 0;

  for (const repo of myRepos) {
    if (!matchesDiscoverRules(repo, auto_discover)) continue;
    if (existingRepos.has(repo.name)) continue;

    skills.push({ repo: repo.name, emoji: DEFAULT_EMOJI });
    existingRepos.add(repo.name);
    console.log(`  + 추가: ${repo.name}`);
    added++;
  }

  if (added === 0) {
    console.log('[sync] 새 레포 없음. skills.json이 최신 상태입니다.');
    return;
  }

  config.skills = skills;
  fs.writeFileSync(SKILLS_FILE, JSON.stringify(config, null, 2) + '\n');
  console.log(`[sync] 완료 — ${added}개 레포 추가됨.`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
