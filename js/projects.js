/**
 * projects.js
 * -----------------------------------------------------------------------
 * Tanggung jawab file ini HANYA soal data & rendering project di index.html:
 *  1. Coba ambil data dari Google Apps Script kalau CONFIG.APPS_SCRIPT_URL
 *     sudah diisi (Phase 7) — sumber data yang sama dengan admin.html.
 *  2. Kalau gagal / timeout / URL belum diisi / ATAU ada error tak terduga
 *     apa pun -> pakai DEFAULT_PROJECTS (js/projects-data.js) sebagai
 *     fallback aman, supaya halaman tidak PERNAH macet di loading state.
 *  3. Render ke grid, dengan loading state (skeleton) & empty state.
 *  4. Semua teks yang datang dari luar (Google Sheets) di-set lewat
 *     textContent (bukan innerHTML) supaya aman dari XSS dasar.
 *
 * Kalau project tidak muncul, buka DevTools -> tab Console: warning/error
 * (kalau ada) akan tercetak dengan prefix "[projects]" untuk memudahkan
 * diagnosis, tapi ini murni untuk Console -- tidak pernah tampil di halaman.
 * -----------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector("[data-projects-grid]");

    if (!grid) {
        console.error(
            "[projects] Container grid '[data-projects-grid]' TIDAK ditemukan di index.html. " +
            "Cek apakah <div class=\"projects__grid\" data-projects-grid> masih ada dan tidak berubah nama atributnya."
        );
        return;
    }

    // Safety net paling luar: apa pun yang terjadi di dalam loadProjects,
    // kalau sampai gagal total di luar dugaan, tetap paksa render data lokal
    // supaya section Projects TIDAK PERNAH macet kosong di skeleton selamanya.
    loadProjects(grid).catch((err) => {
        console.error("[projects] loadProjects() gagal total di luar dugaan, memaksa fallback lokal.", err);
        try {
            renderProjects(grid, DEFAULT_PROJECTS.map(normalizeProject));
        } catch (fatalErr) {
            console.error("[projects] Fallback darurat juga gagal:", fatalErr);
        }
    });
});

async function loadProjects(grid) {
    renderSkeleton(grid, 2);

    let projects = [];
    let usedFallback = false;
    let sourceIsSheet = false;

    // Seluruh logika di bawah ini dibungkus try/catch tunggal yang lebar
    // (bukan cuma di sekitar fetch saja) supaya error tak terduga APA PUN
    // -- termasuk error dari isAppsScriptConfigured(), normalizeProject(),
    // dll -- tetap berujung ke fallback, bukan diam-diam menghentikan proses.
    try {
        const connected = isAppsScriptConfigured();

        if (connected) {
            try {
                const fetched = await fetchProjectsFromSheet(CONFIG.APPS_SCRIPT_URL, CONFIG.FETCH_TIMEOUT_MS);
                projects = fetched.map(normalizeProject);
                sourceIsSheet = true;
                // Catatan: kalau Google Sheets memang mengembalikan daftar KOSONG
                // (misal semua project sudah dihapus lewat Admin Panel), itu keadaan
                // yang SAH -> tampilkan empty state asli, JANGAN diam-diam diganti
                // data lokal, supaya delete di Admin benar-benar tercermin di sini.
            } catch (err) {
                console.warn("[projects] Gagal mengambil/mengolah data dari Google Sheets, memakai data lokal.", err);
                projects = DEFAULT_PROJECTS.map(normalizeProject);
                usedFallback = true;
            }
        } else {
            projects = DEFAULT_PROJECTS.map(normalizeProject);
            usedFallback = true;
        }
    } catch (unexpectedErr) {
        // Jaring pengaman kedua: kalau ADA saja yang tidak terduga meledak di
        // atas (misal CONFIG belum ke-load / helper belum terdefinisi), tetap
        // jatuhkan ke data lokal alih-alih membiarkan section Projects kosong.
        console.error("[projects] Error tak terduga sebelum render, memaksa fallback lokal.", unexpectedErr);
        projects = DEFAULT_PROJECTS.map(normalizeProject);
        usedFallback = true;
        sourceIsSheet = false;
    }

    renderProjects(grid, projects);

    const note = document.querySelector("[data-projects-note]");
    if (note) {
        if (sourceIsSheet) {
            note.textContent = "Data project dimuat langsung dari Google Sheets.";
        } else if (usedFallback && typeof CONFIG !== "undefined" && isAppsScriptConfigured()) {
            note.textContent = "Google Sheets sedang tidak bisa diakses, menampilkan data cadangan lokal untuk sementara.";
        } else {
            note.textContent = "Menampilkan data lokal (Google Sheets belum dihubungkan).";
        }
    }
}

function fetchProjectsFromSheet(url, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(`${url}?action=list`, { signal: controller.signal })
        .then((res) => {
            if (!res.ok) throw new Error(`Request gagal dengan status HTTP ${res.status}`);
            return res.json();
        })
        .then((payload) => {
            // PENTING: Code.gs selalu membungkus hasil di dalam
            // { success, status, data, message? } — bukan array mentah.
            // Ini harus dibongkar dulu sebelum dipakai.
            if (!payload || typeof payload !== "object") {
                throw new Error("Format respons dari server tidak dikenali (bukan objek JSON).");
            }
            if (!payload.success) {
                throw new Error(payload.message || "Server mengembalikan status gagal (success: false).");
            }
            if (!Array.isArray(payload.data)) {
                throw new Error("Field 'data' dari server bukan berupa daftar (array) project.");
            }
            return payload.data;
        })
        .catch((err) => {
            // Deteksi khusus kegagalan fetch cross-origin (CORS/network), supaya
            // pesan di Console lebih jelas dibanding "Failed to fetch" generik.
            if (err instanceof TypeError) {
                console.warn(
                    "[projects] fetch() gagal di level jaringan/CORS (TypeError). " +
                    "Ini biasanya berarti browser memblokir request cross-origin ke Apps Script, " +
                    "atau URL-nya salah/tidak bisa dijangkau. Detail:",
                    err.message
                );
            }
            throw err;
        })
        .finally(() => clearTimeout(timeout));
}

function normalizeProject(raw) {
    raw = raw || {};
    return {
        id: String(raw.id ?? cryptoRandomId()),
        name: String(raw.name ?? "Tanpa nama"),
        category: String(raw.category ?? "Project"),
        description: String(raw.description ?? ""),
        tech: Array.isArray(raw.tech)
            ? raw.tech.map((t) => String(t))
            : String(raw.tech ?? "")
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        year: raw.year ?? "",
        status: String(raw.status ?? "Prototype"),
        thumbnail: String(raw.thumbnail ?? ""),
        demoUrl: String(raw.demoUrl ?? ""),
        githubUrl: String(raw.githubUrl ?? ""),
    };
}

function cryptoRandomId() {
    return `p-${Math.random().toString(36).slice(2, 9)}`;
}

function renderSkeleton(grid, count) {
    grid.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const card = document.createElement("div");
        card.className = "skeleton-card";
        card.innerHTML = `
      <div class="skeleton-card__block"></div>
      <div class="skeleton-card__lines">
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-90"></div>
        <div class="skeleton-line w-60"></div>
      </div>
    `;
        grid.appendChild(card);
    }
}

function renderProjects(grid, projects) {
    grid.innerHTML = "";

    if (!projects || !projects.length) {
        const empty = document.createElement("div");
        empty.className = "projects__state";
        empty.textContent = "Belum ada project untuk ditampilkan. Project baru akan muncul di sini setelah ditambahkan lewat Admin Panel.";
        grid.appendChild(empty);
        return;
    }

    projects.forEach((project) => {
        // Satu project bermasalah tidak boleh menggagalkan project lain yang
        // valid untuk tetap dirender (mis. thumbnail rusak, field aneh, dll).
        try {
            grid.appendChild(buildProjectCard(project));
        } catch (err) {
            console.error("[projects] Gagal merender salah satu project, dilewati:", project, err);
        }
    });

    if (!grid.children.length) {
        console.error("[projects] Semua project gagal dirender satu per satu, menampilkan empty state sebagai jaring pengaman.");
        const empty = document.createElement("div");
        empty.className = "projects__state";
        empty.textContent = "Terjadi kendala saat menampilkan project. Silakan cek kembali nanti.";
        grid.appendChild(empty);
    }

    // PENTING: card baru ini punya class "reveal" (animasi fade-in saat
    // discroll), tapi baru masuk ke DOM belakangan -- observer animasi di
    // script.js yang jalan saat halaman pertama dimuat TIDAK tahu elemen ini
    // ada, jadi tidak akan pernah di-observe kalau tidak didaftarkan ulang di
    // sini. Tanpa baris ini, card akan tampak "kosong" secara visual (nyangkut
    // di opacity:0) walaupun sebenarnya sudah ada di HTML.
    if (typeof window.observeRevealElements === "function") {
        try {
            window.observeRevealElements(grid);
        } catch (err) {
            console.warn("[projects] observeRevealElements melempar error, memaksa tampil tanpa animasi.", err);
            grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
        }
    } else {
        // Fallback kalau karena suatu hal script.js belum sempat ter-load:
        // langsung tampilkan tanpa animasi, supaya TIDAK PERNAH invisible
        // selamanya hanya gara-gara urutan loading script.
        console.warn("[projects] window.observeRevealElements tidak ditemukan, menampilkan card tanpa animasi reveal.");
        grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    }
}

function buildProjectCard(project) {
    const card = document.createElement("article");
    card.className = "project-card reveal";

    const imageBlock = document.createElement("div");
    imageBlock.className = "project-card__image";

    if (project.thumbnail) {
        const img = document.createElement("img");
        img.src = project.thumbnail;
        img.alt = `Tampilan project ${project.name}`;
        img.loading = "lazy";
        // PENTING: kegagalan memuat gambar (file belum diupload, path salah,
        // dll) HANYA mengganti bagian gambar dengan placeholder. Ini tidak
        // pernah membuat seluruh card/section gagal dirender, karena struktur
        // card (judul, deskripsi, dst) sudah dibangun terlepas dari status
        // gambar ini.
        img.onerror = () => {
            imageBlock.innerHTML = "";
            imageBlock.appendChild(buildImagePlaceholder());
        };
        imageBlock.appendChild(img);
    } else {
        imageBlock.appendChild(buildImagePlaceholder());
    }

    const statusBadge = document.createElement("span");
    statusBadge.className = "project-card__status";
    statusBadge.textContent = project.status;
    imageBlock.appendChild(statusBadge);

    const body = document.createElement("div");
    body.className = "project-card__body";

    body.innerHTML = `
    <span class="project-card__category"></span>
    <h3 class="project-card__title"></h3>
    <p class="project-card__desc"></p>
    <div class="project-card__tech"></div>
    <div class="project-card__meta"><span></span></div>
    <div class="project-card__links"></div>
  `;

    // Set teks lewat textContent (bukan innerHTML) supaya aman dari XSS
    body.querySelector(".project-card__category").textContent = project.category;
    body.querySelector(".project-card__title").textContent = project.name;
    body.querySelector(".project-card__desc").textContent = project.description;
    body.querySelector(".project-card__meta span").textContent = project.year ? `Tahun ${project.year}` : "";

    const techWrap = body.querySelector(".project-card__tech");
    (project.tech || []).forEach((tech) => {
        const tag = document.createElement("span");
        tag.textContent = tech;
        techWrap.appendChild(tag);
    });

    const linksWrap = body.querySelector(".project-card__links");
    if (project.demoUrl) {
        const demoLink = document.createElement("a");
        demoLink.href = project.demoUrl;
        demoLink.target = "_blank";
        demoLink.rel = "noopener noreferrer";
        demoLink.textContent = "Lihat Project";
        linksWrap.appendChild(demoLink);
    }
    if (project.githubUrl) {
        const ghLink = document.createElement("a");
        ghLink.href = project.githubUrl;
        ghLink.target = "_blank";
        ghLink.rel = "noopener noreferrer";
        ghLink.textContent = "GitHub";
        linksWrap.appendChild(ghLink);
    }
    if (!project.demoUrl && !project.githubUrl) {
        const disabled = document.createElement("span");
        disabled.className = "disabled";
        disabled.textContent = "Belum ada tautan publik";
        linksWrap.appendChild(disabled);
    }

    card.appendChild(imageBlock);
    card.appendChild(body);
    return card;
}

function buildImagePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "project-card__placeholder";
    placeholder.textContent = "Gambar project belum tersedia";
    return placeholder;
}