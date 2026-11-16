import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-14 px-6 md:px-10 bg-slate-950 text-slate-300 border-t border-slate-800/80 mt-auto selection:bg-teal-500 selection:text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              L
            </span>
            <span className="text-xl font-black text-white tracking-tight">LocalMate</span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Nền tảng kết nối du khách với những người bạn đồng hành địa phương được kiểm duyệt. Trải nghiệm du lịch chân thực với sự an tâm tuyệt đối nhờ Quỹ Ký quỹ Escrow.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Bảo đảm giao dịch an toàn 100%
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Khám phá</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <Link to="/search" className="hover:text-teal-400 transition-colors">Tìm Local Helper</Link>
            </li>
            <li>
              <Link to="/search?location=Hà Nội" className="hover:text-teal-400 transition-colors">Tour Hà Nội</Link>
            </li>
            <li>
              <Link to="/search?location=Đà Nẵng" className="hover:text-teal-400 transition-colors">Tour Đà Nẵng</Link>
            </li>
            <li>
              <Link to="/search?location=Hội An" className="hover:text-teal-400 transition-colors">Tour Hội An</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Dành cho Helper</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <Link to="/login?tab=signup&role=guide" className="hover:text-teal-400 transition-colors">Đăng ký làm Helper</Link>
            </li>
            <li>
              <Link to="/helper-dashboard" className="hover:text-teal-400 transition-colors">Ví thu nhập &amp; Rút tiền</Link>
            </li>
            <li>
              <Link to="/reviews" className="hover:text-teal-400 transition-colors">Quản lý đánh giá</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Chính sách & An toàn</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <a href="#how-it-works" className="hover:text-teal-400 transition-colors">Cơ chế Ký quỹ Escrow</a>
            </li>
            <li>
              <span className="text-slate-500">Chính sách bảo mật</span>
            </li>
            <li>
              <span className="text-slate-500">Điều khoản dịch vụ</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 mt-10 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 LocalMate Platform. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span>Made with passion for authentic travel</span>
        </p>
      </div>
    </footer>
  );
}
