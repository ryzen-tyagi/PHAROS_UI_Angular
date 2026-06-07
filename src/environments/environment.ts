// Central backend endpoints (mirrors PHAROS_UI/src/config/api.js).
// Switch ACTIVE between "prod" | "local" | "localNode" to repoint REST + Socket.IO.

function host(): string {
  return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
}

export const BACKENDS = {
  prod: { http: 'http://103.204.95.215:7001', ws: 'ws://103.204.95.215:7001' },
  local: { http: `http://${host()}:7002`, ws: `ws://${host()}:7002` }, // Python FastAPI
  localNode: { http: `http://${host()}:7001`, ws: `ws://${host()}:7001` },
};

// Which backend the app talks to. Change this one line to switch.
export const ACTIVE: keyof typeof BACKENDS = 'prod';

export const environment = {
  production: false,
  API_BASE: BACKENDS[ACTIVE].http,
  WS_BASE: BACKENDS[ACTIVE].ws,
};
