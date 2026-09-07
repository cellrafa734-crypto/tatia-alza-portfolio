# Portfolio Tatia Alza (TIA)

Portfolio pribadi mahasiswa Teknik Informatika. Dibangun dengan HTML, CSS, dan
JavaScript murni supaya bisa langsung di-hosting di GitHub Pages tanpa proses
build apa pun.

## Status saat ini: Phase 1–3 selesai

Yang **sudah berfungsi** dan sudah diuji secara manual (kode, bukan visual di
browser sungguhan — kamu tetap perlu cek tampilan asli setelah upload foto):

- Seluruh struktur halaman: Home, About, Education, Skills, Hobbies, Projects, Contact
- Navbar responsif dengan hamburger menu di mobile, dan highlight otomatis
  section yang sedang aktif saat scroll
- Animasi reveal ringan saat scroll (fade + slide-up), menghormati preferensi
  `prefers-reduced-motion`
- Tombol back-to-top
- Data pribadi Tatia (About, Education, Skills, Hobbies, Contact) sudah diisi asli
- Project **Eka Home Massage** sudah masuk sebagai data default/fallback
- Sistem render project sudah punya loading state (skeleton), empty state, dan
  escaping teks (textContent, bukan innerHTML) untuk mencegah XSS dasar
- Validasi dasar form contact (nama, email, panjang pesan) — pengiriman
  sementara memakai `mailto:`, **belum** terhubung ke layanan email sungguhan

Yang **BELUM** dibuat/berfungsi (menyusul di phase berikutnya, jangan dianggap sudah jalan):

- `admin.html` — Admin Panel (Phase 4)
- Koneksi ke Google Sheets & Google Apps Script (Phase 5–6) — saat ini
  `CONFIG.APPS_SCRIPT_URL` sengaja dikosongkan, jadi project selalu memuat data
  dari `js/projects-data.js`
- Pengujian nyata di berbagai perangkat asli (Phase 7) — layout sudah ditulis
  responsive dengan breakpoint, tapi belum divisualkan di browser sungguhan
- Deploy ke GitHub Pages (Phase 8)

## Struktur folder

```
/
├── index.html              Halaman utama (semua section)
├── admin.html               (belum dibuat — Phase 4)
├── css/
│   └── style.css            Semua styling & design system
├── js/
│   ├── config.js             Konfigurasi global (URL Apps Script, dll — TANPA secret)
│   ├── script.js             Navbar, scroll reveal, back-to-top, validasi form
│   ├── projects-data.js      Data project default/fallback (termasuk Eka Home Massage)
│   └── projects.js           Fetch + render project, fallback, escaping XSS
├── assets/
│   └── images/
│       ├── profile-tatia.svg        ⬅ placeholder foto, bisa diganti foto asli
│       └── projects/
│           └── eka-home-massage.jpg ⬅ KAMU UPLOAD SENDIRI
└── README.md
```

## File yang perlu kamu upload sendiri

| File | Keterangan |
|---|---|
| `assets/images/profile-tatia.svg` | Placeholder foto untuk hero section. Ganti file ini dengan foto asli jika sudah siap, lalu sesuaikan ekstensi di `index.html` bila diperlukan. |
| `assets/images/projects/eka-home-massage.jpg` | Thumbnail project Eka Home Massage. Sama, ada placeholder otomatis jika belum diupload. |

Cukup upload file dengan nama persis seperti di atas ke folder yang sesuai lewat
GitHub (drag & drop juga bisa), tidak perlu ubah kode apa pun.

## Kenapa fallback project penting

`js/projects.js` didesain supaya **project Eka Home Massage selalu muncul**,
bahkan jika:
- Google Sheets belum dihubungkan sama sekali, atau
- koneksi ke Google Apps Script gagal/timeout

Jadi portfolio tidak akan pernah tampil kosong hanya karena masalah koneksi ke
Google Sheets.

## Rencana keamanan Admin Panel (Phase 4–6, belum diimplementasikan)

GitHub Pages bersifat 100% publik — tidak ada tempat aman untuk menyimpan
password di frontend. Pendekatan yang realistis untuk skala portfolio mahasiswa:

- `admin.html` tidak akan ditautkan di navbar publik (hanya kamu yang tahu URL-nya)
- PIN sederhana akan divalidasi di sisi **Google Apps Script** (server), bukan
  hardcode di JavaScript frontend
- Ini bukan keamanan tingkat enterprise, tapi cukup untuk mencegah orang random
  menemukan dan mengubah data project kamu

Detail lengkap akan ditulis ulang di README ini setelah Phase 4–6 selesai.

## Cara menjalankan secara lokal

Karena tidak ada proses build, cukup buka `index.html` langsung di browser,
atau jalankan server statis sederhana, misalnya:

```bash
python3 -m http.server 8000
```

lalu buka `http://localhost:8000` di browser.