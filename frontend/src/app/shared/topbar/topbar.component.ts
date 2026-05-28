import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  userName = 'Admin User';
  userCode = '#SYS-882';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.fullName;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
