/* Editor Aktivitas yang ramah HP. Perubahan disimpan lokal dan dapat diekspor untuk GitHub. */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-activity-form]");
  const list = document.querySelector("[data-admin-activities-list]");
  const status = document.querySelector("[data-activity-status]");
  if (!form || !list || !window.TiaPortfolioImageUtils) return;

  const KEY = "tia_portfolio_activities_v1";
  const $ = (selector) => form.querySelector(selector);
  let activities = load();
  let imageData = "";
  let imageWasCleared = false;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw !== null) {
        const value = JSON.parse(raw);
        if (Array.isArray(value)) return value;
      }
    } catch (error) { console.warn("Data aktivitas lokal tidak terbaca.", error); }
    return Array.isArray(window.TIA_DEFAULT_ACTIVITIES) ? window.TIA_DEFAULT_ACTIVITIES.map((item) => ({ ...item })) : [];
  }
  function persist(message = "Perubahan disimpan di browser ini.") {
    try {
      localStorage.setItem(KEY, JSON.stringify(activities));
      status.textContent = `${message} Untuk menerbitkan perubahan ke semua pengunjung, unduh file data lalu unggah ke GitHub.`;
      status.className = "form-status success";
      renderList();
      window.TiaActivities?.render();
    } catch (error) {
      status.textContent = "Penyimpanan gagal. Foto mungkin terlalu besar; pilih foto yang lain.";
      status.className = "form-status error";
    }
  }
  function reset() {
    form.reset();
    form.elements.id.value = "";
    imageData = "";
    imageWasCleared = false;
    form.querySelector("[data-activity-image-preview]").classList.remove("is-visible");
    form.querySelector("[data-activity-image-preview] img").removeAttribute("src");
    form.querySelector("[data-activity-submit]").textContent = "Simpan Aktivitas";
  }
  function makeCardPlaceholder() {
    const element = document.createElement("div");
    element.className = "admin-activity-item__placeholder";
    element.textContent = "Foto belum ada";
    return element;
  }
  function renderList() {
    list.replaceChildren();
    if (!activities.length) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "Belum ada aktivitas. Tambahkan melalui form di atas.";
      list.appendChild(empty);
      return;
    }
    activities.forEach((activity) => {
      const article = document.createElement("article");
      article.className = "admin-activity-item";
      if (activity.image && /^(https?:\/\/|data:image\/(webp|jpeg|png);base64,)/i.test(activity.image)) {
        const img = document.createElement("img");
        img.src = activity.image;
        img.alt = "Pratinjau aktivitas";
        img.onerror = () => img.replaceWith(makeCardPlaceholder());
        article.appendChild(img);
      } else article.appendChild(makeCardPlaceholder());

      const content = document.createElement("div");
      const title = document.createElement("div");
      title.className = "admin-activity-item__title";
      title.textContent = activity.title || "Aktivitas";
      const meta = document.createElement("div");
      meta.className = "admin-activity-item__meta";
      meta.textContent = [activity.category || "Aktivitas", activity.year || ""].filter(Boolean).join(" • ");
      const caption = document.createElement("p");
      caption.className = "admin-activity-item__caption";
      caption.textContent = activity.caption || "";
      const actions = document.createElement("div");
      actions.className = "admin-activity-item__actions";
      const edit = document.createElement("button");
      edit.type = "button"; edit.textContent = "Edit";
      edit.addEventListener("click", () => {
        form.elements.id.value = activity.id;
        form.elements.title.value = activity.title || "";
        form.elements.category.value = activity.category || "";
        form.elements.year.value = activity.year || "";
        form.elements.caption.value = activity.caption || "";
        imageData = activity.image || "";
        imageWasCleared = false;
        if (imageData) {
          const preview = form.querySelector("[data-activity-image-preview]");
          preview.querySelector("img").src = imageData;
          preview.classList.add("is-visible");
        } else {
          form.querySelector("[data-activity-image-preview]").classList.remove("is-visible");
        }
        form.querySelector("[data-activity-submit]").textContent = "Perbarui Aktivitas";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      const remove = document.createElement("button");
      remove.type = "button"; remove.textContent = "Hapus";
      remove.addEventListener("click", () => {
        if (!window.confirm(`Hapus aktivitas “${activity.title}” dari data lokal?`)) return;
        activities = activities.filter((item) => item.id !== activity.id);
        persist("Aktivitas dihapus.");
      });
      actions.append(edit, remove);
      content.append(title, meta, caption, actions);
      article.appendChild(content);
      list.appendChild(article);
    });
  }

  form.querySelector("[data-activity-image]").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const pickerStatus = form.querySelector("[data-activity-image-status]");
    pickerStatus.textContent = "Mengoptimalkan foto…";
    try {
      imageData = await window.TiaPortfolioImageUtils.compressImage(file, 48000);
      imageWasCleared = false;
      const preview = form.querySelector("[data-activity-image-preview]");
      preview.querySelector("img").src = imageData;
      preview.classList.add("is-visible");
      pickerStatus.textContent = "Foto siap digunakan.";
    } catch (error) {
      imageData = "";
      pickerStatus.textContent = error.message || "Foto gagal diproses.";
    }
  });
  form.querySelector("[data-activity-clear-image]").addEventListener("click", () => {
    imageData = "";
    imageWasCleared = true;
    form.querySelector("[data-activity-image]").value = "";
    form.querySelector("[data-activity-image-preview]").classList.remove("is-visible");
    form.querySelector("[data-activity-image-preview] img").removeAttribute("src");
    form.querySelector("[data-activity-image-status]").textContent = "Foto dikosongkan.";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = form.elements.title.value.trim();
    const caption = form.elements.caption.value.trim();
    if (title.length < 2 || caption.length < 8) {
      status.textContent = "Isi judul dan keterangan aktivitas (minimal 8 karakter).";
      status.className = "form-status error";
      return;
    }
    const id = form.elements.id.value || `activity-${Date.now()}`;
    const old = activities.find((item) => item.id === id);
    const record = {
      id,
      title,
      category: form.elements.category.value.trim() || "Aktivitas",
      year: form.elements.year.value.trim() || String(new Date().getFullYear()),
      caption,
      image: imageWasCleared ? "" : (imageData || (old ? old.image || "" : ""))
    };
    if (old) activities = activities.map((item) => item.id === id ? record : item);
    else activities.unshift(record);
    persist(old ? "Aktivitas diperbarui." : "Aktivitas ditambahkan.");
    reset();
  });
  form.querySelector("[data-activity-reset]").addEventListener("click", reset);
  document.querySelector("[data-export-activities]").addEventListener("click", () => {
    const js = "/* Data Aktivitas Portfolio TIA — unggah file ini sebagai js/activities-data.js di GitHub untuk menerbitkan perubahan. */\nwindow.TIA_DEFAULT_ACTIVITIES = " + JSON.stringify(activities, null, 2) + ";\n";
    const blob = new Blob([js], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "activities-data.js";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = "File activities-data.js diunduh. Unggah file itu ke folder js pada repository GitHub untuk memperbarui aktivitas publik.";
    status.className = "form-status success";
  });
  document.querySelector("[data-reset-activities]").addEventListener("click", () => {
    if (!window.confirm("Kembalikan aktivitas di browser ini ke data bawaan? Ini hanya mengubah data aktivitas, bukan Project.")) return;
    activities = (window.TIA_DEFAULT_ACTIVITIES || []).map((item) => ({ ...item }));
    persist("Data aktivitas dikembalikan ke bawaan.");
  });
  renderList();
});
