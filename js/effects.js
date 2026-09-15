/**
 * effects.js
 * -----------------------------------------------------------------------
 * Lapisan visual TAMBAHAN untuk upgrade tampilan (particles, custom cursor,
 * tilt 3D ringan, navbar blur saat scroll, garis timeline, modal creative
 * reel). File ini SENGAJA dipisah dari js/script.js supaya logika lama
 * (navbar mobile, active link, scroll reveal, form validasi) yang sudah
 * berjalan tidak ikut berubah/berisiko rusak.
 *
 * Semua efek di sini otomatis dimatikan/dikurangi pada:
 *  - prefers-reduced-motion: reduce
 *  - layar sempit / perangkat sentuh (mobile)
 * supaya performa tetap ringan dan animasi tidak merusak layout di HP.
 * -----------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
    const prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer =
        window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const isNarrow = window.innerWidth < 860;

    initNavbarBlur();
    initTimelineVisibility();
    initReelModal();

    if (!prefersReduced) {
        initHeroParticles(isNarrow);
        if (!isCoarsePointer && !isNarrow) {
            initCustomCursor();
            initTilt();
        }
    }
});

/* ---------------------------------------------------------------------
 * Navbar: transparan di atas, blur/glass setelah discroll
 * ------------------------------------------------------------------- */
function initNavbarBlur() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    const update = () => navbar.classList.toggle("is-scrolled", window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
}

/* ---------------------------------------------------------------------
 * Timeline: tambahkan is-visible saat section Education masuk viewport,
 * supaya garis timeline "tumbuh" dari atas ke bawah lewat CSS.
 * ------------------------------------------------------------------- */
function initTimelineVisibility() {
    const timeline = document.querySelector(".timeline");
    if (!timeline || !("IntersectionObserver" in window)) {
        if (timeline) timeline.classList.add("is-visible");
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    timeline.classList.add("is-visible");
                    observer.disconnect();
                }
            });
        },
        { threshold: 0.2 }
    );

    observer.observe(timeline);
}

/* ---------------------------------------------------------------------
 * Hero particles — canvas 2D ringan (bukan WebGL/Three.js) supaya tetap
 * cepat di device biasa. Jumlah partikel dikurangi otomatis di layar
 * sempit, dan animasi berhenti saat tab tidak aktif untuk hemat baterai.
 * ------------------------------------------------------------------- */
function initHeroParticles(isNarrow) {
    const canvas = document.querySelector("[data-hero-particles]");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width, height, dpr;
    let particles = [];
    let rafId = null;
    let running = true;

    const COUNT = isNarrow ? 18 : 42;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticles() {
        particles = Array.from({ length: COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 1.6 + 0.6,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.12,
            alpha: Math.random() * 0.5 + 0.15,
        }));
    }

    function draw() {
        if (!running) return;
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(244, 237, 228, ${p.alpha})`;
            ctx.fill();
        });
        rafId = requestAnimationFrame(draw);
    }

    resize();
    makeParticles();
    draw();

    window.addEventListener(
        "resize",
        () => {
            resize();
            makeParticles();
        },
        { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
        running = !document.hidden;
        if (running) {
            draw();
        } else if (rafId) {
            cancelAnimationFrame(rafId);
        }
    });
}

/* ---------------------------------------------------------------------
 * Custom cursor — hanya aktif di desktop dengan pointer halus (mouse).
 * Berubah label "VIEW" saat hover di project card, dan membesar saat
 * hover tombol/link.
 * ------------------------------------------------------------------- */
function initCustomCursor() {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";

    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-custom-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener(
        "mousemove",
        (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        },
        { passive: true }
    );

    function animateRing() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll("a, button, .project-card").forEach((el) => {
        el.addEventListener("mouseenter", () => {
            ring.classList.add("is-hover");
            ring.textContent = el.classList.contains("project-card") ? "VIEW" : "";
        });
        el.addEventListener("mouseleave", () => {
            ring.classList.remove("is-hover");
            ring.textContent = "";
        });
    });

    // Project card baru dari js/projects.js dimuat belakangan — daftarkan
    // ulang listener hover untuk card yang baru masuk ke DOM.
    const grid = document.querySelector("[data-projects-grid]");
    if (grid && "MutationObserver" in window) {
        const mo = new MutationObserver(() => {
            grid.querySelectorAll(".project-card").forEach((el) => {
                if (el.dataset.cursorBound) return;
                el.dataset.cursorBound = "true";
                el.addEventListener("mouseenter", () => {
                    ring.classList.add("is-hover");
                    ring.textContent = "VIEW";
                });
                el.addEventListener("mouseleave", () => {
                    ring.classList.remove("is-hover");
                    ring.textContent = "";
                });
            });
        });
        mo.observe(grid, { childList: true });
    }
}

/* ---------------------------------------------------------------------
 * Tilt 3D ringan untuk foto hero (mengikuti posisi mouse relatif ke foto)
 * ------------------------------------------------------------------- */
function initTilt() {
    const el = document.querySelector("[data-tilt]");
    if (!el) return;

    el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });

    el.addEventListener("mouseleave", () => {
        el.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
}

/* ---------------------------------------------------------------------
 * Modal "Creative Reel" — hanya placeholder sampai video asli tersedia.
 * Lihat komentar <!-- TAMBAHKAN VIDEO SHOWREEL DI SINI --> di index.html.
 * ------------------------------------------------------------------- */
function initReelModal() {
    const openBtn = document.querySelector("[data-reel-open]");
    const modal = document.querySelector("[data-reel-modal]");
    const closeBtn = document.querySelector("[data-reel-close]");

    if (!openBtn || !modal || !closeBtn) return;

    openBtn.addEventListener("click", () => modal.classList.add("is-open"));
    closeBtn.addEventListener("click", () => modal.classList.remove("is-open"));
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("is-open");
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") modal.classList.remove("is-open");
    });
}