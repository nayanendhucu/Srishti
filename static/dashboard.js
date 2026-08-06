const dashboard = (() => {
  const state = {
    activePage: 'pg-home',
    tags: [],
    slots: [],
    uploads: [],
    bookings: [],
    messages: [],
    profile: {
      name: 'Artist',
      phone: '',
      location: '',
      experience: '',
      bio: '',
      mediums: '',
      pricing: {
        small: 0,
        medium: 0,
        large: 0,
        sqft: 0,
        frame: 0,
        gift: 0,
        express: 0,
        digital: 0,
        turnaround: '',
        rush: '',
      },
      avatar: 'https://i.pravatar.cc/200?img=47',
    },
  };

  const selectors = {
    pages: document.querySelectorAll('.dash-page'),
    sidebarItems: document.querySelectorAll('#dashSidebar .sb-item'),
    pageTitle: document.getElementById('pageTitle'),
    bookingsBadge: document.getElementById('bookingsBadge'),
    messagesBadge: document.getElementById('messagesBadge'),
    slotList: document.getElementById('slotList'),
    bookingList: document.getElementById('bookingList'),
    messageList: document.getElementById('messageList'),
    portfolioGrid: document.getElementById('portfolioGrid'),
    portfolioCount: document.getElementById('portfolioCount'),
    portfolioInput: document.getElementById('portfolioInput'),
    portfolioDropZone: document.getElementById('portfolioDropZone'),
    avatarInput: document.getElementById('avatarInput'),
    avatarPreview: document.getElementById('avatarPreview'),
    avatarRing: document.getElementById('avatarRing'),
    changeAvatarBtn: document.getElementById('changeAvatarBtn'),
    pName: document.getElementById('pName'),
    pPhone: document.getElementById('pPhone'),
    pLocation: document.getElementById('pLocation'),
    pExp: document.getElementById('pExp'),
    pBio: document.getElementById('pBio'),
    pMediums: document.getElementById('pMediums'),
    tagsWrap: document.getElementById('tagsWrap'),
    tagInput: document.getElementById('tagInput'),
    tagSuggWrap: document.getElementById('tagSuggWrap'),
    slotDate: document.getElementById('slotDate'),
    slotTime: document.getElementById('slotTime'),
    prSmall: document.getElementById('prSmall'),
    prMedium: document.getElementById('prMedium'),
    prLarge: document.getElementById('prLarge'),
    prSqft: document.getElementById('prSqft'),
    prFrame: document.getElementById('prFrame'),
    prGift: document.getElementById('prGift'),
    prExpress: document.getElementById('prExpress'),
    prDigital: document.getElementById('prDigital'),
    prTurnaround: document.getElementById('prTurnaround'),
    prRush: document.getElementById('prRush'),
    toast: document.getElementById('dashToast'),
    toastMsg: document.getElementById('toastMsg'),
    menuToggle: document.getElementById('menuToggle'),
    sidebar: document.getElementById('dashSidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
  };

 const suggestedTags = [
  'portrait',
  'abstract',
  'watercolour',
  'oil',
  'sketch',
  'digital',
  'mandala',
  'mural',
];

  const storage = {
    load() {
      try {
        const raw = localStorage.getItem('artistDashboardState');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.slots) state.slots = data.slots;
        if (data.uploads) state.uploads = data.uploads;
      } catch (error) {
        console.warn('Unable to load dashboard state', error);
      }
    },
    save() {
      try {
        localStorage.setItem('artistDashboardState', JSON.stringify({
          slots: state.slots,
          uploads: state.uploads,
        }));
      } catch (error) {
        console.warn('Unable to save dashboard state', error);
      }
    },
  };

  // ── Confirmation modal helper ──
  // Shows a "Yes / Cancel" modal before any destructive or save action.
  // title    — bold heading inside modal
  // subtitle — smaller description text
  // onYes    — async function to run when user clicks Yes
  function showConfirmModal(title, subtitle, onYes) {
    onYes();
  }

  function closeBookingModal() {
    const modalEl = document.getElementById('bookingModal');
    if (!modalEl || !window.bootstrap) return;
    const instance = bootstrap.Modal.getInstance(modalEl);
    if (instance) instance.hide();
  }

  function normalizeBooking(b) {
    return {
      id: b.id,
      clientId: b.client,
      customer: b.client_name || 'Customer',
      type: b.service_type ? b.service_type.replace('_', ' ') : b.description || 'Booking request',
      date: b.preferred_date || b.delivery || (b.created_at ? b.created_at.split('T')[0] : 'TBD'),
      amount: b.total_price || 0,
      advanceAmount: b.advance_amount || 0,
      status: b.status || 'pending',
      paymentStatus: b.payment_status || 'not_requested',
      details: b.description || 'No additional details provided.',
      artworkSize: b.artwork_size || 'Not specified',
      delivery: b.delivery || 'Not specified',
      deliveryAddress: b.delivery_address || '',
      referenceImage: b.reference_image_url || b.reference_image || '',
      paymentScreenshot: b.payment_screenshot_url || b.payment_screenshot || '',
      createdAt: b.created_at ? b.created_at.split('T')[0] : 'Not available',
    };
  }

  function upsertBooking(updated) {
    const normalized = normalizeBooking(updated);
    const index = state.bookings.findIndex((booking) => booking.id === normalized.id);
    if (index >= 0) state.bookings[index] = normalized;
    else state.bookings.unshift(normalized);
    return normalized;
  }

  function renderArtistRequired() {
    document.body.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#111114;color:#fff;font-family:Raleway,Arial,sans-serif;">
        <section style="width:min(560px,100%);border:1px solid rgba(255,255,255,.14);background:#1a1a1f;border-radius:8px;padding:32px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.28);">
          <div style="font-family:Cinzel,serif;font-size:2rem;font-weight:700;margin-bottom:10px;">Shri<span style="color:#e63946;">sti</span></div>
          <h1 style="font-size:1.4rem;margin:0 0 10px;">Artist account required</h1>
          <p style="color:#b8b8c2;margin:0 0 24px;line-height:1.6;">Your current account is an art lover account, so the artist dashboard is locked. Register as an artist to manage portfolio, bookings, messages, and pricing.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a href="/" style="color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.2);padding:11px 18px;border-radius:6px;">Back Home</a>
            <a href="/login/?mode=register&role=artist" id="dashboardArtistRegister" style="color:#fff;text-decoration:none;background:#e63946;padding:11px 18px;border-radius:6px;font-weight:700;">Register as Artist</a>
          </div>
        </section>
      </main>
    `;
    document.getElementById('dashboardArtistRegister')?.addEventListener('click', () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    });
  }

  async function ensureArtistAccess() {
    if (!getToken()) {
      window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return false;
    }

    try {
      const meRes = await authFetch(`${API_BASE}/users/me/`);
      if (!meRes.ok) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userRole');
        window.location.href = '/login/';
        return false;
      }

      const me = await meRes.json();
      if (me.role !== 'artist') {
        localStorage.setItem('userRole', me.role || 'client');
        renderArtistRequired();
        return false;
      }

      return true;
    } catch (error) {
      window.location.href = '/login/';
      return false;
    }
  }

  async function loadRemoteData() {
    if (!(await ensureArtistAccess())) {
      return false;
    }

    try {
      const res = await authFetch(`${API_BASE}/artists/profile/onboarding/`);
      if (res.ok) {
        const data = await res.json();
        state.profile.name     = data.user_name  || 'Artist';
        state.profile.bio      = data.bio        || '';
        state.profile.location = data.location   || '';
        state.profile.phone = data.phone || '';
        state.profile.experience = data.experience || '';
        state.profile.mediums = data.mediums || '';
        state.profile.avatar   = data.avatar_url || (data.avatar ? `/media/${data.avatar}` : 'https://i.pravatar.cc/200?img=47');
        state.profile.pricing.small = data.base_price ? Number(data.base_price) : 0;
        state.tags = data.style ? [data.style] : [];
        if (Array.isArray(data.portfolio)) {
          state.uploads = data.portfolio.map((item) => ({
            image: item.image_url || item.image,
            title: item.title || 'Portfolio Artwork',
          }));
          storage.save();
        }
      }
    } catch (error) {
      console.warn('Unable to load artist profile', error);
    }

    try {
      const res = await authFetch(`${API_BASE}/bookings/mine/`);
      if (res.ok) {
        const bookings = await res.json();
        state.bookings = bookings.map(normalizeBooking);
      }
    } catch (error) {
      console.warn('Unable to load bookings', error);
    }

    try {
      const res = await authFetch(`${API_BASE}/messages/`);
      if (res.ok) {
        state.messages = await res.json();
      }
    } catch (error) {
      console.warn('Unable to load messages', error);
    }

    return true;
  }

  const ui = {
    setActivePage(pageId) {
      state.activePage = pageId;
      selectors.pages.forEach((p) => p.classList.toggle('active', p.id === pageId));
      selectors.sidebarItems.forEach((item) => {
        item.classList.toggle('active', item.dataset.page === pageId);
      });
      const titleMap = {
        'pg-home':         'Dashboard',
        'pg-portfolio':    'Portfolio',
        'pg-profile':      'Profile & Styles',
        'pg-availability': 'Availability',
        'pg-bookings':     'Bookings',
        'pg-messages':     'Messages',
        'pg-pricing':      'Pricing & Services',
      };
      selectors.pageTitle.textContent = titleMap[pageId] || 'Dashboard';
      document.body.classList.remove('sidebar-open');
      selectors.sidebarOverlay.classList.remove('active');
    },

    renderTags() {
      selectors.tagsWrap.innerHTML = '';
      state.tags.forEach((tag) => {
        const pill = document.createElement('div');
        pill.className = 'tag-pill';
        pill.textContent = tag;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'tag-remove';
        remove.innerHTML = '&times;';
        remove.addEventListener('click', () => removeTag(tag));
        pill.appendChild(remove);
        selectors.tagsWrap.appendChild(pill);
      });
    },

    renderSuggestedTags() {
      selectors.tagSuggWrap.innerHTML = '';
      suggestedTags.forEach((tag) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-ghost btn-tag-suggest';
        btn.textContent = tag;
        btn.addEventListener('click', () => {
          selectors.tagInput.value = tag;
          addTag();
        });
        selectors.tagSuggWrap.appendChild(btn);
      });
    },

    renderSlots() {
      if (!selectors.slotList) return;
      selectors.slotList.innerHTML = '';
      if (!state.slots.length) {
        selectors.slotList.innerHTML = '<div class="empty-state">No availability slots added yet.</div>';
        return;
      }
      state.slots.forEach((slot, index) => {
        const row = document.createElement('div');
        row.className = 'slot-row';
        row.innerHTML = `
          <div>
            <div class="slot-date">${slot.date}</div>
            <div class="slot-time">${slot.time}</div>
          </div>
          <button type="button" class="btn-ghost btn-sm" data-index="${index}">Remove</button>
        `;
        row.querySelector('button').addEventListener('click', () => removeSlot(index));
        selectors.slotList.appendChild(row);
      });
    },

    renderBookings(filter = 'all') {
      if (!selectors.bookingList) return;
      const filters = document.querySelectorAll('.bk-filter-btn');
      filters.forEach((btn) => {
        btn.classList.toggle('btn-red',   btn.dataset.filter === filter);
        btn.classList.toggle('btn-ghost', btn.dataset.filter !== filter);
      });
      const visibleBookings = state.bookings.filter((b) => !['declined', 'cancelled'].includes(b.status));
      const items = visibleBookings.filter((b) => filter === 'all' || b.status === filter);
      if (!items.length) {
        selectors.bookingList.innerHTML = '<div class="empty-state">No bookings match this view.</div>';
        return;
      }
      selectors.bookingList.innerHTML = items.map((b) => `
        <div class="booking-card">
          <div class="booking-card-main">
            <div>
              <div class="booking-title">${b.type}</div>
              <div class="booking-customer">${b.customer}</div>
            </div>
            <span class="booking-status booking-${b.status}">${b.status}</span>
          </div>
          <div class="booking-meta">
            <span><i class="bi bi-calendar3"></i> ${b.date}</span>
            <span><i class="bi bi-currency-rupee"></i> ${b.amount}</span>
            <span><i class="bi bi-receipt"></i> ${b.paymentStatus.replace('_', ' ')}</span>
          </div>
          <div class="booking-actions">
            <button type="button" class="btn-ghost" data-booking-action="view" data-booking-id="${b.id}">View</button>
            ${b.clientId ? `<a class="btn-ghost" href="/chat/?user=${b.clientId}&name=${encodeURIComponent(b.customer)}">Message</a>` : ''}
            ${b.status === 'pending' ? `<button type="button" class="btn-sm-green" data-booking-action="accept" data-booking-id="${b.id}">Accept</button>
            <button type="button" class="btn-sm-red" data-booking-action="decline" data-booking-id="${b.id}">Decline</button>` : ''}
            ${b.status === 'accepted' && b.paymentStatus === 'pending_upload' ? `<span class="booking-waiting"><i class="bi bi-hourglass-split"></i> Waiting for customer screenshot</span>` : ''}
            ${b.status === 'accepted' && b.paymentStatus === 'submitted' ? `<button type="button" class="btn-sm-green" data-booking-action="start" data-booking-id="${b.id}">Verify Payment & Start</button>` : ''}
          </div>
        </div>
      `).join('');
    },

    renderMessages() {
      if (!selectors.messageList) return;
      if (!state.messages.length) {
        selectors.messageList.innerHTML = '<div class="empty-state">No customer messages yet.</div>';
        return;
      }
      selectors.messageList.innerHTML = state.messages.map((thread) => {
        const name = escapeHTML(thread.name || 'Customer');
        const preview = escapeHTML(thread.last_message || '');
        const date = thread.timestamp ? new Date(thread.timestamp).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : '';
        return `
          <a class="message-thread" href="/chat/?user=${thread.user_id}&name=${encodeURIComponent(thread.name || 'Customer')}">
            <div class="message-thread-icon"><i class="bi bi-person-circle"></i></div>
            <div class="message-thread-main">
              <div class="message-thread-top">
                <strong>${name}</strong>
                <span>${date}</span>
              </div>
              <p>${preview}</p>
            </div>
            ${thread.unread_count ? `<span class="message-unread">${thread.unread_count}</span>` : ''}
          </a>`;
      }).join('');
    },

    renderArtistMessageNotice() {
      if (document.querySelector('.artist-message-notice')) return;
      const unreadThreads = state.messages.filter((thread) => Number(thread.unread_count || 0) > 0);
      if (!unreadThreads.length) return;

      const latest = unreadThreads[0];
      const totalUnread = unreadThreads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);
      const notice = document.createElement('aside');
      notice.className = 'artist-message-notice';
      notice.setAttribute('role', 'status');
      notice.innerHTML = `
        <div class="amn-icon"><i class="bi bi-chat-dots-fill" aria-hidden="true"></i></div>
        <div class="amn-copy">
          <strong>${totalUnread} new customer message${totalUnread === 1 ? '' : 's'}</strong>
          <span>Reply from ${escapeHTML(latest.name || 'a customer')}</span>
        </div>
        <button type="button" class="amn-open">Open</button>
        <button type="button" class="amn-close" aria-label="Dismiss notification">&times;</button>
      `;
      notice.querySelector('.amn-open')?.addEventListener('click', () => {
        ui.setActivePage('pg-messages');
        notice.remove();
      });
      notice.querySelector('.amn-close')?.addEventListener('click', () => notice.remove());
      document.body.appendChild(notice);
    },

    renderPortfolio() {
      if (!selectors.portfolioGrid) return;
      selectors.portfolioGrid.innerHTML = '';
      state.uploads.forEach((item, index) => {
        const image = typeof item === 'string' ? item : item.image;
        const title = typeof item === 'string' ? `Portfolio item ${index + 1}` : (item.title || `Portfolio item ${index + 1}`);
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.innerHTML = `
          <img src="${image}" alt="${escapeHTML(title)}" />
          <div class="portfolio-card-title">${escapeHTML(title)}</div>
          <button type="button" class="portfolio-remove" data-index="${index}">&times;</button>
        `;
        card.querySelector('button').addEventListener('click', () => removePortfolioImage(index));
        selectors.portfolioGrid.appendChild(card);
      });
      selectors.portfolioCount.textContent = `${state.uploads.length} / 15 images`;
    },

    updateStats() {
      const earned = state.bookings
        .filter((b) => b.status === 'accepted')
        .reduce((sum, b) => sum + Number(b.amount), 0);
      document.getElementById('statEarnings').textContent  = `₹${earned}`;
      document.getElementById('statCompleted').textContent = state.bookings.filter((b) => b.status === 'accepted').length;
      document.getElementById('statBookings').textContent  = state.bookings.filter((b) => b.status === 'pending').length;
      const profilePercent = Math.min(100, 20 + state.tags.length * 10 + state.slots.length * 5);
      document.getElementById('statProfile').textContent   = `${profilePercent}%`;
      document.getElementById('completionFill').style.width = `${profilePercent}%`;
      selectors.bookingsBadge.textContent = state.bookings.filter((b) => b.status === 'pending').length;
      if (selectors.messagesBadge) {
        selectors.messagesBadge.textContent = state.messages.reduce((total, item) => total + Number(item.unread_count || 0), 0);
      }
    },
  };

  const helpers = {
    showToast(message) {
      if (!selectors.toast) return;
      selectors.toastMsg.textContent = message;
      selectors.toast.classList.add('show');
      window.clearTimeout(helpers._toastTimer);
      helpers._toastTimer = window.setTimeout(() => selectors.toast.classList.remove('show'), 3000);
    },

    saveProfileToState() {
      state.profile.name     = selectors.pName.value.trim()    || state.profile.name;
      state.profile.phone    = selectors.pPhone.value.trim()   || state.profile.phone;
      // Send the visible text label, not the internal value
      state.profile.location = selectors.pLocation.value;
      state.profile.experience = selectors.pExp.value;
      state.profile.bio      = selectors.pBio.value.trim();
      state.profile.mediums  = selectors.pMediums.value.trim();
      state.tags = [...new Set(state.tags)];
    },

    savePricingToState() {
      state.profile.pricing.small      = Number(selectors.prSmall.value)      || state.profile.pricing.small;
      state.profile.pricing.medium     = Number(selectors.prMedium.value)     || state.profile.pricing.medium;
      state.profile.pricing.large      = Number(selectors.prLarge.value)      || state.profile.pricing.large;
      state.profile.pricing.sqft       = Number(selectors.prSqft.value)       || state.profile.pricing.sqft;
      state.profile.pricing.frame      = Number(selectors.prFrame.value)      || state.profile.pricing.frame;
      state.profile.pricing.gift       = Number(selectors.prGift.value)       || state.profile.pricing.gift;
      state.profile.pricing.express    = Number(selectors.prExpress.value)    || state.profile.pricing.express;
      state.profile.pricing.digital    = Number(selectors.prDigital.value)    || state.profile.pricing.digital;
      state.profile.pricing.turnaround = selectors.prTurnaround.value;
      state.profile.pricing.rush       = selectors.prRush.value;
    },

    populateProfileForm() {
      if (!selectors.pName) return;
      selectors.pName.value     = state.profile.name;
      selectors.pPhone.value    = state.profile.phone;
      selectors.pLocation.value = (state.profile.location || '').toLowerCase();
      selectors.pExp.value      = state.profile.experience;
      selectors.pBio.value      = state.profile.bio;
      selectors.pMediums.value  = state.profile.mediums;

      // Update all avatar instances
      const avatarSrc = state.profile.avatar;
      selectors.avatarPreview.src = avatarSrc;
      const sbAvatar    = document.getElementById('sbAvatar');
      const topbarAvatar = document.getElementById('topbarAvatar');
      if (sbAvatar)     sbAvatar.src     = avatarSrc;
      if (topbarAvatar) topbarAvatar.src = avatarSrc;

      // Update name displays
      const sbName    = document.getElementById('sbArtistName');
      const topbarName = document.getElementById('topbarName');
      const welcomeName = document.getElementById('welcomeName');
      if (sbName)     sbName.textContent     = state.profile.name;
      if (topbarName) topbarName.textContent = state.profile.name;
      if (welcomeName) welcomeName.textContent = state.profile.name;

      // Pricing fields
      if (selectors.prSmall)      selectors.prSmall.value      = state.profile.pricing.small      || '';
      if (selectors.prMedium)     selectors.prMedium.value     = state.profile.pricing.medium     || '';
      if (selectors.prLarge)      selectors.prLarge.value      = state.profile.pricing.large      || '';
      if (selectors.prSqft)       selectors.prSqft.value       = state.profile.pricing.sqft       || '';
      if (selectors.prFrame)      selectors.prFrame.value      = state.profile.pricing.frame      || '';
      if (selectors.prGift)       selectors.prGift.value       = state.profile.pricing.gift       || '';
      if (selectors.prExpress)    selectors.prExpress.value    = state.profile.pricing.express    || '';
      if (selectors.prDigital)    selectors.prDigital.value    = state.profile.pricing.digital    || '';
      if (selectors.prTurnaround) selectors.prTurnaround.value = state.profile.pricing.turnaround || '';
      if (selectors.prRush)       selectors.prRush.value       = state.profile.pricing.rush       || '';
    },
  };

  const actions = {
    openBookingModal(id) {
      const booking = state.bookings.find((item) => item.id === id);
      if (!booking) return;
      document.getElementById('bookingModalContent').innerHTML = `
        <div class="booking-modal-card">
          <h5>${booking.type}</h5>
          <div class="booking-detail-grid">
            <p><strong>Customer:</strong> ${booking.customer}</p>
            <p><strong>Start date:</strong> ${booking.date}</p>
            <p><strong>Total:</strong> ₹${booking.amount}</p>
            <p><strong>Advance:</strong> ₹${booking.advanceAmount}</p>
            <p><strong>Artwork size:</strong> ${booking.artworkSize}</p>
            <p><strong>Delivery:</strong> ${booking.delivery}</p>
            <p><strong>Delivery address:</strong> ${booking.deliveryAddress || 'Not provided'}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
            <p><strong>Payment:</strong> ${booking.paymentStatus.replace('_', ' ')}</p>
          </div>
          <div class="booking-detail-section">
            <strong>Project description</strong>
            <p>${booking.details}</p>
          </div>
          <div class="booking-detail-media">
            <div>
              <strong>Reference image</strong>
              ${booking.referenceImage
                ? `<a href="${booking.referenceImage}" target="_blank" rel="noopener"><img src="${booking.referenceImage}" alt="Customer reference image"></a>`
                : `<p>No reference image uploaded.</p>`}
            </div>
            <div>
              <strong>Payment screenshot</strong>
              ${booking.paymentScreenshot
                ? `<a href="${booking.paymentScreenshot}" target="_blank" rel="noopener"><img src="${booking.paymentScreenshot}" alt="Advance payment screenshot"></a>`
                : `<p>No payment screenshot submitted yet.</p>`}
            </div>
          </div>
          <div class="booking-modal-actions">
            ${booking.clientId ? `<a class="btn-ghost" href="/chat/?user=${booking.clientId}&name=${encodeURIComponent(booking.customer)}">Message Customer</a>` : ''}
            ${booking.status === 'pending' ? `<button type="button" class="btn-sm-green" data-booking-action="accept" data-booking-id="${booking.id}">Accept</button>
            <button type="button" class="btn-sm-red" data-booking-action="decline" data-booking-id="${booking.id}">Decline</button>` : ''}
            ${booking.status === 'accepted' && booking.paymentStatus === 'pending_upload' ? `<span class="booking-waiting"><i class="bi bi-hourglass-split"></i> Waiting for customer screenshot</span>` : ''}
            ${booking.status === 'accepted' && booking.paymentStatus === 'submitted' ? `<button type="button" class="btn-sm-green" data-booking-action="start" data-booking-id="${booking.id}">Verify Payment & Start Work</button>` : ''}
          </div>
        </div>
      `;
      new bootstrap.Modal(document.getElementById('bookingModal')).show();
    },

    // ── Accept booking — calls API + updates UI ──
    acceptBooking(id) {
      showConfirmModal(
        'Accept this booking?',
        'The client will be notified that you have accepted.',
        async () => {
          try {
            const res = await authFetch(`${API_BASE}/bookings/${id}/status/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'accepted' }),
            });
            if (res.ok) {
              const updated = await res.json();
              upsertBooking(updated);
              ui.renderBookings('all');
              ui.updateStats();
              closeBookingModal();
              helpers.showToast('Booking accepted. Customer notified to upload advance screenshot.');
            } else {
  const err = await res.json().catch(() => ({}));
  helpers.showToast('Accept failed: ' + (err.error || err.detail || res.status));
}
          } catch {
            helpers.showToast('Network error.');
          }
        }
      );
    },

    // ── Decline booking — calls API + updates UI ──
    declineBooking(id) {
      showConfirmModal(
        'Decline this booking?',
        'This action cannot be undone.',
        async () => {
          try {
            const res = await authFetch(`${API_BASE}/bookings/${id}/status/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'declined' }),
            });
            if (res.ok) {
              const updated = await res.json();
              upsertBooking(updated);
              ui.renderBookings('all');
              ui.updateStats();
              closeBookingModal();
              helpers.showToast('Booking declined. Customer notified.');
           } else {
  const err = await res.json().catch(() => ({}));
  helpers.showToast('Decline failed: ' + (err.error || err.detail || res.status));
}
          } catch {
            helpers.showToast('Network error.');
          }
        }
      );
    },

    startBooking(id) {
      showConfirmModal(
        'Verify payment and start work?',
        'The client will be notified that you verified the advance payment.',
        async () => {
          try {
            const res = await authFetch(`${API_BASE}/bookings/${id}/status/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'in_progress' }),
            });
            if (res.ok) {
              const updated = await res.json();
              upsertBooking(updated);
              ui.renderBookings('all');
              ui.updateStats();
              closeBookingModal();
              helpers.showToast('Payment verified. Work started.');
            } else {
              const err = await res.json().catch(() => ({}));
              helpers.showToast('Start failed: ' + (err.error || err.detail || res.status));
            }
          } catch {
            helpers.showToast('Network error.');
          }
        }
      );
    },

    addSlot() {
      const date = selectors.slotDate.value;
      const time = selectors.slotTime.value;
      if (!date || !time) {
        helpers.showToast('Please select a date and time.');
        return;
      }
      state.slots.push({ date, time });
      selectors.slotDate.value = '';
      selectors.slotTime.value = '9:00 AM – 12:00 PM';
      storage.save();
      ui.renderSlots();
      ui.updateStats();
      helpers.showToast('Availability slot added.');
    },

    removeSlot(index) {
      state.slots.splice(index, 1);
      storage.save();
      ui.renderSlots();
      ui.updateStats();
    },

    async addPortfolioFiles(files) {
      const allowedCount = 15 - state.uploads.length;
      const accepted = Array.from(files).slice(0, allowedCount);
      const validImages = accepted.filter((file) => file.type.startsWith('image/'));
      if (!validImages.length) {
        helpers.showToast('Upload limit reached or invalid file type.');
        return;
      }

      const formData = new FormData();
      validImages.forEach((file) => formData.append('images', file));

      try {
        const res = await authFetch(`${API_BASE}/artists/portfolio/`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          helpers.showToast('Portfolio upload failed: ' + (err.detail || JSON.stringify(err)));
          return;
        }

        const savedItems = await res.json();
        savedItems.forEach((item) => {
          state.uploads.push({
            image: item.image_url || item.image,
            title: item.title || 'Portfolio Artwork',
          });
        });
        ui.renderPortfolio();
        storage.save();
        helpers.showToast('Portfolio image uploaded.');
      } catch (error) {
        helpers.showToast('Network error. Is Django running?');
      }
    },

    removePortfolioImage(index) {
      state.uploads.splice(index, 1);
      storage.save();
      ui.renderPortfolio();
      helpers.showToast('Image removed from portfolio.');
    },

    updateAvatar(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        state.profile.avatar = e.target.result;
        helpers.populateProfileForm();
        helpers.showToast('Profile photo updated. Save profile to keep it.');
      };
      reader.readAsDataURL(file);
    },

    addTag() {
      const value = selectors.tagInput.value.trim();
      if (!value) { helpers.showToast('Enter a style tag first.'); return; }
      if (state.tags.includes(value)) {
        helpers.showToast('Tag already added.');
        selectors.tagInput.value = '';
        return;
      }
      state.tags.push(value);
      selectors.tagInput.value = '';
      ui.renderTags();
      storage.save();
      helpers.showToast('Tag added.');
    },

    removeTag(tag) {
      state.tags = state.tags.filter((t) => t !== tag);
      ui.renderTags();
      helpers.showToast('Tag removed.');
    },

   // ── Save Profile ──
    saveProfile() {
      helpers.saveProfileToState();
      const formData = new FormData();
      if (state.profile.bio)           formData.append('bio',        state.profile.bio);
      if (state.profile.location)      formData.append('location',   state.profile.location);
      if (state.profile.pricing.small) formData.append('base_price', state.profile.pricing.small);
      if (state.profile.phone)      formData.append('phone', state.profile.phone);
      if (state.profile.experience) formData.append('experience', state.profile.experience);
      if (state.profile.mediums)    formData.append('mediums', state.profile.mediums);
      if (state.profile.name) formData.append('full_name', state.profile.name);
      if (state.tags[0]) formData.append('style', state.tags[0]);
      const avatarFile = selectors.avatarInput && selectors.avatarInput.files[0];
      if (avatarFile) formData.append('avatar', avatarFile);

      authFetch(`${API_BASE}/artists/profile/onboarding/`, {
        method: 'POST',
        body: formData,
      })
        .then((res) => {
          if (res.ok) {
            ui.renderTags();
            ui.updateStats();
            helpers.populateProfileForm();
            helpers.showToast('✓ Profile updated successfully!');
          } else {
            res.json().then(err => helpers.showToast('Save failed: ' + (err.detail || JSON.stringify(err))));
          }
        })
        .catch(() => helpers.showToast('Network error. Is Django running?'));
    },
   
  

    // ── Save Pricing — confirm → JSON POST ──
    savePricing() {
      showConfirmModal(
        'Save Pricing Changes?',
        'Your updated rates will be visible to clients immediately.',
        async () => {
          helpers.savePricingToState();

          try {
            const res = await authFetch(`${API_BASE}/artists/profile/onboarding/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base_price: state.profile.pricing.small }),
            });
            if (res.ok) {
              helpers.showToast('✓ Pricing updated successfully!');
            } else {
              helpers.showToast('Save failed. Try again.');
            }
          } catch {
            helpers.showToast('Network error.');
          }
        }
      );
    },

    // ── Reset Profile — re-fetch from server ──
    loadProfileForm() {
      authFetch(`${API_BASE}/artists/profile/onboarding/`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            state.profile.name     = data.user_name  || state.profile.name;
            state.profile.bio      = data.bio        || '';
            state.profile.location = data.location   || '';
            state.profile.phone = data.phone || '';
            state.profile.experience = data.experience || '';
            state.profile.mediums = data.mediums || '';
            state.profile.pricing.small = data.base_price ? Number(data.base_price) : 0;
            if (data.avatar_url) state.profile.avatar = data.avatar_url;
            state.tags = data.style ? [data.style] : [];
          }
          helpers.populateProfileForm();
          ui.renderTags();
          helpers.showToast('Reset to last saved values.');
        })
        .catch(() => helpers.showToast('Could not reset — network error.'));
    },

    // ── Reset Pricing — re-fetch from server ──
    loadPricingForm() {
      authFetch(`${API_BASE}/artists/profile/onboarding/`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.base_price) {
            state.profile.pricing.small = Number(data.base_price);
          }
          helpers.populateProfileForm();
          helpers.showToast('Pricing reset to last saved values.');
        })
        .catch(() => helpers.showToast('Could not reset — network error.'));
    },

    toggleSidebar() {
      document.body.classList.toggle('sidebar-open');
      selectors.sidebarOverlay.classList.toggle('active');
    },
  };

  // Shorthand aliases used in inline HTML onclick attributes
  const removeSlot         = actions.removeSlot;
  const removePortfolioImage = actions.removePortfolioImage;
  const addTag             = actions.addTag;
  const showPage           = (pageId) => ui.setActivePage(pageId);

  const init = async () => {
    storage.load();
    const canUseDashboard = await loadRemoteData();
    if (!canUseDashboard) return;
    ui.renderTags();
    ui.renderSuggestedTags();
    ui.renderSlots();
    ui.renderBookings('all');
    ui.renderMessages();
    ui.renderArtistMessageNotice();
    ui.renderPortfolio();
    ui.updateStats();
    helpers.populateProfileForm();

    window.setInterval(async () => {
      try {
        const [messageRes, bookingRes] = await Promise.all([
          authFetch(`${API_BASE}/messages/`),
          authFetch(`${API_BASE}/bookings/mine/`),
        ]);
        if (messageRes.ok) state.messages = await messageRes.json();
        if (bookingRes.ok) {
          const bookings = await bookingRes.json();
          state.bookings = bookings.map(normalizeBooking);
        }
        ui.renderBookings(state.activePage === 'pg-bookings' ? 'all' : 'all');
        ui.renderMessages();
        ui.updateStats();
        ui.renderArtistMessageNotice();
      } catch (error) {
        console.warn('Unable to refresh messages', error);
      }
    }, 5000);

    selectors.sidebarItems.forEach((item) => {
      if (!item.dataset.page) return;
      item.addEventListener('click', () => showPage(item.dataset.page));
    });

    if (selectors.menuToggle)    selectors.menuToggle.addEventListener('click', actions.toggleSidebar);
    if (selectors.sidebarOverlay) selectors.sidebarOverlay.addEventListener('click', actions.toggleSidebar);

    if (selectors.bookingList) {
      selectors.bookingList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-booking-action]');
        if (!button) return;
        const id = Number(button.dataset.bookingId);
        const action = button.dataset.bookingAction;
        if (action === 'view') actions.openBookingModal(id);
        if (action === 'accept') actions.acceptBooking(id);
        if (action === 'decline') actions.declineBooking(id);
        if (action === 'start') actions.startBooking(id);
      });
    }

    const bookingModalContent = document.getElementById('bookingModalContent');
    if (bookingModalContent) {
      bookingModalContent.addEventListener('click', (event) => {
        const button = event.target.closest('[data-booking-action]');
        if (!button) return;
        const id = Number(button.dataset.bookingId);
        const action = button.dataset.bookingAction;
        if (action === 'accept') actions.acceptBooking(id);
        if (action === 'decline') actions.declineBooking(id);
        if (action === 'start') actions.startBooking(id);
      });
    }

    if (selectors.portfolioDropZone) {
      selectors.portfolioDropZone.addEventListener('click', () => selectors.portfolioInput.click());
      selectors.portfolioDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        selectors.portfolioDropZone.classList.add('dragging');
      });
      selectors.portfolioDropZone.addEventListener('dragleave', () => {
        selectors.portfolioDropZone.classList.remove('dragging');
      });
      selectors.portfolioDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        selectors.portfolioDropZone.classList.remove('dragging');
        if (e.dataTransfer.files) actions.addPortfolioFiles(e.dataTransfer.files);
      });
    }

    if (selectors.portfolioInput) {
      selectors.portfolioInput.addEventListener('change', (e) => {
        if (e.target.files) actions.addPortfolioFiles(e.target.files);
      });
    }

    if (selectors.avatarRing)      selectors.avatarRing.addEventListener('click', () => selectors.avatarInput.click());
    if (selectors.changeAvatarBtn) selectors.changeAvatarBtn.addEventListener('click', () => selectors.avatarInput.click());
    if (selectors.avatarInput) {
      selectors.avatarInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) actions.updateAvatar(e.target.files[0]);
      });
    }

    if (selectors.tagInput) {
      selectors.tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); actions.addTag(); }
      });
    }

    // ── Expose to global scope for onclick= attributes in HTML ──
    window.dashboard = {
      openBookingModal: actions.openBookingModal,
      acceptBooking:    actions.acceptBooking,
      declineBooking:   actions.declineBooking,
      startBooking:     actions.startBooking,
      renderBookings:   ui.renderBookings,
      logoutArtist: () => {
        localStorage.removeItem('artistDashboardState');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '/login/';
      },
      showPage,
      addTag:          actions.addTag,
      saveProfile:     actions.saveProfile,
      loadProfileForm: actions.loadProfileForm,
      addSlot:         actions.addSlot,
      savePricing:     actions.savePricing,
      loadPricingForm: actions.loadPricingForm,
    };

    // Also expose at window level for legacy onclick= calls
    window.showPage        = showPage;
    window.addTag          = actions.addTag;
    window.logoutArtist    = window.dashboard.logoutArtist;
    window.saveProfile     = actions.saveProfile;
    window.loadProfileForm = actions.loadProfileForm;
    window.addSlot         = actions.addSlot;
    window.savePricing     = actions.savePricing;
    window.loadPricingForm = actions.loadPricingForm;
    window.renderBookings = ui.renderBookings;

  };

  return { init, showPage };
})();

dashboard.init();
