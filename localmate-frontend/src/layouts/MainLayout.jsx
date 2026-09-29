import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout() {
  const location = useLocation();
  const isChat = location.pathname === '/chat' || location.pathname === '/messages';
  const isAuth = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/auth';
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Navbar />
      <main className={`flex-grow pt-16 ${isChat || isAuth ? 'h-screen overflow-hidden' : ''}`}>
        <Outlet />
      </main>
      {!isChat && !isAuth && <Footer />}
    </div>
  );
}
