import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LandingPage from '../pages/LandingPage';
import Authentication from '../pages/Authentication';
import SearchResults from '../pages/SearchResults';
import HelperDetail from '../pages/HelperDetail';
import HelperRequestForm from '../pages/HelperRequestForm';
import Payment from '../pages/Payment';
import PaymentResult from '../pages/PaymentResult';
import RealtimeChat from '../pages/RealtimeChat';
import TravelerDashboard from '../pages/TravelerDashboard';
import HelperDashboard from '../pages/HelperDashboard';
import ReviewManagement from '../pages/ReviewManagement';
import AdminDashboard from '../pages/AdminDashboard';
import Customers from '../pages/admin/accounts/Customers';
import LocalHelpers from '../pages/admin/accounts/LocalHelpers';
import ProfileEdit from '../pages/ProfileEdit';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages wrapped in MainLayout (with Header & Footer) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<Authentication />} />
        <Route path="auth" element={<Authentication />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="helpers" element={<SearchResults />} />
        <Route path="helper/:id" element={<HelperDetail />} />
        <Route path="request/:id" element={<HelperRequestForm />} />
        <Route path="payment" element={<Payment />} />
        <Route path="payment-result" element={<PaymentResult />} />
        <Route path="profile" element={<ProfileEdit />} />
        
        {/* Dashboards and Chat */}
        <Route path="chat" element={<RealtimeChat />} />
        <Route path="traveler" element={<TravelerDashboard />} />
        <Route path="helper-dashboard" element={<HelperDashboard />} />
        <Route path="reviews" element={<ReviewManagement />} />
        
        {/* Admin Portal Routes */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/accounts/customers" element={<Customers />} />
        <Route path="admin/accounts/local-helpers" element={<LocalHelpers />} />
      </Route>
    </Routes>
  );
}
