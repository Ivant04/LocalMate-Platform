import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getConversationId } from '../utils/chatUtils';

// Format Time Helper
const formatTime = (isoString) => {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '10:15 AM';
  }
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Yesterday';
  } catch {
    return '2m ago';
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
        alert("Please sign in to access messages!");
        navigate('/login');
        return;
      }

      if (user?.email) {
        try {
          const res = await fetch(`http://localhost:8080/api/v1/users/profile?email=${encodeURIComponent(user.email)}`);
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
      const travelerRes = await fetch(`http://localhost:8080/api/v1/bookings/my-bookings?email=${encodeURIComponent(myEmail)}`);
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
                name: b.guideName || 'Local Guide',
                roleTag: 'Local Guide',
                receiverEmail: partnerEmail,
                avatar: b.guideAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                online: true,
                bookingId: b.id,
                tourName: b.tourName || 'Guided Experience',
                tourDate: b.bookingDate || 'Upcoming',
                tourPrice: b.totalPrice ? `$${b.totalPrice}` : '',
                bookingStatus: b.status || 'PENDING',
                lastMsg: 'Booking request sent',
                time: formatRelativeTime(b.createdAt),
                unread: false
              });
            }
          }
        }
      }

      // 2. Fetch requests as Helper (if user has helper requests)
      const helperRes = await fetch(`http://localhost:8080/api/v1/bookings/helper-requests?email=${encodeURIComponent(myEmail)}`);
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
                name: r.travelerName || 'Traveler',
                roleTag: 'Traveler Explorer',
                receiverEmail: partnerEmail,
                avatar: r.travelerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                online: true,
                bookingId: r.id,
                tourName: r.tourName || 'Tour Request',
                tourDate: r.date || 'Upcoming',
                tourPrice: r.price ? (r.price > 1000 ? `${Number(r.price).toLocaleString()} VND` : `$${r.price}`) : '',
                bookingStatus: r.status || 'PENDING',
                bookingLocation: r.location,
                bookingRequests: r.requests,
                lastMsg: 'Booking request received',
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

    // 3. If navigated with state from HelperDetail, Payment, or Dashboards
    if (location.state && (location.state.guideEmail || location.state.travelerEmail)) {
      const partnerEmail = (location.state.guideEmail || location.state.travelerEmail).toLowerCase().trim();
      const convId = getConversationId(myEmail, partnerEmail);
      const isGuide = Boolean(location.state.guideEmail);
      if (!convMap.has(convId)) {
        convMap.set(convId, {
          id: convId,
          name: location.state.guideName || location.state.travelerName || (isGuide ? 'Local Guide' : 'Traveler'),
          roleTag: isGuide ? 'Local Guide' : 'Traveler Explorer',
          receiverEmail: partnerEmail,
          avatar: location.state.guideAvatar || location.state.travelerAvatar || (isGuide 
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' 
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
          online: true,
          tourName: location.state.tourName || 'Guided Experience',
          tourDate: location.state.date || location.state.tourDate || 'Upcoming',
          tourPrice: location.state.totalCost ? `$${location.state.totalCost}` : '',
          bookingStatus: 'PENDING',
          lastMsg: 'Ready to chat',
          time: '',
          unread: false
        });
      }
      setActiveId(convId);
    }

    // 4. If URL param ?target=email
    const searchParams = new URLSearchParams(location.search);
    const targetParam = searchParams.get('target');
    if (targetParam) {
      const partnerEmail = targetParam.toLowerCase().trim();
      const convId = getConversationId(myEmail, partnerEmail);
      if (!convMap.has(convId)) {
        convMap.set(convId, {
          id: convId,
          name: partnerEmail.split('@')[0],
          roleTag: 'Local Contact',
          receiverEmail: partnerEmail,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          online: true,
          tourName: 'Direct Chat',
          tourDate: 'Today',
          bookingStatus: 'ACTIVE',
          lastMsg: 'Ready to chat',
          time: '',
          unread: false
        });
      }
      setActiveId(convId);
    }

    const convList = Array.from(convMap.values());

    // 5. Update latest message snippets from MongoDB
    for (const c of convList) {
      try {
        const msgRes = await fetch(`http://localhost:8080/api/v1/messages/${c.id}`);
        if (msgRes.ok) {
          const msgs = await msgRes.json();
          if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            c.lastMsg = last.content || 'Sent an attachment';
            c.time = formatRelativeTime(last.createdAt);
          }
        }
      } catch (err) {
        // ignore snippet error
      }
    }

    setConversations(convList);
    setLoadingConversations(false);

    if (convList.length > 0) {
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
      const res = await fetch(`http://localhost:8080/api/v1/messages/${convId}`);
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
                lastMsg: last.content || "Sent an attachment",
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
      c.id === currentConvId ? { ...c, lastMsg: messageText || "Sent an attachment", time: 'Just now' } : c
    ));

    try {
      await fetch('http://localhost:8080/api/v1/messages', {
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
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setSharingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Attempt reverse geocoding to retrieve human-readable address/city
          let locName = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
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
            content: `📍 Shared Location: ${locName}`,
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
            c.id === currentConvId ? { ...c, lastMsg: `📍 Shared Location: ${locName}`, time: 'Just now' } : c
          ));

          // Persist message to backend
          await fetch('http://localhost:8080/api/v1/messages', {
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
          setLocationError('Failed to send location message. Please try again.');
        } finally {
          setSharingLocation(false);
        }
      },
      (err) => {
        setSharingLocation(false);
        console.warn('Geolocation error:', err);
        if (err.code === 1) { // PERMISSION_DENIED
          setLocationError("Unable to access your location. Please allow location permission in your browser and try again.");
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          setLocationError("Location information is currently unavailable.");
        } else if (err.code === 3) { // TIMEOUT
          setLocationError("Location request timed out. Please try again.");
        } else {
          setLocationError("Could not retrieve your location.");
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
      const res = await fetch(`http://localhost:8080/api/v1/bookings/${bookingId}/accept`, { method: 'POST' });
      if (res.ok) {
        // Update active conversation status
        setConversations(prev => prev.map(c => 
          (c.bookingId === bookingId || c.id === activeId) ? { ...c, bookingStatus: 'ACCEPTED' } : c
        ));

        // Reload messages to instantly display automated acceptance confirmation
        setTimeout(() => {
          if (activeId) fetchMessages(activeId, false);
        }, 400);

        alert(`Accepted booking for "${tourName}" with ${travelerName}! Automated confirmation sent to chat.`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Could not accept booking request.');
      }
    } catch (err) {
      console.error('Error accepting booking in chat:', err);
      alert('Network error connecting to booking server.');
    } finally {
      setAcceptingChatBooking(false);
    }
  };

  const handleDeclineBookingInChat = async (bookingId, travelerName) => {
    if (!bookingId) return;
    if (!window.confirm(`Are you sure you want to decline this booking request from ${travelerName}?`)) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/bookings/${bookingId}/decline`, { method: 'POST' });
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

  const displayName = currentUser?.fullName || currentUser?.email?.split('@')[0] || 'My Account';
  const displayAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const roleSubtitle = isHelper ? 'Local Helper Profile' : 'Traveler Explorer';

  const filteredConvs = conversations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white text-slate-900 selection:bg-[#005A71] selection:text-white">
      
      {/* 1. Left Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col h-full py-6 overflow-y-auto bg-white border-r border-slate-200 w-64 shadow-sm shrink-0">
        
        {/* User Card Profile Section */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <img 
              alt={displayName} 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-600/20" 
              src={displayAvatar} 
            />
            <div className="min-w-0">
              <p className="font-label-bold text-sm text-slate-900 truncate font-semibold">{displayName}</p>
              <p className="font-body-sm text-xs text-slate-500 truncate">{roleSubtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="mt-3 w-full py-2 px-4 rounded-lg bg-cyan-50 text-cyan-800 font-label-bold text-xs border border-cyan-200 hover:bg-cyan-100 transition-all font-semibold"
          >
            Edit Profile
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-2">
          <button 
            onClick={() => navigate(isHelper ? '/helper-dashboard' : '/traveler')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">dashboard</span>
            <span className="font-label-bold text-sm">Dashboard</span>
          </button>

          <button 
            onClick={() => navigate('/search')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">explore</span>
            <span className="font-label-bold text-sm">Explore Guides</span>
          </button>

          {/* Active item: Messages */}
          <button 
            className="w-full bg-cyan-50 text-cyan-800 font-semibold rounded-xl px-4 py-2.5 flex items-center gap-3 border border-cyan-100 text-left"
          >
            <span className="material-symbols-outlined text-cyan-700 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
            <span className="font-label-bold text-sm">Messages</span>
          </button>

          <button 
            onClick={() => navigate('/profile')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
            <span className="font-label-bold text-sm">Profile</span>
          </button>
        </nav>

        {/* Settings & Help at Bottom */}
        <div className="mt-auto border-t border-slate-200 pt-4 px-2">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">settings</span>
            <span className="font-label-bold text-sm">Settings</span>
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">help_outline</span>
            <span className="font-label-bold text-sm">Help</span>
          </button>
        </div>
      </aside>

      {/* 2. Middle Column: Conversations List */}
      <section className="w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 shrink-0 bg-white">
        
        {/* Header & Search */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h2>
            {conversations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
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
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100/90 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 border-none outline-none focus:ring-2 focus:ring-[#005A71]/20 transition-all" 
              placeholder="Search conversations..." 
            />
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
          {loadingConversations ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <span className="material-symbols-outlined text-[28px] animate-spin text-primary mb-2">progress_activity</span>
              <p>Loading your conversations...</p>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <span className="material-symbols-outlined text-[24px]">forum</span>
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">No conversations yet</p>
              <p className="text-xs text-slate-500 mb-4 max-w-[200px]">
                Book a local guide to begin a chat conversation and plan your experience.
              </p>
              <button
                onClick={() => navigate('/explore')}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm"
              >
                Find a Local Guide
              </button>
            </div>
          ) : (
            filteredConvs.map(conv => {
              const isActive = conv.id === activeId;
              return (
                <div 
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`p-4 px-6 flex items-center gap-3.5 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-slate-50 border-l-4 border-[#005A71]' 
                      : 'hover:bg-slate-50/70 border-l-4 border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      alt={conv.name}
                      className="w-12 h-12 rounded-full object-cover shadow-sm ring-1 ring-slate-200" 
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
                      <p className="text-[11px] font-medium text-cyan-800 truncate">
                        {conv.roleTag}
                      </p>
                      {conv.bookingStatus && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          conv.bookingStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                          conv.bookingStatus === 'DECLINED' ? 'bg-rose-100 text-rose-800' :
                          conv.bookingStatus === 'EXPIRED' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {conv.bookingStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate">
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
      <section className="hidden md:flex flex-col flex-grow bg-[#F8FAFC]">
        {!activeConv ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400 shadow-sm">
              <span className="material-symbols-outlined text-[32px] text-[#005A71]">chat</span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">No Active Conversation</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              When you submit a booking request for a Local Helper, your conversation thread will appear here automatically so you can finalize plans.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm"
            >
              Browse Local Helpers
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    alt={activeConv.name}
                    className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200" 
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
                    ONLINE
                  </p>
                </div>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center gap-2 text-slate-700">
                <button 
                  onClick={() => setCallStatus('video')}
                  title="Start Video Call"
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-[22px]">videocam</span>
                </button>
                <button 
                  onClick={() => setCallStatus('voice')}
                  title="Start Voice Call"
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
                <button 
                  title="More Options"
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-[22px]">more_vert</span>
                </button>
              </div>
            </header>

            {/* Video / Call Modal Notification */}
            {callStatus && (
              <div className="bg-[#005A71] text-white px-6 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined animate-bounce">
                    {callStatus === 'video' ? 'videocam' : 'call'}
                  </span>
                  <span className="text-sm font-medium">
                    Calling <strong>{activeConv.name}</strong> with high-definition encrypted connection...
                  </span>
                </div>
                <button 
                  onClick={() => setCallStatus(null)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold"
                >
                  End Call
                </button>
              </div>
            )}

            {/* Messages Scrollable Canvas */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-5">
              {/* Linked Booking Context Banner */}
              {activeConv.tourName && (
                <div className="p-4 bg-cyan-50/90 border border-cyan-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-cyan-700 text-[22px]">confirmation_number</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Linked Booking: </span>
                        <span className="text-cyan-900 font-semibold">{activeConv.tourName}</span>
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
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {acceptingChatBooking ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          )}
                          <span>Accept Request</span>
                        </button>
                        <button
                          onClick={() => handleDeclineBookingInChat(activeConv.bookingId, activeConv.name)}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      activeConv.bookingStatus === 'ACCEPTED' || activeConv.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      activeConv.bookingStatus === 'DECLINED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {activeConv.bookingStatus === 'ACCEPTED' ? 'ACCEPTED & CONFIRMED' : (activeConv.bookingStatus || 'Active Tour')}
                    </span>
                  </div>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex items-center justify-center h-48">
                  <span className="material-symbols-outlined animate-spin text-cyan-700 text-3xl">progress_activity</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 bg-white/60 rounded-3xl border border-dashed border-slate-200 my-8">
                  <span className="material-symbols-outlined text-[36px] text-primary/60 mb-2">waving_hand</span>
                  <p className="font-bold text-slate-700 text-sm mb-1">Start chatting with {activeConv.name}!</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Say hello to coordinate details, meeting spot, or ask any questions about your tour.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const userEmail = (currentUser?.email || '').toLowerCase().trim();
                  const isMe = (msg.senderId || '').toLowerCase().trim() === userEmail;
                  const bubbleAvatar = isMe ? displayAvatar : (activeConv?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
                  const bubbleName = isMe ? displayName : (activeConv?.name || 'Local Guide');

                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`flex items-end gap-3 max-w-[85%] sm:max-w-[70%] ${
                        isMe ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <img 
                        alt={bubbleName}
                        className="w-8 h-8 rounded-full object-cover mb-5 flex-shrink-0 shadow-sm ring-1 ring-slate-200" 
                        src={bubbleAvatar} 
                      />
                      
                      <div>
                        {msg.messageType === 'LOCATION' || (msg.latitude && msg.longitude) ? (
                          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden max-w-sm w-72 sm:w-80">
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-[#005A71] to-[#007A99] text-white px-3.5 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-medium text-xs">
                                <span className="material-symbols-outlined text-[18px] text-amber-300">location_on</span>
                                <span>{isMe ? 'My Shared Location' : `${bubbleName}'s Location`}</span>
                              </div>
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-semibold">MAP</span>
                            </div>

                            {/* Google Maps Preview Embed */}
                            <div className="w-full h-40 bg-slate-100 relative">
                              <iframe
                                title="Google Map Preview"
                                src={`https://maps.google.com/maps?q=${msg.latitude},${msg.longitude}&hl=en&z=15&output=embed`}
                                className="w-full h-full border-0 pointer-events-none"
                                loading="lazy"
                              />
                            </div>

                            {/* Address & Direct Link */}
                            <div className="p-3 bg-white">
                              <div className="flex items-start gap-2 mb-2.5">
                                <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5 shrink-0">pin_drop</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                                    {msg.locationName || 'Live Location'}
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
                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-[#005A71] text-slate-700 hover:text-white rounded-xl text-xs font-medium transition-all shadow-sm group"
                              >
                                <span>Open in Google Maps</span>
                                <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">open_in_new</span>
                              </a>
                            </div>
                          </div>
                        ) : msg.imgAttachment ? (
                          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden max-w-md">
                            <img 
                              alt="Attachment" 
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
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe 
                              ? 'bg-[#005A71] text-white rounded-tr-sm' 
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-sm'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content || msg.text}</p>
                          </div>
                        )}

                        <span className={`text-[11px] text-slate-400 mt-1 block ${
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
                  <div className="p-2 bg-[#005A71]/10 rounded-2xl border border-[#005A71]/30 relative">
                    <img alt="Preview" src={selectedImage} className="w-48 h-32 object-cover rounded-xl" />
                    <button 
                      type="button" 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
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
              <div className="mx-6 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">warning</span>
                  <span>{locationError}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setLocationError(null)}
                  className="text-amber-500 hover:text-amber-800 p-0.5 ml-2"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Bottom Input Bar */}
            <form 
              onSubmit={handleSend} 
              className="p-4 px-6 border-t border-slate-200 flex items-center gap-3 bg-white shrink-0"
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
                title="Attach Image / Itinerary"
                className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">attach_file</span>
              </button>

              {/* Share Location Button */}
              <button 
                type="button" 
                onClick={handleShareLocation}
                disabled={sharingLocation}
                title="Share Current Location"
                className={`p-2.5 rounded-xl transition-all ${
                  sharingLocation 
                    ? 'bg-amber-50 text-amber-600 animate-pulse' 
                    : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                {sharingLocation ? (
                  <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[24px]">location_on</span>
                )}
              </button>
              
              <input 
                type="text" 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-grow py-3 px-4 bg-slate-100/90 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm outline-none border-none focus:ring-1 focus:ring-[#005A71]" 
                placeholder="Type a message..." 
              />
              
              <button 
                type="submit" 
                disabled={!inputMsg.trim() && !selectedImage}
                className="p-3 bg-[#005A71] hover:bg-[#004B5E] text-white rounded-xl shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center shrink-0"
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
