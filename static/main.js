"use strict";

/* ================================================================
   SHRISTI – MAIN JAVASCRIPT
   File: main.js
================================================================ */


/* ================================================================
   0. API CONFIG & AUTH HELPERS
================================================================ */
const API_BASE = "http://127.0.0.1:8000/api";
const DEFAULT_ARTIST_IMAGE = "https://i.pravatar.cc/400?img=47";

function saveAuth(data) {
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
}

function getToken() {
  return localStorage.getItem("access_token");
}

async function authFetch(url, options = {}) {
  const headers = {
    "Authorization": `Bearer ${getToken()}`,
    ...(options.headers || {})
  };
  // Do NOT set Content-Type for FormData — browser must set it with the multipart boundary
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, { ...options, headers });
}

function redirectAfterLogin(nextPage, role) {
  if (nextPage) {
    window.location.href = nextPage;
    return;
  }
  window.location.href = role === "artist" ? "/artist-dashboard/" : "/";
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
}

async function getCurrentUser() {
  if (!getToken()) return null;
  try {
    const response = await authFetch(`${API_BASE}/users/me/`);
    if (!response.ok) {
      clearAuth();
      return null;
    }
    const me = await response.json();
    localStorage.setItem("userRole", me.role || "client");
    localStorage.setItem("userName", me.name || me.email || "");
    return me;
  } catch (error) {
    return null;
  }
}

function redirectToLogin() {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login/?next=${next}`;
}

async function enforcePageAccess(page) {
  const publicPages = new Set(["index", "login", "forgot-password", "privacy-policy", "terms"]);
  if (publicPages.has(page) || page === "artist-dashboard") return true;
  const me = await getCurrentUser();
  if (!me) {
    redirectToLogin();
    return false;
  }
  return true;
}

async function initAuthNav() {
  const nav = document.getElementById("mainNav");
  if (!nav) return;

  const menu = nav.querySelector(".navbar-nav");
  const actions = nav.querySelector("#navMenu > div.d-flex");
  const me = await getCurrentUser();

  if (menu) {
    if (!me) {
      menu.innerHTML = "";
    } else {
      menu.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="/artist/">Artists</a></li>
        <li class="nav-item"><a class="nav-link" href="/gallery/">Gallery</a></li>
        ${me.role === "client" ? '<li class="nav-item"><a class="nav-link" href="/chat/">Messages</a></li>' : ""}
        ${me.role === "artist" ? '<li class="nav-item"><a class="nav-link" href="/artist-dashboard/">Dashboard</a></li>' : ""}
      `;
    }
  }

  if (actions) {
    if (!me) {
      actions.innerHTML = `
        <a href="/login/?mode=register" class="btn-nav-outline">Register</a>
        <a href="/login/" class="btn-nav-solid">Sign In</a>
      `;
    } else {
      const safeName = escapeHTML(me.name || me.email || "Account");
      actions.innerHTML = `
        <span class="nav-user-name d-none d-lg-inline">${safeName}</span>
        ${me.role === "artist" ? '<a href="/artist-dashboard/" class="btn-nav-outline">Dashboard</a>' : '<a href="/login/?mode=register&role=artist" class="btn-nav-outline" id="becomeArtistBtn">Register as Artist</a>'}
        <button type="button" class="btn-nav-solid" id="logoutNavBtn">Logout</button>
      `;
      actions.querySelector("#logoutNavBtn")?.addEventListener("click", () => {
        clearAuth();
        window.location.href = "/login/";
      });
      actions.querySelector("#becomeArtistBtn")?.addEventListener("click", (event) => {
        event.preventDefault();
        clearAuth();
        window.location.href = "/login/?mode=register&role=artist";
      });
    }
  }
}


/* ================================================================
   1. ARTIST + PORTFOLIO DATA
================================================================ */
let ARTISTS = [];
let PORTFOLIO = [];

async function loadArtists() {
  try {
    const response = await fetch(`${API_BASE}/artists/`);
    if (response.ok) {
      const data = await response.json();
      ARTISTS = data.map(artist => ({
        id: artist.id,
        userId: artist.user_id || artist.user,
        name: artist.user_name,
        location: artist.location,
        style: artist.style,
        priceMin: parseFloat(artist.base_price || 0),
        rating: parseFloat(artist.rating || 0),
        image: artist.avatar_url || artist.avatar || DEFAULT_ARTIST_IMAGE,
        bio: artist.bio || ""
      }));
    } else {
      ARTISTS = [];
    }
  } catch (error) {
    console.error("Error loading artists:", error);
    ARTISTS = [];
  }
}

async function loadPortfolio() {
  try {
    const response = await fetch(`${API_BASE}/artists/portfolio/`);
    PORTFOLIO = response.ok ? await response.json() : [];
  } catch (error) {
    console.error("Error loading portfolio:", error);
    PORTFOLIO = [];
  }
}


