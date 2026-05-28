import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface VerificationRecord {
  employee: string;
  uidRef: string;
  timestamp: string;
  status: 'verified' | 'pending' | 'flagged' | 'rejected';
  actions: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  userName = 'Administrator';
  userRole = 'Chief Compliance Officer';
  verificationLog: VerificationRecord[] = [];
  summary = { totalRecords: 0, verified: 0, pending: 0, flagged: 0, rejected: 0 };

  constructor(private authService: AuthService, private apiService: ApiService) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.fullName;
      this.userRole = user.role === 'admin' ? 'Chief Compliance Officer' : 'General User';
    }

    // Fetch real records and summary from API
    this.apiService.getRecords({ limit: 5 }).subscribe({
      next: (res) => {
        this.verificationLog = res.data.map((r: any) => ({
          employee: r.employeeName,
          uidRef: r.employeeId,
          timestamp: r.lastUpdated,
          status: r.verificationStatus,
          actions: r.verificationStatus === 'verified' ? 'View' : r.verificationStatus === 'pending' ? 'Review' : 'Investigate',
        }));
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });

    this.apiService.getRecordsSummary().subscribe({
      next: (res) => { this.summary = res.data; },
      error: () => {}
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'verified': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'pending': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      case 'flagged': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60';
      case 'rejected': return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
      default: return 'bg-gray-50 text-gray-700';
    }
  }
}
