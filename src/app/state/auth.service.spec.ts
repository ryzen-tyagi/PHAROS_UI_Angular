import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ModesService } from './modes.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let modesSpy: jasmine.SpyObj<ModesService>;

  beforeEach(() => {
    localStorage.removeItem('token');
    modesSpy = jasmine.createSpyObj<ModesService>('ModesService', [
      'fetchModes',
      'changeMode',
    ]);
    modesSpy.fetchModes.and.resolveTo();
    modesSpy.changeMode.and.resolveTo({});

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ModesService, useValue: modesSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('token');
  });

  it('login() posts to /v1/auth/login, stores token and sets signals', async () => {
    const promise = service.login('a@b.com', 'pw');

    const req = httpMock.expectOne(environment.API_BASE + '/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pw' });
    req.flush({ token: 'tok123', user: { id: 1 }, message: 'Welcome' });

    await promise;

    expect(localStorage.getItem('token')).toBe('tok123');
    expect(service.token()).toBe('tok123');
    expect(service.user()).toEqual({ id: 1 });
    expect(service.message()).toBe('Welcome');
    expect(modesSpy.fetchModes).toHaveBeenCalled();
    expect(modesSpy.changeMode).toHaveBeenCalledWith(
      jasmine.objectContaining({ mode: 'Maintenance' }),
    );
  });

  it('logout() clears user/token signals and localStorage', () => {
    localStorage.setItem('token', 'tok');
    service.token.set('tok');
    service.user.set({ id: 1 });

    service.logout();

    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
