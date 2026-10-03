// Shared client utility for Lost & Found Application

// ---------------- Theme Management (Dark / Light Mode) ----------------

function initTheme() {
    const savedTheme = localStorage.getItem('lf_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggleIcon(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lf_theme', newTheme);
    updateThemeToggleIcon(newTheme);
    
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
}

function updateThemeToggleIcon(theme) {
    const desktopBtn = document.getElementById('themeToggleBtn');
    const mobileBtn = document.getElementById('mobileThemeToggleBtn');
    const icon = theme === 'dark' ? '☀️' : '🌙';
    const title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;

    if (desktopBtn) {
        desktopBtn.innerHTML = icon;
        desktopBtn.setAttribute('title', title);
    }
    if (mobileBtn) {
        mobileBtn.innerHTML = icon;
        mobileBtn.setAttribute('title', title);
    }
}

function injectThemeButton() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks || document.getElementById('themeToggleBtn')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'themeToggleBtn';
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.type = 'button';
    toggleBtn.onclick = toggleTheme;

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    toggleBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
    toggleBtn.setAttribute('title', `Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`);

    navLinks.appendChild(toggleBtn);
}

// ---------------- Interactive Card Spotlight Effect ----------------
// High-end cursor tracking spotlight found on Linear, Stripe, and Raycast

function initSpotlightTracker() {
    // Only track spotlight on devices with fine pointer (mouse/trackpad), not mobile touchscreens
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.item-card, .stat-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// ---------------- Live Activity Marquee Ticker ----------------

async function initLiveActivityTicker() {
    const nav = document.querySelector('nav');
    if (!nav || document.querySelector('.live-ticker-wrap')) return;

    const tickerWrap = document.createElement('div');
    tickerWrap.className = 'live-ticker-wrap';

    try {
        const res = await fetch('/api/items');
        const items = await res.json();
        
        let tickerEvents = [];
        if (items && items.length > 0) {
            tickerEvents = items.map(item => {
                const action = item.status === 'resolved' 
                    ? 'Reunited with owner' 
                    : (item.type === 'lost' ? 'Reported missing' : 'Discovered & reported');
                return `<div class="ticker-item"><span class="dot">•</span> <strong>${escapeHtml(item.title)}</strong> ${action} at ${escapeHtml(item.location)}</div>`;
            });
        } else {
            tickerEvents = [
                '<div class="ticker-item"><span class="dot">•</span> Community lost & found directory active</div>',
                '<div class="ticker-item"><span class="dot">•</span> Connect directly with finders in your area</div>'
            ];
        }

        // Duplicate items for continuous smooth infinite scrolling
        const trackHtml = tickerEvents.join('') + tickerEvents.join('');

        tickerWrap.innerHTML = `
            <div class="ticker-label-box">
                <div class="ticker-label"><span class="ticker-pulse"></span> Live Activity</div>
            </div>
            <div class="ticker-viewport">
                <div class="ticker-track">
                    ${trackHtml}
                </div>
            </div>
        `;

        nav.insertAdjacentElement('afterend', tickerWrap);
    } catch (err) {
        console.warn("Could not load ticker events:", err);
    }
}

// ---------------- Toast Notification Helper ----------------

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

// ---------------- Smooth Animated Number Counter ----------------

function animateNumber(element, start, end, duration = 900) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = Math.floor(easeProgress * (end - start) + start);
        element.textContent = currentVal;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}

// ---------------- Navigation Auth State Check ----------------

