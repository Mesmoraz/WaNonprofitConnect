# The app

The React app people use. It is built into the API's `wwwroot` and served by the API (`../src/WaNonprofitConnect.Api`).

- Node 22.12 or newer (`../.nvmrc`), then `npm ci`.
- `npm run dev`: http://localhost:5173, calling the API on http://localhost:5253. `npm run dev:mock` runs without the API.
- `npm run lint`, `npm run build`.
- `npm run test:e2e:local`: builds, starts the API from this checkout (or uses one already on 5253), runs the acceptance tests in `e2e/`.

The handoff, local setup notes and where everything else is: `../docs/CONTINUE.md`. Scope and the API contract: `../docs/ALPHA.md`.
