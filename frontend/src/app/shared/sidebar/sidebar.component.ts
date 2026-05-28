import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  activeId = 'dashboard';

  mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid', route: '/dashboard' },
    { id: 'verifications', label: 'Verifications', icon: 'shield', route: '/verifications' },
    { id: 'reports', label: 'Reports', icon: 'chart', route: '/reports' },
    { id: 'team', label: 'Team', icon: 'users', route: '/team' },
    { id: 'compliance', label: 'Compliance', icon: 'clipboard', route: '/compliance' },
  ];

  bottomNavItems = [
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
    { id: 'support', label: 'Support', icon: 'help', route: '/support' },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Set active based on current URL
    this.updateActiveFromUrl();
    this.router.events.subscribe(() => {
      this.updateActiveFromUrl();
    });
  }

  private updateActiveFromUrl(): void {
    const url = this.router.url;
    const allItems = [...this.mainNavItems, ...this.bottomNavItems];
    const match = allItems.find(item => url === item.route);
    if (match) {
      this.activeId = match.id;
    }
  }

  navigate(item: any): void {
    this.activeId = item.id;
    this.router.navigate([item.route]);
  }

  logout(): void {
    this.authService.logout();
  }
}
