import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { UserService } from '../../services/user-service';
import { User } from '../../model/user.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  users = signal<User[]>([]);
  showGuideModal = false;

  guideSuccess = '';
  guideError = '';

  constructor(private userServ: UserService,private router:Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  guideData: Partial<User> = {
    name: '',
    username: '',
    email: '',
    password: ''
  };

  loadUsers() {
    this.userServ.getAllUsers().subscribe((data) => {
      this.users.set(data);
    });
  }

  registerGuide() {
    this.guideSuccess = '';
    this.guideError = '';

    if (
      !this.guideData.name ||
      !this.guideData.username ||
      !this.guideData.email ||
      !this.guideData.password
    ) {
      this.guideError = 'Please fill in all required fields.';
      return;
    }

    this.userServ.registerGuide(this.guideData).subscribe({
      next: () => {
        this.guideSuccess = 'Guide account created successfully.';
        this.loadUsers();

        this.guideData = {
          name: '',
          username: '',
          email: '',
          password: ''
        };

        setTimeout(() => this.closeGuideModal(), 1500);
      },
      error: (err) => {
        this.guideError =
          err.error || 'Failed to register guide.';
      }
    });
  }

  ActiveUsers(): number {
    return this.users().length;
  }

  sidebarOpen = true;
  activeTab = 'dashboard';

  setTab(tab: string) {
    this.activeTab = tab;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  openGuideModal() {
    this.showGuideModal = true;
  }

  closeGuideModal() {
    this.showGuideModal = false;
  }

  logout(){
    this.router.navigate(['']);
  }
}
