import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TourService } from '../../services/tour.service';
import { BookingService } from '../../services/booking.service';
import { ReviewService } from '../../services/review.service';

import { Tour, Status as TourStatus } from '../../model/tour.model';
import { Booking, Status as BookingStatus } from '../../model/booking.model';
import { Review } from '../../model/review.model';
import { Role, User } from '../../model/user.model';
import { API } from '../../api/api.config';

type TabKey = 'dashboard' | 'tours' | 'bookings' | 'reviews' | 'profile';

@Component({
  selector: 'app-tourist-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './tourist-dashboard.html',
  styleUrl: './tourist-dashboard.css',
})
export class TouristDashboard implements OnInit {
  // ===== UI =====
  sidebarOpen = true;
  activeTab: TabKey = 'dashboard';

  toastMsg = signal('');
  toastType = signal<'success' | 'error' | 'info'>('info');

  // ===== AUTH =====
  currentUser: User | null = null;

  // ===== DATA =====
  tours = signal<Tour[]>([]);
  myBookings = signal<Booking[]>([]);
  selectedTour: Tour | null = null;

  // reviews for selected tour
  selectedTourReviews = signal<Review[]>([]);
  loadingReviews = signal(false);

  loadingTours = signal(false);
  loadingBookings = signal(false);

  // ===== FILTERS =====
  qTours = '';
  qBookings = '';
  tourStatusFilter: TourStatus | 'ALL' = 'ALL';

  // ===== MODALS =====
  showBookModal = false;
  showReviewModal = false;
  showTourDetailsModal = false;

  bookError = '';
  bookSuccess = '';

  reviewError = '';
  reviewSuccess = '';

  // ===== FORMS =====
  bookingForm = {
    date: '',
  };

  reviewForm = {
    rating: 5,
    comment: '',
  };

  // ===== ENUMS =====
  Role = Role;
  BookingStatus = BookingStatus;
  TourStatus = TourStatus;

  statuses: TourStatus[] = [
    TourStatus.Pending,
    TourStatus.Approved,
    TourStatus.Rejected,
    TourStatus.Confirmed,
    TourStatus.Completed,
    TourStatus.Canceled,
  ];

