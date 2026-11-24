const Database = require("better-sqlite3");
const fs = require("fs");

// Ambil argumen nama database dari terminal (default: soal-awal.db)
const dbFile = process.argv[2] || "soal-awal.db";

// 1. Validasi: Pastikan file database ada dan ukurannya lebih dari 0 byte
if (!fs.existsSync(dbFile) || fs.statSync(dbFile).size === 0) {
  console.error(
    `Error: File database '${dbFile}' tidak ditemukan atau merupakan file kosong 0 byte.`,
  );
  process.exit(1);
}

const db = new Database(dbFile);

db.exec("PRAGMA foreign_keys = ON;");

// 2. Validasi Khusus: Jika database yang dibuka BUKAN database soal (misal: database pelanggan),
// pastikan kita mengecek apakah tabel 'soal' sudah ada atau apakah ini database yang valid.
// Catatan: Jika ini adalah inisialisasi awal database baru, tabel 'soal' akan dibuat.
// Tapi jika mengecek database asing (seperti pelanggan.db), kita bisa periksa eksistensinya.
const cekTabelSoal = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='soal';")
  .get();

// Jika file database sudah ada isinya tapi TIDAK punya tabel 'soal' (misal: pelanggan.db),
// kita tolak agar tidak salah memproses atau merusak database lain.
const cekFileEksis = db
  .prepare("SELECT COUNT(*) as cnt FROM sqlite_master")
  .get();
if (cekFileEksis.cnt > 0 && !cekTabelSoal) {
  // Cek apakah ada tabel lain seperti 'pelanggan' yang menandakan ini database salah
  const cekPelanggan = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pelanggan';",
    )
    .get();

  if (cekPelanggan) {
    console.error(
      `Error: Ditemukan database asing (tabel 'pelanggan'). Migrasi dibatalkan untuk mencegah kerusakan.`,
    );
    db.close();
    process.exit(1);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS soal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pertanyaan TEXT NOT NULL,
    jawaban TEXT,
    kategori_id INTEGER
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS opsi_jawaban (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    soal_id INTEGER,
    teks_opsi TEXT,
    is_correct INTEGER DEFAULT 0,
    FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE
  );
`);

const cekSoal = db.prepare("SELECT COUNT(*) as total FROM soal").get();
if (cekSoal.total === 0) {
  db.prepare(
    `
    INSERT INTO soal (id, pertanyaan, jawaban, kategori_id) 
    VALUES 
    (1, 'Ibukota Indonesia adalah?', 'Jakarta', 1),
    (2, 'Bahasa pemrograman web standar adalah?', 'JavaScript', 1);
  `,
  ).run();
  console.log("Log: Data dummy soal berhasil dimasukkan.");
}

const cekData = db.prepare("SELECT COUNT(*) as total FROM opsi_jawaban").get();

if (cekData.total > 0) {
  console.log(
    "Log: Migrasi sudah pernah dilakukan sebelumnya. Tidak ada data yang diproses ulang.",
  );
} else {
  console.log(
    "Log: Memulai migrasi data jawaban lama ke tabel opsi_jawaban...",
  );

  const soalLama = db.prepare("SELECT id, jawaban FROM soal").all();

  if (soalLama.length === 0) {
    console.log(
      "Log: Peringatan - Tabel 'soal' kosong atau tidak ada data yang bisa dimigrasi.",
    );
  } else {
    const insertOpsi = db.prepare(`
      INSERT INTO opsi_jawaban (soal_id, teks_opsi, is_correct) 
      VALUES (?, ?, ?)
    `);

    const jalankanMigrasi = db.transaction((listSoal) => {
      for (const s of listSoal) {
        insertOpsi.run(s.id, s.jawaban, 1);
      }
    });

    jalankanMigrasi(soalLama);
    console.log("Log: Migrasi data selesai dengan sukses.");
  }
}

db.close();
console.log("Koneksi database ditutup.");