/* ================================================================
   2. UTILITY FUNCTIONS
================================================================ */
function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function cap(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getQueryParams() {
  const params = {};
  new URLSearchParams(window.location.search).forEach((val, key) => {
    params[key] = val.trim();
  });
  return params;
}

function updateURLParams(filters) {
  const url = new URL(window.location.href);
  Object.entries(filters).forEach(([key, val]) => {
    if (val && val !== "all" && val !== "") {
      url.searchParams.set(key, val);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.pushState({}, "", url.toString());
}

function getCurrentPage() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "index";
}


/* ================================================================
   3. ARTIST CARD BUILDER
================================================================ */
function buildArtistCard(artist, lazy = true) {
  const profileUrl = `/artist-profile/?id=${artist.id}`;
  return `
    <div class="col-sm-6 col-lg-3 reveal" data-artist-id="${artist.id}">
      <div class="artist-card h-100">
        <div class="artist-img-wrap">
          <span class="art-style-badge">${cap(artist.style)}</span>
          <span class="rating-badge"><i class="bi bi-star-fill"></i> ${Number(artist.rating).toFixed(1)}</span>
          <a href="${profileUrl}" aria-label="View ${escapeHTML(artist.name)} profile">
            <img src="${artist.image}" alt="${escapeHTML(artist.name)}" ${lazy ? 'loading="lazy"' : ''} />
          </a>
        </div>
        <div class="artist-body">
          <a href="${profileUrl}" class="artist-name">${escapeHTML(artist.name)}</a>
          <div class="artist-location">
            <i class="bi bi-geo-alt-fill"></i> ${cap(artist.location)}
          </div>
          <a href="${profileUrl}" class="text-brand" style="display:inline-block;font-size:.76rem;margin-top:.45rem;">View Profile</a>
          <div class="artist-meta">
            <div class="artist-price">
              From ${formatINR(artist.priceMin)}<small> per artwork</small>
            </div>
            <a href="/booking/?artist=${encodeURIComponent(artist.name)}&id=${artist.id}" class="btn-book">Book Now</a>
          </div>
        </div>
      </div>
    </div>`;
}

function buildGalleryCard(item) {
  const image = item.image_url || item.image || DEFAULT_ARTIST_IMAGE;
  const artistName = item.artist_name || "Unknown Artist";
  const title = item.title || `Artwork by ${artistName}`;

  return `
    <div class="col-sm-6 col-lg-4 reveal">
      <article class="artist-card h-100">
        <div class="artist-img-wrap">
          <span class="art-style-badge">${cap(item.artist_style)}</span>
          <img src="${image}" alt="${title}" loading="lazy" />
        </div>
        <div class="artist-body">
          <div class="artist-name">${title}</div>
          <div class="artist-location">
            <i class="bi bi-person-fill"></i> ${artistName}
          </div>
          <div class="artist-meta">
            <a href="/artist-profile/?id=${item.artist_id}" class="btn-book">View Artist</a>
          </div>
        </div>
      </article>
    </div>`;
}


/* ================================================================
   4. NAVBAR
================================================================ */
function initNavbar() {
  const nav = document.getElementById("mainNav");
  if (!nav) return;

  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
}


/* ================================================================
   5. SCROLL REVEAL
================================================================ */
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}


/* ================================================================
   6. HOME PAGE
================================================================ */
async function initHomePage() {
  await loadArtists();

  const grid = document.getElementById("featuredGrid");
  if (grid) {
    grid.innerHTML = Array(4).fill('<div class="col-sm-6 col-lg-3"><div class="skeleton"></div></div>').join("");
    setTimeout(() => {
      grid.innerHTML = ARTISTS.slice(0, 4).map(a => buildArtistCard(a, false)).join("");
      initScrollReveal();
    }, 600);
  }

  const searchBtn = document.getElementById("homeSearchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const location = document.getElementById("homeLocation")?.value || "";
      const style    = document.getElementById("homeStyle")?.value || "";
      const budget   = document.getElementById("homeBudget")?.value || "";
      const params   = new URLSearchParams();
      if (location && location !== "all") params.set("location", location);
      if (style    && style    !== "all") params.set("style",    style);
      if (budget   && budget   !== "all") params.set("budget",   budget);
      window.location.href = "/artist/" + (params.toString() ? "?" + params.toString() : "");
    });
  }
}


/* ================================================================
   7. ARTISTS PAGE
================================================================ */
async function initArtistsPage() {
  await loadArtists();

  const grid         = document.getElementById("artistsGrid");
  const filterLoc    = document.getElementById("filterLocation");
  const filterStyle  = document.getElementById("filterStyle");
  const filterBudget = document.getElementById("filterBudget");
  const filterSearch = document.getElementById("filterSearch");
  const resultsCount = document.getElementById("resultsCount");
  const noResults    = document.getElementById("noResults");
  const tagsWrap     = document.getElementById("filterTags");

  if (!grid) return;

  let revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.08 });

  function applyFilters() {
    const loc    = filterLoc.value.toLowerCase();
    const style  = filterStyle.value.toLowerCase();
    const budget = filterBudget.value;
    const search = filterSearch.value.toLowerCase().trim();

    const filtered = ARTISTS.filter(artist => {
      if (loc    && loc    !== "all" && artist.location !== loc)   return false;
      if (style  && style  !== "all" && artist.style    !== style) return false;
      if (budget && budget !== "all") {
        const price = artist.priceMin;
        if (budget === "under1000"   && price >= 1000)              return false;
        if (budget === "1000-5000"   && (price < 1000  || price > 5000))  return false;
        if (budget === "5000-15000"  && (price < 5000  || price > 15000)) return false;
        if (budget === "15000-50000" && (price < 15000 || price > 50000)) return false;
        if (budget === "above50000"  && price < 50000)              return false;
      }
      if (search && !artist.name.toLowerCase().includes(search)) return false;
      return true;
    });

    updateURLParams({ location: loc, style, budget, search });

    if (filtered.length === 0) {
      grid.innerHTML = "";
      if (noResults) noResults.classList.add("show");
    } else {
      if (noResults) noResults.classList.remove("show");
      grid.innerHTML = Array(filtered.length)
        .fill('<div class="col-sm-6 col-lg-3"><div class="skeleton"></div></div>')
        .join("");
      setTimeout(() => {
        grid.innerHTML = filtered.map(a => buildArtistCard(a)).join("");
        grid.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
      }, 350);
    }

    if (resultsCount) {
      resultsCount.innerHTML = `Showing <span>${filtered.length}</span> artist${filtered.length !== 1 ? "s" : ""}`;
    }

    if (tagsWrap) renderFilterTags({ loc, style, budget, search });
  }

  function renderFilterTags({ loc, style, budget, search }) {
    const tags = [];
    if (loc    && loc    !== "all") tags.push({ key: "location", label: cap(loc) });
    if (style  && style  !== "all") tags.push({ key: "style",    label: cap(style) });
    if (budget && budget !== "all") {
      const labels = { "under1000": "Under ₹1,000", "1000-5000": "₹1K–₹5K", "5000-15000": "₹5K–₹15K", "15000-50000": "₹15K–₹50K", "above50000": "₹50K+" };
      tags.push({ key: "budget", label: labels[budget] || budget });
    }
    if (search) tags.push({ key: "search", label: `"${search}"` });
    tagsWrap.innerHTML = tags.map(t =>
      `<span class="filter-tag" data-key="${t.key}">${t.label} <span class="remove">×</span></span>`
    ).join("");
  }

  if (tagsWrap) {
    tagsWrap.addEventListener("click", e => {
      const tag = e.target.closest(".filter-tag");
      if (!tag) return;
      const key = tag.dataset.key;
      if (key === "location") filterLoc.value    = "all";
      if (key === "style")    filterStyle.value  = "all";
      if (key === "budget")   filterBudget.value = "all";
      if (key === "search")   filterSearch.value = "";
      applyFilters();
    });
  }

  [filterLoc, filterStyle, filterBudget].forEach(el => {
    if (el) el.addEventListener("change", applyFilters);
  });

  let searchTimer;
  if (filterSearch) {
    filterSearch.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilters, 280);
    });
  }

  const params = getQueryParams();
  if (params.location && filterLoc)    filterLoc.value    = params.location;
  if (params.style    && filterStyle)  filterStyle.value  = params.style;
  if (params.budget   && filterBudget) filterBudget.value = params.budget;
  if (params.search   && filterSearch) filterSearch.value = params.search;

  applyFilters();
}


