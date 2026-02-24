import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TourService } from '../../services/tour.service';
import { BookingService } from '../../services/booking.service';
import { ReviewService } from '../../services/review.service';

import { Tour, Status } from '../../model/tour.model';
import { Booking } from '../../model/booking.model';
import { Review } from '../../model/review.model';
import { Role, User } from '../../model/user.model';

type TabKey = 'dashboard' | 'tours' | 'bookings' | 'reviews' | 'profile';

@Component({
  selector: 'app-guider-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './guider-dashboard.html',
  styleUrl: './guider-dashboard.css',
})
export class GuiderDashboard implements OnInit {
  // ===== UI =====
  sidebarOpen = true;
  activeTab: TabKey = 'dashboard';

  toastMsg = signal('');
  toastType = signal<'success' | 'error' | 'info'>('info');

  // ===== AUTH =====
  currentUser: User | null = null;

  // ===== DATA =====
  tours = signal<Tour[]>([]);
  bookings = signal<Booking[]>([]);
  reviews = signal<Review[]>([]);

  loadingTours = signal(false);
  loadingBookings = signal(false);
  loadingReviews = signal(false);

  // ===== FILTERS =====
  qTours = '';
  qBookings = '';
  qReviews = '';
  tourStatusFilter: Status | 'ALL' = 'ALL';

  // ===== MODALS =====
  showTourModal = false;
  tourSuccess = '';
  tourError = '';

  // ===== FORM: Add Tour =====
  tourForm: {
    title: string;
    description: string;
    price: number | null;
    date: string;
    image: File | null;
  } = {
    title: '',
    description: '',
    price: null,
    date: '',
    image: null,
  };

  // ===== ENUMS =====
  Status = Status;
  Role = Role;
  statuses: Status[] = [
    Status.Pending,
    Status.Approved,
    Status.Rejected,
    Status.Confirmed,
    Status.Completed,
    Status.Canceled,
  ];

  // =========================
  //  HELPERS (robust mapping)
  // =========================
  private ownerIdOf(t: Tour): number | null {
    const anyT: any = t as any;
    return (
      anyT?.user?.user_id ??
      anyT?.userId ??
      anyT?.user_id ??
      anyT?.guideId ??
      anyT?.guide_id ??
      null
    );
  }

  tourTitle(t: Tour): string {
    const anyT: any = t as any;
    return anyT?.title || anyT?.name || 'Tour';
  }

  tourDesc(t: Tour): string {
    const anyT: any = t as any;
    return anyT?.description || '';
  }

  tourPrice(t: Tour): string {
    const anyT: any = t as any;
    const p = anyT?.price;
    return p === null || p === undefined ? '—' : String(p);
  }

  imgUrl(t: Tour): string {
    const anyT: any = t as any;
    const img =
      anyT?.imageUrl ||
      anyT?.image_url ||
      anyT?.image ||
      anyT?.imagePath ||
      '';

    if (!img) return 'assets/img/p1.jpg'; // fallback

    // already absolute
    if (String(img).startsWith('http')) return String(img);

    // backend serves /uploads/** (e.g. /uploads/xxx.jpg)
    return `http://localhost:8080${img}`;
  }

  // =========================
  //  COMPUTED
  // =========================
  myTours = computed(() => {
    const me = this.currentUser?.user_id;
    if (!me) return [];

    // FIX: use ownerIdOf() so it works even when t.user is null
    let arr = this.tours().filter(t => this.ownerIdOf(t) === me);

    if (this.tourStatusFilter !== 'ALL') {
      arr = arr.filter(t => t.status === this.tourStatusFilter);
    }

    const q = this.qTours.trim().toLowerCase();
    if (!q) return arr;

    return arr.filter(t =>
      this.tourTitle(t).toLowerCase().includes(q) ||
      this.tourDesc(t).toLowerCase().includes(q) ||
      this.tourPrice(t).toLowerCase().includes(q) ||
      String(t.status || '').toLowerCase().includes(q)
    );
  });

  // bookings related to my tours (client-side)
  myBookings = computed(() => {
    const myTourIds = new Set(this.myTours().map(t => t.tour_id));

    let arr = this.bookings().filter(b => myTourIds.has(b.tour?.tour_id));

    const q = this.qBookings.trim().toLowerCase();
    if (!q) return arr;

    return arr.filter(b =>
      String(b.booking_id).includes(q) ||
      (b.user?.name || '').toLowerCase().includes(q) ||
      ((b.tour?.title || (b.tour as any)?.name || '') as string).toLowerCase().includes(q) ||
      (b.status || '').toLowerCase().includes(q)
    );
  });

  filteredReviews = computed(() => {
    const q = this.qReviews.trim().toLowerCase();
    if (!q) return this.reviews();

    return this.reviews().filter(r =>
      (r.user?.name || '').toLowerCase().includes(q) ||
      ((r.tour?.title || (r.tour as any)?.name || '') as string).toLowerCase().includes(q) ||
      (r.comment || '').toLowerCase().includes(q)
    );
  });

  // dashboard metrics
  totalMyTours = computed(() => this.myTours().length);
  totalMyBookings = computed(() => this.myBookings().length);
  totalMyReviews = computed(() => this.reviews().length);

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
    if (this.currentUser.role !== Role.Guide) {
      this.router.navigate(['']);
      return;
    }

