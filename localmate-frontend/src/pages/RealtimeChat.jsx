import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getConversationId } from '../utils/chatUtils';
import API_BASE_URL from '../config/api';
import { formatVND } from '../utils/formatCurrency';
import Sidebar from '../components/Sidebar';

// Format Time Helper
const formatTime = (isoString) => {
  if (!isoString) return 'Vừa xong';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '10:15';
  }
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Vừa xong';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return 'Hôm qua';
  } catch {
    return '2 phút trước';
  }
};

export default function RealtimeChat() {
  const navigate = useNavigate();
  const location = useLocation();

  // Current Logged in User
  const [currentUser, setCurrentUser] = useState(null);

  // Conversations & Active Selection
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState(null);

  // Messages in Active Conversation
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Input & Attachments
  const [inputMsg, setInputMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const fileInputRef = useRef(null);
  const messageEndRef = useRef(null);
  const channelRef = useRef(null);

  // Load User Info & Sync Fresh Profile from MongoDB
  useEffect(() => {
    const loadUser = async () => {
      const stored = localStorage.getItem('localmate_user');
      let user = null;
      if (stored) {
        try {
          user = JSON.parse(stored);
        } catch {
          user = null;
        }
      }
      if (!user) {
        alert("Vui lòng đăng nhập để truy cập tin nhắn!");
        navigate('/login');
        return;
      }

      if (user?.email) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/users/profile?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const freshUser = await res.json();
            user = { ...user, ...freshUser };
            localStorage.setItem('localmate_user', JSON.stringify(user));
          }
        } catch (err) {
          console.error('Error fetching fresh user profile:', err);
        }
      }
      setCurrentUser(user);
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [navigate]);

  const isHelper = currentUser?.roles?.includes('ROLE_HELPER');

  // Load Real Conversations from Bookings & MongoDB (No fake sample contacts)
  const loadConversations = async () => {
    if (!currentUser?.email) return;
    const myEmail = currentUser.email.toLowerCase().trim();
    const convMap = new Map();

    try {
      // 1. Fetch user's bookings as Traveler
      const travelerRes = await fetch(`${API_BASE_URL}/api/v1/bookings/my-bookings?email=${encodeURIComponent(myEmail)}`);
      if (travelerRes.ok) {
        const bookings = await travelerRes.json();
        if (Array.isArray(bookings)) {
          for (const b of bookings) {
            const partnerEmail = (b.guideEmail || b.helperId || '').toLowerCase().trim();
            if (!partnerEmail) continue;
            const convId = getConversationId(myEmail, partnerEmail);
            if (!convMap.has(convId)) {
              convMap.set(convId, {
                id: convId,
                name: b.guideName || 'Local Helper',
                roleTag: 'Local Helper',
                receiverEmail: partnerEmail,
                avatar: b.guideAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                online: true,
                bookingId: b.id,
                tourName: b.tourName || 'Tour trải nghiệm',
                tourDate: b.bookingDate || 'Sắp tới',
                tourPrice: b.totalPrice ? formatVND(b.totalPrice) : '',
                bookingStatus: b.status || 'PENDING',
                lastMsg: 'Đã gửi yêu cầu đặt lịch',
                time: formatRelativeTime(b.createdAt),
                unread: false
              });
            }
          }
        }
      }

      // 2. Fetch requests as Helper (if user has helper requests)
      const helperRes = await fetch(`${API_BASE_URL}/api/v1/bookings/helper-requests?email=${encodeURIComponent(myEmail)}`);
      if (helperRes.ok) {
        const requests = await helperRes.json();
        if (Array.isArray(requests)) {
          for (const r of requests) {
            const partnerEmail = (r.email || r.travelerId || '').toLowerCase().trim();
            if (!partnerEmail) continue;
            const convId = getConversationId(myEmail, partnerEmail);
            if (!convMap.has(convId)) {
              convMap.set(convId, {
                id: convId,
                name: r.travelerName || 'Du khách',
                roleTag: 'Du khách',
                receiverEmail: partnerEmail,
                avatar: r.travelerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                online: true,
                bookingId: r.id,
                tourName: r.tourName || 'Yêu cầu tour',
                tourDate: r.date || 'Sắp tới',
                tourPrice: r.price ? formatVND(r.price) : '',
                bookingStatus: r.status || 'PENDING',
                bookingLocation: r.location,
                bookingRequests: r.requests,
                lastMsg: 'Nhận yêu cầu đặt lịch mới',
                time: formatRelativeTime(r.sentAt || r.createdAt),
                unread: false
              });
            } else {
              // Update with bookingId if not already set
              const existing = convMap.get(convId);
              if (!existing.bookingId && r.id) {
                existing.bookingId = r.id;
                existing.bookingStatus = r.status || existing.bookingStatus;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching bookings for chat:', err);
    }

    // 3 & 4. Handle target navigation from HelperDetail or other pages
    const searchParams = new URLSearchParams(location.search);
    const targetParam = searchParams.get('target');
    const partnerEmailFromState = location.state?.guideEmail || location.state?.travelerEmail;
    const partnerEmail = (targetParam || partnerEmailFromState || '').toLowerCase().trim();
    let targetConvId = null;

    if (partnerEmail) {
      const convId = getConversationId(myEmail, partnerEmail);
      targetConvId = convId;
      const isGuide = Boolean(location.state?.guideEmail || location.state?.guideName);

      let partnerName = location.state?.guideName || location.state?.travelerName;
      let partnerAvatar = location.state?.guideAvatar || location.state?.travelerAvatar;
      let partnerRole = isGuide ? 'Local Helper' : 'Du khách';

      if (!partnerName || !partnerAvatar) {
        try {
          const profileRes = await fetch(`${API_BASE_URL}/api/v1/users/profile?email=${encodeURIComponent(partnerEmail)}`);
          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData.fullName) partnerName = pData.fullName;
            if (pData.avatarUrl) partnerAvatar = pData.avatarUrl;
            if (pData.roles?.includes('ROLE_HELPER')) partnerRole = 'Local Helper';
          }
        } catch {
          // ignore lookup error
        }
      }

      const existingConv = convMap.get(convId);
      convMap.set(convId, {
        id: convId,
        name: partnerName || existingConv?.name || partnerEmail.split('@')[0],
        roleTag: partnerRole || existingConv?.roleTag || 'Local Helper',
        receiverEmail: partnerEmail,
        avatar: partnerAvatar || existingConv?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        online: true,
        tourName: location.state?.tourName || existingConv?.tourName || 'Trò chuyện trực tiếp',
        tourDate: location.state?.date || location.state?.tourDate || existingConv?.tourDate || 'Sắp tới',
        tourPrice: location.state?.totalCost ? formatVND(location.state.totalCost) : (existingConv?.tourPrice || ''),
        bookingStatus: existingConv?.bookingStatus || 'ACTIVE',
        lastMsg: existingConv?.lastMsg || 'Sẵn sàng trò chuyện',
        time: existingConv?.time || '',
        unread: false,
        bookingId: existingConv?.bookingId
      });
    }

    const convList = Array.from(convMap.values());

    // 5. Update latest message snippets from MongoDB
    for (const c of convList) {
      try {
        const msgRes = await fetch(`${API_BASE_URL}/api/v1/messages/${c.id}`);
        if (msgRes.ok) {
          const msgs = await msgRes.json();
          if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            c.lastMsg = last.content || 'Đã gửi tệp đính kèm';
            c.time = formatRelativeTime(last.createdAt);
          }
        }
      } catch (err) {
        // ignore snippet error
      }
    }

    setConversations(convList);
    setLoadingConversations(false);

    if (targetConvId) {
      setActiveId(targetConvId);
    } else if (convList.length > 0) {
      setActiveId(prev => (prev && convList.some(c => c.id === prev)) ? prev : convList[0].id);
    } else {
      setActiveId(null);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser?.email, location.state, location.search]);

  // Periodic poll to pick up new bookings / requests every 5 seconds
  useEffect(() => {
    if (!currentUser?.email) return;
    const bookingPoll = setInterval(() => {
      loadConversations();
    }, 5000);
    return () => clearInterval(bookingPoll);
  }, [currentUser?.email]);

  // Setup BroadcastChannel for Instant Cross-Tab Realtime Sync
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('localmate_chat_channel');
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_MESSAGE' && event.data?.conversationId === activeId) {
          fetchMessages(activeId, false);
        }
      };
      return () => channel.close();
    } catch {
      // Fallback if BroadcastChannel not supported
    }
  }, [activeId]);

  // Fetch Messages from Backend MongoDB
  const fetchMessages = async (convId, showLoading = true) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/messages/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);

        // Update snippet in conversation list
        if (data && data.length > 0) {
          const last = data[data.length - 1];
          setConversations(prev => prev.map(c => {
            if (c.id === convId) {
              return {
                ...c,
                lastMsg: last.content || "Đã gửi tệp đính kèm",
                time: formatRelativeTime(last.createdAt)
              };
            }
            return c;
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching messages from MongoDB:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Switch Conversation & Fetch Messages
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId, true);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  // Real-time Polling every 2 seconds to sync active conversation
  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(() => {
      fetchMessages(activeId, false);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedImage]);

  // Active conversation object
  const activeConv = conversations.find(c => c.id === activeId) || null;

  // Send Message with MongoDB Persistence & Realtime Broadcast
  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!inputMsg.trim() && !selectedImage) return;

    const messageText = inputMsg.trim();
    const imagePayload = selectedImage;

    const senderEmail = (currentUser?.email || '').toLowerCase().trim();
    const receiverEmail = (activeConv?.receiverEmail || '').toLowerCase().trim();
    const currentConvId = activeId || activeConv.id;

    const newMsgPayload = {
      conversationId: currentConvId,
      senderId: senderEmail,
      receiverId: receiverEmail,
      content: messageText,
      imgAttachment: imagePayload,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI Update
    setMessages(prev => [...prev, newMsgPayload]);
    setInputMsg('');
    setSelectedImage(null);

    // Update conversation item snippet
    setConversations(prev => prev.map(c => 
      c.id === currentConvId ? { ...c, lastMsg: messageText || "Đã gửi tệp đính kèm", time: 'Vừa xong' } : c
    ));

    try {
      await fetch(`${API_BASE_URL}/api/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsgPayload)
      });

      channelRef.current?.postMessage({
        type: 'NEW_MESSAGE',
        conversationId: currentConvId
      });
    } catch (err) {
      console.error('Error saving message to MongoDB:', err);
    }
  };

  // Image File Picker Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Messenger-style One-Shot Location Sharing Handler
  const handleShareLocation = async () => {
    if (!activeConv || sharingLocation) return;
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setSharingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Attempt reverse geocoding to retrieve human-readable address/city
          let locName = `Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': 'vi' } }
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData?.display_name) {
                const addr = geoData.address || {};
                const parts = [
                  addr.road || addr.suburb || addr.neighbourhood,
                  addr.city || addr.town || addr.county,
                  addr.country
                ].filter(Boolean);
                locName = parts.length > 0 ? parts.join(', ') : geoData.display_name.split(',').slice(0, 3).join(', ');
              }
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding failed, falling back to coordinates:', geoErr);
          }

          const senderEmail = (currentUser?.email || '').toLowerCase().trim();
          const receiverEmail = (activeConv?.receiverEmail || '').toLowerCase().trim();
          const currentConvId = activeId || activeConv.id;

          const locationMsgPayload = {
            conversationId: currentConvId,
            senderId: senderEmail,
            receiverId: receiverEmail,
            content: `📍 Vị trí chia sẻ: ${locName}`,
            messageType: 'LOCATION',
            latitude: lat,
            longitude: lng,
            locationName: locName,
            createdAt: new Date().toISOString()
          };

          // Optimistic UI update
          setMessages(prev => [...prev, locationMsgPayload]);

          // Update conversation last message preview
          setConversations(prev => prev.map(c => 
            c.id === currentConvId ? { ...c, lastMsg: `📍 Vị trí chia sẻ: ${locName}`, time: 'Vừa xong' } : c
          ));

          // Persist message to backend
          await fetch(`${API_BASE_URL}/api/v1/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationMsgPayload)
          });

          // Broadcast to other tabs/windows
          channelRef.current?.postMessage({
            type: 'NEW_MESSAGE',
            conversationId: currentConvId
          });
        } catch (err) {
          console.error('Error sending location message:', err);
          setLocationError('Không thể gửi vị trí. Vui lòng thử lại.');
        } finally {
          setSharingLocation(false);
        }
      },
      (err) => {
        setSharingLocation(false);
        console.warn('Geolocation error:', err);
        if (err.code === 1) { // PERMISSION_DENIED
          setLocationError("Không có quyền truy cập vị trí. Vui lòng cấp quyền định vị trong trình duyệt và thử lại.");
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          setLocationError("Thông tin vị trí hiện không khả dụng.");
        } else if (err.code === 3) { // TIMEOUT
          setLocationError("Yêu cầu lấy vị trí quá hạn. Vui lòng thử lại.");
        } else {
          setLocationError("Không thể xác định vị trí của bạn.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // In-Chat Booking Acceptance for Local Helpers
  const [acceptingChatBooking, setAcceptingChatBooking] = useState(false);

  const handleAcceptBookingInChat = async (bookingId, travelerName, tourName) => {
    if (!bookingId || acceptingChatBooking) return;
    setAcceptingChatBooking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/accept`, { method: 'POST' });
      if (res.ok) {
        // Update active conversation status
        setConversations(prev => prev.map(c => 
          (c.bookingId === bookingId || c.id === activeId) ? { ...c, bookingStatus: 'ACCEPTED' } : c
        ));

        // Reload messages to instantly display automated acceptance confirmation
        setTimeout(() => {
          if (activeId) fetchMessages(activeId, false);
        }, 400);

        alert(`Đã chấp nhận tour "${tourName}" cùng ${travelerName}! Xác nhận đã được gửi vào cuộc trò chuyện.`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Không thể chấp nhận yêu cầu đặt lịch.');
      }
    } catch (err) {
      console.error('Error accepting booking in chat:', err);
      alert('Lỗi kết nối máy chủ đặt lịch.');
    } finally {
      setAcceptingChatBooking(false);
    }
  };

  const handleDeclineBookingInChat = async (bookingId, travelerName) => {
    if (!bookingId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối yêu cầu đặt lịch từ ${travelerName}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/decline`, { method: 'POST' });
      if (res.ok) {
        setConversations(prev => prev.map(c => 
          (c.bookingId === bookingId || c.id === activeId) ? { ...c, bookingStatus: 'DECLINED' } : c
        ));
        setTimeout(() => {
          if (activeId) fetchMessages(activeId, false);
        }, 400);
      }
    } catch (err) {
      console.error('Error declining booking in chat:', err);
    }
  };

  const displayName = currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Tài khoản của tôi';
  const displayAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const roleSubtitle = isHelper ? 'Hồ sơ Local Helper' : 'Du khách khám phá';

  const filteredConvs = conversations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 text-slate-900 selection:bg-teal-700 selection:text-white">
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar activePage="messages" />

      {/* 2. Middle Column: Conversations List */}
      <section className="w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200/80 shrink-0 bg-white">
        
        {/* Header & Search */}
        <div className="p-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Tin nhắn</h2>
            {conversations.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                {conversations.length}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all" 
              placeholder="Tìm kiếm cuộc trò chuyện..." 
            />
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
          {loadingConversations ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <span className="material-symbols-outlined text-[28px] animate-spin text-teal-700 mb-2">progress_activity</span>
              <p>Đang tải cuộc trò chuyện...</p>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 mb-3">
                <span className="material-symbols-outlined text-[24px]">forum</span>
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">Chưa có cuộc trò chuyện nào</p>
              <p className="text-xs text-slate-500 mb-4 max-w-[200px]">
                Hãy đặt lịch với một Local Helper để bắt đầu trao đổi và lên lịch trình nhé.
              </p>
              <button
                onClick={() => navigate('/helpers')}
                className="btn-primary text-xs !py-2 !px-4"
              >
                Tìm Local Helper
              </button>
            </div>
          ) : (
            filteredConvs.map(conv => {
              const isActive = conv.id === activeId;
              const statusLabel = 
                conv.bookingStatus === 'ACCEPTED' ? 'ĐÃ NHẬN' :
                conv.bookingStatus === 'DECLINED' ? 'ĐÃ TỪ CHỐI' :
                conv.bookingStatus === 'EXPIRED' ? 'HẾT HẠN' : 'CHỜ DUYỆT';

              return (
                <div 
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`p-4 px-5 flex items-center gap-3.5 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-teal-50/70 border-l-4 border-teal-600' 
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      alt={conv.name} 
                      className="w-11 h-11 rounded-full object-cover shadow-2xs ring-2 ring-slate-100" 
                      src={conv.avatar} 
                    />
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{conv.name}</h3>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">{conv.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[11px] font-semibold text-teal-800 truncate">
                        {conv.roleTag}
                      </p>
                      {conv.bookingStatus && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          conv.bookingStatus === 'ACCEPTED' ? 'badge-success' :
                          conv.bookingStatus === 'DECLINED' ? 'badge-danger' :
                          conv.bookingStatus === 'EXPIRED' ? 'badge-neutral' :
                          'badge-warning'
                        }`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {conv.lastMsg}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Right Column: Active Chat Canvas */}
      <section className="hidden md:flex flex-col flex-grow bg-slate-50/50">
        {!activeConv ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/30">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center mb-4 text-teal-700 shadow-2xs">
              <span className="material-symbols-outlined text-[32px]">chat</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Chưa chọn cuộc trò chuyện</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              Khi bạn gửi yêu cầu đặt lịch với Local Helper, cuộc trò chuyện sẽ tự động xuất hiện tại đây để bạn tiện trao đổi.
            </p>
            <button
              onClick={() => navigate('/helpers')}
              className="btn-primary text-xs !py-2.5 !px-5"
            >
              Khám phá Local Helper
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="h-16 border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 bg-white shadow-2xs z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    alt={activeConv.name} 
                    className="w-10 h-10 rounded-full object-cover shadow-2xs ring-2 ring-slate-100" 
                    src={activeConv.avatar} 
                  />
                  {activeConv.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    {activeConv.name}
                    <span className="text-[11px] font-normal text-slate-500">({activeConv.roleTag})</span>
                  </h2>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Đang hoạt động
                  </p>
                </div>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center gap-1 text-slate-600">
                <button 
                  onClick={() => setCallStatus('video')}
                  title="Gọi Video"
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                </button>
                <button 
                  onClick={() => setCallStatus('voice')}
                  title="Gọi thoại"
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[19px]">call</span>
                </button>
                <button 
                  title="Tùy chọn khác"
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
            </header>

            {/* Video / Call Modal Notification */}
            {callStatus && (
              <div className="bg-teal-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined animate-bounce">
                    {callStatus === 'video' ? 'videocam' : 'call'}
                  </span>
                  <span className="text-sm font-medium">
                    Đang gọi cho <strong>{activeConv.name}</strong> qua đường truyền bảo mật HD...
                  </span>
                </div>
                <button 
                  onClick={() => setCallStatus(null)}
                  className="px-3 py-1 bg-rose-500 hover:bg-rose-600 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Kết thúc cuộc gọi
                </button>
              </div>
            )}

            {/* Messages Scrollable Canvas */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-4">
              {/* Linked Booking Context Banner */}
              {activeConv.tourName && (
                <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-teal-700 text-[22px]">confirmation_number</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Lịch đặt liên quan: </span>
                        <span className="text-teal-900 font-bold">{activeConv.tourName}</span>
                      </div>
                      <span className="text-slate-500">
                        {activeConv.tourDate} {activeConv.tourPrice ? `• ${activeConv.tourPrice}` : ''}
                        {activeConv.bookingLocation ? ` • ${activeConv.bookingLocation}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Local Helper Actions: Accept or Decline Directly from Chat */}
                    {isHelper && (activeConv.bookingStatus === 'PENDING' || !activeConv.bookingStatus) && activeConv.bookingId && (
                      <>
                        <button
                          onClick={() => handleAcceptBookingInChat(activeConv.bookingId, activeConv.name, activeConv.tourName)}
                          disabled={acceptingChatBooking}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {acceptingChatBooking ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          )}
                          <span>Chấp nhận tour</span>
                        </button>
                        <button
                          onClick={() => handleDeclineBookingInChat(activeConv.bookingId, activeConv.name)}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
                        >
                          Từ chối
                        </button>
                      </>
                    )}

                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      activeConv.bookingStatus === 'ACCEPTED' || activeConv.bookingStatus === 'CONFIRMED' ? 'badge-success' :
                      activeConv.bookingStatus === 'DECLINED' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {activeConv.bookingStatus === 'ACCEPTED' ? 'ĐÃ XÁC NHẬN TOUR' : (activeConv.bookingStatus === 'DECLINED' ? 'ĐÃ TỪ CHỐI' : 'CHỜ DUYỆT')}
                    </span>
                  </div>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex items-center justify-center h-48">
                  <span className="material-symbols-outlined animate-spin text-teal-700 text-3xl">progress_activity</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 my-8">
                  <span className="material-symbols-outlined text-[36px] text-teal-600 mb-2">waving_hand</span>
                  <p className="font-bold text-slate-800 text-sm mb-1">Bắt đầu trò chuyện với {activeConv.name}!</p>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    Gửi lời chào để trao đổi chi tiết điểm hẹn, lịch trình hoặc bất kỳ câu hỏi nào.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {[
                      `Chào ${activeConv.name}, mình muốn hỏi thêm về lịch trình nhé!`,
                      `Chào bạn! Chúng mình có thể cùng điều chỉnh lịch trình được không?`,
                      `Chào bạn, bạn có sẵn sàng cho chuyến đi tuần này không?`
                    ].map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setInputMsg(prompt)}
                        className="px-3.5 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200/80 transition-all hover:scale-[1.02] active:scale-95 text-left cursor-pointer shadow-2xs"
                      >
                        💬 "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const userEmail = (currentUser?.email || '').toLowerCase().trim();
                  const isMe = (msg.senderId || '').toLowerCase().trim() === userEmail;
                  const bubbleAvatar = isMe ? displayAvatar : (activeConv?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
                  const bubbleName = isMe ? displayName : (activeConv?.name || 'Local Helper');

                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`flex items-end gap-2.5 max-w-[85%] sm:max-w-[70%] ${
                        isMe ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <img 
                        alt={bubbleName} 
                        className="w-8 h-8 rounded-full object-cover mb-4 flex-shrink-0 shadow-2xs ring-1 ring-slate-200" 
                        src={bubbleAvatar} 
                      />
                      
                      <div>
                        {msg.messageType === 'LOCATION' || (msg.latitude && msg.longitude) ? (
                          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden max-w-sm w-72 sm:w-80">
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-3.5 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-medium text-xs">
                                <span className="material-symbols-outlined text-[18px] text-amber-300">location_on</span>
                                <span>{isMe ? 'Vị trí của tôi' : `Vị trí của ${bubbleName}`}</span>
                              </div>
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-semibold">BẢN ĐỒ</span>
                            </div>

                            {/* Google Maps Preview Embed */}
                            <div className="w-full h-40 bg-slate-100 relative">
                              <iframe
                                title="Bản đồ Google Maps"
                                src={`https://maps.google.com/maps?q=${msg.latitude},${msg.longitude}&hl=vi&z=15&output=embed`}
                                className="w-full h-full border-0 pointer-events-none"
                                loading="lazy"
                              />
                            </div>

                            {/* Address & Direct Link */}
                            <div className="p-3 bg-white">
                              <div className="flex items-start gap-2 mb-2.5">
                                <span className="material-symbols-outlined text-rose-500 text-[20px] mt-0.5 shrink-0">pin_drop</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                                    {msg.locationName || 'Vị trí hiện tại'}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    {Number(msg.latitude).toFixed(5)}, {Number(msg.longitude).toFixed(5)}
                                  </p>
                                </div>
                              </div>

                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${msg.latitude},${msg.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-teal-700 text-slate-700 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-200/80 hover:border-teal-700 group cursor-pointer"
                              >
                                <span>Mở trên Google Maps</span>
                                <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">open_in_new</span>
                              </a>
                            </div>
                          </div>
                        ) : msg.imgAttachment ? (
                          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden max-w-md">
                            <img 
                              alt="Tệp đính kèm" 
                              className="w-full h-56 object-cover" 
                              src={msg.imgAttachment} 
                            />
                            {msg.content && (
                              <div className="p-4 pt-3 text-slate-800 text-sm leading-relaxed">
                                {msg.content}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`p-3.5 px-4 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                            isMe 
                              ? 'bg-teal-700 text-white rounded-tr-xs font-normal' 
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content || msg.text}</p>
                          </div>
                        )}

                        <span className={`text-[10px] text-slate-400 mt-1 block ${
                          isMe ? 'text-right mr-1' : 'ml-1'
                        }`}>
                          {formatTime(msg.createdAt || msg.time)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Image Upload Preview */}
              {selectedImage && (
                <div className="flex flex-row-reverse items-end gap-3 ml-auto max-w-[70%]">
                  <div className="p-2 bg-teal-50 rounded-2xl border border-teal-200/80 relative">
                    <img alt="Xem trước ảnh" src={selectedImage} className="w-48 h-32 object-cover rounded-xl" />
                    <button 
                      type="button" 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -left-2 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              )}

              <div ref={messageEndRef} />
            </div>

            {/* Polite Location Error Alert Banner */}
            {locationError && (
              <div className="mx-6 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800 shadow-2xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">warning</span>
                  <span>{locationError}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setLocationError(null)}
                  className="text-amber-500 hover:text-amber-800 p-0.5 ml-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Bottom Input Bar */}
            <form 
              onSubmit={handleSend} 
              className="p-3.5 px-6 border-t border-slate-200/80 flex items-center gap-2.5 bg-white shrink-0"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                title="Đính kèm ảnh"
                className="p-2.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">attach_file</span>
              </button>

              {/* Share Location Button */}
              <button 
                type="button" 
                onClick={handleShareLocation}
                disabled={sharingLocation}
                title="Chia sẻ vị trí hiện tại"
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  sharingLocation 
                    ? 'bg-amber-50 text-amber-600 animate-pulse' 
                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                {sharingLocation ? (
                  <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[22px]">location_on</span>
                )}
              </button>
              
              <input 
                type="text" 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-grow py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all" 
                placeholder="Nhập tin nhắn..." 
              />
              
              <button 
                type="submit" 
                disabled={!inputMsg.trim() && !selectedImage}
                className="p-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </>
        )}
      </section>

    </div>
  );
}