/* ================================================================
   8. GALLERY PAGE
================================================================ */
async function initGalleryPage() {
  await loadPortfolio();

  const grid = document.getElementById("galleryGrid");
  const empty = document.getElementById("galleryEmpty");
  if (!grid) return;

  if (PORTFOLIO.length === 0) {
    grid.innerHTML = "";
    if (empty) empty.classList.add("show");
    return;
  }

  if (empty) empty.classList.remove("show");
  grid.innerHTML = PORTFOLIO.map(item => buildGalleryCard(item)).join("");
  initScrollReveal();
}


/* ================================================================
   9. BOOKING PAGE
================================================================ */
async function initBookingPage() {
  await loadArtists();

  const nameEl = document.getElementById("bookingArtistName");
  if (!nameEl) return;

  const params   = getQueryParams();
  const artistId = parseInt(params.id);
  let artist     = ARTISTS.find(a => a.id === artistId);

  if (!artist && params.artist) {
    artist = ARTISTS.find(a => a.name.toLowerCase() === decodeURIComponent(params.artist).toLowerCase());
  }

  if (!artist) artist = ARTISTS[0];
  if (artist) populateBooking(artist);
}

function populateBooking(artist) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const img = document.getElementById("bookingArtistImg");
  if (img) { img.src = artist.image; img.alt = artist.name; }

  set("bookingArtistName",     artist.name);
  set("bookingArtistLocation", cap(artist.location));
  set("bookingArtistStyle",    cap(artist.style));
  set("bookingArtistRating",   Number(artist.rating).toFixed(1));
  set("bookingArtistBio",      artist.bio);

  const fee   = Math.round(artist.priceMin * 0.05);
  const base  = document.getElementById("basePrice");
  if (base) { base.textContent = formatINR(artist.priceMin); base.dataset.base = artist.priceMin; }
  set("platformFee", formatINR(fee));
  set("totalPrice",  formatINR(artist.priceMin + fee));

  const titleEl = document.getElementById("bookingPageTitle");
  if (titleEl) titleEl.textContent = `Book ${artist.name}`;
  const portfolioLink = document.getElementById("bookingPortfolioLink");
  if (portfolioLink) {
  portfolioLink.href = `/artist-profile/?id=${artist.id}#portfolio-heading`;
  portfolioLink.setAttribute("aria-label", `View ${artist.name}'s portfolio before booking`);
}
}