async function checkAuthNav() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        const existingAuth = document.querySelector('.nav-auth-user');
        const loginLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase() === 'login');
        const mobileLoginLink = document.getElementById('mobileNavLoginLink');
        const mobileAuthSlot = document.getElementById('mobileAuthSlot');

        if (data.authenticated) {
            if (loginLink) loginLink.style.display = 'none';
            if (mobileLoginLink) mobileLoginLink.style.display = 'none';

            const initial = (data.name || data.email)[0].toUpperCase();
            const displayName = data.name || data.email.split('@')[0];

            if (!existingAuth) {
                const authDiv = document.createElement('div');
                authDiv.className = 'nav-auth-user';
                authDiv.innerHTML = `
                    <div class="user-badge">
                        <div class="user-avatar-sm">${initial}</div>
                        <span>${displayName}</span>
                    </div>
                    <button class="btn-nav-logout" onclick="logoutUser()">Logout</button>
                `;
                
                const themeBtn = document.getElementById('themeToggleBtn');
                if (themeBtn) {
                    navLinks.insertBefore(authDiv, themeBtn);
                } else {
                    navLinks.appendChild(authDiv);
                }
            }

            if (mobileAuthSlot) {
                mobileAuthSlot.innerHTML = `
                    <div class="mobile-nav-user-box">
                        <div class="user-badge" style="border: none; padding: 0; background: none; box-shadow: none;">
                            <div class="user-avatar-sm">${initial}</div>
                            <span>${displayName}</span>
                        </div>
                        <button class="btn-nav-logout" onclick="logoutUser()">Logout</button>
                    </div>
                `;
            }
        } else {
            if (existingAuth) existingAuth.remove();
            if (loginLink) loginLink.style.display = 'inline-block';
            if (mobileLoginLink) mobileLoginLink.style.display = 'flex';
            if (mobileAuthSlot) mobileAuthSlot.innerHTML = '';
        }
    } catch (err) {
        console.warn("Auth check failed:", err);
    }
}

async function logoutUser() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        showToast("Logged out successfully");
        setTimeout(() => {
            window.location.reload();
        }, 600);
    } catch (err) {
        showToast("Error logging out", "error");
    }
}

// ---------------- Crisp Category SVGs ----------------

function getCategorySVG(cat) {
    const map = {
        'Electronics': `<svg class="item-card-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
        'Documents': `<svg class="item-card-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        'Accessories': `<svg class="item-card-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
        'Books': `<svg class="item-card-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
        'Other': `<svg class="item-card-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`
    };
    return map[cat] || map['Other'];
}

// ---------------- Modal Logic ----------------

function openItemModal(item) {
    let overlay = document.getElementById('item-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'item-modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-btn" onclick="closeItemModal()" title="Close">✕</button>
                <div id="modal-item-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeItemModal();
        });
    }

    const typeBadge = item.type === 'lost' 
        ? '<span class="status-badge lost">Lost Item</span>' 
        : '<span class="status-badge found">Found Item</span>';
    
    const resolvedBadge = item.status === 'resolved'
        ? '<span class="status-badge resolved" style="margin-left: 8px;">Reunited / Closed</span>'
        : '';

    const imageHtml = item.image_url 
        ? `<div style="margin-bottom: 20px; border-radius: 12px; overflow: hidden; max-height: 280px; background: var(--pills-bg); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
             <img src="${item.image_url}" alt="${item.title}" style="max-width: 100%; max-height: 280px; object-fit: contain;">
           </div>`
        : `<div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; height: 110px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
             ${getCategorySVG(item.category)}
           </div>`;

    const resolveBtn = item.status === 'open' 
        ? `<button onclick="markItemResolved(${item.id})" class="button" style="background: #059669; color: white; padding: 10px 18px; font-size: 13.5px;">Mark as Claimed / Reunited</button>`
        : `<button onclick="markItemReopened(${item.id})" class="button" style="background: var(--pills-bg); color: var(--text-primary); border: 1px solid var(--border-color); padding: 10px 18px; font-size: 13.5px;">Reopen Item</button>`;

    const body = document.getElementById('modal-item-body');
    body.innerHTML = `
        ${imageHtml}
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            ${typeBadge}
            ${resolvedBadge}
            <span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
                ${item.category}
            </span>
        </div>
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; letter-spacing: -0.4px;">${escapeHtml(item.title)}</h2>
        <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 13.5px; display: flex; flex-direction: column; gap: 8px;">
            <div><strong>Location:</strong> ${escapeHtml(item.location)}</div>
            <div><strong>Date Reported:</strong> ${escapeHtml(item.item_date)}</div>
            <div><strong>Contact:</strong> <a href="mailto:${escapeHtml(item.contact)}" style="color: var(--primary); font-weight: 600;">${escapeHtml(item.contact)}</a></div>
        </div>
        <div style="margin-bottom: 22px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Description:</h4>
            <p style="color: var(--text-secondary); font-size: 14.5px; line-height: 1.6; white-space: pre-line;">${escapeHtml(item.description || "No additional description provided.")}</p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; border-top: 1px solid var(--border-color); padding-top: 18px;">
            ${resolveBtn}
            <button onclick="closeItemModal()" class="button" style="background: var(--input-bg); color: var(--text-secondary); border: 1px solid var(--border-color); padding: 10px 18px; font-size: 13.5px;">Close</button>
        </div>
    `;

    overlay.classList.add('active');
}

