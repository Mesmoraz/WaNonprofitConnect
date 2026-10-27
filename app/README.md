# The app

The React app people use. It is built into the API's `wwwroot` and served by the API (`../src/WaNonprofitConnect.Api`).

- Node 22.12 or newer (`../.nvmrc`), then `npm ci`.
- `npm run dev`: http://localhost:5173, calling the API on http://localhost:5253. `npm run dev:mock` runs without the API.
- **The demo, dev:mock and the map test page (`/map-dev.html`) share one seed**, `src/api/mock/data.ts`. How much of it shows is the demo's settings (`src/api/mock/settings.ts`): pick a preset or change any setting in Admin, or from the demo bar's Settings while in the demo. Links take the same settings, as in `/admin?demo=busy&waiting=0` (on the real site only an admin's Admin page reads them) or `/map-dev.html?demo=hard`.
- `npm run lint`, `npm run build`.
- `npm run test:e2e:local`: builds, starts the API from this checkout (or uses one already on 5253), runs the acceptance tests in `e2e/`.
- `npm run test:e2e:fresh`: the same on an empty test database with the 13 sample organizations, as on GitHub (`../scripts/e2e-fresh.js`).

The handoff, local setup notes and where everything else is: `../docs/CONTINUE.md`. Scope and the API contract: `../docs/ALPHA.md`.
