# Development Skills and Repository Review

Reviewed on 2026-10-15. No external skill package was installed or executed; the workspace was empty and the current VS Code agent already supplied compatible engineering workflows.

## Requested repositories

- [Ponytail](https://github.com/DietrichGebert/ponytail): current README, `skills/ponytail/SKILL.md`, and MIT license reviewed. Applied the smallest complete-change approach while retaining validation, security, accessibility and tests.
- [OmniRoute](https://github.com/diegosouzapw/OmniRoute): README and MIT license reviewed. It is an AI gateway with unrelated routing/provider/runtime concerns; no runtime, API, or infrastructure was added to Red Bull TUT.
- [Graphify](https://github.com/Graphify-Labs/graphify): README install instructions and Apache-2.0 license reviewed. It uses local tree-sitter parsing and supports Windows, but the initial workspace was empty, so graph mapping would not add useful context. It is not an application dependency.
- [Agent Skills](https://github.com/addyosmani/agent-skills): README, MIT license, and current `frontend-ui-engineering`, `api-and-interface-design`, `security-and-hardening`, and `test-driven-development` skill files reviewed. Relevant ideas used: API contracts first, validate trust boundaries, test logic, accessible responsive UI and verify builds. Skills were not installed.

## Official product docs consulted

- Next.js App Router installation and Cache Components rendering guidance, `nextjs.org/docs/app/getting-started/installation`.
- Express 5 migration/runtime behavior, `expressjs.com/en/guide/migrating-5.html`.
- `pg` Pool lifecycle and query guidance, `node-postgres.com/features/pooling`.
- Cloudinary signed uploads and Node SDK, `cloudinary.com/documentation/upload_images` and `cloudinary.com/documentation/node_image_and_video_upload`.
- shadcn/ui Next.js installation page was requested, but the documentation fetch returned no extractable content. The apps include `components.json` and a minimal reusable Button primitive using the documented shadcn-style dependencies.
- Neon connection documentation redirected during retrieval; no Neon runtime code was copied from an unverified page. Database access uses the documented `pg` pool.

## Validation actually performed

- `client`: repeated `npm run build` checks; latest build passed.
- `admin`: repeated `npm run build` checks; latest build passed.
- `backend`: strict TypeScript check, production compile and 13 unit/schema tests passed with Vitest 4.1.11.
- `client` and `admin`: ESLint and production builds passed after adding the shadcn Button primitive.
- All installs used `--ignore-scripts` because npm 11 rejected unapproved lifecycle scripts in this environment.
- Backend `npm audit` reports zero vulnerabilities after the Vitest update. Client/admin audits still report five high-severity findings in the development-only Next ESLint dependency chain (`fast-glob` → `micromatch` → `braces`); npm proposes downgrading `eslint-config-next` to 14.2.35, which was not applied. The registry currently has no patched `braces` release.

No Graphify CLI, Agent Skills package, Ponytail plugin, or OmniRoute runtime was installed.
