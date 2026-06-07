import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/v1/login', pathMatch: 'full' },
  {
    path: 'v1/login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'v1/landing-page',
    loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'v1/operations-dashboard',
    loadComponent: () =>
      import('./pages/operations-dashboard/operations-dashboard.component').then(
        (m) => m.OperationsDashboardComponent,
      ),
  },
  {
    path: 'v1/kpi/:id',
    loadComponent: () =>
      import('./pages/full-screen-kpi/full-screen-kpi.component').then(
        (m) => m.FullScreenKpiComponent,
      ),
  },
  {
    path: 'v1/waste-heat-configurator',
    loadComponent: () =>
      import('./pages/waste-heat-configurator/waste-heat-configurator.component').then(
        (m) => m.WasteHeatConfiguratorComponent,
      ),
  },
  { path: '**', redirectTo: '/v1/login' },
];
