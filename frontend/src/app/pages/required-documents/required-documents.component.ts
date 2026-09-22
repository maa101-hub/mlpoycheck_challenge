import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-required-documents',
  templateUrl: './required-documents.component.html',
  styleUrls: ['./required-documents.component.scss']
})
export class RequiredDocumentsComponent implements OnInit {
  isLoading = true;
  docs: any[] = [];

  newLabel = '';
  isSaving = false;
  busyType: string | null = null;
  actionSuccess = '';
  actionError = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.isLoading = true;
    this.apiService.getRequiredDocuments().subscribe({
      next: (res) => {
        this.docs = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to load required documents.';
        this.isLoading = false;
      }
    });
  }

  add(): void {
    const label = this.newLabel.trim();
    if (!label) {
      this.actionError = 'Enter a document name.';
      return;
    }
    this.isSaving = true;
    this.actionSuccess = '';
    this.actionError = '';
    this.apiService.addRequiredDocument({ label }).subscribe({
      next: () => {
        this.isSaving = false;
        this.newLabel = '';
        this.actionSuccess = 'Required document added.';
        this.fetch();
      },
      error: (err) => {
        this.isSaving = false;
        this.actionError = err.error?.message || 'Failed to add document.';
      }
    });
  }

  remove(doc: any): void {
    if (!confirm(`Remove "${doc.label}" from required documents?`)) return;
    this.busyType = doc.type;
    this.actionSuccess = '';
    this.actionError = '';
    this.apiService.deleteRequiredDocument(doc.type).subscribe({
      next: () => {
        this.busyType = null;
        this.actionSuccess = 'Required document removed.';
        this.fetch();
      },
      error: (err) => {
        this.busyType = null;
        this.actionError = err.error?.message || 'Failed to remove document.';
      }
    });
  }
}
