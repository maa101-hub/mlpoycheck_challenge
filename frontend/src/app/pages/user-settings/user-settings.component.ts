import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  isLoading = true;
  userName = '';
  userEmail = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) { this.userName = user.fullName; this.userEmail = user.email; }
    setTimeout(() => { this.isLoading = false; }, 1100);
  }

  navigateTo(route: string): void { this.router.navigate([route]); }
  logout(): void { this.authService.logout(); }
}
