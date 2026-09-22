import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-access-requests',
  templateUrl: './access-requests.component.html',
  styleUrls: ['./access-requests.component.scss']
})
export class AccessRequestsComponent implements OnInit {
  isLoading = true;
  filter: 'pending' | 'approved' | 'rejected' = 'pending';
  requests: any[] = [];
  busyId: string | null = null;
  actionSuccess = '';
  actionError = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetch();
  }

  setFilter(f: 'pending' | 'approved' | 'rejected'): void {
    this.filter = f;
    this.fetch();
  }

  fetch(): void {
    this.isLoading = true;
    this.apiService.getAccessRequests(this.filter).subscribe({
      next: (res) => {
        this.requests = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to load access requests.';
        this.isLoading = false;
      }
    });
  }

  approve(r: any): void {
    this.act(r, () => this.apiService.approveAccessRequest(r.id), `${r.fullName} approved.`);
  }

  reject(r: any): void {
    this.act(r, () => this.apiService.rejectAccessRequest(r.id), `${r.fullName} rejected.`);
  }

  private act(r: any, call: () => any, successMsg: string): void {
    this.busyId = r.id;
    this.actionSuccess = '';
    this.actionError = '';
    call().subscribe({
      next: () => {
        this.busyId = null;
        this.actionSuccess = successMsg;
        this.fetch();
      },
      error: (err: any) => {
        this.busyId = null;
        this.actionError = err.error?.message || 'Action failed.';
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'pending': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      case 'rejected': return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
      default: return 'bg-gray-50 text-gray-700';
    }
  }

  initials(name: string): string {
    return (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
