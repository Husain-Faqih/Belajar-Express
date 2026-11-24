const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = process.argv[2] || "soal-awal.db";

if (!fs.existsSync(dbPath)) {
  console.error(
    `Error: File database '${dbPath}' tidak ditemukan. Migrasi dibatalkan.`,
  );
  process.exit(1);
}

const db = new Database(dbPath);

db.exec("PRAGMA foreign_keys = ON;");
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
  console.error("Error: Tabel 'soal' kosong. Tidak ada data untuk dimigrasi.");
  db.close();
  process.exit(1);
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

db.close();
console.log("Koneksi database ditutup.");
