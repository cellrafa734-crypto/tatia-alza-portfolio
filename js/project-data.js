/**
 * projects-data.js
 * -----------------------------------------------------------------------
 * DEFAULT_PROJECTS — data project fallback/lokal yang dipakai js/projects.js
 * ketika Google Sheets (CONFIG.APPS_SCRIPT_URL) belum terhubung atau gagal
 * diakses. Lihat README.md bagian "Kenapa fallback project penting".
 *
 * CATATAN PERBAIKAN:
 * File ini sebelumnya HILANG dari repository walaupun sudah dipanggil di
 * index.html (<script src="js/projects-data.js">) dan disebut di README.
 * Akibatnya window.DEFAULT_PROJECTS tidak pernah terdefinisi, sehingga
 * section Projects di halaman utama macet permanen di teks
 * "Memuat data project…". File ini dibuat ulang supaya section Projects
 * berfungsi kembali.
 *
 * Data di bawah HANYA berisi apa yang sudah pasti diketahui (nama project
 * dan file thumbnail yang sudah ada di repo). Field lain (description,
 * tech, year, demoUrl, githubUrl) sengaja dikosongkan / diberi teks
 * "coming soon" alih-alih dikarang, supaya tidak ada informasi palsu.
 *
 * CARA MENGISI:
 * Edit langsung array di bawah ini — ganti nilai description, tech,
 * year, status, demoUrl, githubUrl sesuai data project asli kamu. Untuk
 * menambah project baru, cukup tambahkan object baru dengan struktur yang
 * sama di dalam array DEFAULT_PROJECTS.
 * -----------------------------------------------------------------------
 */

const DEFAULT_PROJECTS = [
    {
        id: "eka-home-massage",
        name: "Eka Home Massage",
        category: "Project", // TODO: ganti dengan kategori asli (mis. "Website Bisnis")
        description: "Project details coming soon.", // TODO: isi deskripsi asli project ini
        tech: [], // TODO: isi teknologi yang dipakai, mis. ["HTML", "CSS", "JavaScript"]
        year: "", // TODO: isi tahun pengerjaan, mis. "2025"
        status: "Prototype", // TODO: ganti jika statusnya berbeda, mis. "Selesai"
        thumbnail: "assets/images/projects/eka-home-massage.jpg",
        demoUrl: "https://cellrafa734-crypto.github.io/eka-home-massage/",
        githubUrl: "https://github.com/cellrafa734-crypto/eka-home-massage",
    },

    {
        id: "hadirin-digital",
        name: "Hadirin Digital",
        category: "Project",
        description: "Website Hadirin Digital.",
        tech: [],
        year: "2026",
        status: "Selesai",
        thumbnail: "assets/images/projects/hadirin-digital.png",
        demoUrl: "https://cellrafa734-crypto.github.io/hadirin-digital/",
        githubUrl: "",
    },

    {
        id: "sanggar-seni-leguna",
        name: "Sanggar Seni Leguna",
        category: "Web Development",
        description:
            "Website profil dan booking untuk Sanggar Seni Leguna yang memperkenalkan program kelas, dokumentasi kegiatan, dan layanan pentas seni.",
        tech: ["HTML", "CSS", "JavaScript"],
        year: "2026",
        status: "Selesai",
        thumbnail: "https://ameliasyifaul55315-beep.github.io/sanggar-seni-leguna/adat-rumoh-leguna.jpg",
        demoUrl: "https://ameliasyifaul55315-beep.github.io/sanggar-seni-leguna/",
        githubUrl: "https://github.com/ameliasyifaul55315-beep/sanggar-seni-leguna",
    },

    // Tambahkan project baru di sini dengan format yang sama:
    // {
    //   id: "id-unik-project",
    //   name: "Nama Project",
    //   category: "Kategori",
    //   description: "Deskripsi singkat project.",
    //   tech: ["Teknologi 1", "Teknologi 2"],
    //   year: "2026",
    //   status: "Selesai",
    //   thumbnail: "assets/images/projects/nama-file.jpg",
    //   demoUrl: "",
    //   githubUrl: "",
    // },
];