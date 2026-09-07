/**
 * admin.js
 * -----------------------------------------------------------------------
 * Logic untuk admin.html: tambah, edit, hapus, dan lihat detail project.
 *
 * STATUS (Phase 6): Google Apps Script sudah dibuat dan endpoint GET sudah
 * dites berhasil langsung dari browser. File ini sekarang mencoba memakai
 * Google Sheets sebagai penyimpanan utama saat CONFIG.APPS_SCRIPT_URL sudah
 * diisi (lihat js/config.js).
 *
 * PENTING — jujur soal apa yang sudah/belum teruji:
 *  - GET (list project) sudah pernah dites manual dan berhasil.
 *  - CREATE/UPDATE/DELETE lewat Admin Panel ini BELUM tentu langsung berhasil
 *    di percobaan pertama kamu — silakan coba dan lihat pesan status yang
 *    muncul di bawah form. Kalau gagal, pesan errornya akan ditampilkan apa
 *    adanya (bukan disembunyikan), supaya gampang di-diagnosis.
 *  - Kalau CONFIG.APPS_SCRIPT_URL masih kosong, semua fungsi di bawah
 *    otomatis balik memakai localStorage (perilaku Phase 4), sebagai
 *    fallback yang sengaja dipertahankan.
 * -----------------------------------------------------------------------
 */

const STORAGE_KEY = "tia_admin_projects_v1";
const PIN_SESSION_KEY = "tia_admin_pin";

/* ---------------------------------------------------------------------
 * ProjectStore — lapisan penyimpanan.
 * Otomatis pakai Google Sheets (lewat Apps Script) kalau
 * CONFIG.APPS_SCRIPT_URL sudah diisi, kalau belum pakai localStorage.
 * ------------------------------------------------------------------- */
const ProjectStore = {
    isConnectedToSheet() {
        return isAppsScriptConfigured();
    },

    async list() {
        if (this.isConnectedToSheet()) {
            const result = await callAppsScriptGet("list");
            return Array.isArray(result) ? result : [];
        }
        return readLocalProjects();
    },

    async create(data) {
        if (this.isConnectedToSheet()) {
            return callAppsScriptPost({ action: "create", ...data, pin: getStoredPin() });
        }
        const projects = readLocalProjects();
        const newProject = { ...data, id: `p-${Date.now()}` };
        projects.unshift(newProject);
        writeLocalProjects(projects);
        return newProject;
    },

    async update(id, data) {
        if (this.isConnectedToSheet()) {
            return callAppsScriptPost({ action: "update", id, ...data, pin: getStoredPin() });
        }
        const projects = readLocalProjects();
        const index = projects.findIndex((p) => p.id === id);
        if (index === -1) throw new Error("Project tidak ditemukan.");
        projects[index] = { ...projects[index], ...data, id };
        writeLocalProjects(projects);
        return projects[index];
    },

    async remove(id) {
        if (this.isConnectedToSheet()) {
            await callAppsScriptPost({ action: "delete", id, pin: getStoredPin() });
            return;
        }
        const projects = readLocalProjects().filter((p) => p.id !== id);
        writeLocalProjects(projects);
    },
};

/* ---------------------------------------------------------------------
 * Komunikasi ke Google Apps Script
 *
 * Catatan teknis: request POST sengaja dikirim dengan Content-Type
 * "text/plain" (bukan "application/json"). Ini bukan salah ketik —
 * Google Apps Script Web App tidak menangani preflight request (OPTIONS)
 * dengan baik, jadi kalau kita pakai "application/json" browser akan
 * mengirim preflight dulu dan gagal karena CORS. Dengan "text/plain",
 * browser menganggapnya "simple request" (tidak perlu preflight), dan
 * Apps Script di sisi server tetap mem-parse isinya sebagai JSON seperti
 * biasa (lihat JSON.parse(e.postData.contents) di Code.gs).
 * ------------------------------------------------------------------- */
