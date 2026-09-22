import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * API Service - Handles all backend HTTP calls
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers: { [key: string]: string } = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  // ─── RECORDS ────────────────────────────────────────────────────────
  getRecords(params?: any): Observable<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.http.get(`${this.apiUrl}/records${queryString}`, { headers: this.getHeaders() });
  }

  getRecordsSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/records/summary`, { headers: this.getHeaders() });
  }

  createRecord(record: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/records`, record, { headers: this.getHeaders() });
  }

  updateRecord(id: string, record: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/records/${id}`, record, { headers: this.getHeaders() });
  }

  deleteRecord(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/records/${id}`, { headers: this.getHeaders() });
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

  // ─── ACCESS REQUESTS (admin, company-scoped) ────────────────────────
  getAccessRequests(status: string = 'pending'): Observable<any> {
    return this.http.get(`${this.apiUrl}/access-requests?status=${status}`, { headers: this.getHeaders() });
  }

  approveAccessRequest(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/access-requests/${id}/approve`, {}, { headers: this.getHeaders() });
  }

  rejectAccessRequest(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/access-requests/${id}/reject`, {}, { headers: this.getHeaders() });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/users/change-password`,
      { currentPassword, newPassword },
      { headers: this.getHeaders() }
    );
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
