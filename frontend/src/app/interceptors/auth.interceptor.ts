import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * - Attaches the JWT as a Bearer token on API requests (only when present).
 * - On a 401 from the API, clears the session and redirects to /login, so an
 *   expired/invalid token doesn't leave the user stuck on a broken page.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Don't add the token to the auth endpoints themselves.
    const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/register');

    const authReq = token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isAuthEndpoint) {
          // Token expired or invalid — end the session cleanly.
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
