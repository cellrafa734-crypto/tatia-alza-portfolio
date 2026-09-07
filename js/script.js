/**
 * script.js
 * -----------------------------------------------------------------------
 * Perilaku umum halaman index.html:
 *  - toggle hamburger menu di mobile
 *  - highlight link navbar sesuai section yang sedang aktif
 *  - reveal animasi ringan saat elemen masuk viewport
 *  - tombol back-to-top
 *  - validasi dasar form contact (belum kirim ke server manapun)
 * -----------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initActiveNavLink();
  initScrollReveal();
  initBackToTop();
  initContactForm();
});

/* ---------------------------------------------------------------------
 * Mobile hamburger menu
 * ------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileMenu = document.querySelector("[data-nav-mobile]");

  if (!toggle || !mobileMenu) return;

  toggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // tutup menu setiap kali sebuah link diklik
  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------------------------------------------------------------------
 * Highlight nav link aktif berdasarkan section yang terlihat
 * ------------------------------------------------------------------- */
function initActiveNavLink() {
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".navbar a[href^='#']");

  if (!sections.length || !navLinks.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isMatch);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------------------
 * Scroll reveal sederhana (fade + slide-up) via IntersectionObserver
 *
 * PENTING: fungsi ini dibuat "reusable" (bukan cuma jalan sekali di awal)
 * karena project card dari js/projects.js baru masuk ke halaman BELAKANGAN
 * (setelah data selesai diambil, baik dari Google Sheets maupun fallback
 * lokal) -- jauh setelah pengecekan ".reveal" pertama kali di bawah ini
 * selesai. Kalau elemen baru itu tidak ikut di-observe ulang, elemen itu
 * akan macet permanen di opacity:0 (invisible), walaupun sebenarnya sudah
 * ada di HTML. window.observeRevealElements() dipanggil lagi oleh
 * js/projects.js setiap kali card baru selesai dirender.
 * ------------------------------------------------------------------- */
let sharedRevealObserver = null;

function getSharedRevealObserver() {
  if (!sharedRevealObserver) {
    sharedRevealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
  }
  return sharedRevealObserver;
}

function observeRevealElements(root) {
  root = root || document;
  const revealEls = root.querySelectorAll(".reveal:not(.is-visible)");
  if (!revealEls.length) return;

  // Prinsip aman: kalau ADA saja yang tidak terduga gagal di bawah ini
  // (mis. matchMedia/IntersectionObserver tidak tersedia di browser/WebView
  // tertentu), elemen tetap dipaksa terlihat (is-visible) alih-alih diam2
  // macet di opacity:0 selamanya. Lebih baik animasinya hilang daripada
  // kontennya hilang.
  try {
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = getSharedRevealObserver();
    revealEls.forEach((el) => observer.observe(el));
  } catch (err) {
    console.warn("[script] observeRevealElements gagal, menampilkan elemen tanpa animasi sebagai fallback aman.", err);
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
}

// Diekspos secara eksplisit ke window supaya js/projects.js (dimuat SEBELUM
// script.js, lihat urutan <script> di index.html) tetap bisa memanggilnya
// nanti setelah card project baru selesai disisipkan ke DOM.
window.observeRevealElements = observeRevealElements;

function initScrollReveal() {
  observeRevealElements(document);
}

/* ---------------------------------------------------------------------
 * Tombol back-to-top
 * ------------------------------------------------------------------- */
function initBackToTop() {
  const btn = document.querySelector("[data-back-to-top]");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 480);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------------------------------------------------------------------
 * Validasi dasar form contact
 * Catatan: form ini saat ini memakai mailto fallback (lihat index.html).
 * Belum terhubung ke backend/email service pihak ketiga.
 * ------------------------------------------------------------------- */
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    let hasError = false;
    hasError = setFieldError(form, "name", name.length < 2 ? "Nama minimal 2 karakter." : "") || hasError;
    hasError = setFieldError(form, "email", !isValidEmail(email) ? "Format email tidak valid." : "") || hasError;
    hasError = setFieldError(form, "message", message.length < 10 ? "Pesan minimal 10 karakter." : "") || hasError;

    if (hasError) {
      status.textContent = "Periksa kembali form di atas.";
      status.classList.add("error");
      return;
    }

    const subject = encodeURIComponent(`Pesan dari ${name} lewat portfolio`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:tatialza@gmail.com?subject=${subject}&body=${body}`;

    status.textContent = "Membuka aplikasi email kamu...";
    status.classList.add("success");
  });
}

function setFieldError(form, fieldName, message) {
  const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (errorEl) errorEl.textContent = message;
  return Boolean(message);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}