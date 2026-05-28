import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  isLoading = true;

  reports = [
    { name: 'Monthly Verification Summary', type: 'PDF', date: '2024-03-15', size: '2.4 MB', status: 'ready' },
    { name: 'Q1 Compliance Audit Report', type: 'PDF', date: '2024-03-10', size: '5.1 MB', status: 'ready' },
    { name: 'Risk Assessment Overview', type: 'XLSX', date: '2024-03-08', size: '1.8 MB', status: 'ready' },
    { name: 'Employee Onboarding Metrics', type: 'PDF', date: '2024-03-05', size: '3.2 MB', status: 'processing' },
    { name: 'Annual Background Check Stats', type: 'PDF', date: '2024-02-28', size: '7.6 MB', status: 'ready' },
    { name: 'Department-wise Verification', type: 'XLSX', date: '2024-02-25', size: '980 KB', status: 'ready' },
  ];

  constructor() {}

  ngOnInit(): void {
    setTimeout(() => { this.isLoading = false; }, 1400);
  }
}
