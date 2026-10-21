const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("Server jalan!");
});

app.get("/soal", (req, res) => {
  const daftarSoal = bacaDataSoal();
  res.json(daftarSoal);
});

app.get("/soal/:id", (req, res) => {
  const daftarSoal = bacaDataSoal();
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

  if (!pertanyaan || !jawaban) {
    return res
      .status(400)
      .json({ pesan: "Pertanyaan dan jawaban wajib diisi!" });
  }

  const daftarSoal = bacaDataSoal();

  const idBaru =
    daftarSoal.length > 0 ? daftarSoal[daftarSoal.length - 1].id + 1 : 1;

  const soalBaru = {
    id: idBaru,
    pertanyaan: pertanyaan,
    jawaban: jawaban,
  };

  daftarSoal.push(soalBaru);
  simpanDataSoal(daftarSoal);
  res.status(201).json(soalBaru);
});

app.put("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const { pertanyaan, jawaban } = req.body;
  const daftarSoal = bacaDataSoal();
  const index = daftarSoal.findIndex((s) => s.id === idSoal);

  if (index !== -1) {
    daftarSoal[index] = {
      id: idSoal,
      pertanyaan: pertanyaan || daftarSoal[index].pertanyaan,
      jawaban: jawaban || daftarSoal[index].jawaban,
    };

    simpanDataSoal(daftarSoal); 
    res.json(daftarSoal[index]);
  } else {
    res.status(404).json({ pesan: "Soal tidak di temukan!" });
  }
});

app.delete("/soal/:id", (req, res) => {
  const idSoal = parseInt(req.params.id);
  const daftarSoal = bacaDataSoal();
  const index = daftarSoal.findIndex((s) => s.id === idSoal);

  if (index !== -1) {
    const soalDihapus = daftarSoal.splice(index, 1);
    simpanDataSoal(daftarSoal); 
    res.json({ pesan: "Soal berhasil dihapus!", data: soalDihapus[0] });
  } else {
    res.status(404).json({ pesan: "Soal tidak ditemukan!" });
  }
});

app.post("/soal/cari", (req, res) => {
  const { cari } = req.body;
  const daftarSoal = bacaDataSoal();

  if (!cari) {
    return res
      .status(400)
      .json({ pesan: "Kata kunci 'cari' wajib diisi di body!" });
  }

  const hasilFilter = daftarSoal.filter((s) =>
    s.pertanyaan.toLowerCase().includes(cari.toLowerCase()),
  );

  res.json(hasilFilter);
});

app.query("/soal/cari", (req, res) => {
  const { cari } = req.body;
  const daftarSoal = bacaDataSoal();

  if (!cari) {
    return res
      .status(400)
      .json({ pesan: "Kata kunci 'cari' wajib diisi di body!" });
  }

  const hasilFilter = daftarSoal.filter((s) =>
    s.pertanyaan.toLowerCase().includes(cari.toLowerCase()),
  );

  res.json(hasilFilter);
});

app.listen(PORT, () => {
  console.log(`Server berhasil berjalan di http://localhost:${PORT}`);
});
