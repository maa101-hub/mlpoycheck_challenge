import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-verifications',
  templateUrl: './user-verifications.component.html',
  styleUrls: ['./user-verifications.component.scss']
})
export class UserVerificationsComponent implements OnInit {
  isLoading = true;
  userName = 'James Wilson';

  progress: any = { percentage: 0, totalRequired: 4, uploaded: 0, verified: 0, finalReportReady: false, steps: [] };

  constructor(private authService: AuthService, private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) this.userName = user.fullName;
    this.loadProgress();
  }

  loadProgress(): void {
    this.isLoading = true;
    this.apiService.getVerificationProgress().subscribe({
      next: (res) => {
        this.progress = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  getStepIcon(status: string): string {
    switch (status) {
      case 'completed': return 'check';
      case 'uploaded': return 'clock';
      default: return 'lock';
    }
  }

  getStepClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-white';
      case 'uploaded': return 'bg-primary-700 text-white';
      default: return 'bg-gray-200 text-gray-400';
    }
  }

  getDetailClass(status: string): string {
    switch (status) {
      case 'completed': return 'text-emerald-600 font-semibold';
      case 'uploaded': return 'text-primary-700 font-semibold';
      default: return 'text-gray-400';
    }
  }

  getDetailText(step: any): string {
    switch (step.status) {
      case 'completed': return 'Verified ✓';
      case 'uploaded': return 'Under Review';
      default: return 'Awaiting Upload';
    }
  }

  getCurrentStepDetail(): string {
    const current = this.progress.steps.find((s: any) => s.status === 'uploaded');
    if (current) return `We are currently reviewing your ${current.label}. This typically takes 24-48 hours.`;
    const pending = this.progress.steps.find((s: any) => s.status === 'pending');
    if (pending) return `Please upload your ${pending.label} to continue the verification process.`;
    return 'All documents have been verified. Your verification is complete.';
  }

  getEstimatedDays(): number {
    const pending = this.progress.steps.filter((s: any) => s.status === 'pending').length;
    const reviewing = this.progress.steps.filter((s: any) => s.status === 'uploaded').length;
    return pending + reviewing;
  }

  navigateTo(route: string): void { this.router.navigate([route]); }
  logout(): void { this.authService.logout(); }
}
