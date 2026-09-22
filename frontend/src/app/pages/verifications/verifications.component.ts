import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

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
  pageSize = 10;
  searchTerm = '';

  actionError = '';
  actionSuccess = '';
  busyId: string | null = null; // id of the record whose action is in flight

  // Add-record modal
  showAddModal = false;
  isSaving = false;
  newRecord = {
    employeeName: '',
    employeeId: '',
    department: '',
    position: '',
    riskLevel: 'low',
    verificationStatus: 'pending',
  };

  readonly statuses = ['verified', 'pending', 'flagged', 'rejected'];
  readonly risks = ['low', 'medium', 'high', 'critical'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchRecords();
  }

  fetchRecords(): void {
    this.isLoading = true;
    this.apiService.getRecords({ page: this.currentPage.toString(), limit: this.pageSize.toString(), search: this.searchTerm }).subscribe({
      next: (res) => {
        // Keep the full record (incl. id / employeeId / position) so we can mutate it.
        this.records = res.data.map((r: any) => ({
          id: r.id,
          employeeName: r.employeeName,
          employeeId: r.employeeId,
          department: r.department,
          position: r.position,
          status: r.verificationStatus,
          riskLevel: r.riskLevel,
          lastUpdated: r.lastUpdated,
        }));
        this.totalRecords = res.pagination.total;
        this.totalPages = res.pagination.totalPages || 1;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
    this.fetchRecords();
  }

  // ─── Row actions ──────────────────────────────────────────────────
  setStatus(record: any, status: string): void {
    if (record.status === status) return;
    this.actionError = '';
    this.actionSuccess = '';
    this.busyId = record.id;
    this.apiService.updateRecord(record.id, { verificationStatus: status }).subscribe({
      next: (res) => {
        record.status = res.data.verificationStatus;
        record.lastUpdated = res.data.lastUpdated;
        this.busyId = null;
        this.actionSuccess = `${record.employeeName} marked ${status}.`;
      },
      error: (err) => {
        this.busyId = null;
        this.actionError = err.error?.message || 'Failed to update record.';
      }
    });
  }

  deleteRecord(record: any): void {
    if (!confirm(`Delete the verification record for ${record.employeeName}?`)) return;
    this.actionError = '';
    this.actionSuccess = '';
    this.busyId = record.id;
    this.apiService.deleteRecord(record.id).subscribe({
      next: () => {
        this.busyId = null;
        this.actionSuccess = `${record.employeeName} deleted.`;
        this.fetchRecords();
      },
      error: (err) => {
        this.busyId = null;
        this.actionError = err.error?.message || 'Failed to delete record.';
      }
    });
  }

  // ─── Add-record modal ─────────────────────────────────────────────
  openAddModal(): void {
    this.newRecord = { employeeName: '', employeeId: '', department: '', position: '', riskLevel: 'low', verificationStatus: 'pending' };
    this.actionError = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitNewRecord(): void {
    const r = this.newRecord;
    if (!r.employeeName || !r.employeeId || !r.department || !r.position) {
      this.actionError = 'Please fill in name, employee ID, department and position.';
      return;
    }
    this.isSaving = true;
    this.actionError = '';
    this.apiService.createRecord(r).subscribe({
      next: () => {
        this.isSaving = false;
        this.showAddModal = false;
        this.actionSuccess = 'Record created.';
        this.currentPage = 1;
        this.fetchRecords();
      },
      error: (err) => {
        this.isSaving = false;
        this.actionError = err.error?.message || 'Failed to create record.';
      }
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

  getRiskClass(risk: string): string {
    switch (risk) {
      case 'low': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'medium': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      case 'high': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60';
      case 'critical': return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
      default: return 'bg-gray-50 text-gray-700';
    }
  }

  // Range shown in the pagination footer, e.g. "1 - 10".
  get rangeStart(): number {
    return this.totalRecords === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }
  get pageList(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchRecords();
    }
  }
}
