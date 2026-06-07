import { Route } from '@angular/router';
import { routes } from './app.routes';

describe('app.routes', () => {
  it('has a wildcard route redirecting to /v1/login', () => {
    const wildcard = routes.find((r: Route) => r.path === '**');
    expect(wildcard).toBeTruthy();
    expect(wildcard!.redirectTo).toBe('/v1/login');
  });

  it('redirects the empty path to /v1/login', () => {
    const root = routes.find((r: Route) => r.path === '');
    expect(root).toBeTruthy();
    expect(root!.redirectTo).toBe('/v1/login');
  });

  it('defines the five v1 routes', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('v1/login');
    expect(paths).toContain('v1/landing-page');
    expect(paths).toContain('v1/operations-dashboard');
    expect(paths).toContain('v1/kpi/:id');
    expect(paths).toContain('v1/waste-heat-configurator');
  });
});
