import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../state/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'clearMessages', 'message', 'user', 'error'],
      { loading: signal(false) },
    );
    authSpy.login.and.resolveTo({});
    authSpy.message.and.returnValue(null);
    authSpy.user.and.returnValue(null);
    authSpy.error.and.returnValue(null);

    toastSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('handleLogin with empty fields calls toast.error and not auth.login', async () => {
    component.email = '';
    component.password = '';
    await component.handleLogin(new Event('submit'));

    expect(toastSpy.error).toHaveBeenCalled();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('handleLogin with values calls auth.login', async () => {
    component.email = 'a@b.com';
    component.password = 'pw';
    await component.handleLogin(new Event('submit'));

    expect(authSpy.login).toHaveBeenCalledWith('a@b.com', 'pw');
  });
});
