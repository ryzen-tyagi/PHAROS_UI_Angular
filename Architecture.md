# PHAROS_UI_Angular — Architecture (Angular 20)

> A **pixel-identical Angular port** of the React/Vite PHAROS dashboard (`../PHAROS_UI`). Same design, same routes, same backend contract (REST + Socket.IO) — a drop-in frontend for the Node (`:7001`) / Python (`:7002`) / prod (`103.204.95.215:7001`) backend. Built with **Angular 20 standalone components + signals**, **Tailwind** (theme ported verbatim), **Highcharts** + **D3**, **socket.io-client**, and **Jasmine/Karma** tests. Repo: `github.com/ryzen-tyagi/PHAROS_UI_Angular`.

---

## 1. Tech Stack

| Concern | Choice |
|---|---|
| Framework | **Angular 20** — standalone components, **signals**, new control flow `@if/@for/@switch` |
| Routing | **Angular Router** (lazy `loadComponent`) |
| State | **3 injectable signal services** (mirrors the React Redux slices — *no NgRx*) |
| HTTP | **HttpClient** + a functional **auth interceptor** |
| Realtime | **socket.io-client** wrapped in `SocketService` |
| Charts | **highcharts-angular** (gauges + line charts) + **d3** (flow diagrams + TES animation) |
| UI / styling | **Tailwind CSS 3** + `tailwindcss-animate`, the React **CSS variables ported verbatim**; **@lucide/angular** icons; Angular CDK available |
| Tests | **Jasmine + Karma** (ChromeHeadless via puppeteer's Chromium) |

Entry: `src/main.ts` → `bootstrapApplication(App, appConfig)`. Dev server **:7011** (`npm start`). Angular auto-detects `tailwind.config.js`.

---

## 2. Design System (ported verbatim — the key to "looks the same")

- **`src/styles.css`** ← React `index.css`: the Inter `@import`, **every `:root`/`.dark` HSL CSS variable**, the gradient scrollbars, `dash-flow-hot/cold` keyframes, `.card-border`. Plus Angular-specific `display:block` host fixes (component hosts default to `inline`) and the `app-speedometer-gauge { width:100%; height:100% }` sizing fix.
- **`tailwind.config.js`** ← the React theme verbatim (`hsl(var(--*))` color map, `--radius`, `darkMode:["class"]`, `tailwindcss-animate`); content glob `./src/**/*.{html,ts}`.
- **`index.html`** — `<html class="dark">`, Inter font, title "PHAROS".
- **`shared/util/cn.ts`** — `clsx` + `tailwind-merge` (= React `lib/utils.ts`).

---

## 3. Directory Structure

```
src/
  main.ts, index.html, styles.css
  environments/environment.ts        endpoints: prod | local(:7002) | localNode(:7001); ACTIVE switch
  app/
    app.ts                           root: <router-outlet> + <app-toast-container>
    app.config.ts                    provideRouter + provideHttpClient(withInterceptors([authInterceptor]))
    app.routes.ts                    the 5 routes (lazy)
    core/
      api.service.ts                 HttpClient wrapper (= redux/api/Client.js)
      auth.interceptor.ts            Bearer attach + 401 logout (= axios interceptors)
      socket.service.ts              socket.io-client factory (connect() → Socket)
      mode-channel.service.ts        BroadcastChannel cross-tab (= utils/modeChannel.js)
    state/                           SIGNAL SERVICES (= redux slices)
      auth.service.ts                user/token/login/logout              (= authSlice)
      modes.service.ts               list/current/sim + changeMode        (= modesSlice)
      kpi.service.ts                 ppr/hrf/temp history + live setters   (= pprSlice)
      dashboard.service.ts           mode signal                          (= DashboardContext)
    layout/                          header, footer, global-layout, app-sidebar (full nav tree), sidebar.service
    pages/                           login, landing, operations-dashboard, full-screen-kpi, waste-heat-configurator
    features/
      kpi/                           speedometer-gauge, hrf, parasitic-power-ratio, tes-temperature (Highcharts);
                                     sfg, lps, tes, tes2, system-flow-d3-model (D3)
      dashboard/                     control-command-panel, kpis-forecasts, system-flow, diagnostics-asset-health, alarms-events
      configurator/                  digital-configurator, simulation-sidebar, step-progress-bar,
                                     system-parameters, simulation-parameter, run-simulation
    shared/                          toast (service + container), date-time-picker, anim (animated/fading value), util (cn, helper)
  *.spec.ts                          10 Jasmine specs (26 tests)
```

---

## 4. Backend Integration

**`environments/environment.ts`** is the single source of truth (mirrors React's `config/api.js`):
```ts
BACKENDS = { prod:{http,ws}, local:{http:`http://${host}:7002`,ws}, localNode:{...:7001} }
export const ACTIVE = 'prod';          // one-line switch
export const environment = { API_BASE, WS_BASE };
```
- **REST** (`core/api.service.ts`): `HttpClient` with `environment.API_BASE`, `get<T>(path, params)` / `post<T>(path, body)` returning Promises (`firstValueFrom`).
- **Auth interceptor** (`core/auth.interceptor.ts`): attaches `Authorization: Bearer <localStorage token>`; on `401` (or `"Invalid or expired token"`) clears the token and `window.location.href='/'` — exact port of the axios interceptors.
- **Socket** (`core/socket.service.ts`): `connect(opts={transports:['websocket']})` returns a fresh `Socket` per chart (mirrors React's per-component socket); components disconnect in `ngOnDestroy`.
- **Endpoints consumed:** `/v1/auth/login`, `/v1/modes/*`, `/api/simulation/{start,stop,status}`, `/v1/{ppr,hrf,sensor}/latest`. **Socket events:** `hrfData/pprData/sensorData` (live), `*HistoricalData` (seed), `powerMetrics`, `alarmsSnapshot`; emits `getSensorHistory`.

---

## 5. State — signal services (no NgRx)

| Service | = React slice | Holds (signals) / key methods |
|---|---|---|
| `AuthService` | authSlice | `user, token`; `login()` (stores token → `modes.fetchModes()` → `changeMode("Maintenance")`), `logout()` |
| `ModesService` | modesSlice | `list, current, simulationStatus, simulationStartStatus`; `fetchModes/fetchCurrentModes/changeMode/simulationStartAndStop/fetchSimulationStatus`; `changeMode` broadcasts via `ModeChannelService` |
| `KpiService` | pprSlice | `pprHistory, hrfHistory, tempHistory, latest*`; `fetchPprHistory/HrfHistory/TempHistory`; **`setLivePprData` (cap 100)**, **`setLiveHrfData` (cap 500)**, `clearPowerData` |
| `DashboardService` | DashboardContext | `mode` signal |

React→Angular idiom map: Redux store→signal services · thunk→async method updating signals · reducer→method mutating a signal · `useEffect`→`ngOnInit`/`effect()`/`ngOnDestroy` · `useRef` guards→plain fields · `useState`→`signal` · `BroadcastChannel`→unchanged.

---

## 6. Routing (`app.routes.ts`)

Same paths as React, lazy-loaded:

| Path | Component |
|---|---|
| `/v1/login` | `LoginComponent` |
| `/v1/landing-page` | `LandingComponent` (6 feature cards) |
| `/v1/operations-dashboard` | `OperationsDashboardComponent` |
| `/v1/waste-heat-configurator` | `WasteHeatConfiguratorComponent` |
| `/v1/kpi/:id` | `FullScreenKpiComponent` (opens in a new tab via `window.open`) |
| `**` / `''` | → `/v1/login` |

Auth is implicit (no route guard): unauthenticated requests 401 → interceptor logs out. Cross-tab mode sync via `ModeChannelService` keeps full-screen tabs consistent.

---

## 7. The Operations Dashboard

`pages/operations-dashboard` composes a 2-row grid (Header + GlobalLayout sidebar + Footer):
- **Row 1:** `app-system-flow` (SFG/TES tabs → D3 `app-lps`/`app-tes` + 4 `powerMetrics` cards + start/stop) · `app-kpis-forecasts` (gauge carousel)
- **Row 2:** `app-control-command-panel` (mode selector + setpoint modals) · `app-alarms-events` (CSV-driven) · `app-diagnostics-asset-health` (temp chart)

On init it calls `ModesService.fetchModes/fetchCurrentModes/fetchSimulationStatus`; `handleSimulationHandler` → `simulationStartAndStop` + toast + re-fetch.

---

## 8. Charts & Visualizations

**Highcharts** (`highcharts-angular`, `<highcharts-chart>`, options copied verbatim from React):
- `speedometer-gauge` — reusable 180° gauge (inputs value/min/max/gradient/unit/pointerValue…), negative-aware red/green plot bands.
- `hrf` (dual-axis), `parasitic-power-ratio` (0-line plotLine), `tes-temperature` (T2 65–80°C) — spline charts; `datetime` x-axis with **PST −8h offset**.

**D3** (rendered in `ngAfterViewInit` against an `ElementRef`, cleaned in `ngOnDestroy`):
- `sfg`/`lps` — system schematic (gradient tank, DC-heat/ORC boxes, hot/cold pipes, animated flow arrows via `attrTween` + `getPointAtLength`, hardcoded `TEMP_SEQ`/`FLOW_SEQ` advancing 7s).
- `tes`/`tes2` — stratified-tank animation reading `/assets/tes_data2.csv`, RdYlBu-reversed, rect-per-layer, 600ms frames, play/pause + slider.

**Dual-mode data pattern** (HRF/PPR/TES-temp/Diagnostics): **Live** = REST history via `KpiService`; **Simulation** = `SocketService` → `emit('getSensorHistory')` → seed `*HistoricalData` → append `*Data` with the guards (`skipNextLive`, `historyLoaded`, drop out-of-order, rolling `slice(-15)`/`slice(-5)`). `alarms-events` ports the CSV-driven logic (10s sim stream, last-100 + `localStorage`, last-50 Live).

---

## 9. Shared / Layout / Configurator

- **Header** (`host: block w-full`) — home button, live PST clock, logout-confirm modal. **Footer**, **GlobalLayout** (collapsible sidebar via `SidebarService` + cookie). **AppSidebar** — full recursive nav tree (`operationDashSidebar`) with collapsible/searchable dropdowns.
- **Toast** — `ToastService` (signals) + `app-toast-container` (top-center, react-hot-toast look).
- **DateTimePicker** — from/to → `KpiService.fetch*History`. **AnimatedValue/FadingValue** — flash/fade-on-change (= React hooks).
- **Configurator wizard** — `waste-heat-configurator` + `simulation-sidebar` + `step-progress-bar` + panels + `digital-configurator` (UI-only, same as React).
- Icons: react-icons → **@lucide/angular** (`LucideAngularModule` + named icons, `<lucide-icon [img]="Icon">`).

---

## 10. Testing (Jasmine + Karma)

`karma.conf.js` runs **ChromeHeadlessNoSandbox** (CHROME_BIN = puppeteer's Chromium). **10 spec files, 26 tests, all green** (`ng test --watch=false --browsers=ChromeHeadlessNoSandbox`):
state services (login token+chain, mode broadcast, `setLive*` caps 100/500, `clearPowerData`), the auth interceptor (Bearer + 401 logout), `SpeedometerGauge` render, Login form, Header clock/logout, helper (`dateTimeFormatter`/`modeStyles`), routing catch-all.

---

## 11. Build / Run

- `npm start` → dev server **:7011** (`ng serve --host 0.0.0.0`).
- `ng build` → prod bundle. `ng test` → unit tests.
- Switch backend: edit `ACTIVE` in `environment.ts` (`prod`/`local`/`localNode`).

## 12. Parity notes
Verified pixel-identical to the React app (login, landing, operations dashboard with the D3 flow diagram + 3-gauge carousel + charts). Reproduces the React quirks: CSV-driven alarms, hardcoded D3 sequences, UI-only configurator/setpoints, the 4 stub landing cards, `window.open` full-screen, login-forces-Maintenance. `plotly`/`recharts`/`reactflow` (unused in React) are not ported.

*Companion docs: `../PHAROS_UI/Architecture.md` (React UI), `../Architecture.md` (Node backend), `../pharos_backend_py/Architecture.md` (Python backend).*
