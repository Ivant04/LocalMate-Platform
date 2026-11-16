import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ activePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('localmate_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  const isHelper = currentUser?.roles?.includes('ROLE_HELPER');
  const displayName = currentUser?.fullName || currentUser?.name || (isHelper ? 'Local Helper' : 'Du khách');
  const displayAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const roleSubtitle = isHelper ? 'Hồ sơ Local Helper' : 'Hồ sơ Du khách';

  // Determine active item if not provided as prop
  const currentActive = activePage || (
    location.pathname.startsWith('/chat') ? 'messages' :
    location.pathname.startsWith('/reviews') ? 'reviews' :
    location.pathname.startsWith('/profile') ? 'profile' :
    (location.pathname.startsWith('/traveler') || location.pathname.startsWith('/helper-dashboard')) ? 'dashboard' :
    location.pathname.startsWith('/helpers') || location.pathname.startsWith('/search') ? 'explore' : ''
  );

  return (
    <aside className="hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] py-6 overflow-y-auto bg-white border-r border-slate-200 w-64 shadow-sm shrink-0 select-none">
      
      {/* User Card Profile Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <img 
            alt={displayName} 
            className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-600/30 shrink-0" 
            src={displayAvatar} 
          />
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{roleSubtitle}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="mt-3 w-full py-2 px-4 rounded-xl bg-teal-50 text-teal-800 text-xs border border-teal-200/80 hover:bg-teal-100 transition-all font-bold cursor-pointer"
        >
          Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-2">
        {/* Dashboard */}
        <button 
          onClick={() => navigate(isHelper ? '/helper-dashboard' : '/traveler')}
          className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            currentActive === 'dashboard'
              ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <span 
              className={`material-symbols-outlined text-[20px] ${currentActive === 'dashboard' ? 'text-teal-700' : 'text-slate-400'}`}
              style={{ fontVariationSettings: currentActive === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}
            >
              dashboard
            </span>
            <span className="text-sm">Bảng điều khiển</span>
          </div>
          {currentActive === 'dashboard' && <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>}
        </button>

        {/* Explore Guides */}
        <button 
          onClick={() => navigate('/helpers')}
          className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            currentActive === 'explore'
              ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <span 
              className={`material-symbols-outlined text-[20px] ${currentActive === 'explore' ? 'text-teal-700' : 'text-slate-400'}`}
              style={{ fontVariationSettings: currentActive === 'explore' ? "'FILL' 1" : "'FILL' 0" }}
            >
              explore
            </span>
            <span className="text-sm">Khám phá Helper</span>
          </div>
          {currentActive === 'explore' && <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>}
        </button>

        {/* Messages */}
        <button 
          onClick={() => navigate('/chat')}
          className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            currentActive === 'messages'
              ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <span 
              className={`material-symbols-outlined text-[20px] ${currentActive === 'messages' ? 'text-teal-700' : 'text-slate-400'}`}
              style={{ fontVariationSettings: currentActive === 'messages' ? "'FILL' 1" : "'FILL' 0" }}
            >
              chat_bubble
            </span>
            <span className="text-sm">Tin nhắn</span>
          </div>
          {currentActive === 'messages' && <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>}
        </button>

        {/* Reviews (especially prominent for Helpers) */}
        <button 
          onClick={() => navigate('/reviews')}
          className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            currentActive === 'reviews'
              ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <span 
              className={`material-symbols-outlined text-[20px] ${currentActive === 'reviews' ? 'text-teal-700' : 'text-slate-400'}`}
              style={{ fontVariationSettings: currentActive === 'reviews' ? "'FILL' 1" : "'FILL' 0" }}
            >
              stars
            </span>
            <span className="text-sm">Đánh giá</span>
          </div>
          {currentActive === 'reviews' && <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>}
        </button>

        {/* Profile */}
        <button 
          onClick={() => navigate('/profile')}
          className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            currentActive === 'profile'
              ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <span 
              className={`material-symbols-outlined text-[20px] ${currentActive === 'profile' ? 'text-teal-700' : 'text-slate-400'}`}
              style={{ fontVariationSettings: currentActive === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
            >
              person
            </span>
            <span className="text-sm">Hồ sơ cá nhân</span>
          </div>
          {currentActive === 'profile' && <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>}
        </button>
      </nav>

      {/* Settings & Help at Bottom */}
      <div className="mt-auto border-t border-slate-200 pt-4 px-2">
        <button 
          onClick={() => navigate('/profile')}
          className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-slate-400 text-[20px]">settings</span>
          <span className="text-sm font-medium">Cài đặt</span>
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-slate-400 text-[20px]">help_outline</span>
          <span className="text-sm font-medium">Trợ giúp</span>
        </button>
      </div>
    </aside>
  );
}