    this.loadTours();
    this.loadBookings(); // backend haina booking-by-guide, so load all then filter
  }

  // ===== UI =====
  setTab(tab: TabKey) {
    this.activeTab = tab;
    if (tab === 'reviews') this.loadReviewsForMyTours();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['']);
  }

  // ===== LOAD =====
  loadTours() {
    this.loadingTours.set(true);
    this.tourServ.getAllTours().subscribe({
      next: (data) => this.tours.set(data ?? []),
      error: () => this.toast('Failed to load tours.', 'error'),
      complete: () => this.loadingTours.set(false),
    });
  }

  loadBookings() {
    this.loadingBookings.set(true);
    this.bookingServ.getAllBookings().subscribe({
      next: (data) => this.bookings.set(data ?? []),
      error: () => this.toast('Failed to load bookings.', 'error'),
      complete: () => this.loadingBookings.set(false),
    });
  }

  // reviews: fetch for each my tour, merge
  loadReviewsForMyTours() {
    const my = this.myTours();
    if (my.length === 0) {
      this.reviews.set([]);
      return;
    }

    this.loadingReviews.set(true);
    this.reviews.set([]);

    let pending = my.length;
    const collected: Review[] = [];

    my.forEach(t => {
      this.reviewServ.getReviewsByTour(t.tour_id).subscribe({
        next: (arr) => {
          (arr ?? []).forEach(r => collected.push(r));
        },
        error: () => {
          // ignore single failure
        },
        complete: () => {
          pending--;
          if (pending === 0) {
            collected.sort((a, b) =>
              (b.reviewDate || '').localeCompare(a.reviewDate || '')
            );
            this.reviews.set(collected);
            this.loadingReviews.set(false);
          }
        }
      });
    });
  }

  // ===== TOURS CRUD =====
  openTourModal() {
    this.tourSuccess = '';
    this.tourError = '';
    this.showTourModal = true;
    this.tourForm = {
      title: '',
      description: '',
      price: null,
      date: '',
      image: null,
    };
  }

  closeTourModal() {
    this.showTourModal = false;
  }

  onTourImagePicked(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.tourForm.image = input.files?.[0] || null;
  }

  createTour() {
    this.tourSuccess = '';
    this.tourError = '';

    if (!this.currentUser) {
      this.tourError = 'Not logged in.';
      return;
    }

    const { title, description, price, date, image } = this.tourForm;
    if (!title || !description || price == null || !date || !image) {
      this.tourError = 'Please fill all fields and select an image.';
      return;
    }

    this.tourServ.createTour({
      title,
      description,
      price: Number(price),
      date,
      userId: this.currentUser.user_id,
      image,
    }).subscribe({
      next: () => {
        this.tourSuccess = 'Tour created successfully.';
        this.toast('Tour created.', 'success');
        this.loadTours();
        setTimeout(() => this.closeTourModal(), 900);
      },
      error: () => {
        this.tourError = 'Failed to create tour.';
        this.toast(this.tourError, 'error');
      }
    });
  }

  updateTourStatus(tourId: number, status: Status) {
    this.tourServ.updateTourStatus(tourId, status).subscribe({
      next: () => {
        this.toast('Tour status updated.', 'success');
        this.tours.set(
          this.tours().map(t => (t.tour_id === tourId ? { ...t, status } : t))
        );
      },
      error: () => this.toast('Failed to update status.', 'error'),
    });
  }

  deleteTour(tourId: number) {
    if (!confirm('Delete this tour?')) return;

    this.tourServ.deleteTour(tourId).subscribe({
      next: () => {
        this.toast('Tour deleted.', 'success');
        this.loadTours();
      },
      error: () => this.toast('Failed to delete tour.', 'error'),
    });
  }

  // ===== BOOKINGS (guide view) =====
  approveBooking(id: number) {
    this.bookingServ.approveBooking(id).subscribe({
      next: () => {
        this.toast('Booking approved.', 'success');
        this.loadBookings();
      },
      error: () => this.toast('Failed to approve booking.', 'error'),
    });
  }

  rejectBooking(id: number) {
    this.bookingServ.rejectBooking(id).subscribe({
      next: () => {
        this.toast('Booking rejected.', 'success');
        this.loadBookings();
      },
      error: () => this.toast('Failed to reject booking.', 'error'),
    });
  }

  // ===== REVIEWS =====
  deleteReview(reviewId: number) {
    if (!confirm('Delete this review?')) return;

    this.reviewServ.deleteReview(reviewId).subscribe({
      next: () => {
        this.toast('Review deleted.', 'success');
        this.loadReviewsForMyTours();
      },
      error: () => this.toast('Failed to delete review.', 'error'),
    });
  }

  // ===== COMMON =====
  private toast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMsg.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMsg.set(''), 2200);
  }

  private getUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }
    // ===== TEMPLATE SAFE HELPERS (no "as any" in HTML) =====
  bookingTourTitle(b: Booking): string {
    const tour: any = (b as any)?.tour;
    return tour?.title || tour?.name || 'Tour';
  }

  reviewTourTitle(r: Review): string {
    const tour: any = (r as any)?.tour;
    return tour?.title || tour?.name || 'Tour';
  }
}