/* ================================================================
   9. BOOKING FORM
================================================================ */
function initBookingForm() {
  const serviceSelect = document.getElementById("serviceType");
  if (!serviceSelect) return;

  const multipliers = { standard: 1, express: 1.5, premium: 2 };

  serviceSelect.addEventListener("change", () => {
    const m    = multipliers[serviceSelect.value] || 1;
    const base = parseInt(document.getElementById("basePrice")?.dataset.base || 0);
    const adj  = Math.round(base * m);
    const fee  = Math.round(adj * 0.05);
    const set  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("basePrice",   formatINR(adj));
    set("platformFee", formatINR(fee));
    set("totalPrice",  formatINR(adj + fee));
  });

  const dateInput = document.getElementById("bookingDate");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

  const bookingForm = document.getElementById("bookingForm");
  if (!bookingForm) return;

  bookingForm.addEventListener("submit", async e => {
    e.preventDefault();
    const termsAccepted = document.getElementById("agreeTerms")?.checked || false;
    if (!termsAccepted) {
      showSiteNotice({
        type: "error",
        icon: "bi-exclamation-triangle-fill",
        title: "Terms required",
        text: "Please accept the Terms of Service before sending a booking request."
      });
      return;
    }
    const btn = bookingForm.querySelector('[type="submit"]');
    const originalText = btn.textContent;
    const delivery = bookingForm.querySelector('input[name="delivery"]:checked')?.value || "digital";
    const deliveryAddress = document.getElementById("deliveryAddress")?.value.trim() || "";

    if (["physical", "both"].includes(delivery) && !deliveryAddress) {
      showSiteNotice({
        type: "error",
        icon: "bi-geo-alt-fill",
        title: "Delivery address required",
        text: "Please enter a delivery address for physical artwork delivery."
      });
      return;
    }
    btn.textContent = "Confirming…";
    btn.disabled = true;

    const params   = getQueryParams();
    const artistId = parseInt(params.id);

    const bookingData = new FormData();
    bookingData.append("artist", artistId);
    bookingData.append("description", document.getElementById("projectDescription")?.value || "");
    bookingData.append("service_type", document.getElementById("serviceType")?.value || "standard");
    bookingData.append("artwork_size", bookingForm.querySelectorAll("select")[1]?.value || "");
    bookingData.append("delivery", delivery);
    bookingData.append("delivery_address", deliveryAddress);
    bookingData.append("preferred_date", document.getElementById("bookingDate")?.value || "");
    bookingData.append("terms_accepted", termsAccepted ? "true" : "");
    const referenceFile = document.getElementById("referenceImage")?.files?.[0];
    if (referenceFile) bookingData.append("reference_image", referenceFile);

    try {
      const response = await authFetch(`${API_BASE}/bookings/create/`, {
        method: "POST",
        body: bookingData
      });

      if (response.ok) {
        sessionStorage.setItem("pendingSiteNotice", JSON.stringify({
          type: "success",
          icon: "bi-check-circle-fill",
          title: "Booking request sent",
          text: "The artist will review your commission and reply in Messages."
        }));
        window.location.href = "/";
      } else {
        const error = await response.json();
        showSiteNotice({
          type: "error",
          icon: "bi-exclamation-triangle-fill",
          title: "Booking not sent",
          text: error.error || error.detail || "Please check the details and try again."
        });
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch (err) {
      showSiteNotice({
        type: "error",
        icon: "bi-wifi-off",
        title: "Could not reach Shristi",
        text: "Please try again in a moment."
      });
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}


/* ================================================================
   10. LOGIN PAGE
================================================================ */
function initLoginPage() {
  const loginForm    = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs         = document.querySelectorAll(".auth-tab");

  if (!loginForm && !registerForm) return;

  // -- Tab switching --
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelectorAll(".auth-form").forEach(f => {
        f.style.display = f.id === target + "Form" ? "block" : "none";
      });
    });
  });

  const params = getQueryParams();
  if (params.mode === "register") {
    document.querySelector('[data-tab="register"]')?.click();
  }
  if (params.mode === "login") {
    document.querySelector('[data-tab="login"]')?.click();
  }
  if (params.role === "artist") {
    const registerRole = document.querySelector('input[name="accountType"][value="artist"]');
    const loginRole = document.querySelector('input[name="loginAccountType"][value="artist"]');
    if (registerRole) registerRole.checked = true;
    if (loginRole) loginRole.checked = true;
  }

  // -- Eye icon toggle --
  document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrap")?.querySelector("input");
      if (!input) return;
      const isPass  = input.type === "password";
      input.type    = isPass ? "text" : "password";
      btn.className = isPass
        ? "bi bi-eye-slash input-icon toggle-password"
        : "bi bi-eye input-icon toggle-password";
    });
  });

  // -- Helpers --
  function showError(id, msg) {
    const el = document.getElementById(id + "Error");
    if (el) { el.textContent = msg; el.classList.add("show"); }
  }
  function clearError(id) {
    const el = document.getElementById(id + "Error");
    if (el) el.classList.remove("show");
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // -- Login submit --
  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      let valid = true;

      const email = document.getElementById("loginEmail")?.value.trim() || "";
      const pass  = document.getElementById("loginPassword")?.value || "";

      clearError("loginEmail"); clearError("loginPassword");

      if (!isValidEmail(email)) { showError("loginEmail", "Please enter a valid email."); valid = false; }
      if (pass.length < 6)      { showError("loginPassword", "Password must be at least 6 characters."); valid = false; }

      if (!valid) return;

      const btn  = loginForm.querySelector(".btn-auth");
      const role = document.querySelector('input[name="loginAccountType"]:checked')?.value || "client";
      btn.textContent = "Signing In…";
      btn.disabled    = true;

      try {
        const res  = await fetch(`${API_BASE}/users/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password: pass })
        });
        const data = await res.json();

      if (res.ok) {
  saveAuth(data);

  const meRes = await authFetch(`${API_BASE}/users/me/`);
  if (!meRes.ok) throw new Error("Could not verify account type");

  const me = await meRes.json();

  if (me.role !== role) {
    clearAuth();

    showSiteNotice({
      type: "error",
      icon: "bi-exclamation-triangle-fill",
      title: "Wrong account type",
      text: me.role === "artist"
        ? "This is an artist account, not an art lover account. Please sign in as Artist."
        : "This is an art lover account, not an artist account. Please sign in as Art Lover."
    });

    btn.textContent = "Sign In";
    btn.disabled = false;
    return;
  }

  localStorage.setItem("userRole", me.role);
  localStorage.setItem("userName", me.name || email);
  redirectAfterLogin(undefined, me.role);
} else {
          showError("loginPassword", "Invalid email or password.");
          btn.textContent = "Sign In";
          btn.disabled    = false;
        }
      } catch (err) {
        showError("loginEmail", "Server error. Make sure Django is running.");
        btn.textContent = "Sign In";
        btn.disabled    = false;
      }
    });
  }

  // -- Register submit --
  if (registerForm) {
    registerForm.addEventListener("submit", async e => {
      e.preventDefault();
      let valid = true;

      const name  = document.getElementById("regName")?.value.trim()  || "";
      const email = document.getElementById("regEmail")?.value.trim()  || "";
      const pass  = document.getElementById("regPassword")?.value      || "";
      const conf  = document.getElementById("regConfirm")?.value       || "";
      const role  = document.querySelector('input[name="accountType"]:checked')?.value || "client";
      const termsAccepted = document.getElementById("regTerms")?.checked || false;

      ["regName", "regEmail", "regPassword", "regConfirm"].forEach(clearError);

      if (name.length < 2)   { showError("regName",     "Please enter your full name.");          valid = false; }
      if (!isValidEmail(email)) { showError("regEmail",  "Please enter a valid email.");           valid = false; }
      if (pass.length < 6)   { showError("regPassword", "Password must be at least 6 characters."); valid = false; }
      if (pass !== conf)     { showError("regConfirm",  "Passwords do not match.");               valid = false; }
      if (!termsAccepted) {
        showSiteNotice({
          type: "error",
          icon: "bi-exclamation-triangle-fill",
          title: "Terms required",
          text: "Please accept the Terms of Service and Privacy Policy to create your account."
        });
        valid = false;
      }

      if (!valid) return;

      const btn = registerForm.querySelector(".btn-auth");
      btn.textContent = "Creating Account…";
      btn.disabled    = true;

      try {
        // Step 1: Register
        const res  = await fetch(`${API_BASE}/users/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, first_name: name, password: pass, role, phone: "", terms_accepted: termsAccepted })
        });
        const data = await res.json();

        if (!res.ok) {
          const duplicateUser = data.email || data.username;
          const firstError = Object.values(data)[0];
          const message = duplicateUser
            ? "User already exists."
            : Array.isArray(firstError) ? firstError[0] : firstError;
          showError("regEmail", message);
          btn.textContent = "Create Account";
          btn.disabled    = false;
          return;
        }

        // Step 2: Auto-login
        const loginRes  = await fetch(`${API_BASE}/users/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password: pass })
        });
        const loginData = await loginRes.json();

        const redirectUrl = role === "artist" ? (data.next_page || "/artist-onboarding/") : "/";

        if (loginRes.ok) {
          saveAuth(loginData);
          localStorage.setItem("userRole", role);
          localStorage.setItem("userName", name);
          redirectAfterLogin(redirectUrl, role);
        } else {
          // Registered but auto-login failed — send to login page or onboarding if provided
          window.location.href = data.next_page || "/login/";
        }

      } catch (err) {
        showError("regEmail", "Server error. Make sure Django is running.");
        btn.textContent = "Create Account";
        btn.disabled    = false;
      }
    });
  }
}


/* ================================================================
   11. ARTIST PROFILE & CHAT
================================================================ */
async function loadArtistDetail(id) {
  try {
    const response = await fetch(`${API_BASE}/artists/${id}/`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Error loading artist profile:", error);
    return null;
  }
}

function buildProfilePortfolioItem(item, artistStyle) {
  const image = item.image_url || item.image || DEFAULT_ARTIST_IMAGE;
  const title = item.title || "Portfolio Artwork";
  return `
    <figure class="portfolio-item reveal" role="listitem">
      <img src="${image}" alt="${escapeHTML(title)}" class="portfolio-img" loading="lazy" />
      <figcaption class="portfolio-caption">
        <span class="portfolio-title">${escapeHTML(title)}</span>
        <span class="portfolio-style">${cap(artistStyle)}</span>
      </figcaption>
    </figure>`;
}

async function initArtistProfilePage() {
  const params = getQueryParams();
  const artistId = parseInt(params.id, 10);
  const main = document.getElementById("profileMain");

  if (!artistId) {
    if (main) {
      main.innerHTML = `
        <section class="profile-section">
          <h2 class="profile-section-title">Artist Not Selected</h2>
          <p class="profile-bio">Please open a profile from the Artists or Gallery page.</p>
          <a href="/artist/" class="btn-book">Browse Artists</a>
        </section>`;
    }
    return;
  }

  const artist = await loadArtistDetail(artistId);
  if (!artist) {
    if (main) {
      main.innerHTML = `
        <section class="profile-section">
          <h2 class="profile-section-title">Artist Not Found</h2>
          <p class="profile-bio">This artist profile is unavailable or may have been removed.</p>
          <a href="/artist/" class="btn-book">Browse Artists</a>
        </section>`;
    }
    return;
  }

  const name = artist.user_name || "Artist";
  const location = cap(artist.location || "India");
  const style = cap(artist.style || "Artist");
  const rating = Number(artist.rating || 0).toFixed(1);
  const price = formatINR(artist.base_price || 0);
  const avatar = artist.avatar_url || artist.avatar || DEFAULT_ARTIST_IMAGE;
  const portfolio = artist.portfolio || [];
  const bio = artist.bio || "This artist has not added a bio yet.";

  document.title = `${name} - Artist Profile | Shristi`;

  const breadcrumbCurrent = document.querySelector(".profile-breadcrumb span:last-child");
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = name;

  const avatarEl = document.getElementById("profileHeroAvatar");
  if (avatarEl) {
    avatarEl.src = avatar;
    avatarEl.alt = `${name} profile photo`;
  }

  const nameEl = document.querySelector(".profile-name");
  if (nameEl) nameEl.textContent = name;

  const locationEl = document.querySelector(".profile-location");
  if (locationEl) {
    locationEl.innerHTML = `<i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ${location}`;
  }

  const ratingEl = document.querySelector(".profile-rating-num");
  if (ratingEl) ratingEl.textContent = rating;

  const ratingCount = document.querySelector(".profile-rating-count");
  if (ratingCount) ratingCount.textContent = `(${artist.total_bookings || 0} bookings)`;

  const stats = document.querySelectorAll(".pqs-value");
  if (stats[0]) stats[0].textContent = String(portfolio.length);
  if (stats[1]) stats[1].textContent = "New";
  if (stats[2]) stats[2].textContent = artist.is_available ? "Open" : "Closed";

  const statLabels = document.querySelectorAll(".pqs-label");
  if (statLabels[0]) statLabels[0].textContent = "Portfolio Works";
  if (statLabels[1]) statLabels[1].textContent = "Artist Status";
  if (statLabels[2]) statLabels[2].textContent = "Commissions";

  const aboutTitle = document.getElementById("about-heading");
  if (aboutTitle) aboutTitle.textContent = `Meet ${name}`;

  const aboutSection = document.querySelector('[aria-labelledby="about-heading"]');
  if (aboutSection) {
    aboutSection.querySelectorAll(".profile-bio").forEach((el, index) => {
      if (index === 0) el.textContent = bio;
      else el.remove();
    });
  }

  const mediumValue = document.querySelector(".profile-medium-value");
  if (mediumValue) mediumValue.textContent = style;

  const tags = document.querySelector(".profile-tags");
  if (tags) {
    tags.innerHTML = `<a href="/artist/?style=${encodeURIComponent(artist.style || "")}" class="profile-tag profile-tag--highlight" role="listitem">${style}</a>`;
  }

  const portfolioGrid = document.querySelector(".portfolio-grid");
  if (portfolioGrid) {
    portfolioGrid.innerHTML = portfolio.length
      ? portfolio.map(item => buildProfilePortfolioItem(item, artist.style)).join("")
      : `<p class="profile-bio">No portfolio images uploaded yet.</p>`;
  }

  const reviewsList = document.querySelector(".reviews-list");
  if (reviewsList) {
    reviewsList.innerHTML = `<p class="profile-bio">No reviews yet. Reviews will appear after completed bookings.</p>`;
  }

  const priceEl = document.querySelector(".pac-price");
  if (priceEl) priceEl.textContent = price;

  const availability = document.querySelector(".pac-availability span:last-child");
  if (availability) {
    availability.textContent = artist.is_available
      ? "Available for new commissions"
      : "Currently unavailable for new commissions";
  }

  const chatLink = document.querySelector(".pac-btn-chat");
  if (chatLink) {
    chatLink.href = `/chat/?artist=${encodeURIComponent(name)}&id=${artist.id}`;
    chatLink.setAttribute("aria-label", `Open chat with ${name}`);
  }

  const bookLink = document.querySelector(".pac-btn-book");
  if (bookLink) {
    bookLink.href = `/booking/?artist=${encodeURIComponent(name)}&id=${artist.id}`;
    bookLink.setAttribute("aria-label", `Book ${name} for a commission`);
  }

  initScrollReveal();
}

const chatState = {
  currentUser: null,
  otherUserId: null,
  otherName: "Artist",
  pollTimer: null,
  artistProfileId: null,
  paymentBooking: null
};

function setChatAvatar(src, altName) {
  const avatar = src || DEFAULT_ARTIST_IMAGE;
  const headerAvatar = document.getElementById("chatArtistAvatar");
  const typingAvatar = document.getElementById("chatTypingAvatar");
  if (headerAvatar) {
    headerAvatar.src = avatar;
    headerAvatar.alt = `${altName || "Artist"} profile photo`;
  }
  if (typingAvatar) {
    typingAvatar.src = avatar;
  }
}

function setChatStatus(text) {
  const status = document.getElementById("chatArtistStatus");
  if (!status) return;
  status.innerHTML = text
    ? `<span class="chat-status-dot" aria-hidden="true"></span>${escapeHTML(text)}`
    : "";
}

function setChatAvatarVisible(isVisible) {
  const avatarWrap = document.querySelector(".chat-avatar-wrap");
  const typingAvatar = document.getElementById("chatTypingAvatar");
  if (avatarWrap) avatarWrap.hidden = !isVisible;
  if (typingAvatar) typingAvatar.hidden = !isVisible;
}

function formatChatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatNoticeTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showSiteNotice({ type = "message", icon = "bi-bell-fill", title, text, actionHref, actionText = "Open", persistKey = "" }) {
  if (persistKey && sessionStorage.getItem(persistKey)) return;
  const existing = document.querySelector(`.site-notice[data-type="${type}"]`);
  if (existing) existing.remove();

  const notice = document.createElement("aside");
  notice.className = `site-notice site-notice-${type}`;
  notice.dataset.type = type;
  notice.setAttribute("role", "status");
  notice.innerHTML = `
    <div class="site-notice-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
    <div class="site-notice-copy">
      <strong>${escapeHTML(title)}</strong>
      <span>${escapeHTML(text)}</span>
    </div>
    ${actionHref ? `<a class="site-notice-action" href="${actionHref}">${escapeHTML(actionText)}</a>` : ""}
    <button type="button" class="site-notice-close" aria-label="Dismiss notification">&times;</button>
  `;
  notice.querySelector(".site-notice-close")?.addEventListener("click", () => {
    if (persistKey) sessionStorage.setItem(persistKey, "1");
    notice.remove();
  });
  document.body.appendChild(notice);
  if (!persistKey && type !== "payment") {
    window.setTimeout(() => notice.remove(), 6500);
  }
}

function showPendingSiteNotice() {
  const raw = sessionStorage.getItem("pendingSiteNotice");
  if (!raw) return;
  sessionStorage.removeItem("pendingSiteNotice");
  try {
    showSiteNotice(JSON.parse(raw));
  } catch (error) {
    console.warn("Could not show saved notification", error);
  }
}

function renderChatMessages(messages) {
  const wrap = document.getElementById("chatMessages");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="chat-date-divider" role="separator">
      <span>Today</span>
    </div>`;

  if (!messages.length) {
    wrap.insertAdjacentHTML("beforeend", `
      <div class="chat-empty-state">
        Start the conversation. Messages you send here will appear in the other account.
      </div>`);
    return;
  }

  messages.forEach((message) => {
    const isMine = chatState.currentUser && message.sender === chatState.currentUser.id;
    const hasAttachment = Boolean(message.attachment_url);
    const isImage = hasAttachment && String(message.attachment_content_type || "").startsWith("image/");
    const attachmentName = message.attachment_name || "Attachment";
    const attachmentMarkup = hasAttachment
      ? isImage
        ? `<a class="chat-attachment chat-attachment-image" href="${message.attachment_url}" target="_blank" rel="noopener">
             <img src="${message.attachment_url}" alt="${escapeHTML(attachmentName)}" loading="lazy" />
             <span>${escapeHTML(attachmentName)}</span>
           </a>`
        : `<a class="chat-attachment chat-attachment-file" href="${message.attachment_url}" target="_blank" rel="noopener">
             <i class="bi bi-file-earmark-arrow-down-fill" aria-hidden="true"></i>
             <span>${escapeHTML(attachmentName)}</span>
           </a>`
      : "";
    const row = document.createElement("div");
    row.className = `chat-message ${isMine ? "customer" : "artist"}`;
    row.innerHTML = `
      <div class="chat-bubble">
        ${message.text ? `<div>${escapeHTML(message.text)}</div>` : ""}
        ${attachmentMarkup}
        <time class="chat-message-time" datetime="${escapeHTML(message.timestamp)}">${formatChatTime(message.timestamp)}</time>
      </div>`;
    wrap.appendChild(row);
  });

  wrap.scrollTop = wrap.scrollHeight;
}

