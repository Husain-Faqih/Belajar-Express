const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

let daftarSoal = [
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

app.post("/soal", (req, res) => {
  const { pertanyaan, jawaban } = req.body;

  if (!pertanyaan || jawaban) {
    return res
      .status(400)
      .json({ pesan: "Pertanyaan dan jawaban wajib diisi!" });
  }

  const idBaru =
    daftarSoal.length > 0 ? daftarSoal[daftarSoal.length - 1].id + 1 : 1;

  const soalBaru = {
    id: idBaru,
    pertanyaan: pertanyaan,
    jawaban: jawaban,
  };

  daftarSoal.push(soalBaru);
  res.status(201).json(soalBaru);
});

app.put("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const { pertanyaan, jawaban } = req.body;
  const index = daftarSoal.findIndex((s) => s.id === idSoal);

  if (index !== -1) {
    daftarSoal[index] = {
      id: idSoal,
      pertanyaan: pertanyaan || daftarSoal[index].pertanyaan,
      jawaban: jawaban || daftarSoal[index].jawaban,
    };

    res.json(daftarSoal[index]);
  } else {
    res.status(404).json({ pesan: "Soal tidak di temukan!" });
  }
});

app.delete("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const index = daftarSoal.findIndex((s) => s.id === idSoal);

  if (index !== -1) {
    const soalDihapus = daftarSoal.splice(index, 1);
    res.json({ pesan: "Soal berhasil dihapus!", data: soalDihapus[0] });
  } else {
    res.status(404).json({ pesan: "Soal tidak ditemukan!" });
  }
});

app.listen(PORT, () => {
  console.log(`Server berhasil berjalan di http://localhost:${PORT}`);
});
