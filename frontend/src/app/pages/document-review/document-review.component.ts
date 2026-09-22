import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-document-review',
  templateUrl: './document-review.component.html',
  styleUrls: ['./document-review.component.scss']
})
export class DocumentReviewComponent implements OnInit {
  isLoading = true;
  employees: any[] = [];
  expandedId: string | null = null;
  busy = false;
  actionSuccess = '';
  actionError = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.isLoading = true;
    this.apiService.getDocumentReviewList().subscribe({
      next: (res) => {
        this.employees = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to load employees.';
        this.isLoading = false;
      }
    });
  }

  toggle(emp: any): void {
    this.expandedId = this.expandedId === emp.id ? null : emp.id;
  }

  verifyDoc(docId: string): void {
    this.run(() => this.apiService.verifyDocument(docId), 'Document verified.');
  }

  rejectDoc(docId: string): void {
    this.run(() => this.apiService.rejectDocument(docId), 'Document rejected.');
  }

  verifyAll(emp: any): void {
    if (!confirm(`Verify all uploaded documents for ${emp.fullName}?`)) return;
    this.run(() => this.apiService.verifyEmployee(emp.id), `${emp.fullName} verified.`);
  }

  private run(call: () => any, successMsg: string): void {
    this.busy = true;
    this.actionSuccess = '';
    this.actionError = '';
    call().subscribe({
      next: (res: any) => {
        this.busy = false;
        this.actionSuccess = res?.message || successMsg;
        this.fetch();
      },
      error: (err: any) => {
        this.busy = false;
        this.actionError = err.error?.message || 'Action failed.';
      }
    });
  }

  overallLabel(o: string): string {
    switch (o) {
      case 'verified': return 'Verified';
      case 'ready_for_review': return 'Ready for Review';
      case 'in_progress': return 'In Progress';
      default: return 'Not Started';
    }
  }

  overallClass(o: string): string {
    switch (o) {
      case 'verified': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'ready_for_review': return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60';
      case 'in_progress': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      default: return 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/60';
    }
  }

  stepBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'uploaded': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      default: return 'bg-gray-50 text-gray-500 ring-1 ring-gray-200/60';
    }
  }

  stepStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Verified';
      case 'uploaded': return 'Awaiting review';
      default: return 'Not uploaded';
    }
  }

  initials(name: string): string {
    return (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