async function loadChatMessages() {
  if (!chatState.otherUserId) return;
  try {
    const response = await authFetch(`${API_BASE}/messages/${chatState.otherUserId}/`);
    if (response.status === 401) {
      window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    if (!response.ok) throw new Error("Message load failed");
    renderChatMessages(await response.json());
  } catch (error) {
    const wrap = document.getElementById("chatMessages");
    if (wrap) {
      wrap.innerHTML = '<div class="chat-empty-state">Could not load messages. Make sure Django is running.</div>';
    }
  }
}

async function sendChatMessage(file = null) {
  const input = document.getElementById("chatInput");
  const button = document.getElementById("chatSendBtn");
  const text = input?.value.trim();
  if ((!text && !file) || !chatState.otherUserId) return;

  button.disabled = true;
  try {
    const body = file ? new FormData() : JSON.stringify({ text });
    if (file) {
      body.append("text", text);
      body.append("attachment", file);
    }
    const response = await authFetch(`${API_BASE}/messages/${chatState.otherUserId}/`, {
      method: "POST",
      body
    });
    if (response.status === 401) {
      window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      showSiteNotice({
        type: "error",
        icon: "bi-exclamation-triangle-fill",
        title: "Message not sent",
        text: error.detail || "Please try sending it again."
      });
      return;
    }
    input.value = "";
    await loadChatMessages();
  } catch (error) {
    showSiteNotice({
      type: "error",
      icon: "bi-wifi-off",
      title: "Message not sent",
      text: "Please check your connection and try again."
    });
  } finally {
    button.disabled = false;
    input.focus();
  }
}

function triggerFileAttach() {
  document.getElementById("chatFileInput")?.click();
}

function buildChatHrefForThread(thread) {
  if (thread.role === "artist" && thread.artist_profile_id) {
    return `/chat/?artist=${encodeURIComponent(thread.name || "Artist")}&id=${thread.artist_profile_id}`;
  }
  return `/chat/?user=${thread.user_id}&name=${encodeURIComponent(thread.name || "Contact")}`;
}

async function renderChatInbox() {
  const nameEl = document.getElementById("chatArtistName");
  const statusEl = document.getElementById("chatArtistStatus");
  const wrap = document.getElementById("chatMessages");
  const inputArea = document.querySelector(".chat-input-area");
  const bookingLink = document.getElementById("chatBookingLink");
  const profileLink = document.getElementById("chatProfileLink");

  if (nameEl) nameEl.textContent = "Messages";
  if (statusEl) statusEl.innerHTML = '<span class="chat-status-dot" aria-hidden="true"></span>Your artist conversations';
  if (inputArea) inputArea.hidden = true;
  if (bookingLink) bookingLink.hidden = true;
  if (profileLink) profileLink.hidden = true;
  setChatAvatarVisible(false);

  if (!wrap) return;
  wrap.classList.add("chat-inbox-view");
  wrap.innerHTML = '<div class="chat-empty-state">Loading your conversations...</div>';

  try {
    const response = await authFetch(`${API_BASE}/messages/`);
    if (response.status === 401) {
      redirectToLogin();
      return;
    }
    if (!response.ok) throw new Error("Inbox load failed");
    const threads = await response.json();

    if (!threads.length) {
      wrap.innerHTML = `
        <div class="chat-empty-state">
          No artist messages yet. Start a conversation from any artist profile.
        </div>`;
      return;
    }

    wrap.innerHTML = `
      <section class="client-inbox" aria-label="Message conversations">
        ${threads.map(thread => {
          const unread = Number(thread.unread_count || 0);
          const avatar = thread.avatar_url || DEFAULT_ARTIST_IMAGE;
          const when = formatNoticeTime(thread.timestamp);
          return `
            <a class="client-thread ${unread ? "unread" : ""}" href="${buildChatHrefForThread(thread)}">
              <img src="${avatar}" alt="" class="client-thread-avatar" loading="lazy" />
              <span class="client-thread-copy">
                <strong>${escapeHTML(thread.name || "Artist")}</strong>
                <small>${escapeHTML(thread.last_message || "Open conversation")}</small>
              </span>
              <span class="client-thread-meta">
                ${when ? `<time>${escapeHTML(when)}</time>` : ""}
                ${unread ? `<b>${unread}</b>` : ""}
              </span>
            </a>`;
        }).join("")}
      </section>`;
  } catch (error) {
    wrap.innerHTML = '<div class="chat-empty-state">Could not load messages right now. Please try again shortly.</div>';
  }
}

async function initCustomerMessageNotice() {
  if (!getToken()) return;

  const page = getCurrentPage();
  if (["login", "chat", "artist-dashboard", "artist-onboarding"].includes(page)) return;

  try {
    const meResponse = await authFetch(`${API_BASE}/users/me/`);
    if (!meResponse.ok) return;

    const me = await meResponse.json();
    if (me.role !== "client") return;

    const inboxResponse = await authFetch(`${API_BASE}/messages/`);
    if (!inboxResponse.ok) return;

    const threads = await inboxResponse.json();
    const unreadThreads = threads.filter(thread => Number(thread.unread_count || 0) > 0);
    if (!unreadThreads.length) return;
    if (document.querySelector(".customer-message-notice")) return;

    const latest = unreadThreads[0];
    const totalUnread = unreadThreads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);
    showSiteNotice({
      type: "message",
      icon: "bi-chat-dots-fill",
      title: `${totalUnread} new artist message${totalUnread === 1 ? "" : "s"}`,
      text: `${latest.name || "An artist"} replied to your conversation.`,
      actionHref: buildChatHrefForThread(latest),
      actionText: "View"
    });
  } catch (error) {
    console.warn("Unable to load customer message notice", error);
  }
}