function closeItemModal() {
    const overlay = document.getElementById('item-modal-overlay');
    if (overlay) overlay.classList.remove('active');
}

async function markItemResolved(id) {
    try {
        const res = await fetch(`/api/items/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved' })
        });
        if (res.ok) {
            showToast("Item marked as reunited/resolved!");
            closeItemModal();
            if (typeof loadItems === 'function') loadItems();
            if (typeof loadStats === 'function') loadStats();
        } else {
            showToast("Failed to update status", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    }
}

async function markItemReopened(id) {
    try {
        const res = await fetch(`/api/items/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'open' })
        });
        if (res.ok) {
            showToast("Item reopened successfully!");
            closeItemModal();
            if (typeof loadItems === 'function') loadItems();
            if (typeof loadStats === 'function') loadStats();
        } else {
            showToast("Failed to update status", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ---------------- Dropzone Enhancement ----------------

function setupDropZone(dropZoneId, fileInputId) {
    const zone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    if (!zone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dragover');
        });
    });

    zone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            fileInput.files = files;
            if (typeof previewImage === 'function') {
                previewImage(fileInput);
            }
        }
    });
}

// ---------------- Ambient Chromatic Aurora (Illuminates Glass Elements) ----------------

function injectAmbientAurora() {
    if (document.querySelector('.ambient-aurora-bg')) return;
    const aurora = document.createElement('div');
    aurora.className = 'ambient-aurora-bg';
    aurora.innerHTML = `
        <div class="aurora-blob aurora-blob-1"></div>
        <div class="aurora-blob aurora-blob-2"></div>
        <div class="aurora-blob aurora-blob-3"></div>
    `;
    document.body.prepend(aurora);
}

// ---------------- Live Sparkling Starfield Animation ----------------

function initLiveSparkles() {
    let canvas = document.getElementById('sparkle-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'sparkle-canvas';
        document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    let mouseX = -1000;
    let mouseY = -1000;
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const sparkleCount = window.innerWidth < 768 ? 24 : Math.floor(Math.min(width, 1600) / 18);
    const sparkles = [];

    const darkColors = ['#fde047', '#38bdf8', '#c084fc', '#4ade80', '#ffffff'];
    const lightColors = ['#6366f1', '#a855f7', '#0284c7', '#d97706', '#4f46e5'];

    class Sparkle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : height + 10;
            this.size = Math.random() * 2.2 + 0.8;
            this.isStar = Math.random() > 0.65; // 35% are 4-point cross sparkles
            this.speedY = -(Math.random() * 0.45 + 0.15);
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.twinkleSpeed = Math.random() * 0.04 + 0.015;
            this.phase = Math.random() * Math.PI * 2;
            this.maxOpacity = Math.random() * 0.7 + 0.3;
            this.colorIdx = Math.floor(Math.random() * darkColors.length);
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.phase += this.twinkleSpeed;

            // Interactive proximity glow
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                this.x += (dx / dist) * 1.5;
                this.y += (dy / dist) * 1.5;
            }

            if (this.y < -20 || this.x < -20 || this.x > width + 20) {
                this.reset(false);
            }
        }

        draw(isDark) {
            const rawTwinkle = Math.sin(this.phase);
            const opacity = Math.max(0.05, Math.abs(rawTwinkle) * this.maxOpacity);
            const color = isDark ? darkColors[this.colorIdx] : lightColors[this.colorIdx];

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.shadowBlur = isDark ? 10 : 6;
            ctx.shadowColor = color;

            if (this.isStar && opacity > 0.4) {
                // Draw 4-point diamond star sparkle
                const s = this.size * 2.2;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - s);
                ctx.quadraticCurveTo(this.x, this.y, this.x + s, this.y);
                ctx.quadraticCurveTo(this.x, this.y, this.x, this.y + s);
                ctx.quadraticCurveTo(this.x, this.y, this.x - s, this.y);
                ctx.quadraticCurveTo(this.x, this.y, this.x, this.y - s);
                ctx.closePath();
                ctx.fill();
            } else {
                // Draw glowing circular sparkle
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    for (let i = 0; i < sparkleCount; i++) {
        sparkles.push(new Sparkle());
    }

    function render() {
        ctx.clearRect(0, 0, width, height);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        sparkles.forEach(s => {
            s.update();
            s.draw(isDark);
        });

        requestAnimationFrame(render);
    }

    render();
}

