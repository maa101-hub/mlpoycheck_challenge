import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-verifications',
  templateUrl: './verifications.component.html',
  styleUrls: ['./verifications.component.scss']
})
export class VerificationsComponent implements OnInit {
  isLoading = true;
  loadError = '';

  // Full list from the API and the current search-filtered view.
  private allRows: any[] = [];
  rows: any[] = [];
  summary = { total: 0, verified: 0, flagged: 0, inReview: 0, notStarted: 0 };

  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.isLoading = true;
    this.loadError = '';
    this.apiService.getVerificationEmployees().subscribe({
      next: (res) => {
        this.allRows = res.data || [];
        this.summary = res.summary || this.summary;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.loadError = err.error?.message || 'Failed to load verifications.';
        this.isLoading = false;
      }
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  }

  private applyFilter(): void {
    const s = this.searchTerm;
    this.rows = s
      ? this.allRows.filter(r =>
          (r.employeeName || '').toLowerCase().includes(s) ||
          (r.email || '').toLowerCase().includes(s))
      : [...this.allRows];
  }

  goToReview(): void {
    this.router.navigate(['/document-review']);
  }

  // The status label shown to the admin (derived server-side).
  statusLabel(status: string): string {
    switch (status) {
      case 'verified': return 'Verified';
      case 'flagged': return 'Flagged';
      default: return 'Pending';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'verified': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'flagged': return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
      default: return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
    }
  }

  // ─── Pagination over the filtered rows ───────────────────────────────
  get filteredTotal(): number { return this.rows.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.rows.length / this.pageSize)); }
  get pagedRows(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }
  get rangeStart(): number { return this.rows.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get rangeEnd(): number { return Math.min(this.currentPage * this.pageSize, this.rows.length); }
  get pageList(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