  // ===== COMPUTED =====
  filteredTours = computed(() => {
    let arr = this.tours();

    if (this.tourStatusFilter !== 'ALL') {
      arr = arr.filter(t => t.status === this.tourStatusFilter);
    }

    const q = this.qTours.trim().toLowerCase();
    if (!q) return arr;

    return arr.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      String(t.price || '').toLowerCase().includes(q) ||
      String(t.status || '').toLowerCase().includes(q)
    );
  });

  filteredBookings = computed(() => {
    const q = this.qBookings.trim().toLowerCase();
    if (!q) return this.myBookings();

    return this.myBookings().filter(b =>
      String(b.booking_id).includes(q) ||
      (b.tour?.title || '').toLowerCase().includes(q) ||
      (b.status || '').toLowerCase().includes(q)
    );
  });

  totalTours = computed(() => this.tours().length);
  totalBookings = computed(() => this.myBookings().length);

  pendingBookings = computed(() =>
    this.myBookings().filter(b => b.status === BookingStatus.Pending).length
  );

  constructor(
    private tourServ: TourService,
    private bookingServ: BookingService,
    private reviewServ: ReviewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.getUser();
    if (!this.currentUser) {
      this.router.navigate(['']);
      return;
    }
    if (this.currentUser.role !== Role.Tourist) {
      this.router.navigate(['']);
      return;
    }

    this.loadTours();
    this.loadMyBookings();
  }

  // ===== UI =====
  setTab(tab: TabKey) {
    this.activeTab = tab;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['']);
  }

  // ===== LOADERS =====
  loadTours() {
    this.loadingTours.set(true);
    this.tourServ.getAllTours().subscribe({
      next: (data) => this.tours.set(data ?? []),
      error: () => this.toast('Failed to load tours.', 'error'),
      complete: () => this.loadingTours.set(false),
    });
  }

  loadMyBookings() {
    if (!this.currentUser) return;

    this.loadingBookings.set(true);

    // IMPORTANT: requires backend endpoint: GET /api/booking/user/{userId}
    this.bookingServ.getBookingsByUser(this.currentUser.user_id).subscribe({
      next: (data) => this.myBookings.set(data ?? []),
      error: () => this.toast('Failed to load your bookings.', 'error'),
      complete: () => this.loadingBookings.set(false),
    });
  }

  // ===== TOUR DETAILS =====
  openTourDetails(t: Tour) {
    this.selectedTour = t;
    this.showTourDetailsModal = true;
    this.loadReviewsForTour(t.tour_id);
  }

  closeTourDetails() {
    this.showTourDetailsModal = false;
    this.selectedTour = null;
    this.selectedTourReviews.set([]);
  }

  // ===== BOOKING =====
  openBookModal(t: Tour) {
    this.selectedTour = t;
    this.showBookModal = true;
    this.bookError = '';
    this.bookSuccess = '';
    this.bookingForm = { date: '' };
  }

  closeBookModal() {
    this.showBookModal = false;
  }

  createBooking() {
    this.bookError = '';
    this.bookSuccess = '';

    if (!this.currentUser || !this.selectedTour) {
      this.bookError = 'Please select a tour.';
      return;
    }
    if (!this.bookingForm.date) {
      this.bookError = 'Please choose a booking date.';
      return;
    }

    this.bookingServ.createBooking({
      userId: this.currentUser.user_id,
      tourId: this.selectedTour.tour_id,
      date: this.bookingForm.date,
    }).subscribe({
      next: () => {
        this.bookSuccess = 'Booking created successfully!';
        this.toast('Booking created.', 'success');
        this.loadMyBookings();
        setTimeout(() => this.closeBookModal(), 900);
      },
      error: () => {
        this.bookError = 'Failed to create booking.';
        this.toast(this.bookError, 'error');
      }
    });
  }

  deleteBooking(id: number) {
    if (!confirm('Delete this booking?')) return;

    this.bookingServ.deleteBooking(id).subscribe({
      next: () => {
        this.toast('Booking deleted.', 'success');
        this.loadMyBookings();
      },
      error: () => this.toast('Failed to delete booking.', 'error'),
    });
  }

  // ===== REVIEWS =====
  loadReviewsForTour(tourId: number) {
    this.loadingReviews.set(true);
    this.reviewServ.getReviewsByTour(tourId).subscribe({
      next: (data) => this.selectedTourReviews.set(data ?? []),
      error: () => this.toast('Failed to load reviews.', 'error'),
      complete: () => this.loadingReviews.set(false),
    });
  }

  openReviewModal(t: Tour) {
    this.selectedTour = t;
    this.showReviewModal = true;
    this.reviewError = '';
    this.reviewSuccess = '';
    this.reviewForm = { rating: 5, comment: '' };
  }

  closeReviewModal() {
    this.showReviewModal = false;
  }

  createReview() {
    this.reviewError = '';
    this.reviewSuccess = '';

    if (!this.currentUser || !this.selectedTour) {
      this.reviewError = 'Please select a tour.';
      return;
    }
    if (!this.reviewForm.comment.trim()) {
      this.reviewError = 'Please write a comment.';
      return;
    }
    if (this.reviewForm.rating < 1 || this.reviewForm.rating > 5) {
      this.reviewError = 'Rating must be between 1 and 5.';
      return;
    }

    this.reviewServ.createReview({
      userId: this.currentUser.user_id,
      tourId: this.selectedTour.tour_id,
      rating: this.reviewForm.rating,
      comment: this.reviewForm.comment,
    }).subscribe({
      next: () => {
        this.reviewSuccess = 'Review submitted successfully!';
        this.toast('Review submitted.', 'success');

        // refresh reviews
        this.loadReviewsForTour(this.selectedTour!.tour_id);

        setTimeout(() => this.closeReviewModal(), 900);
      },
      error: () => {
        this.reviewError = 'Failed to submit review.';
        this.toast(this.reviewError, 'error');
      }
    });
  }

  // ===== HELPERS =====
  imgUrl(t?: Tour): string {
    const fallback = 'assets/placeholder.jpg'; // weka picha yoyote placeholder kwenye assets
  
    if (!t || !t.imageUrl) return fallback;
  
    // 1) fix windows path: uploads\abc.jpg -> uploads/abc.jpg
    let p = String(t.imageUrl).replace(/\\/g, '/').trim();
  
    // 2) if already full url
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
  
    // 3) if saved as /uploads/xxx or uploads/xxx, normalize
    p = p.replace(/^\/?uploads\//, '');
  
    // 4) final url: http://localhost:8080/uploads/xxx
    return `${API.uploads}/${p}`;
  }


  private toast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMsg.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMsg.set(''), 2200);
  }

  private getUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }
}