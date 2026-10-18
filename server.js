const express = require("express");
const app = express();
const PORT = 3000;

const daftarSoal = [
  {
    id: 1,
    pertanyaan: "Apa kepanjangan dari HTML?",
    jawaban: "HyperText Markup Language",
  },
  {
    id: 2,
    pertanyaan: "Framework JS apa yang di pakai buat backend?",
    jawaban: "Express.js",
  },
  {
    id: 3,
    pertanyaan: "Port berapa yang sedang di pakai server ini?",
    jawaban: "3000",
  },
];

app.get("/", (req, res) => {
  res.send("Server jalan!");
});

app.get("/soal", (req, res) => {
  res.json(daftarSoal);
});

app.get("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const soal = daftarSoal.find((s) => s.id === idSoal);

  if (soal) {
    res.json(soal);
  } else {
    res.status(404).json({ pesan: "Soal tidak di temukan!" });
  }
});

app.listen(PORT, () => {
  console.log(`Server berhasil berjalan di http://localhost:${PORT}`);
});
