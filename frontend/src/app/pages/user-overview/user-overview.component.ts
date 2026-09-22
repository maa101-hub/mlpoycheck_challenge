import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-overview',
  templateUrl: './user-overview.component.html',
  styleUrls: ['./user-overview.component.scss']
})
export class UserOverviewComponent implements OnInit {
  isLoading = true;
  userName = '';

  // Live verification progress from the backend.
  percentage = 0;
  uploaded = 0;
  totalRequired = 0;
  verified = 0;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) this.userName = user.fullName;

    this.apiService.getVerificationProgress().subscribe({
      next: (res) => {
        const d = res?.data || {};
        this.percentage = d.percentage ?? 0;
        this.uploaded = d.uploaded ?? 0;
        this.totalRequired = d.totalRequired ?? 0;
        this.verified = d.verified ?? 0;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  // Documents still awaiting upload or verification.
  get pendingActions(): number {
    return Math.max(this.totalRequired - this.verified, 0);
  }

  get progressLabel(): string {
    if (this.percentage >= 100) return 'Complete';
    if (this.percentage > 0) return 'In Progress';
    return 'Not Started';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }
}
