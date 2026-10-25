/* Render aktivitas terpisah dari Projects. Aktivitas lokal disimpan di browser. */
(() => {
  const STORAGE_KEY = "tia_portfolio_activities_v1";
  const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 8h10M7 12h6M7 16h4"/><circle cx="17" cy="15.5" r="2"/></svg>`;

  function getActivities() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn("Aktivitas lokal tidak dapat dibaca; memakai data default.", error);
    }
    return Array.isArray(window.TIA_DEFAULT_ACTIVITIES) ? window.TIA_DEFAULT_ACTIVITIES : [];
  }

  function safeImage(image) {
    const value = String(image || "").trim();
    if (/^https:\/\//i.test(value) || /^http:\/\//i.test(value) || /^data:image\/(webp|jpeg|png);base64,/i.test(value)) return value;
    return "";
  }

  function makeCard(activity) {
    const card = document.createElement("article");
    card.className = "activity-card reveal";
    const media = document.createElement("div");
    media.className = "activity-card__media";
    const imageSource = safeImage(activity.image);
    if (imageSource) {
      const image = document.createElement("img");
      image.src = imageSource;
      image.alt = `Dokumentasi ${activity.title || "aktivitas"}`;
      image.loading = "lazy";
      image.onerror = () => {
        media.replaceChildren(makePlaceholder());
      };
      media.appendChild(image);
    } else {
      media.appendChild(makePlaceholder());
    }

    const body = document.createElement("div");
    body.className = "activity-card__body";
    const eyebrow = document.createElement("p");
    eyebrow.className = "activity-card__eyebrow";
    eyebrow.textContent = activity.category || "Aktivitas";
    const title = document.createElement("h3");
    title.className = "activity-card__title";
    title.textContent = activity.title || "Aktivitas";
    const caption = document.createElement("p");
    caption.className = "activity-card__caption";
    caption.textContent = activity.caption || "Dokumentasi kegiatan.";
    body.append(eyebrow, title, caption);
    if (activity.year) {
      const year = document.createElement("p");
      year.className = "activity-card__year";
      year.textContent = String(activity.year);
      body.appendChild(year);
    }
    card.append(media, body);
    return card;
  }

  function makePlaceholder() {
    const holder = document.createElement("div");
    holder.className = "activity-card__placeholder";
    holder.innerHTML = icon;
    return holder;
  }

  function render() {
    const grid = document.querySelector("[data-activities-grid]");
    if (!grid) return;
    grid.replaceChildren();
    const activities = getActivities();
    if (!activities.length) {
      const empty = document.createElement("p");
      empty.className = "projects__state";
      empty.textContent = "Belum ada aktivitas yang ditampilkan.";
      grid.appendChild(empty);
      return;
    }
    activities.forEach((activity) => grid.appendChild(makeCard(activity)));
    if (typeof window.observeRevealElements === "function") {
      try { window.observeRevealElements(grid); } catch (_) { grid.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible")); }
    } else {
      grid.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
    }
  }

  window.TiaActivities = { STORAGE_KEY, getActivities, render };
  document.addEventListener("DOMContentLoaded", render);
})();
