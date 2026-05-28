import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {
  isLoading = true;

  tickets = [
    { id: 'TKT-4821', subject: 'Unable to export verification report', priority: 'high', status: 'open', date: '2024-03-15' },
    { id: 'TKT-4819', subject: 'API timeout on bulk verification', priority: 'medium', status: 'in-progress', date: '2024-03-14' },
    { id: 'TKT-4815', subject: 'Role permission not updating', priority: 'low', status: 'resolved', date: '2024-03-12' },
    { id: 'TKT-4810', subject: 'Dashboard metrics not refreshing', priority: 'medium', status: 'resolved', date: '2024-03-10' },
  ];

  constructor() {}

  ngOnInit(): void {
    setTimeout(() => { this.isLoading = false; }, 1200);
  }

  getPriorityClass(p: string): string {
    switch (p) {
      case 'high': return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
      case 'medium': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      case 'low': return 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/60';
      default: return '';
    }
  }

  getStatusClass(s: string): string {
    switch (s) {
      case 'open': return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60';
      case 'in-progress': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      default: return '';
    }
  }
}
