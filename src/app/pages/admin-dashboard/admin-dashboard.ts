import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Role, User } from '../../model/user.model';
import { Status, Tour } from '../../model/tour.model';
import { Booking } from '../../model/booking.model';
import { Review } from '../../model/review.model';
import { ChatMessage, ChatThread } from '../../model/chat.model';
import { UserService } from '../../services/user-service';
import { TourService } from '../../services/tour.service';
import { ReviewService } from '../../services/review.service';
import { BookingService } from '../../services/booking.service';
import { ChatService } from '../../services/chat.service';
import { API } from '../../api/api.config';

type TabKey =
  | 'dashboard'
  | 'bookings'
  | 'tours'
  | 'users'
  | 'reports'
  | 'settings'
  | 'chats';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit, OnDestroy {
  // ===== UI =====
  sidebarOpen = true;
  activeTab: TabKey = 'dashboard';

  // ===== AUTH =====
  currentUser: User | null = null;

  // ===== STATE =====
  users = signal<User[]>([]);
  tours = signal<Tour[]>([]);
  bookings = signal<Booking[]>([]);

  loadingUsers = signal(false);
  loadingTours = signal(false);
  loadingBookings = signal(false);

  toastMsg = signal<string>('');
  toastType = signal<'success' | 'error' | 'info'>('info');

  // ===== FILTERS =====
  qUsers = '';
  qTours = '';
  qBookings = '';
  bookingStatusFilter: Status | 'ALL' = 'ALL';

  // ===== MODALS =====
  showGuideModal = false;
  showTourModal = false;

  // Tour details + reviews modal
  showTourDetailsModal = false;
  selectedTour: Tour | null = null;
  tourReviews = signal<Review[]>([]);
  loadingReviews = signal(false);

  // ===== FORMS =====
  guideSuccess = '';
  guideError = '';
  tourSuccess = '';
  tourError = '';

  guideData: { name: string; username: string; email: string; password: string } =
    {
      name: '',
      username: '',
      email: '',
      password: '',
    };

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

  // ===== COMPUTED =====
  filteredUsers = computed(() => {
    const q = this.qUsers.trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
  });

  filteredTours = computed(() => {
    const q = this.qTours.trim().toLowerCase();
    if (!q) return this.tours();
    return this.tours().filter(
      (t) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        String(t.price ?? '').toLowerCase().includes(q) ||
        String(t.status ?? '').toLowerCase().includes(q)
    );
  });

  filteredBookings = computed(() => {
    const q = this.qBookings.trim().toLowerCase();
    let arr = this.bookings();

    if (this.bookingStatusFilter !== 'ALL') {
      arr = arr.filter((b) => b.status === this.bookingStatusFilter);
    }
    if (!q) return arr;

    return arr.filter(
      (b) =>
        String(b.booking_id).includes(q) ||
        (b.user?.name || '').toLowerCase().includes(q) ||
        (b.user?.username || '').toLowerCase().includes(q) ||
        (b.tour?.title || '').toLowerCase().includes(q) ||
        (b.status || '').toLowerCase().includes(q)
    );
  });

  totalUsers = computed(() => this.users().length);
  totalTours = computed(() => this.tours().length);
  totalBookings = computed(() => this.bookings().length);
  pendingBookings = computed(
    () => this.bookings().filter((b) => b.status === Status.Pending).length
  );

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

  // ===== CHATS =====
  chatThreads = signal<ChatThread[]>([]);
  chatMessages = signal<ChatMessage[]>([]);
  selectedThread: ChatThread | null = null;

  chatSearch = '';
  chatInput = '';
  loadingThreads = signal(false);
  loadingMessages = signal(false);

  private chatPoll: any = null;

  filteredThreads = computed(() => {
    const q = this.chatSearch.trim().toLowerCase();
    if (!q) return this.chatThreads();
    return this.chatThreads().filter(
      (t) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.lastMessage || '').toLowerCase().includes(q)
    );
  });

  constructor(
    private userServ: UserService,
    private tourServ: TourService,
    private bookingServ: BookingService,
    private reviewServ: ReviewService,
    private chatServ: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.getUser();
    if (!this.currentUser) {
      this.router.navigate(['']);
      return;
    }
    if (this.currentUser.role !== Role.Admin) {
      this.router.navigate(['']);
      return;
    }

    this.loadAll();
  }

  ngOnDestroy(): void {
    if (this.chatPoll) clearInterval(this.chatPoll);
  }

  // ===== LOADERS =====
  loadAll() {
    this.loadUsers();
    this.loadTours();
    this.loadBookings();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    this.userServ.getAllUsers().subscribe({
      next: (data) => this.users.set(data ?? []),
      error: () => this.toast('Failed to load users.', 'error'),
      complete: () => this.loadingUsers.set(false),
    });
  }

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

  // ===== UI =====
  setTab(tab: TabKey) {
    this.activeTab = tab;

    if (tab === 'users') this.qUsers = '';
    if (tab === 'tours') this.qTours = '';
    if (tab === 'bookings') {
      this.qBookings = '';
      this.bookingStatusFilter = 'ALL';
    }

    if (tab === 'chats') {
      this.initChats();
    } else {
      if (this.chatPoll) clearInterval(this.chatPoll);
      this.chatPoll = null;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['']);
  }

  // ===== USERS =====
  deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    this.userServ.deleteUser(id).subscribe({
      next: () => {
        this.toast('User deleted.', 'success');
        this.loadUsers();
      },
      error: () => this.toast('Failed to delete user.', 'error'),
    });
  }

  openGuideModal() {
    this.guideSuccess = '';
    this.guideError = '';
    this.showGuideModal = true;
  }

  closeGuideModal() {
    this.showGuideModal = false;
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
      this.guideError = 'Please fill all required fields.';
      return;
    }

    this.userServ.registerGuide(this.guideData).subscribe({
      next: () => {
        this.guideSuccess = 'Guide created successfully.';
        this.toast('Guide created.', 'success');
        this.loadUsers();

        this.guideData = { name: '', username: '', email: '', password: '' };
        setTimeout(() => this.closeGuideModal(), 800);
      },
      error: (err) => {
        if (err?.status === 409) this.guideError = 'Username already exists.';
        else this.guideError = 'Failed to create guide.';
        this.toast(this.guideError, 'error');
      },
    });
  }

  // ===== TOURS =====
  openTourModal() {
    this.tourSuccess = '';
    this.tourError = '';
    this.showTourModal = true;
    this.tourForm = { title: '', description: '', price: null, date: '', image: null };
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

    this.tourServ
      .createTour({
        title,
        description,
        price: Number(price),
        date,
        userId: this.currentUser.user_id,
        image,
      })
      .subscribe({
        next: () => {
          this.tourSuccess = 'Tour created successfully.';
          this.toast('Tour created.', 'success');
          this.loadTours();
          setTimeout(() => this.closeTourModal(), 900);
        },
        error: () => {
          this.tourError = 'Failed to create tour.';
          this.toast(this.tourError, 'error');
        },
      });
  }

  updateTourStatus(tourId: number, status: Status) {
    this.tourServ.updateTourStatus(tourId, status).subscribe({
      next: () => {
        this.toast('Tour status updated.', 'success');
        this.tours.set(this.tours().map((t) => (t.tour_id === tourId ? { ...t, status } : t)));
      },
      error: () => this.toast('Failed to update tour status.', 'error'),
    });
  }

  deleteTour(id: number) {
    if (!confirm('Delete this tour?')) return;
    this.tourServ.deleteTour(id).subscribe({
      next: () => {
        this.toast('Tour deleted.', 'success');
        this.loadTours();
      },
      error: () => this.toast('Failed to delete tour.', 'error'),
    });
  }

  // ===== TOUR DETAILS + REVIEWS =====
  openTourDetails(t: Tour) {
    this.selectedTour = t;
    this.showTourDetailsModal = true;
    this.loadReviewsForTour(t.tour_id);
  }

  closeTourDetails() {
    this.showTourDetailsModal = false;
    this.selectedTour = null;
    this.tourReviews.set([]);
  }

  loadReviewsForTour(tourId: number) {
    this.loadingReviews.set(true);
    this.reviewServ.getReviewsByTour(tourId).subscribe({
      next: (data) => this.tourReviews.set(data ?? []),
      error: () => this.toast('Failed to load reviews.', 'error'),
      complete: () => this.loadingReviews.set(false),
    });
  }

  deleteReview(reviewId: number) {
    if (!confirm('Delete this review?')) return;
    this.reviewServ.deleteReview(reviewId).subscribe({
      next: () => {
        this.toast('Review deleted.', 'success');
        if (this.selectedTour) this.loadReviewsForTour(this.selectedTour.tour_id);
      },
      error: () => this.toast('Failed to delete review.', 'error'),
    });
  }

  // ===== BOOKINGS =====
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

  updateBookingStatus(id: number, status: Status) {
    this.bookingServ.updateStatus(id, status).subscribe({
      next: () => {
        this.toast('Booking status updated.', 'success');
        this.bookings.set(
          this.bookings().map((b) => (b.booking_id === id ? { ...b, status } : b))
        );
      },
      error: () => this.toast('Failed to update booking status.', 'error'),
    });
  }

  // ✅ NEW: Delete booking
  deleteBooking(id: number) {
    if (!confirm('Delete this booking?')) return;
    this.bookingServ.deleteBooking(id).subscribe({
      next: () => {
        this.toast('Booking deleted.', 'success');
        this.loadBookings();
      },
      error: () => this.toast('Failed to delete booking.', 'error'),
    });
  }

  // ===== REPORTS / SETTINGS =====
  exportReport() {
    this.toast('Report exported (demo).', 'info');
  }

  saveSettings() {
    this.toast('Settings saved (demo).', 'success');
  }

  // ===== CHATS CONNECT =====
  initChats() {
    this.loadThreads();

    // poll threads/messages for updates
    if (!this.chatPoll) {
      this.chatPoll = setInterval(() => {
        this.loadThreads(false);
        if (this.selectedThread) this.loadMessages(this.selectedThread.thread_id, false);
      }, 5000);
    }
  }

  loadThreads(showToast = true) {
    this.loadingThreads.set(true);
    this.chatServ.listThreads().subscribe({
      next: (data) => {
        this.chatThreads.set(data ?? []);
        // auto select first thread
        if (!this.selectedThread && (data?.length || 0) > 0) {
          this.selectThread(data![0]);
        }
      },
      error: () => {
        if (showToast) this.toast('Failed to load chats (backend not added yet).', 'error');
      },
      complete: () => this.loadingThreads.set(false),
    });
  }

  selectThread(t: ChatThread) {
    this.selectedThread = t;
    this.loadMessages(t.thread_id, true);
  }

  loadMessages(threadId: number, showToast = true) {
    this.loadingMessages.set(true);
    this.chatServ.getMessages(threadId).subscribe({
      next: (data) => this.chatMessages.set(data ?? []),
      error: () => {
        if (showToast) this.toast('Failed to load messages.', 'error');
      },
      complete: () => this.loadingMessages.set(false),
    });
  }

  sendChat() {
    if (!this.currentUser || !this.selectedThread) return;
    const text = this.chatInput.trim();
    if (!text) return;

    this.chatInput = '';

    this.chatServ.sendMessage(this.selectedThread.thread_id, this.currentUser.user_id, text).subscribe({
      next: () => {
        // reload messages
        this.loadMessages(this.selectedThread!.thread_id, false);
      },
      error: () => this.toast('Failed to send message.', 'error'),
    });
  }

  // ===== TOAST =====
  toast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMsg.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMsg.set(''), 2200);
  }

  

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

  private getUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }
}