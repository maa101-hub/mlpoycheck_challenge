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

  isExporting = false;
  exportError = '';

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

  /**
   * Build and download a real CSV of the company's employee verification data,
   * generated on demand from the live backend list.
   */
  exportCsv(): void {
    this.isExporting = true;
    this.exportError = '';
    this.apiService.getVerificationEmployees().subscribe({
      next: (res) => {
        const rows = res?.data || [];
        const header = ['Employee', 'Email', 'Documents Verified', 'Documents Total', 'Status'];
        const escape = (v: any) => {
          const s = String(v ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = [
          header.join(','),
          ...rows.map((r: any) =>
            [r.employeeName, r.email, r.verified, r.total, r.status].map(escape).join(',')
          ),
        ];
        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verification-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.isExporting = false;
      },
      error: (err) => {
        this.isExporting = false;
        this.exportError = err.error?.message || 'Could not generate the report.';
      }
    });
  }
}
