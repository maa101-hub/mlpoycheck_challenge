import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * API Service - Handles all backend HTTP calls
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ─── RECORDS ────────────────────────────────────────────────────────
  getRecords(params?: any): Observable<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.http.get(`${this.apiUrl}/records${queryString}`, { headers: this.getHeaders() });
  }

  getRecordsSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/records/summary`, { headers: this.getHeaders() });
  }

  // ─── USERS ──────────────────────────────────────────────────────────
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, user, { headers: this.getHeaders() });
  }

  updateUser(id: string, user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, user, { headers: this.getHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  // ─── DOCUMENTS ──────────────────────────────────────────────────────
  getMyDocuments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/documents`, { headers: this.getHeaders() });
  }

  getVerificationProgress(): Observable<any> {
    return this.http.get(`${this.apiUrl}/documents/progress`, { headers: this.getHeaders() });
  }

  uploadDocument(type: string, fileName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/documents/upload`, { type, fileName }, { headers: this.getHeaders() });
  }

  getFinalReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/documents/report`, { headers: this.getHeaders() });
  }
}
