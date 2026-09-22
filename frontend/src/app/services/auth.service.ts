import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'general';
  companyName: string;
  companyId?: string | null;
  status?: string;
  lastLogin: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

/**
 * Auth Service - Connects to real backend API
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Login via backend API
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      }),
      catchError(err => {
        const message = err.error?.message || 'Login failed. Please try again.';
        return throwError(() => ({ success: false, message }));
      })
    );
  }

  /**
   * Registration. mode 'company' creates a company and makes the caller its
   * admin (returns a join code); mode 'join' requests access to an existing
   * company via its join code (creates a pending member).
   */
  register(payload: {
    mode: 'company' | 'join';
    fullName: string;
    email: string;
    password: string;
    companyName?: string;
    joinCode?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, payload).pipe(
      catchError(err => {
        const message = err.error?.message || 'Registration failed. Please try again.';
        return throwError(() => ({ success: false, message }));
      })
    );
  }

  getUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Decode the JWT payload (base64url) without verifying the signature.
   * Signature verification is the backend's job; this is only used to read
   * claims like `role` on the client. Returns null if the token is malformed.
   */
  private decodeToken(): { id?: string; email?: string; role?: string; exp?: number } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const claims = this.decodeToken();
    if (!claims) return false;
    // Treat an expired token as not authenticated.
    if (claims.exp && claims.exp * 1000 <= Date.now()) return false;
    return true;
  }

  /**
   * Role is read from the JWT claims (source of truth), falling back to the
   * stored user object only if the token can't be decoded.
   */
  isAdmin(): boolean {
    const role = this.decodeToken()?.role ?? this.getUser()?.role;
    return role === 'admin';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
