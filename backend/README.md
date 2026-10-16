# Red Bull TUT API

Express 5 and TypeScript API. See the repository [README](../README.md) for full setup.

```powershell
Copy-Item .env.example .env
npm ci --ignore-scripts
npm run migrate
npm run seed
npm run dev
```

Required at API startup: `DATABASE_URL`, a 32+ character `JWT_ACCESS_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `CLIENT_ORIGIN`, and `ADMIN_ORIGIN`. Cloudinary values are required only for signed uploads. Bootstrap administrators with `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME`, and a 16+ character `INITIAL_ADMIN_PASSWORD` set in the process environment, then run `npm run create-admin`.

- `npm test` — unit and schema tests.
- `npm run typecheck` — strict TypeScript check.
- `npm run build` — compile to `dist/`.
- `npm start` — run the compiled server.

Never expose the Cloudinary API secret or JWT secret to either frontend.
