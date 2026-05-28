import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface RequiredDoc {
  type: string;
  label: string;
  step: string;
  status: 'completed' | 'uploaded' | 'pending';
  document: any;
}

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  isLoading = true;
  userName = 'James Wilson';
  userEmail = 'user@mploycheck.com';
  userRole = 'General User';
  employeeId = 'EMP-8842190';
  phone = '+1 (555) 0123-4567';

  // Document progress from API
  progress = { percentage: 0, totalRequired: 4, uploaded: 0, verified: 0, finalReportReady: false, steps: [] as RequiredDoc[] };
  documents: any[] = [];
  uploadingType = '';
  uploadError = '';
  uploadSuccess = '';

  // Final report
  finalReport: any = null;
  reportError = '';

  constructor(private authService: AuthService, private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.fullName;
      this.userEmail = user.email;
    }
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    // Fetch progress
    this.apiService.getVerificationProgress().subscribe({
      next: (res) => {
        this.progress = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
    // Fetch documents
    this.apiService.getMyDocuments().subscribe({
      next: (res) => { this.documents = res.data; }
    });
  }

  uploadDocument(type: string, label: string): void {
    this.uploadingType = type;
    this.uploadError = '';
    this.uploadSuccess = '';

    // Generate a realistic file name
    const fileNames: any = {
      photo_id: 'National_ID_Scan.pdf',
      employment_letter: 'Employment_Verification_Letter.pdf',
      degree: 'Degree_Certificate.pdf',
      background_cert: 'Background_Check_Report.pdf',
    };
    const fileName = fileNames[type] || `${label.replace(/\s/g, '_')}.pdf`;

    this.apiService.uploadDocument(type, fileName).subscribe({
      next: (res) => {
        this.uploadingType = '';
        this.uploadSuccess = res.message;
        // Refresh data after upload
        setTimeout(() => {
          this.uploadSuccess = '';
          this.loadData();
        }, 2000);
      },
      error: (err) => {
        this.uploadingType = '';
        this.uploadError = err.error?.message || 'Upload failed.';
        setTimeout(() => { this.uploadError = ''; }, 3000);
      }
    });
  }

  viewFinalReport(): void {
    this.reportError = '';
    this.apiService.getFinalReport().subscribe({
      next: (res) => { this.finalReport = res.data; },
      error: (err) => { this.reportError = err.error?.message || 'Report not available yet.'; }
    });
  }

  closeFinalReport(): void {
    this.finalReport = null;
  }

  getStepStatus(type: string): string {
    const step = this.progress.steps.find((s: any) => s.type === type);
    return step ? step.status : 'pending';
  }

  navigateTo(route: string): void { this.router.navigate([route]); }
  logout(): void { this.authService.logout(); }
}
