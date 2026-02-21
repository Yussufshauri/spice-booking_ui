import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-guider-dashboard',
  imports: [CommonModule],
  templateUrl: './guider-dashboard.html',
  styleUrl: './guider-dashboard.css',
})
export class GuiderDashboard {
  
  sidebarOpen = true;
  activeTab = 'dashboard';

  // mfano wa data (badilisha na API)
  myTours = [
    { id: 1, name: 'Zanzibar Spice Tour', status: 'ACTIVE' },
    { id: 2, name: 'Stone Town Walk', status: 'INACTIVE' }
  ];

  myBookings = [
    { id: 1, customer: 'Ahmed', date: '2026-03-12', status: 'CONFIRMED' },
    { id: 2, customer: 'Fatma', date: '2026-03-15', status: 'PENDING' }
  ];

  reviews = [
    { user: 'Ali', rating: 5, comment: 'Guide mzuri sana!' },
    { user: 'Sara', rating: 4, comment: 'Safari nzuri' }
  ];

  setTab(tab: string) {
    this.activeTab = tab;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

}