async function uploadAdvanceScreenshot(bookingId, file, button) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showSiteNotice({
      type: "error",
      icon: "bi-image",
      title: "Screenshot needed",
      text: "Please choose an image file for the payment proof."
    });
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showSiteNotice({
      type: "error",
      icon: "bi-file-earmark-x",
      title: "File is too large",
      text: "Please choose a screenshot under 10 MB."
    });
    return;
  }

  const formData = new FormData();
  formData.append("payment_screenshot", file);
  const originalText = button?.textContent || "Upload";
  if (button) {
    button.textContent = "Uploading...";
    button.disabled = true;
  }

  try {
    const response = await authFetch(`${API_BASE}/bookings/${bookingId}/payment/`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      showSiteNotice({
        type: "error",
        icon: "bi-exclamation-triangle-fill",
        title: "Upload failed",
        text: error.error || error.detail || "Please try again."
      });
      return;
    }
    showSiteNotice({
      type: "success",
      icon: "bi-check-circle-fill",
      title: "Payment proof submitted",
      text: "The artist will verify it and update your commission soon."
    });
    document.querySelector(".customer-payment-notice")?.remove();
    await renderChatPaymentPanel();
    await loadChatMessages();
  } catch (error) {
    showSiteNotice({
      type: "error",
      icon: "bi-exclamation-triangle-fill",
      title: "Upload failed",
      text: "We could not submit the screenshot. Please try again."
    });
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function renderChatPaymentPanel() {
  const panel = document.getElementById("chatPaymentPanel");
  if (!panel) return;

  panel.hidden = true;
  panel.innerHTML = "";
  chatState.paymentBooking = null;

  if (!chatState.currentUser || chatState.currentUser.role !== "client" || !chatState.otherUserId) return;

  try {
    const response = await authFetch(`${API_BASE}/bookings/mine/`);
    if (!response.ok) return;
    const bookings = await response.json();
    const pending = bookings.find((booking) => {
      const artistProfileMatches = chatState.artistProfileId && Number(booking.artist) === Number(chatState.artistProfileId);
      return booking.status === "accepted"
        && booking.payment_status === "pending_upload"
        && artistProfileMatches;
    });

    if (!pending) return;
    chatState.paymentBooking = pending;
    panel.hidden = false;
    panel.innerHTML = `
      <div class="chat-payment-copy">
        <strong>Advance payment requested</strong>
        <span>${escapeHTML(pending.artist_name || "Artist")} accepted your booking. Upload the payment screenshot so the artist can start work.</span>
        <b>${formatINR(pending.advance_amount || 0)}</b>
      </div>
      <label class="chat-payment-file">
        <i class="bi bi-image" aria-hidden="true"></i>
        <span>Choose screenshot</span>
        <input type="file" accept="image/*" aria-label="Choose advance payment screenshot" />
      </label>
      <button type="button" class="chat-payment-submit">Submit proof</button>
    `;

    const fileInput = panel.querySelector('input[type="file"]');
    const fileText = panel.querySelector(".chat-payment-file span");
    const submit = panel.querySelector(".chat-payment-submit");
    fileInput?.addEventListener("change", () => {
      if (fileText) fileText.textContent = fileInput.files?.[0]?.name || "Choose screenshot";
    });
    submit?.addEventListener("click", () => uploadAdvanceScreenshot(pending.id, fileInput?.files?.[0], submit));
  } catch (error) {
    console.warn("Unable to load chat payment request", error);
  }
}

async function initCustomerBookingNotice() {
  if (!getToken()) return;
  const page = getCurrentPage();
  if (["login", "chat", "artist-dashboard", "artist-onboarding"].includes(page)) return;

  try {
    const meResponse = await authFetch(`${API_BASE}/users/me/`);
    if (!meResponse.ok) return;
    const me = await meResponse.json();
    if (me.role !== "client") return;

    const response = await authFetch(`${API_BASE}/bookings/mine/`);
    if (!response.ok) return;
    const bookings = await response.json();
    const booking = bookings.find(item => item.status === "accepted" && item.payment_status === "pending_upload");
    if (!booking || document.querySelector(".customer-payment-notice")) return;
    if (sessionStorage.getItem(`dismissed_payment_${booking.id}`)) return;

    const notice = document.createElement("aside");
    notice.className = "site-notice site-notice-payment customer-payment-notice";
    notice.setAttribute("role", "status");
    notice.innerHTML = `
      <div class="site-notice-icon"><i class="bi bi-receipt-cutoff" aria-hidden="true"></i></div>
      <div class="site-notice-copy">
        <strong>Advance payment requested</strong>
        <span>${escapeHTML(booking.artist_name || "Artist")} accepted your commission. Advance due: ${formatINR(booking.advance_amount || 0)}.</span>
        <label class="cpn-file-label">
          <i class="bi bi-image" aria-hidden="true"></i>
          <span>Choose payment screenshot</span>
          <input type="file" accept="image/*" class="cpn-file" aria-label="Upload payment screenshot" />
        </label>
      </div>
      <button type="button" class="site-notice-action cpn-upload">Submit</button>
      <button type="button" class="site-notice-close cpn-close" aria-label="Dismiss payment notice">&times;</button>
    `;
    const fileInput = notice.querySelector(".cpn-file");
    const uploadBtn = notice.querySelector(".cpn-upload");
    fileInput?.addEventListener("change", () => {
      const labelText = notice.querySelector(".cpn-file-label span");
      if (labelText) labelText.textContent = fileInput.files?.[0]?.name || "Choose payment screenshot";
    });
    uploadBtn?.addEventListener("click", () => uploadAdvanceScreenshot(booking.id, fileInput?.files?.[0], uploadBtn));
    notice.querySelector(".cpn-close")?.addEventListener("click", () => {
      sessionStorage.setItem(`dismissed_payment_${booking.id}`, "1");
      notice.remove();
    });
    document.body.appendChild(notice);
  } catch (error) {
    console.warn("Unable to load customer booking notice", error);
  }
}

async function initChatPage() {
  const params = getQueryParams();
  const artistId = params.id;
  const userId = params.user;
  const artistName = params.artist ? decodeURIComponent(params.artist) : "";
  const contactName = params.name ? decodeURIComponent(params.name) : "";

  const nameEl = document.getElementById("chatArtistName");
  if (nameEl && artistName) nameEl.textContent = artistName;
  if (nameEl && contactName) nameEl.textContent = contactName;

  const bookingLink = document.getElementById("chatBookingLink");
  if (bookingLink && artistId) {
    bookingLink.href = `/booking/?artist=${encodeURIComponent(artistName)}&id=${artistId}`;
  }

  const profileLink = document.getElementById("chatProfileLink");
  if (profileLink && artistId) {
    profileLink.href = `/artist-profile/?id=${artistId}`;
  }

  if (userId) {
    const backLink = document.querySelector(".chat-back-btn");
    if (backLink) backLink.href = "/artist-dashboard/";
    if (bookingLink) bookingLink.hidden = true;
    if (profileLink) profileLink.hidden = true;
    setChatAvatarVisible(false);
    setChatStatus("Customer conversation");
  }

  if (!getToken()) {
    window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return;
  }

  try {
    const meResponse = await authFetch(`${API_BASE}/users/me/`);
    if (!meResponse.ok) throw new Error("Not logged in");
    chatState.currentUser = await meResponse.json();
  } catch (error) {
    window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return;
  }

  if (!userId && !artistId) {
    await renderChatInbox();
    return;
  }

  if (userId) {
    chatState.otherUserId = parseInt(userId, 10);
    chatState.otherName = contactName || "Customer";
  } else if (artistId) {
    chatState.artistProfileId = parseInt(artistId, 10);
    const artist = await loadArtistDetail(artistId);
    if (artist) {
      chatState.otherUserId = artist.user_id || artist.user;
      chatState.otherName = artist.user_name || artistName || "Artist";
      if (nameEl) nameEl.textContent = chatState.otherName;
      setChatAvatarVisible(true);
      setChatAvatar(artist.avatar_url || artist.avatar, chatState.otherName);
      setChatStatus(`${cap(artist.style || "artist")} Artist`);
    }
  }

  if (!chatState.otherUserId || chatState.otherUserId === chatState.currentUser.id) {
    const wrap = document.getElementById("chatMessages");
    if (wrap) wrap.innerHTML = '<div class="chat-empty-state">Open a customer or artist conversation to start messaging.</div>';
    return;
  }

  const input = document.getElementById("chatInput");
  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
      }
    });
  }

  const fileInput = document.getElementById("chatFileInput");
  if (fileInput) {
    fileInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        showSiteNotice({
          type: "error",
          icon: "bi-file-earmark-x",
          title: "File is too large",
          text: "Please choose a file under 10 MB."
        });
        fileInput.value = "";
        return;
      }
      await sendChatMessage(file);
      fileInput.value = "";
    });
  }

  await renderChatPaymentPanel();
  await loadChatMessages();
  window.clearInterval(chatState.pollTimer);
  chatState.pollTimer = window.setInterval(loadChatMessages, 5000);
}


