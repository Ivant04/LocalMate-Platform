import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReviewManagement() {
  const navigate = useNavigate();

  // Reviews state with response edit states
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: "Minh Quan",
      rating: 5,
      date: "2 days ago",
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      text: "Great experience! The guide was very knowledgeable about local history and led us to amazing street food stalls that tourists rarely find. Highly recommended for everyone!",
      response: "Thank you Quan! It was a pleasure accompanying you on your last trip. Hope to see you again on future journeys.",
      isEditing: false
    },
    {
      id: 2,
      author: "Linh Chi",
      rating: 4,
      date: "5 days ago",
      timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      text: "Friendly helper and very helpful with translations at the local clinics. Highly appreciate the quick response in an emergency. The tour itinerary was a bit rushed though.",
      response: "Thanks for the feedback Chi! I will make sure our next trip has a more relaxed pace. Hope you recovered well!",
      isEditing: false
    },
    {
      id: 3,
      author: "James Wilson",
      rating: 5,
      date: "2 weeks ago",
      timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
      text: "Kenji was incredible! He took us to a tiny ramen shop in a Shinjuku alleyway that we would never have found on our own. It was the best meal of our entire trip. LocalMate made booking so easy.",
      response: "Thanks James! It was a pleasure showing you around the market. Hope you come back to Vietnam soon!",
      isEditing: false
    }
  ]);

  const [sortBy, setSortBy] = useState('recent');
  const [editingText, setEditingText] = useState('');

  // Handle Sort Change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const startEdit = (id, currentResponse) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, isEditing: true } : r));
    setEditingText(currentResponse || '');
  };

  const saveEdit = (id) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, response: editingText, isEditing: false } : r));
    setEditingText('');
  };

  const cancelEdit = (id) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, isEditing: false } : r));
    setEditingText('');
  };

  // Sort logic
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return b.timestamp - a.timestamp;
    }
    if (sortBy === 'highest') {
      return b.rating - a.rating;
    }
    if (sortBy === 'lowest') {
      return a.rating - b.rating;
    }
    return 0;
  });

  return (
    <div className="flex min-h-screen bg-background-light text-on-surface">
      
      {/* SideNavBar - Shared Component - Desktop Only */}
      <aside className="hidden lg:flex flex-col h-full sticky top-0 py-6 overflow-y-auto bg-surface-container-low border-r border-border-subtle w-64 shrink-0 justify-between">
        <div className="px-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDu2eYJiDtCibKRA3DHjpAU6L2dwo5mqt9xT4BlOSpTez37umuP8OiKHirTlH_5EZ70QVDEbuOz0kU0iLvtMs9LHW3l0wa1a3ii8zITX5i7WyKRgwd1OrSgKzF1XYLmkuNokl8LlorrQ6-3_Zsapf6wujeWN3nE0RscFS28aiBH3Ta02358i2nIt7Hk7SgMQLS42nDSj-FntSR9LzY7Nt73c23Mpt2st8z3ABUXx1JBzEy4hkpgoi4dn4E4hnetI2je9RVnkH6-wsg" 
              />
            </div>
            <div>
              <p className="font-label-bold text-label-bold text-primary font-bold">Linh Nguyen</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Local Helper Profile</p>
            </div>
          </div>
          <button className="w-full py-2 px-4 rounded-lg bg-primary text-on-primary font-label-bold text-label-bold hover:opacity-90 transition-opacity">
            View Public Profile
          </button>
          
          <nav className="mt-8 space-y-2">
            <button onClick={() => navigate('/helper-dashboard')} className="w-full text-on-surface-variant hover:bg-surface-variant/50 px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-bold text-label-bold">Dashboard</span>
            </button>
            <button className="w-full bg-secondary-container text-on-secondary-container rounded-xl px-4 py-3 flex items-center gap-3 text-left">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-bold text-label-bold">Reviews</span>
            </button>
            <button onClick={() => navigate('/chat')} className="w-full text-on-surface-variant hover:bg-surface-variant/50 px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span className="font-label-bold text-label-bold">Messages</span>
            </button>
          </nav>
        </div>
        
        <div className="px-6 border-t border-border-subtle pt-4">
          <button className="w-full text-on-surface-variant hover:bg-surface-variant/50 px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-bold text-label-bold">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">Review Management</h1>
            <p className="text-on-surface-variant font-body-md">Monitor and respond to your travelers' experiences.</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-4 py-2 self-start md:self-auto">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="font-label-bold text-label-bold text-secondary">Top Rated Helper</span>
          </div>
        </header>

        {/* Summary Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Ratings */}
          <div className="md:col-span-4 bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle flex flex-col items-center justify-center text-center shadow-sm">
            <div className="text-primary font-headline-xl text-headline-xl leading-none mb-2 font-bold">4.9</div>
            <div className="flex gap-1 mb-4 text-status-warning">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <p className="font-body-md text-on-surface-variant">Based on <span class="font-bold text-on-surface">128 reviews</span></p>
            <div className="mt-6 pt-6 border-t border-border-subtle w-full text-center">
              <div className="text-status-warning font-headline-md text-headline-md mb-1 font-bold">98%</div>
              <p className="text-label-caps text-label-caps uppercase text-on-surface-variant">SATISFACTION RATE</p>
            </div>
          </div>
          
          {/* Rating Distribution */}
          <div className="md:col-span-8 bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
            <h3 className="font-label-bold text-label-bold text-on-surface mb-6 font-bold">Rating Distribution</h3>
            <div className="space-y-4 text-on-surface">
              {[
                { star: 5, count: 108, pct: '85%' },
                { star: 4, count: 15, pct: '12%' },
                { star: 3, count: 3, pct: '2%' },
                { star: 2, count: 2, pct: '1%' },
                { star: 1, count: 0, pct: '0%' }
              ].map(item => (
                <div key={item.star} className="flex items-center gap-4">
                  <span className="w-16 font-label-bold text-label-bold text-on-surface-variant">{item.star} stars</span>
                  <div className="flex-grow bg-surface-container rounded-full h-3 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: item.pct }}></div>
                  </div>
                  <span className="w-10 text-right font-body-sm text-body-sm text-on-surface-variant">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews List */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Reviews List</h2>
            <div className="flex items-center gap-4 text-on-surface">
              <label className="font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap" htmlFor="sort">Sort by:</label>
              <select 
                value={sortBy}
                onChange={handleSortChange}
                className="bg-white border border-border-subtle rounded-xl px-4 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                id="sort"
              >
                <option value="recent">Newest</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-6">
            {sortedReviews.map(rev => (
              <article key={rev.id} className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                      {rev.author.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-label-bold text-label-bold text-on-surface">{rev.author}</h4>
                      <div className="flex gap-0.5 mt-0.5 text-status-warning">
                        {[...Array(rev.rating)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <time className="text-body-sm text-on-surface-variant">{rev.date}</time>
                </div>
                
                <p className="text-body-md text-on-surface mb-4 leading-relaxed italic">
                  "{rev.text}"
                </p>
                
                {/* Response / Inline Reply Editor */}
                <div className="bg-surface-container-low p-4 rounded-lg border-l-4 border-primary">
                  {rev.isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-3 border border-border-subtle bg-white text-on-surface rounded-xl outline-none"
                        rows="3"
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => saveEdit(rev.id)}
                          className="bg-primary text-on-primary px-4 py-1.5 rounded-lg text-sm font-label-bold"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => cancelEdit(rev.id)}
                          className="bg-surface-container-high/60 text-on-surface-variant px-4 py-1.5 rounded-lg text-sm font-label-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-label-bold text-label-bold text-primary">You responded</span>
                        <button 
                          onClick={() => startEdit(rev.id, rev.response)}
                          className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        {rev.response || "No reply submitted yet."}
                      </p>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
