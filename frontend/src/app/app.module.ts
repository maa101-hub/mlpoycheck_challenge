import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { TeamComponent } from './pages/team/team.component';
import { VerificationsComponent } from './pages/verifications/verifications.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { UserVerificationsComponent } from './pages/user-verifications/user-verifications.component';
import { UserOverviewComponent } from './pages/user-overview/user-overview.component';
import { UserSettingsComponent } from './pages/user-settings/user-settings.component';
import { AccessRequestsComponent } from './pages/access-requests/access-requests.component';
import { RequiredDocumentsComponent } from './pages/required-documents/required-documents.component';
import { DocumentReviewComponent } from './pages/document-review/document-review.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    SidebarComponent,
    TopbarComponent,
    TeamComponent,
    VerificationsComponent,
    ReportsComponent,
    SettingsComponent,
    UserDashboardComponent,
    UserVerificationsComponent,
    UserOverviewComponent,
    UserSettingsComponent,
    AccessRequestsComponent,
    RequiredDocumentsComponent,
    DocumentReviewComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
