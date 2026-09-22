import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  mode: 'company' | 'join' = 'company';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Populated after a successful "company" registration.
  generatedJoinCode = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      joinCode: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      agreeTerms: [false, [Validators.requiredTrue]]
    });
    this.applyModeValidators();
  }

  setMode(mode: 'company' | 'join'): void {
    this.mode = mode;
    this.errorMessage = '';
    this.applyModeValidators();
  }

  /** Company mode requires companyName; join mode requires joinCode. */
  private applyModeValidators(): void {
    const companyName = this.registerForm.get('companyName');
    const joinCode = this.registerForm.get('joinCode');

    if (this.mode === 'company') {
      companyName?.setValidators([Validators.required]);
      joinCode?.clearValidators();
    } else {
      joinCode?.setValidators([Validators.required]);
      companyName?.clearValidators();
    }
    companyName?.updateValueAndValidity();
    joinCode?.updateValueAndValidity();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.errorMessage = this.mode === 'company'
        ? 'Please fill all fields (incl. company name) and accept terms.'
        : 'Please fill all fields (incl. join code) and accept terms.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.generatedJoinCode = '';

    const { fullName, companyName, joinCode, email, password } = this.registerForm.value;

    this.authService.register({
      mode: this.mode,
      fullName,
      email,
      password,
      companyName: this.mode === 'company' ? companyName : undefined,
      joinCode: this.mode === 'join' ? joinCode : undefined,
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (this.mode === 'company') {
          // Show the join code so the admin can share it, then send to login.
          this.generatedJoinCode = res?.data?.joinCode || '';
          this.successMessage = 'Company registered! Save your join code below, then log in.';
          setTimeout(() => this.router.navigate(['/login']), 6000);
        } else {
          this.successMessage = res?.message || 'Request sent. You can log in once an admin approves your access.';
          setTimeout(() => this.router.navigate(['/login']), 4000);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.message || err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
