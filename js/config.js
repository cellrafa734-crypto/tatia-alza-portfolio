/**
 * config.js
 * -----------------------------------------------------------------------
 * Tempat SATU-SATUNYA untuk menyimpan konfigurasi yang dipakai di seluruh
 * situs (index.html & admin.html). Tidak boleh ada API key rahasia atau
 * password di file ini, karena file ini publik (GitHub Pages).
 *
 * CARA MENGISI APPS_SCRIPT_URL (baca sebelum edit):
 * Hanya ada SATU baris aktif di bawah untuk APPS_SCRIPT_URL, yaitu baris
 * yang TIDAK diawali tanda "//". Ganti isi tanda kutip "" di baris itu
 * dengan Web App URL kamu dari Phase 6 (docs/apps-script-setup.md bagian G).
 * Jangan menambah baris baru bertuliskan APPS_SCRIPT_URL lain di file ini.
 * -----------------------------------------------------------------------
 */

const CONFIG = {
    // Kosong ("") berarti mode lokal: index.html pakai js/projects-data.js,
    // admin.html pakai localStorage. Isi dengan Web App URL (berakhiran /exec)
    // untuk mengaktifkan mode Google Sheets.
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby1GJP0mrqhwkCmPyQhZWk4JM8F0_-9hFAGSGeWihYBeyFfFQS9SokfxkC0H524r1C2yg/exec",

    // Nama tampilan brand, dipakai beberapa tempat di JS (mis. judul dinamis)
    SITE_NAME: "TIA",
    OWNER_NAME: "Tatia Alza",

    // Berapa lama (ms) fetch ke Apps Script ditunggu sebelum dianggap gagal
    // dan sistem jatuh ke data fallback.
    FETCH_TIMEOUT_MS: 6000,
};

/**
 * Helper terpusat untuk mengecek apakah APPS_SCRIPT_URL sudah diisi dengan
 * benar (bukan cuma spasi kosong). Dipakai oleh js/admin.js dan
 * js/projects.js supaya logikanya konsisten di satu tempat saja.
 */
function isAppsScriptConfigured() {
    return typeof CONFIG.APPS_SCRIPT_URL === "string" && CONFIG.APPS_SCRIPT_URL.trim().length > 0;
}

/**
 * Cek ringan (bukan validasi ketat) apakah URL yang diisi PENAMPAKANNYA
 * seperti Web App URL Apps Script yang benar. Ini hanya untuk menampilkan
 * peringatan dini di admin.html kalau formatnya mencurigakan (misal lupa
 * "/exec" di akhir) — tidak memblokir apa pun, tetap dicoba dipakai.
 */
function looksLikeValidAppsScriptUrl(url) {
    return /^https:\/\/script\.google(usercontent)?\.com\/macros\/s\/.+\/exec$/.test(String(url).trim());
}