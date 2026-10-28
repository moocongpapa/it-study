<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 작업 하네스 (이 프로젝트의 필수 절차)

- 코드·콘텐츠를 바꾸면 끝내기 전에 `npm run harness`를 실행해 통과시킨다. 배포 직전에는 `npm run harness:full`.
- 커밋·푸시는 항상 `main`에 한다 (`origin` = github.com/moocongpapa/it-study). 푸시 전에 하네스를 통과해야 하며, 훅이 통과 기록 없는 `git push`를 막는다.
- 푸시 후 `npm run harness:deploy`로 Vercel 프로덕션 배포(READY)를 확인하고 사용자에게 보고한다.
- 자세한 절차와 영역별 검증은 `.agents/skills/release-harness/SKILL.md`를 따른다.
- 디자인은 화이트 톤의 단순·플랫 스타일을 유지한다 (그라디언트·글로우·네온 금지). 학습에 불필요한 요소는 넣지 않는다.