// ---------------- Scroll-Reveal Observer ----------------
// Uses IntersectionObserver to trigger entrance animations as elements scroll into view

function initScrollReveal() {
    const revealClasses = ['.reveal-on-scroll', '.reveal-left', '.reveal-right', '.reveal-scale'];
    const allRevealEls = document.querySelectorAll(revealClasses.join(','));

    if (allRevealEls.length === 0) {
        // Auto-tag elements that should animate on scroll if no manual classes found
        autoTagRevealElements();
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll(revealClasses.join(',')).forEach(el => {
        observer.observe(el);
    });
}

function autoTagRevealElements() {
    // Auto-tag section headers
    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('reveal-on-scroll');
    });

    // Auto-tag step cards with stagger
    document.querySelectorAll('.steps-grid').forEach(grid => {
        grid.classList.add('reveal-stagger');
        grid.querySelectorAll('.step-card').forEach(card => {
            card.classList.add('reveal-on-scroll');
        });
    });

    // Auto-tag stat cards
    document.querySelectorAll('.stats-container').forEach(container => {
        container.classList.add('reveal-stagger');
        container.querySelectorAll('.stat-card').forEach(card => {
            card.classList.add('reveal-scale');
        });
    });

    // Auto-tag filter bars
    document.querySelectorAll('.filter-bar').forEach(el => {
        el.classList.add('reveal-on-scroll');
    });

    // Auto-tag form wrappers
    document.querySelectorAll('.form-wrapper').forEach(el => {
        el.classList.add('reveal-scale');
    });

    // Auto-tag the "How it works" section header from left, buttons from right
    const buttons = document.querySelector('.buttons');
    if (buttons) buttons.classList.add('reveal-on-scroll');
}

// ---------------- Magnetic 3D Tilt Effect ----------------
// Gives cards a subtle 3D rotation that follows the cursor

