import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('token');
  });

  it('attaches Authorization: Bearer <token> when a token is present', () => {
    localStorage.setItem('token', 'abc');

    http.get('/data').subscribe();

    const req = httpMock.expectOne('/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('does not attach Authorization when there is no token', () => {
    http.get('/data').subscribe();

    const req = httpMock.expectOne('/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('removes the token from localStorage on a 401 response', () => {
    localStorage.setItem('token', 'abc');

    // On a 401 the interceptor runs, in this order:
    //   localStorage.removeItem('token');
    //   window.location.href = '/';
    // In modern Chrome `window.location` and its `href` accessor are BOTH
    // non-configurable, so they cannot be replaced/deleted/spied — and letting
    // the real `href = '/'` run navigates the Karma iframe and disconnects the
    // runner. Since `removeItem` is called first (and is not wrapped in a
    // try/catch in the interceptor), we stub it to throw *after* recording the
    // call. The thrown error short-circuits the catchError handler before the
    // navigation line executes, so we deterministically verify the token-removal
    // behaviour without ever triggering a real page navigation.
    // Only throw the FIRST time (the interceptor's call). Later calls — e.g. the
    // afterEach cleanup — fall through to the real implementation so they behave
    // normally.
    let thrown = false;
    const realRemove = localStorage.removeItem.bind(localStorage);
    const removeSpy = spyOn(localStorage, 'removeItem').and.callFake((k: string) => {
      if (!thrown) {
        thrown = true;
        throw new Error('stop-before-navigation');
      }
      realRemove(k);
    });

    http.get('/data').subscribe({ next: () => {}, error: () => {} });

    const req = httpMock.expectOne('/data');
    // The intentional throw from our removeItem stub propagates synchronously out
    // of flush() (HttpClientTesting runs the pipeline synchronously), so swallow
    // it here — its only purpose was to halt execution before the navigation.
    try {
      req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });
    } catch (e: any) {
      expect(e?.message).toBe('stop-before-navigation');
    }

    expect(removeSpy).toHaveBeenCalledWith('token');
  });

  it('also logs out on an "Invalid or expired token" message', () => {
    localStorage.setItem('token', 'abc');
    let thrown = false;
    const realRemove = localStorage.removeItem.bind(localStorage);
    const removeSpy = spyOn(localStorage, 'removeItem').and.callFake((k: string) => {
      if (!thrown) {
        thrown = true;
        throw new Error('stop-before-navigation');
      }
      realRemove(k);
    });

    http.get('/data').subscribe({ next: () => {}, error: () => {} });

    const req = httpMock.expectOne('/data');
    // Non-401 status but the sentinel message still triggers logout.
    try {
      req.flush(
        { message: 'Invalid or expired token' },
        { status: 400, statusText: 'Bad Request' },
      );
    } catch (e: any) {
      expect(e?.message).toBe('stop-before-navigation');
    }

    expect(removeSpy).toHaveBeenCalledWith('token');
  });
});
