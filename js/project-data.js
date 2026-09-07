/**
 * projects-data.js
 * -----------------------------------------------------------------------
 * Data project DEFAULT / FALLBACK.
 *
 * Ini dipakai ketika:
 *  1. Google Apps Script belum dihubungkan (CONFIG.APPS_SCRIPT_URL kosong), atau
 *  2. Fetch ke Google Sheets gagal (offline, error, timeout).
 *
 * Dengan begini, portfolio TETAP menampilkan minimal project ini
 * kapan pun, tanpa bergantung pada koneksi ke Google Sheets.
 *
 * Struktur field HARUS sama dengan data yang dikirim dari Google Sheets
 * lewat Apps Script (lihat js/projects.js -> normalizeProject).
 * -----------------------------------------------------------------------
 */

const DEFAULT_PROJECTS = [
    {
        id: "eka-home-massage",
        name: "Eka Home Massage",
        category: "Web Development",
        description:
            "Website untuk membantu memperkenalkan dan mempromosikan layanan pijat panggilan Eka Home Massage secara online, mencakup informasi layanan, harga, dan cara memesan.",
        tech: ["HTML", "CSS", "JavaScript"],
        year: 2025,
        status: "Prototype",
        thumbnail: "assets/images/projects/eka-home-massage.jpg",
        demoUrl: "",
        githubUrl: "",
    },
];