import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

interface VerificationRecord {
  employeeName: string;
  department: string;
  status: 'verified' | 'pending' | 'flagged' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
}

@Component({
  selector: 'app-verifications',
  templateUrl: './verifications.component.html',
  styleUrls: ['./verifications.component.scss']
})
export class VerificationsComponent implements OnInit {
  isLoading = true;
  records: any[] = [];
  totalRecords = 0;
  currentPage = 1;
  totalPages = 1;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchRecords();
  }

  fetchRecords(): void {
    this.isLoading = true;
    this.apiService.getRecords({ page: this.currentPage.toString(), limit: '10', search: this.searchTerm }).subscribe({
      next: (res) => {
        this.records = res.data.map((r: any) => ({
          employeeName: r.employeeName,
          department: r.department,
          status: r.verificationStatus,
          riskLevel: r.riskLevel,
          lastUpdated: r.lastUpdated,
        }));
        this.totalRecords = res.pagination.total;
        this.totalPages = res.pagination.totalPages;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  searchTerm = '';

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
    this.fetchRecords();
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

  getRiskClass(risk: string): string {
    switch (risk) {
      case 'low': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'medium': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      case 'high': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60';
      case 'critical': return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
      default: return 'bg-gray-50 text-gray-700';
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchRecords();
    }
  }
}