function initMagneticTilt() {
    // Only enable magnetic tilt on devices with mouse/fine pointer
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cards = document.querySelectorAll('.stat-card, .step-card, .floating-showcase-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8; // max 8deg
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ---------------- Click Ripple Effect on Buttons ----------------

function initClickRipple() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.button, .btn-card-details, .btn-submit-full, .pill-btn');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-wave';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

        btn.style.position = btn.style.position || 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);

        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

// ---------------- Cursor Glow Follower ----------------
// A soft ambient glow that follows the cursor across the page

function initCursorGlow() {
    if (window.innerWidth < 768) return; // Skip on mobile

    const glow = document.createElement('div');
    glow.className = 'cursor-glow-follower';
    document.body.appendChild(glow);

    let curX = -500, curY = -500;
    let glowX = -500, glowY = -500;

    document.addEventListener('mousemove', (e) => {
        curX = e.clientX;
        curY = e.clientY;
    });

    function updateGlow() {
        // Smooth lerp follow
        glowX += (curX - glowX) * 0.08;
        glowY += (curY - glowY) * 0.08;
        glow.style.transform = `translate(${glowX - 160}px, ${glowY - 160}px)`;
        requestAnimationFrame(updateGlow);
    }
    updateGlow();
}

// ---------------- Orbit Rings Injection (Hero Section) ----------------

function injectOrbitRings() {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.orbit-ring-container')) return;

    const container = document.createElement('div');
    container.className = 'orbit-ring-container';
    container.innerHTML = `
        <div class="orbit-ring"><div class="orbit-dot"></div></div>
        <div class="orbit-ring"><div class="orbit-dot"></div></div>
        <div class="orbit-ring"><div class="orbit-dot"></div></div>
    `;
    hero.appendChild(container);
}

// ---------------- Floating Particles Injection ----------------

function injectFloatingParticles() {
    // Add to "How It Works" section and items section
    const sections = document.querySelectorAll('.section, .hero');
    sections.forEach(section => {
        if (section.querySelector('.live-particles-layer')) return;
        if (section.style.position !== 'relative') {
            section.style.position = 'relative';
        }

        const layer = document.createElement('div');
        layer.className = 'live-particles-layer';
        let particlesHtml = '';
        for (let i = 0; i < 8; i++) {
            particlesHtml += `<div class="live-particle"></div>`;
        }
        layer.innerHTML = particlesHtml;
        section.prepend(layer);
    });
}

// ---------------- Parallax Scroll Depth ----------------

function initParallaxScroll() {
    const aurora = document.querySelector('.ambient-aurora-bg');
    const orbitContainer = document.querySelector('.orbit-ring-container');

    if (!aurora && !orbitContainer) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Aurora moves at 30% of scroll speed (slow parallax)
                if (aurora) {
                    aurora.style.transform = `translateY(${scrollY * 0.3}px)`;
                }

                // Orbit rings move at 15% for deeper parallax
                if (orbitContainer) {
                    orbitContainer.style.transform = `translate(-50%, -50%) translateY(${scrollY * 0.15}px)`;
                }

                ticking = false;
            });
            ticking = true;
        }
    });
}

// ---------------- Page Transition Effect ----------------

function initPageTransition() {
    document.body.classList.add('page-transition-in');

    // Apple iOS Safari & Android BFCache fix: restore page when navigating back/forward
    window.addEventListener('pageshow', (event) => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'none';
        document.body.classList.add('page-transition-in');
    });

    // Smooth link transitions
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        // Only handle internal navigation, not anchors or external links
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

        // Skip if modifier key or opening new tab
        if (e.metaKey || e.ctrlKey || e.shiftKey || link.target === '_blank') return;

        e.preventDefault();
        document.body.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        document.body.style.opacity = '0';
        document.body.style.transform = 'translateY(-6px)';

        setTimeout(() => {
            window.location.href = href;
        }, 180);
    });
}

// ---------------- Hero Text Shimmer Activation ----------------

function initHeroTextShimmer() {
    const heroH1 = document.querySelector('.hero h1');
    if (!heroH1) return;

    // Apply shimmer to the "Lost something?" text (not the highlighted gradient part)
    const textNodes = heroH1.childNodes;
    const firstTextNode = textNodes[0];
    if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
        const shimmerSpan = document.createElement('span');
        shimmerSpan.className = 'text-shimmer';
        shimmerSpan.textContent = firstTextNode.textContent;
        heroH1.replaceChild(shimmerSpan, firstTextNode);
    }
}

// ---------------- Animated Logo Letters ----------------
// Splits "Lost&Found" into individual letter spans with staggered wave animation

