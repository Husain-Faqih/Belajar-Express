const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3000;
const Database = require("better-sqlite3");
const db = new Database("soal.db");

app.use(express.json());

db.prepare(
  ` CREATE TABLE IF NOT EXISTS kategori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL
  )
`,
).run();

const cekKategori = db.prepare("SELECT COUNT(*) as total FROM kategori").get();

if (cekKategori.total === 0) {
  const insertKategori = db.prepare("INSERT INTO kategori (nama) VALUES (?)");
  insertKategori.run("Algoritma");
  insertKategori.run("Database");
  insertKategori.run("Bahasa Pemrograman");

  console.log("Berhasil menambahkan data kategori!");
}

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS soal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pertanyaan TEXT,
    jawaban TEXT,
    kategori_id INTEGER,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id)
  )
`,
).run();

const cekData = db.prepare("SELECT COUNT(*) as total FROM soal").get();

if (cekData.total === 0) {
  try {
    const dataJson = fs.readFileSync("soal.json", "utf-8");
    const daftarSoalLama = JSON.parse(dataJson);

    const insertData = db.prepare(
      "INSERT INTO soal (pertanyaan, jawaban, kategori_id) VALUES (?, ?, ?)",
    );

    const simpanBanyakData = db.transaction((soals) => {
      for (let soal of soals) {
        insertData.run(soal.pertanyaan, soal.jawaban, soal.kategori_id);
      }
    });

    simpanBanyakData(daftarSoalLama);
    console.log("Berhasil migrasi data dari soal.json ke SQLite!");
  } catch (error) {
    console.log(
      "File soal.json tidak ditemukan atau formatnya belum ada kategori_id, migrasi dilewati.",
    );
  }
} else {
  console.log("Data di database sudah ada, migrasi dilewati.");
}

app.get("/", (req, res) => {
  res.send("Server jalan!");
});

app.get("/soal", (req, res) => {
  const { kategori } = req.query;
  let query = `
  SELECT
    soal.id,
    soal.pertanyaan,
    soal.jawaban,
    soal.kategori_id,
    kategori.nama AS nama_kategori
  FROM soal
  JOIN kategori ON soal.kategori_id = kategori.id  
  `;

  if (kategori) {
    query += ` WHERE kategori.nama LIKE ? OR kategori.id = ?`;
    const daftarSoal = db.prepare(query).all(`%${kategori}%`, kategori);
    return res.json(daftarSoal);
  }

  const daftarSoal = db.prepare(query).all();
  res.json(daftarSoal);
});

app.get("/soal/cari", (req, res) => {
  const { keyword } = req.query;
  const query = db.prepare("SELECT * FROM soal WHERE pertanyaan LIKE ?");
  const hasil = query.all(`%${keyword}%`);
  res.json(hasil);
});

app.get("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const soal = db.prepare("SELECT * FROM soal WHERE id = ?").get(idSoal);

  if (soal) {
    res.json(soal);
  } else {
    res.status(404).json({ pesan: "Soal tidak ditemukan!" });
  }
});

app.post("/soal", (req, res) => {
  const { pertanyaan, jawaban, kategori_id } = req.body;
  if (!pertanyaan || !jawaban || !kategori_id) {
    return res
      .status(400)
      .json({ pesan: "Pertanyaan, jawaban, dan kategori wajib diisi!" });
  }

  const cekKategori = db
    .prepare("SELECT * FROM kategori WHERE id = ?")
    .get(kategori_id);

  if (!cekKategori) {
    return res.status(400).json({
      pesan: `kategori_id tidak valid, kategori tidak ditemukan!`,
    });
  }

  const info = db
    .prepare(
      "INSERT INTO soal (pertanyaan, jawaban, kategori_id) VALUES (?, ?, ?)",
    )
    .run(pertanyaan, jawaban, kategori_id);
  res
    .status(201)
    .json({
      id: info.lastInsertRowid,
      pertanyaan,
      jawaban,
      kategori_id,
      nama_kategori: cekKategori.nama,
    });
});

app.put("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const { pertanyaan, jawaban, kategori_id } = req.body;

  if (!pertanyaan || !jawaban || !kategori_id) {
    return res
      .status(400)
      .json({ pesan: "Pertanyaan, jawaban, dan kategori wajib diisi!" });
  }

  const query = db.prepare(
    "UPDATE soal SET pertanyaan = ?, jawaban = ?, kategori_id = ? WHERE id = ?",
  );
  const result = query.run(pertanyaan, jawaban, kategori_id, idSoal);

  if (result.changes === 0) {
    return res
      .status(404)
      .json({ pesan: "Soal yang mau di-update tidak ditemukan!" });
  }

  res.json({ pesan: `Soal dengan ID ${idSoal} berhasil di-update!` });
});

app.delete("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const query = db.prepare("DELETE FROM soal WHERE id = ?");
  const result = query.run(idSoal);

  if (result.changes === 0) {
    return res
      .status(404)
      .json({ pesan: "Soal tidak ditemukan untuk dihapus!" });
  }

  res.json({ pesan: `Soal dengan ID ${idSoal} berhasil dihapus!` });
});

app.listen(PORT, () => {
  console.log(`Server berhasil berjalan di http://localhost:${PORT}`);
});
