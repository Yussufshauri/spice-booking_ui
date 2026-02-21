import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { TouristDashboard } from './pages/tourist-dashboard/tourist-dashboard';
import { GuiderDashboard } from './pages/guider-dashboard/guider-dashboard';

export const routes: Routes = [
    {path: '', component: Home},
    {path: 'admin',component:AdminDashboard},
    {path: 'guide',component:GuiderDashboard},
    {path: 'tourist',component:TouristDashboard}
];