function initLogoLetterAnimation() {
    const logoTexts = document.querySelectorAll('.logo-text');

    logoTexts.forEach(logo => {
        if (logo.querySelector('.logo-letter')) return; // Already animated

        const rawHtml = logo.innerHTML;
        // Parse: "Lost<span>&</span>Found"
        const parts = rawHtml.split(/(<span[^>]*>.*?<\/span>)/i);

        let letterIndex = 0;
        let newHtml = '';

        parts.forEach(part => {
            if (part.match(/^<span/i)) {
                // The & symbol — extract inner text
                const inner = part.replace(/<\/?span[^>]*>/gi, '');
                newHtml += `<span class="logo-letter logo-ampersand" style="animation-delay: ${letterIndex * 0.12}s">${inner}</span>`;
                letterIndex++;
            } else {
                // Regular text — split each character
                for (const char of part) {
                    if (char.trim() === '') {
                        newHtml += char;
                    } else {
                        newHtml += `<span class="logo-letter" style="animation-delay: ${letterIndex * 0.12}s">${char}</span>`;
                        letterIndex++;
                    }
                }
            }
        });

        logo.innerHTML = newHtml;
    });
}

// ---------------- Morphing Glow Border Activation ----------------

function initGlowBorders() {
    // Add glow borders to key glass elements
    document.querySelectorAll('.form-wrapper, .filter-bar').forEach(el => {
        el.classList.add('glow-border');
    });
}

// ---------------- Offline / Serverless Fallback Data ----------------

const LF_DEFAULT_ITEMS = [
    {
        id: 1,
        title: "Black Leather Wallet",
        category: "Accessories",
        type: "lost",
        location: "Library 2nd Floor Study Room",
        item_date: "2026-09-28",
        description: "Contains college student ID, driving license, and blue metro card. Reward offered for return.",
        contact: "abelgsubi123@gmail.com",
        status: "open"
    },
    {
        id: 2,
        title: "Apple AirPods Pro (2nd Gen)",
        category: "Electronics",
        type: "found",
        location: "Campus Cafeteria - Corner Booth",
        item_date: "2026-09-29",
        description: "Found on the table in a white charging case with a small sticker on back.",
        contact: "abelgsubi123@gmail.com",
        status: "open"
    },
    {
        id: 3,
        title: "Calculus & Linear Algebra Textbook",
        category: "Books",
        type: "lost",
        location: "Science Block Room 302",
        item_date: "2026-09-30",
        description: "Hardcover 11th edition. Has handwritten notes and yellow highlighter markings.",
        contact: "abelgsubi123@gmail.com",
        status: "open"
    },
    {
        id: 4,
        title: "Silver Keychain with 4 Keys",
        category: "Other",
        type: "found",
        location: "Gym Locker Area / Entrance",
        item_date: "2026-10-01",
        description: "Set of brass and silver keys attached to a blue car fob and mini carabiner.",
        contact: "abelgsubi123@gmail.com",
        status: "open"
    },
    {
        id: 5,
        title: "Blue Hydro Flask Water Bottle",
        category: "Accessories",
        type: "found",
        location: "Auditorium Row F",
        item_date: "2026-10-01",
        description: "32oz navy blue bottle with outdoors/national park stickers.",
        contact: "abelgsubi123@gmail.com",
        status: "resolved"
    }
];

function getLocalOrFallbackItems(filters = {}) {
    let all = [];
    try {
        const stored = localStorage.getItem('lf_custom_items');
        if (stored) {
            all = JSON.parse(stored);
        }
    } catch (e) {}
    all = [...all, ...LF_DEFAULT_ITEMS];

    if (filters.type && filters.type !== 'all') {
        all = all.filter(i => i.type === filters.type);
    }
    if (filters.category && filters.category !== 'all') {
        all = all.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.status && filters.status !== 'all') {
        all = all.filter(i => i.status === filters.status);
    }
    if (filters.search) {
        const q = filters.search.toLowerCase();
        all = all.filter(i => 
            (i.title && i.title.toLowerCase().includes(q)) ||
            (i.description && i.description.toLowerCase().includes(q)) ||
            (i.location && i.location.toLowerCase().includes(q))
        );
    }
    return all;
}

// ---------------- Responsive Mobile Navigation System ----------------

function initResponsiveNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // 1. Ensure Hamburger Button exists in Nav
    let hamburgerBtn = document.getElementById('navHamburgerBtn');
    if (!hamburgerBtn) {
        hamburgerBtn = document.createElement('button');
        hamburgerBtn.id = 'navHamburgerBtn';
        hamburgerBtn.className = 'nav-hamburger-btn';
        hamburgerBtn.type = 'button';
        hamburgerBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.innerHTML = `
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
        `;
        nav.appendChild(hamburgerBtn);
    }

    // 2. Ensure Backdrop exists
    let backdrop = document.getElementById('mobileNavBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'mobileNavBackdrop';
        backdrop.className = 'mobile-nav-backdrop';
        document.body.appendChild(backdrop);
    }

    // 3. Ensure Drawer exists
    let drawer = document.getElementById('mobileNavDrawer');
    if (!drawer) {
        drawer = document.createElement('aside');
        drawer.id = 'mobileNavDrawer';
        drawer.className = 'mobile-nav-drawer';
        drawer.setAttribute('aria-label', 'Mobile Navigation');

        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const isHome = currentPath === 'index.html' || currentPath === '';
        const isItems = currentPath === 'items.html';
        const isReport = currentPath === 'report.html';
        const isContact = currentPath === 'contact.html';
        const isLogin = currentPath === 'login.html';

        drawer.innerHTML = `
            <div class="mobile-nav-header">
                <a href="index.html" class="logo-container">
                    <div class="logo-icon-svg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <div class="logo-text">Lost<span>&</span>Found</div>
                </a>
                <button class="mobile-nav-close" id="mobileNavClose" type="button" aria-label="Close Navigation">✕</button>
            </div>

            <div class="mobile-nav-links">
                <a href="index.html" class="${isHome ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Home
                </a>
                <a href="items.html" class="${isItems ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Directory
                </a>
                <a href="report.html" class="${isReport ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
                    Report Item
                </a>
                <a href="contact.html" class="${isContact ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    Contact
                </a>
                <a href="login.html" class="${isLogin ? 'active' : ''}" id="mobileNavLoginLink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                    Login / Sign In
                </a>
            </div>

            <div class="mobile-nav-actions">
                <div class="mobile-theme-row">
                    <span>Appearance</span>
                    <button class="theme-toggle-btn" id="mobileThemeToggleBtn" type="button" onclick="toggleTheme()" aria-label="Toggle Theme">
                        🌙
                    </button>
                </div>
                <div id="mobileAuthSlot"></div>
                <a href="report.html" class="button browse-button" style="text-align: center; width: 100%; padding: 12px; font-size: 14.5px;">
                    + Report Lost / Found
                </a>
            </div>
        `;
        document.body.appendChild(drawer);
    }

    const closeBtn = document.getElementById('mobileNavClose');

    function openNav() {
        hamburgerBtn.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        backdrop.classList.add('active');
        drawer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        backdrop.classList.remove('active');
        drawer.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburgerBtn.onclick = () => {
        if (drawer.classList.contains('active')) {
            closeNav();
        } else {
            openNav();
        }
    };

    if (closeBtn) closeBtn.onclick = closeNav;
    backdrop.onclick = closeNav;

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('active')) {
            closeNav();
        }
    });

    // Close on screen resize to desktop (> 768px)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && drawer.classList.contains('active')) {
            closeNav();
        }
    });

    // Close when clicking any drawer link
    drawer.querySelectorAll('.mobile-nav-links a').forEach(a => {
        a.addEventListener('click', closeNav);
    });

    // Sync theme icon to mobile drawer toggle button
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeToggleIcon(currentTheme);
}

// ---------------- Initialize on DOM Ready ----------------

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    injectThemeButton();
    initResponsiveNav();
    injectAmbientAurora();
    initLiveSparkles();
    initSpotlightTracker();
    initLiveActivityTicker();
    checkAuthNav();
    setupDropZone('dropZone', 'imageInput');

    // Live animation systems
    initPageTransition();
    initScrollReveal();
    initMagneticTilt();
    initClickRipple();
    initCursorGlow();
    injectOrbitRings();
    injectFloatingParticles();
    initParallaxScroll();
    initHeroTextShimmer();
    initGlowBorders();
    initLogoLetterAnimation();
});


