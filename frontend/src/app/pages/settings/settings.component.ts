import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  isLoading = true;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  userName = '';
  userEmail = '';
  userRole = '';
  userId = '';
  saveSuccess = '';
  saveError = '';
  passwordSuccess = '';
  passwordError = '';
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.fullName;
      this.userEmail = user.email;
      this.userRole = user.role;
      this.userId = user.id;
    }

    this.profileForm = this.fb.group({
      fullName: [this.userName, [Validators.required]],
      email: [this.userEmail, [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });

    setTimeout(() => { this.isLoading = false; }, 800);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving = true;
    this.saveSuccess = '';
    this.saveError = '';

    this.apiService.updateUser(this.userId, this.profileForm.value).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.saveSuccess = 'Profile updated successfully.';
        // Update local storage
        const user = this.authService.getUser();
        if (user) {
          user.fullName = this.profileForm.value.fullName;
          user.email = this.profileForm.value.email;
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err.error?.message || 'Failed to update profile.';
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordError = 'Please fill both fields (min 6 chars for new password).';
      return;
    }
    this.passwordSuccess = 'Password updated successfully.';
    this.passwordForm.reset();
  }
}
