import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  isLoading = true;
  userName = '';
  userEmail = '';

  passwordForm!: FormGroup;
  passwordSuccess = '';
  passwordError = '';
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) { this.userName = user.fullName; this.userEmail = user.email; }

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });

    setTimeout(() => { this.isLoading = false; }, 1100);
  }

  updatePassword(): void {
    this.passwordSuccess = '';
    this.passwordError = '';

    if (this.passwordForm.invalid) {
      this.passwordError = 'Please fill all fields (new password must be at least 6 characters).';
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    this.isSaving = true;
    this.apiService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isSaving = false;
        this.passwordSuccess = 'Password updated successfully.';
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isSaving = false;
        this.passwordError = err.error?.message || 'Failed to update password.';
      }
    });
  }

  navigateTo(route: string): void { this.router.navigate([route]); }
  logout(): void { this.authService.logout(); }
}
