import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'general';
  status: 'active' | 'inactive';
  lastActive: string;
  avatar: string;
}

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {
  isLoading = true;
  members: TeamMember[] = [];
  totalMembers = 0;
  currentPage = 1;
  rowsPerPage = 10;
  totalPages = 1;

  // Modal state
  showModal = false;
  isEditing = false;
  editingId = '';
  userForm!: FormGroup;
  formError = '';
  formLoading = false;

  constructor(private apiService: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['general', [Validators.required]],
      companyName: [''],
    });
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.apiService.getUsers().subscribe({
      next: (res) => {
        this.members = res.data.map((u: any) => ({
          id: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          status: u.isActive ? 'active' : 'inactive',
          lastActive: u.lastLogin ? this.timeAgo(u.lastLogin) : 'Never',
          avatar: u.fullName.split(' ').map((n: string) => n[0]).join(''),
        }));
        this.totalMembers = res.total;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingId = '';
    this.formError = '';
    this.userForm.reset({ role: 'general', companyName: '', password: '', fullName: '', email: '' });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(member: TeamMember): void {
    this.isEditing = true;
    this.editingId = member.id;
    this.formError = '';
    this.userForm.patchValue({
      fullName: member.name,
      email: member.email,
      role: member.role,
      companyName: '',
      password: '',
    });
    // Password not required for edit
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
  }

  submitForm(): void {
    if (this.userForm.invalid) {
      // Show specific validation errors
      const controls = this.userForm.controls;
      if (controls['fullName'].invalid) { this.formError = 'Full name is required.'; return; }
      if (controls['email'].invalid) { this.formError = 'Valid email is required.'; return; }
      if (!this.isEditing && controls['password'].invalid) { this.formError = 'Password must be at least 6 characters.'; return; }
      this.formError = 'Please fill all required fields correctly.';
      return;
    }
    this.formLoading = true;
    this.formError = '';

    if (this.isEditing) {
      const { fullName, email, role, companyName } = this.userForm.value;
      this.apiService.updateUser(this.editingId, { fullName, email, role, companyName }).subscribe({
        next: () => { this.formLoading = false; this.closeModal(); this.fetchUsers(); },
        error: (err) => { this.formLoading = false; this.formError = err.error?.message || 'Failed to update user.'; }
      });
    } else {
      this.apiService.createUser(this.userForm.value).subscribe({
        next: () => { this.formLoading = false; this.closeModal(); this.fetchUsers(); },
        error: (err) => { this.formLoading = false; this.formError = err.error?.message || 'Failed to create user.'; }
      });
    }
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.apiService.deleteUser(id).subscribe({
        next: () => { this.fetchUsers(); },
        error: (err) => { alert(err.error?.message || 'Failed to delete user.'); }
      });
    }
  }

  private timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hrs ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  }

  getRoleClass(role: string): string {
    return role === 'admin' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60' : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/60';
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200/60';
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; }
  }
}
