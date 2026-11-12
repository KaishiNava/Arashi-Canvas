# Araishi Canvas

Starter web app editor poster berbasis Next.js + TypeScript. Project disimpan di IndexedDB browser menggunakan Dexie.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Fitur awal
- Dashboard project lokal (buat, cari, buka, hapus).
- Preset ukuran poster dan ukuran custom.
- Canvas Fabric.js: teks, rectangle, circle, triangle, gambar.
- Seleksi, drag, resize, rotate melalui kontrol Fabric.js.
- Properties: warna, opacity, posisi, ukuran font, lock.
- Layers sederhana dan pengaturan urutan.
- Autosave JSON + preview ke IndexedDB.
- Export PNG.
- Effects modular di `src/features/effects/` (blur, brightness, contrast, grayscale).
- Folder font di `public/fonts/` dan registry `src/features/fonts/fonts.ts`.

## Penyimpanan
Database browser bernama `AraishiCanvasDB`, tabel `projects`. Data tidak otomatis tersinkron antar perangkat/browser. Menghapus data situs/browser dapat menghapus project; ekspor/backup project belum disediakan pada starter ini.

## Catatan pengembangan
- Effects starter saat ini ditujukan untuk objek gambar. Implementasi preset filter lanjutan dan reset filter bisa ditingkatkan.
- Undo/redo, PDF/JPG export, crop, multi-select, ruler, snap guides, custom font loader UI, dan gesture pinch/pan adalah tahap lanjutan.
- Untuk font custom, letakkan file berlisensi di `public/fonts/`, lalu daftarkan melalui `@font-face` di CSS dan `customFonts`.
- Jangan simpan file besar tanpa batas: pertimbangkan batas ukuran upload dan penanganan quota IndexedDB.