/* ================================================================
   12. SMOOTH SCROLLING
================================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href$="#howItWorks"]').forEach(link => {
    link.addEventListener("click", function (e) {
      const currentPage = window.location.pathname.split("/").filter(Boolean).pop() || "index";
      if (currentPage === "index" || currentPage === "index.html" || currentPage === "") {
        e.preventDefault();
        const target = document.getElementById("howItWorks");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href").substring(1);
      const el = document.getElementById(targetId);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth" }); }
    });
  });
}


/* ================================================================
   13. ENTRY POINT — single DOMContentLoaded
================================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  await initAuthNav();
  showPendingSiteNotice();
  initScrollReveal();
  initSmoothScroll();

  const page = window.location.pathname.split("/").filter(Boolean).pop() || "index";
  console.log("Page:", page);
  const canAccessPage = await enforcePageAccess(page);
  if (!canAccessPage) return;

  initCustomerMessageNotice();
  initCustomerBookingNotice();
  window.setInterval(() => {
    initCustomerMessageNotice();
    initCustomerBookingNotice();
  }, 8000);

  if (page === "index" || page === "index.html" || page === "") {
    await initHomePage();
  }
  if (page === "artist" || page === "artist.html") {
    await initArtistsPage();
  }
  if (page === "gallery" || page === "gallery.html") {
    await initGalleryPage();
  }
  if (page === "booking" || page === "booking.html") {
    await initBookingPage();
    initBookingForm();
  }
  if (page === "login" || page === "login.html") {
    initLoginPage();
  }
  if (page === "artist-profile" || page === "artist-profile.html") {
    await initArtistProfilePage();
  }
  if (page === "chat" || page === "chat.html") {
    initChatPage();
  }
});


