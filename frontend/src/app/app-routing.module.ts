import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TeamComponent } from './pages/team/team.component';
import { VerificationsComponent } from './pages/verifications/verifications.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ComplianceComponent } from './pages/compliance/compliance.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SupportComponent } from './pages/support/support.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { UserVerificationsComponent } from './pages/user-verifications/user-verifications.component';
import { UserOverviewComponent } from './pages/user-overview/user-overview.component';
import { UserSettingsComponent } from './pages/user-settings/user-settings.component';
import { AuthGuard, AdminGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Admin routes (protected)
  { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
  { path: 'verifications', component: VerificationsComponent, canActivate: [AdminGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [AdminGuard] },
  { path: 'team', component: TeamComponent, canActivate: [AdminGuard] },
  { path: 'compliance', component: ComplianceComponent, canActivate: [AdminGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'support', component: SupportComponent, canActivate: [AuthGuard] },
  // User routes (protected)
  { path: 'user-overview', component: UserOverviewComponent, canActivate: [AuthGuard] },
  { path: 'user-profile', component: UserDashboardComponent, canActivate: [AuthGuard] },
  { path: 'user-verifications', component: UserVerificationsComponent, canActivate: [AuthGuard] },
  { path: 'user-settings', component: UserSettingsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
