/* Menambahkan pemilih foto mobile ke form Project yang sudah ada. */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-admin-form]");
  if (!form || !form.elements.thumbnail || !window.TiaPortfolioImageUtils) return;

  const thumbnail = form.elements.thumbnail;
  thumbnail.type = "text"; // Data URL hasil kompresi bukan URL http biasa.
  thumbnail.placeholder = "Tempel URL gambar atau unggah foto di bawah";
  thumbnail.setAttribute("autocomplete", "off");

  const picker = document.createElement("div");
  picker.className = "mobile-image-picker";
  picker.innerHTML = `
    <label for="project-image-upload">Atau unggah foto dari HP / komputer</label>
    <input id="project-image-upload" type="file" accept="image/jpeg,image/png,image/webp,image/*" />
    <p class="mobile-image-picker__hint">Foto akan dikecilkan otomatis agar cocok sebagai thumbnail. Jika disimpan ke Google Sheets, pastikan penyimpanan menerima data gambar.</p>
    <p class="mobile-image-picker__status" data-project-image-status aria-live="polite"></p>
    <div class="mobile-image-picker__preview" data-project-image-preview><img alt="Pratinjau thumbnail project" /></div>
    <button class="btn btn-ghost btn-small" type="button" data-clear-project-image>Hapus pilihan foto</button>
  `;
  const thumbnailRow = thumbnail.closest(".admin-form__row");
  if (thumbnailRow) thumbnailRow.insertAdjacentElement("afterend", picker);
  else thumbnail.closest(".form-field")?.insertAdjacentElement("afterend", picker);

  const fileInput = picker.querySelector("input[type=file]");
  const status = picker.querySelector("[data-project-image-status]");
  const preview = picker.querySelector("[data-project-image-preview]");
  const previewImage = preview.querySelector("img");

  function updatePreview(value) {
    const source = (value || "").trim();
    if (/^(https?:\/\/|data:image\/(webp|jpeg|png);base64,)/i.test(source)) {
      previewImage.src = source;
      preview.classList.add("is-visible");
    } else {
      preview.classList.remove("is-visible");
      previewImage.removeAttribute("src");
    }
  }
  thumbnail.addEventListener("input", () => updatePreview(thumbnail.value));
  // Ketika tombol Edit pada daftar project mengisi field secara programatik,
  // perbarui preview setelah handler bawaan menyelesaikan pengisian form.
  document.querySelector("[data-admin-list]")?.addEventListener("click", () => {
    window.setTimeout(() => updatePreview(thumbnail.value), 0);
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    status.textContent = "Mengoptimalkan foto…";
    status.style.color = "#8b6549";
    fileInput.disabled = true;
    try {
      const dataUrl = await window.TiaPortfolioImageUtils.compressImage(file, 34000);
      thumbnail.value = dataUrl;
      thumbnail.dispatchEvent(new Event("input", { bubbles: true }));
      status.textContent = `Foto siap digunakan (${Math.round(dataUrl.length / 1024)} KB teks). Simpan Project untuk menerapkan gambar.`;
      status.style.color = "#47714e";
    } catch (error) {
      status.textContent = error.message || "Foto gagal diproses.";
      status.style.color = "#a02c48";
      fileInput.value = "";
    } finally {
      fileInput.disabled = false;
    }
  });
  picker.querySelector("[data-clear-project-image]").addEventListener("click", () => {
    fileInput.value = "";
    thumbnail.value = "";
    updatePreview("");
    status.textContent = "Foto pilihan dikosongkan. Project yang sudah tersimpan tidak berubah sampai kamu menekan Save/Update.";
  });

  // Validasi existing menerima URL web; tambahkan pengecekan untuk thumbnail data URI saja.
  if (typeof window.isValidUrl === "function") {
    const previous = window.isValidUrl;
    window.isValidUrl = function (value) {
      const text = String(value || "").trim();
      if (/^data:image\/(webp|jpeg|png);base64,/i.test(text)) return text.length <= 36000;
      return previous(value);
    };
  }
});
