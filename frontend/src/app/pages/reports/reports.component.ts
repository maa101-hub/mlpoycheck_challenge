import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  isLoading = true;

  // Live verification stats sourced from the backend records summary.
  totalRecords = 0;
  verified = 0;
  pending = 0;
  flagged = 0;
  rejected = 0;
  statsError = '';

  reports = [
    { name: 'Monthly Verification Summary', type: 'PDF', date: '2024-03-15', size: '2.4 MB', status: 'ready' },
    { name: 'Q1 Compliance Audit Report', type: 'PDF', date: '2024-03-10', size: '5.1 MB', status: 'ready' },
    { name: 'Risk Assessment Overview', type: 'XLSX', date: '2024-03-08', size: '1.8 MB', status: 'ready' },
    { name: 'Employee Onboarding Metrics', type: 'PDF', date: '2024-03-05', size: '3.2 MB', status: 'processing' },
    { name: 'Annual Background Check Stats', type: 'PDF', date: '2024-02-28', size: '7.6 MB', status: 'ready' },
    { name: 'Department-wise Verification', type: 'XLSX', date: '2024-02-25', size: '980 KB', status: 'ready' },
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getRecordsSummary().subscribe({
      next: (res) => {
        const d = res?.data || {};
        this.totalRecords = d.totalRecords ?? 0;
        this.verified = d.verified ?? 0;
        this.pending = d.pending ?? 0;
        this.flagged = d.flagged ?? 0;
        this.rejected = d.rejected ?? 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.statsError = err.error?.message || 'Could not load verification stats.';
        this.isLoading = false;
      }
    });
  }
}