async function callAppsScriptGet(action) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}`, {
            method: "GET",
            signal: controller.signal,
        });
        const payload = await res.json();
        if (!payload.success) {
            throwAppsScriptError(payload);
        }
        return payload.data;
    } finally {
        clearTimeout(timeout);
    }
}

async function callAppsScriptPost(body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const payload = await res.json();
        if (!payload.success) {
            throwAppsScriptError(payload);
        }
        return payload.data;
    } finally {
        clearTimeout(timeout);
    }
}

function throwAppsScriptError(payload) {
    const err = new Error(payload.message || "Terjadi kesalahan yang tidak diketahui dari server.");
    if (payload.errors) err.fieldErrors = payload.errors;
    err.status = payload.status;
    throw err;
}

function getStoredPin() {
    try {
        return sessionStorage.getItem(PIN_SESSION_KEY) || "";
    } catch {
        return "";
    }
}

function setStoredPin(pin) {
    try {
        sessionStorage.setItem(PIN_SESSION_KEY, pin);
    } catch (err) {
        console.error("Gagal menyimpan PIN ke sessionStorage.", err);
    }
}

function readLocalProjects() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const seeded = DEFAULT_PROJECTS.map((p) => ({ ...p }));
            writeLocalProjects(seeded);
            return seeded;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Gagal membaca data lokal, mengembalikan array kosong.", err);
        return [];
    }
}

function writeLocalProjects(projects) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
        console.error("Gagal menyimpan ke localStorage.", err);
        throw new Error("Penyimpanan gagal. Periksa penyimpanan browser kamu.");
    }
}

/* ---------------------------------------------------------------------
 * Bootstrapping halaman
 * ------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    // Setiap langkah dibungkus try/catch sendiri-sendiri supaya kalau satu
    // bagian gagal (misal karena config salah format), bagian lain tetap
    // berjalan normal — tidak saling menjatuhkan satu sama lain.
    try {
        renderModeBanner();
    } catch (err) {
        console.error("Gagal menampilkan status mode:", err);
    }

    try {
        initPinForm();
    } catch (err) {
        console.error("Gagal menyiapkan form PIN:", err);
    }

    refreshList().catch((err) => console.error("Gagal memuat daftar project:", err));

    try {
        const form = document.querySelector("[data-admin-form]");
        const cancelBtn = document.querySelector("[data-cancel-edit]");
        form.addEventListener("submit", handleFormSubmit);
        cancelBtn.addEventListener("click", resetForm);
    } catch (err) {
        console.error("Gagal memasang event form project:", err);
    }
});

function initPinForm() {
    const pinSection = document.querySelector("[data-pin-section]");
    if (!pinSection) return;

    if (!ProjectStore.isConnectedToSheet()) {
        pinSection.hidden = true;
        return;
    }
    pinSection.hidden = false;

    const pinForm = document.querySelector("[data-pin-form]");
    const pinInput = document.getElementById("admin-pin");
    const pinStatus = document.querySelector("[data-pin-status]");

    const existingPin = getStoredPin();
    if (existingPin) {
        pinInput.value = existingPin;
        pinStatus.textContent = "PIN tersimpan untuk sesi ini.";
        pinStatus.classList.add("success");
    }

    pinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = pinInput.value.trim();
        if (!value) {
            pinStatus.textContent = "PIN tidak boleh kosong.";
            pinStatus.className = "form-status error";
            return;
        }
        setStoredPin(value);
        pinStatus.textContent = "PIN tersimpan untuk sesi ini.";
        pinStatus.className = "form-status success";
    });
}

function renderModeBanner() {
    const banner = document.querySelector("[data-mode-banner]");
    if (!banner) return;

    banner.classList.add("is-visible");

    if (ProjectStore.isConnectedToSheet()) {
        const urlLooksValid = looksLikeValidAppsScriptUrl(CONFIG.APPS_SCRIPT_URL);
        if (urlLooksValid) {
            banner.classList.add("mode-connected");
            banner.textContent =
                "Terhubung ke Google Sheets (endpoint GET sudah dites berhasil). Isi PIN di bawah, lalu coba Save/Edit/Delete satu project untuk memastikan semuanya benar-benar bekerja — status hasilnya akan tampil di bawah form.";
        } else {
            banner.classList.add("mode-local");
            banner.textContent =
                'APPS_SCRIPT_URL di js/config.js sudah terisi, tapi formatnya tidak seperti Web App URL Apps Script yang benar (harusnya diawali "https://script.google.com/macros/s/" dan diakhiri "/exec"). Cek kembali js/config.js — sistem tetap akan mencoba memakainya, tapi kemungkinan besar akan gagal.';
        }
    } else {
        banner.classList.add("mode-local");
        banner.textContent =
            "Mode lokal: Google Sheets belum terhubung. Perubahan di sini hanya tersimpan di perangkat/browser ini dan BELUM tampil di portfolio publik. Isi CONFIG.APPS_SCRIPT_URL di js/config.js untuk mengaktifkan mode Google Sheets.";
    }
}

/* ---------------------------------------------------------------------
 * Render daftar project
 * ------------------------------------------------------------------- */
async function refreshList() {
    const list = document.querySelector("[data-admin-list]");
    if (!list) return;

    list.innerHTML = `<p class="admin-empty">Memuat data…</p>`;

    try {
        const projects = await ProjectStore.list();
        renderList(list, projects);
    } catch (err) {
        list.innerHTML = `<p class="admin-empty">Gagal memuat data: ${escapeText(err.message)}</p>`;
    }
}

function renderList(list, projects) {
    list.innerHTML = "";

    if (!projects.length) {
        list.innerHTML = `<p class="admin-empty">Belum ada project. Tambahkan project pertama lewat form di atas.</p>`;
        return;
    }

    projects.forEach((project) => {
        list.appendChild(buildAdminItem(project));
    });
}

function buildAdminItem(project) {
    const item = document.createElement("article");
    item.className = "admin-item";

    const top = document.createElement("div");
    top.className = "admin-item__top";
    top.innerHTML = `
    <div>
      <h3 class="admin-item__title"></h3>
      <p class="admin-item__meta"></p>
    </div>
    <span class="admin-item__badge"></span>
  `;
    top.querySelector(".admin-item__title").textContent = project.name;
    top.querySelector(".admin-item__meta").textContent = `${project.category} • ${project.year || "-"}`;
    top.querySelector(".admin-item__badge").textContent = project.status;

    const details = document.createElement("details");
    details.innerHTML = `
    <summary>Lihat Detail</summary>
    <div class="admin-item__detail-row"><strong>Deskripsi:</strong> <span data-field="description"></span></div>
    <div class="admin-item__detail-row"><strong>Technology:</strong> <span data-field="tech"></span></div>
    <div class="admin-item__detail-row"><strong>Thumbnail:</strong> <span data-field="thumbnail"></span></div>
    <div class="admin-item__detail-row"><strong>Demo:</strong> <span data-field="demoUrl"></span></div>
    <div class="admin-item__detail-row"><strong>GitHub:</strong> <span data-field="githubUrl"></span></div>
  `;
    details.querySelector('[data-field="description"]').textContent = project.description || "-";
    details.querySelector('[data-field="tech"]').textContent = Array.isArray(project.tech)
        ? project.tech.join(", ")
        : project.tech || "-";
    details.querySelector('[data-field="thumbnail"]').textContent = project.thumbnail || "-";
    details.querySelector('[data-field="demoUrl"]').textContent = project.demoUrl || "-";
    details.querySelector('[data-field="githubUrl"]').textContent = project.githubUrl || "-";

    const actions = document.createElement("div");
    actions.className = "admin-item__actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => populateFormForEdit(project));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "is-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDelete(project));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(top);
    item.appendChild(details);
    item.appendChild(actions);

    return item;
}

function escapeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* ---------------------------------------------------------------------
 * Form: create / update
 * ------------------------------------------------------------------- */
function populateFormForEdit(project) {
    const form = document.querySelector("[data-admin-form]");
    form.elements.id.value = project.id;
    form.elements.name.value = project.name;
    form.elements.category.value = project.category;
    form.elements.year.value = project.year;
    form.elements.description.value = project.description;
    form.elements.tech.value = Array.isArray(project.tech) ? project.tech.join(", ") : project.tech || "";
    form.elements.status.value = project.status;
    form.elements.thumbnail.value = project.thumbnail || "";
    form.elements.demoUrl.value = project.demoUrl || "";
    form.elements.githubUrl.value = project.githubUrl || "";

    document.getElementById("form-title").textContent = `Edit Project: ${project.name}`;
    document.querySelector("[data-submit-btn]").textContent = "Update Project";
    document.querySelector("[data-cancel-edit]").hidden = false;

    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
    const form = document.querySelector("[data-admin-form]");
    form.reset();
    form.elements.id.value = "";
    document.getElementById("form-title").textContent = "Tambah Project Baru";
    document.querySelector("[data-submit-btn]").textContent = "Save Project";
    document.querySelector("[data-cancel-edit]").hidden = true;
    clearAllErrors(form);
    setStatus("");
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearAllErrors(form);
    setStatus("");

    const values = {
        name: form.elements.name.value.trim(),
        category: form.elements.category.value.trim(),
        year: form.elements.year.value.trim(),
        description: form.elements.description.value.trim(),
        tech: form.elements.tech.value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        status: form.elements.status.value,
        thumbnail: form.elements.thumbnail.value.trim(),
        demoUrl: form.elements.demoUrl.value.trim(),
        githubUrl: form.elements.githubUrl.value.trim(),
    };

    const errors = validateProject(values);
    if (Object.keys(errors).length) {
        Object.entries(errors).forEach(([field, message]) => setFieldError(form, field, message));
        setStatus("Periksa kembali form di atas.", "error");
        return;
    }

    const id = form.elements.id.value;
    const submitBtn = document.querySelector("[data-submit-btn]");
    submitBtn.disabled = true;
    submitBtn.textContent = id ? "Menyimpan perubahan…" : "Menyimpan…";

    try {
        if (id) {
            await ProjectStore.update(id, values);
            setStatus(
                ProjectStore.isConnectedToSheet()
                    ? "Project berhasil diperbarui di Google Sheets."
                    : "Project berhasil diperbarui (lokal).",
                "success"
            );
        } else {
            await ProjectStore.create(values);
            setStatus(
                ProjectStore.isConnectedToSheet()
                    ? "Project berhasil ditambahkan ke Google Sheets."
                    : "Project berhasil ditambahkan (lokal).",
                "success"
            );
        }
        resetForm();
        await refreshList();
    } catch (err) {
        if (err.fieldErrors) {
            Object.entries(err.fieldErrors).forEach(([field, message]) => setFieldError(form, field, message));
        }
        setStatus(`Gagal menyimpan: ${err.message}`, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = id ? "Update Project" : "Save Project";
    }
}

async function handleDelete(project) {
    const confirmed = window.confirm(`Hapus project "${project.name}"? Tindakan ini tidak bisa dibatalkan.`);
    if (!confirmed) return;

    try {
        await ProjectStore.remove(project.id);
        await refreshList();
        setStatus(`Project "${project.name}" berhasil dihapus.`, "success");
    } catch (err) {
        setStatus(`Gagal menghapus: ${err.message}`, "error");
    }
}

/* ---------------------------------------------------------------------
 * Validasi
 * ------------------------------------------------------------------- */
function validateProject(values) {
    const errors = {};

    if (values.name.length < 2) errors.name = "Nama project minimal 2 karakter.";
    if (values.category.length < 2) errors.category = "Kategori wajib diisi.";
    if (values.description.length < 10) errors.description = "Deskripsi minimal 10 karakter.";

    const yearNum = Number(values.year);
    if (!values.year || !Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
        errors.year = "Tahun harus angka antara 2000-2100.";
    }

    if (values.thumbnail && !isValidUrl(values.thumbnail)) errors.thumbnail = "URL thumbnail tidak valid.";
    if (values.demoUrl && !isValidUrl(values.demoUrl)) errors.demoUrl = "URL demo tidak valid.";
    if (values.githubUrl && !isValidUrl(values.githubUrl)) errors.githubUrl = "URL GitHub tidak valid.";

    return errors;
}

function isValidUrl(value) {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

function setFieldError(form, fieldName, message) {
    const el = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (el) el.textContent = message;
}

function clearAllErrors(form) {
    form.querySelectorAll("[data-error-for]").forEach((el) => (el.textContent = ""));
}

function setStatus(message, type) {
    const status = document.querySelector("[data-form-status]");
    if (!status) return;
    status.textContent = message;
    status.className = "form-status" + (type ? ` ${type}` : "");
}