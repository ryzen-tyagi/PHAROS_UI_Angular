import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Port of the axios interceptors in redux/api/Client.js:
 *  - attach Bearer token from localStorage
 *  - on 401 (or "Invalid or expired token") clear token + redirect to "/" */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = err?.error?.message;
      if (err.status === 401 || message === 'Invalid or expired token') {
        console.warn('Token invalid or expired, logging out...');
        localStorage.removeItem('token');
        window.location.href = '/';
      }
      console.error('API Error:', message || err.message);
      return throwError(() => err);
    }),
  );
};
