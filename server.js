const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3000;
const Database = require("better-sqlite3");
const db = new Database("soal.db");

app.use(express.json());

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS soal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pertanyaan TEXT,
    jawaban TEXT
  )
`,
).run();

const cekData = db.prepare("SELECT COUNT(*) as total FROM soal").get();

if (cekData.total === 0) {
  try {
    const dataJson = fs.readFileSync("soal.json", "utf-8");
    const daftarSoalLama = JSON.parse(dataJson);

    const insertData = db.prepare(
      "INSERT INTO soal (pertanyaan, jawaban) VALUES (?, ?)",
    );

    const simpanBanyakData = db.transaction((soals) => {
      for (let soal of soals) {
        insertData.run(soal.pertanyaan, soal.jawaban);
      }
    });

    simpanBanyakData(daftarSoalLama);
    console.log("Berhasil migrasi data dari soal.json ke SQLite!");
  } catch (error) {
    console.log(
      "File soal.json tidak ditemukan atau kosong, migrasi dilewati.",
    );
  }
} else {
  console.log("Data di database sudah ada, migrasi dilewati.");
}

app.get("/", (req, res) => {
  res.send("Server jalan!");
});

app.get("/soal", (req, res) => {
  const daftarSoal = db.prepare("SELECT * FROM soal").all();
  res.json(daftarSoal);
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

const bacaDataSoal = () => {
  try {
    const dataBuffer = fs.readFileSync("soal.json", "utf8");
    return JSON.parse(dataBuffer);
  } catch (error) {
    return [];
  }
};

const simpanDataSoal = (data) => {
  fs.writeFileSync("soal.json", JSON.stringify(data, null, 2), "utf8");
};

app.post("/soal", (req, res) => {
  const { pertanyaan, jawaban } = req.body;
  if (!pertanyaan || !jawaban) {
    return res
      .status(400)
      .json({ pesan: "Pertanyaan dan jawaban wajib diisi!" });
  }

  const info = db
    .prepare("INSERT INTO soal (pertanyaan, jawaban) VALUES (?, ?)")
    .run(pertanyaan, jawaban);
  res.status(201).json({ id: info.lastInsertRowid, pertanyaan, jawaban });
});

app.listen(PORT, () => {
  console.log(`Server berhasil berjalan di http://localhost:${PORT}`);
});
