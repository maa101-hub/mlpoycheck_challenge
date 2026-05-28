import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-compliance',
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss']
})
export class ComplianceComponent implements OnInit {
  isLoading = true;

  frameworks = [
    { name: 'GDPR', region: 'European Union', status: 'compliant', lastAudit: '2024-03-01', score: 98 },
    { name: 'SOC 2 Type II', region: 'Global', status: 'compliant', lastAudit: '2024-02-15', score: 96 },
    { name: 'ISO 27001', region: 'Global', status: 'compliant', lastAudit: '2024-01-20', score: 99 },
    { name: 'HIPAA', region: 'United States', status: 'in-progress', lastAudit: '2024-03-10', score: 87 },
    { name: 'PCI DSS', region: 'Global', status: 'compliant', lastAudit: '2024-02-28', score: 94 },
    { name: 'CCPA', region: 'California, US', status: 'review', lastAudit: '2024-03-05', score: 91 },
  ];

  constructor() {}

  ngOnInit(): void {
    setTimeout(() => { this.isLoading = false; }, 1600);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'compliant': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'in-progress': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      case 'review': return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60';
      default: return 'bg-gray-50 text-gray-700';
    }
  }
}
