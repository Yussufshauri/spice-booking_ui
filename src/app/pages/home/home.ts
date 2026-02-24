import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService } from '../../services/user-service';
import { Role, User } from '../../model/user.model';

type SectionId = 'home' | 'about' | 'features' | 'booking' | 'contact';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {

  // ================= UI STATE =================
  menuOpen = false;
  showLoginModal = false;
  showRegisterModal = false;
  activeSection: SectionId = 'home';
  scrolled = false;

  // ================= SLIDER =================
  currentSlide = 0;
  private sliderTimer: any = null;
  isHoveringHero = false;

  slides = [
    {
      title: 'Smart Spice Booking Platform',
      text: 'Book premium-quality spices and tours easily with a modern, reliable system.',
      image: 'img/p1.jpg',
    },
    {
      title: 'Fresh • Authentic • Trusted',
      text: 'We connect you with verified suppliers and guides for a smooth experience.',
      image: 'img/p2.jpg',
    },
    {
      title: 'Fast Booking, Clear Status',
      text: 'Manage bookings, track status, and review tours in one place.',
      image: 'img/p3.jpg',
    },
  ];

  // ================= AUTH =================
  loginData = {
    username: '',
    password: '',
  };

  registerData = {
    name: '',
    username: '',
    email: '',
    password: '',
  };

  loginMessage = '';
  loginError = '';
  registerMessage = '';
  registerError = '';

  loginLoading = signal(false);
  registerLoading = signal(false);

  private sub = new Subscription();

  constructor(
    private ngZone: NgZone,
    private userService: UserService,
    private router: Router,
    private el: ElementRef<HTMLElement>
  ) {}

  // ================= LIFECYCLE =================
  ngOnInit(): void {
    // Start slider
    this.ngZone.runOutsideAngular(() => {
      this.sliderTimer = setInterval(() => {
        if (this.isHoveringHero) return;
        this.ngZone.run(() => this.nextSlide());
      }, 6000);
    });

    // Detect active section on load
    setTimeout(() => this.detectActiveSection(), 0);
  }

  ngOnDestroy(): void {
    if (this.sliderTimer) clearInterval(this.sliderTimer);
    this.sub.unsubscribe();
    this.unlockBodyScroll();
  }

  // ================= NAVIGATION =================
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  goToBookings(): void {
    const user = this.getUser();

    if (!user) {
      this.openLogin();
      return;
    }

    this.routeToDashboard(user);
  }

  private routeToDashboard(user: User): void {
    if (user.role === Role.Admin) {
      this.router.navigate(['/admin']);
    } else if (user.role === Role.Guide) {
      this.router.navigate(['/guide']);
    } else {
      this.router.navigate(['/tourist']);
    }
  }

  scrollTo(section: SectionId): void {
    this.closeMenu();

    const target = this.el.nativeElement.querySelector(
      `#${section}`
    ) as HTMLElement | null;

    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // ================= SLIDER CONTROLS =================
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  setSlide(index: number): void {
    this.currentSlide = index;
  }

  heroHover(isHovering: boolean): void {
    this.isHoveringHero = isHovering;
  }

  // ================= MODALS =================
  openLogin(): void {
    this.resetMessages();
    this.showRegisterModal = false;
    this.showLoginModal = true;
    this.lockBodyScroll();
  }

  openRegister(): void {
    this.resetMessages();
    this.showLoginModal = false;
    this.showRegisterModal = true;
    this.lockBodyScroll();
  }

  closeModals(): void {
    this.showLoginModal = false;
    this.showRegisterModal = false;
    this.unlockBodyScroll();
  }

  private resetMessages(): void {
    this.loginMessage = '';
    this.loginError = '';
    this.registerMessage = '';
    this.registerError = '';
  }

  // ================= HOST LISTENERS =================
  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModals();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 900) {
      this.menuOpen = false;
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 10;
    this.detectActiveSection();
  }

  private detectActiveSection(): void {
    const sections: SectionId[] = [
      'home',
      'about',
      'features',
      'booking',
      'contact',
    ];

    const offset = 120;

    for (const id of sections) {
      const element = this.el.nativeElement.querySelector(
        `#${id}`
      ) as HTMLElement | null;

      if (!element) continue;

      const rect = element.getBoundingClientRect();

      if (rect.top <= offset && rect.bottom > offset) {
        this.activeSection = id;
        break;
      }
    }
  }

  // ================= LOGIN =================
  submitLogin(): void {
    this.resetMessages();

    if (!this.loginData.username || !this.loginData.password) {
      this.loginError = 'Please enter both username and password.';
      return;
    }

    this.loginLoading.set(true);

    const subscription = this.userService
      .login(this.loginData)
      .subscribe({
        next: (user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.loginMessage = 'Welcome back! Redirecting...';

          setTimeout(() => {
            this.closeModals();
            this.routeToDashboard(user);
          }, 900);
        },
        error: (err) => {
          const msg =
            err?.error?.error ||
            err?.error?.message ||
            'Invalid username or password. Please try again.';

          this.loginError = msg;
        },
        complete: () => this.loginLoading.set(false),
      });

    this.sub.add(subscription);
  }

  // ================= REGISTER =================
  submitRegister(): void {
    this.resetMessages();

    const { name, username, email, password } = this.registerData;

    if (!name || !username || !email || !password) {
      this.registerError = 'Please fill in all required fields.';
      return;
    }

    this.registerLoading.set(true);

    const subscription = this.userService
      .register({ name, username, email, password })
      .subscribe({
        next: () => {
          this.registerMessage =
            'Account created successfully! Please login to continue.';

          this.registerData = {
            name: '',
            username: '',
            email: '',
            password: '',
          };

          setTimeout(() => this.openLogin(), 900);
        },
        error: (err) => {
          if (err?.status === 409) {
            this.registerError =
              'Username already exists. Choose another.';
          } else {
            const msg =
              err?.error?.error ||
              err?.error?.message ||
              'Registration failed. Please try again.';

            this.registerError = msg;
          }
        },
        complete: () => this.registerLoading.set(false),
      });

    this.sub.add(subscription);
  }

  // ================= LOCAL STORAGE =================
  private getUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }

  // ================= BODY SCROLL CONTROL =================
  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    document.body.style.overflow = '';
  }
}