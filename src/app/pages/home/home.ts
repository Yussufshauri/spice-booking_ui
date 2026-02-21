import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { UserService } from '../../services/user-service';
import { Role, User } from '../../model/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  imports: [CommonModule,FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  menuOpen = false;
  currentSlide = 0;

  /* ===== LOGIN MESSAGES ===== */
  loginMessage = '';
  loginError = '';

  /* ===== REGISTER MESSAGES ===== */
  registerMessage = '';
  registerError = '';

  slides = [
    {
      title: 'Smart Spice Booking Platform',
      text: 'Book premium-quality spices easily with our secure and reliable system.',
      image: 'img/p1.jpg'
    },
    {
      title: 'Fresh & Authentic Spices',
      text: 'We connect you with trusted suppliers for guaranteed freshness.',
      image: 'img/p2.jpg'
    },
    {
      title: 'Fast • Secure • Reliable',
      text: 'Experience a modern way of managing spice bookings.',
      image: 'img/p3.jpg'
    }
  ];

  constructor(
    private ngZone: NgZone,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      setInterval(() => {
        this.ngZone.run(() => this.nextSlide());
      }, 5000);
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  /* ================= LOGIN ================= */
  loginData = {
    username: '',
    password: ''
  };

  submitLogin() {
    this.loginMessage = '';
    this.loginError = '';

    if (!this.loginData.username || !this.loginData.password) {
      this.loginError = 'Please enter both username and password.';
      return;
    }

    this.userService.login(this.loginData).subscribe({
      next: (user: User) => {
        this.loginMessage = 'Welcome back! Redirecting to your dashboard...';

        localStorage.setItem('user', JSON.stringify(user));

        setTimeout(() => {
          if (user.role === Role.Admin) {
            this.router.navigate(['/admin']);
          } else if (user.role === Role.Guide) {
            this.router.navigate(['/guide']);
          } else {
            this.router.navigate(['/tourist']);
          }
          this.closeModals();
        }, 1500);
      },
      error: () => {
        this.loginError =
          'Invalid username or password. Please try again.';
      }
    });
  }

  /* ================= REGISTER ================= */
  registerData: Partial<User> = {
    name: '',
    username: '',
    email: '',
    password: ''
  };

  submitRegister() {
    this.registerMessage = '';
    this.registerError = '';

    if (
      !this.registerData.name ||
      !this.registerData.username ||
      !this.registerData.email ||
      !this.registerData.password
    ) {
      this.registerError = 'Please fill in all required fields.';
      return;
    }

    this.userService.register(this.registerData).subscribe({
      next: () => {
        this.registerMessage =
          'Account created successfully! You can now log in.';

        this.registerData = {
          name: '',
          username: '',
          email: '',
          password: ''
        };

        setTimeout(() => {
          this.openLogin();
        }, 1500);
      },
      error: (err) => {
        if (err.status === 409) {
          this.registerError =
            'This username is already taken. Please choose another.';
        } else {
          this.registerError =
            'Registration failed. Please try again.';
        }
      }
    });
  }

  /* ===== MODALS ===== */
  showLoginModal = false;
  showRegisterModal = false;

  openLogin() {
    this.showRegisterModal = false;
    this.showLoginModal = true;
  }

  openRegister() {
    this.showLoginModal = false;
    this.showRegisterModal = true;
  }

  closeModals() {
    this.showLoginModal = false;
    this.showRegisterModal = false;
  }
}
