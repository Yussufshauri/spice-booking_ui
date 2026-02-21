import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tourist-dashboard',
  imports: [CommonModule],
  templateUrl: './tourist-dashboard.html',
  styleUrl: './tourist-dashboard.css',
})
export class TouristDashboard {
  sidebarOpen = true;
  activeTab = 'dashboard';

  // mfano wa data (replace na API)
  myBookings = [
    { id: 1, tour: 'Zanzibar Spice Tour', date: '2026-03-20', status: 'CONFIRMED' },
    { id: 2, tour: 'Stone Town Walk', date: '2026-04-01', status: 'PENDING' }
  ];

  availableTours = [
    { id: 1, name: 'Zanzibar Spice Tour', price: 50 },
    { id: 2, name: 'Island Adventure', price: 80 }
  ];

  myReviews = [
    { tour: 'Zanzibar Spice Tour', rating: 5, comment: 'Safari nzuri sana!' }
  ];

  setTab(tab: string) {
    this.activeTab = tab;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

}
