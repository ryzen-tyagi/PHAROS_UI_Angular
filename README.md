# PHAROS_UI_Angular

An **Angular 20** reimplementation of the PHAROS dashboard frontend — a pixel-for-pixel,
behavior-identical port of the original **React + Vite** app (`PHAROS_UI`). It's a drop-in
frontend for the same PHAROS backend (Node / Python — same REST + Socket.IO contract, same
auth, same routes).

## Stack
- **Angular 20** — standalone components, **signals** (no NgRx), new control flow (`@if`/`@for`)
- **Tailwind CSS 3** + the original shadcn theme (CSS variables ported verbatim) + `tailwindcss-animate`
- **highcharts-angular** (KPI gauges + line charts) · **d3** (system-flow schematics + TES tank animation)
- **socket.io-client** (real-time KPI/sensor/alarm streams) · **lucide-angular** icons · Angular CDK
- **Jasmine + Karma** unit tests (ChromeHeadless)

## Architecture (React → Angular mapping)
| React | Angular |
|---|---|
| Redux Toolkit slices (auth/modes/kpi) | 3 signal services: `state/{auth,modes,kpi}.service.ts` |
| `createAsyncThunk` | async service methods updating signals |
| axios + interceptors | `HttpClient` + `core/auth.interceptor.ts` (Bearer + 401→logout) |
| `socket.io-client` per component | `core/socket.service.ts` (per-component lifecycle) |
| `BroadcastChannel` cross-tab | `core/mode-channel.service.ts` |
| react-router | Angular Router (`app.routes.ts`, same paths) |
| Highcharts / D3 | `highcharts-angular` / d3 in `ngAfterViewInit` |

Routes (identical to React): `/v1/login`, `/v1/landing-page`, `/v1/operations-dashboard`,
`/v1/waste-heat-configurator`, `/v1/kpi/:id`, `**` → login.

## Backend endpoints
`src/environments/environment.ts` holds `BACKENDS = { prod, local(:7002), localNode(:7001) }`.
Switch the whole app (REST + Socket.IO) by changing the one-line `ACTIVE` constant.
Default is `prod` (`103.204.95.215:7001`), matching the React app.

## Run
```bash
npm install
npm start          # dev server on http://localhost:7011  (beside React :7010)
npm run build      # production build -> dist/
npm test           # Jasmine + Karma (ChromeHeadlessNoSandbox)
```
Log in (against the local backends) with `operator@pharos.local` / `OperatorPharos!123`.

## Tests
26 specs covering the state services (login->token chain, changeMode->broadcast, live-data caps
100/500, clearPowerData), the auth interceptor (Bearer attach + 401 logout), the helper
(PST formatter, modeStyles), the speedometer gauge, the Login form, the Header clock/logout,
and the route table. `npm test` -> **26 SUCCESS**.

## Parity notes
Faithfully reproduces the React app's behavior, including its quirks: CSV-driven alarms
(`public/assets/alarms.csv`), hardcoded D3 temperature/flow sequences in the SFG/LPS schematics,
the UI-only configurator/setpoints, the 4 stub landing cards, and `window.open` full-screen KPIs.
Login + Landing + Operations Dashboard are screenshot-verified pixel-identical to the React app.
