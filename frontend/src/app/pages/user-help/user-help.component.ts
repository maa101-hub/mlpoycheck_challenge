import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-help',
  templateUrl: './user-help.component.html',
  styleUrls: ['./user-help.component.scss']
})
export class UserHelpComponent implements OnInit {
  isLoading = true;
  userName = '';
  companyName: string | null = null;
  admins: { fullName: string; email: string }[] = [];

  // How the verification process works (real, accurate to this app).
  steps = [
    { title: 'Join your company', text: 'You register with your company\'s join code. Your request goes to a company admin.' },
    { title: 'Get approved', text: 'An admin reviews and approves your access. Once approved, you can log in and start.' },
    { title: 'Upload required documents', text: 'On the Documents page, upload each document your company requires for verification.' },
    { title: 'Admin review', text: 'A company admin reviews each uploaded document and marks it verified or rejected.' },
    { title: 'Verification complete', text: 'When all required documents are verified, your status shows "Verification Successful".' },
  ];

  faqs = [
    { q: 'How do I upload a document?', a: 'Go to the Documents page from the sidebar. Each required document has an upload button — it disappears once that document is uploaded.' },
    { q: 'A document was rejected. What now?', a: 'Contact your company admin (below) to find out what was wrong, then it can be re-reviewed.' },
    { q: 'Why can\'t I log in right after registering?', a: 'New employees start as "pending". You can log in once a company admin approves your access request.' },
    { q: 'How long does verification take?', a: 'It depends on how quickly your company admin reviews your documents. Reach out to them if it\'s taking a while.' },
  ];

  constructor(private authService: AuthService, private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) this.userName = user.fullName;

    this.apiService.getMyCompanyInfo().subscribe({
      next: (res) => {
        this.companyName = res?.data?.companyName ?? null;
        this.admins = res?.data?.admins ?? [];
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  navigateTo(route: string): void { this.router.navigate([route]); }
  logout(): void { this.authService.logout(); }
}
