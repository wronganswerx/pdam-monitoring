// Versi Final main.js Monitoring PDAM - Kompatibel dengan HTML & CSS terbaru

let latitude = "";
let longitude = "";

// Ambil lokasi GPS
function getLocation() {
  const lokasiText = document.getElementById("lokasiText");
  lokasiText.innerText = "📍 Mengambil lokasi...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      lokasiText.innerText = "Lokasi: " + latitude + ", " + longitude;
    }, function () {
      lokasiText.innerText = "❌ Gagal ambil lokasi.";
      alert("Gagal ambil lokasi.");
    });
  } else {
    lokasiText.innerText = "❌ Browser tidak mendukung GPS.";
    alert("Browser tidak mendukung GPS.");
  }
}

// Lookup pelanggan
function lookupPelanggan() {
  const nomor = document.getElementById("nomorPelanggan").value.trim();
  if (nomor.length < 5) return;

  document.getElementById("namaPelanggan").innerText = "⏳ Mencari...";
  document.getElementById("alamatPelanggan").innerText = "";
  document.getElementById("kelurahanPelanggan").innerText = "";
  document.getElementById("rtrwPelanggan").innerText = "";
  document.getElementById("golonganPelanggan").innerText = "";
  document.getElementById("meterPelanggan").innerText = "";

  fetch("https://script.google.com/macros/s/AKfycbwyKmL6dNBfr-VoP-JdTr2tO5ltDSmIDzKewQf0RsWepORUX1xW2C_L_-m3wCS8h4JE/exec?nomor=" + nomor)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById("namaPelanggan").innerText = "-";
        document.getElementById("alamatPelanggan").innerText = "Tidak ditemukan";
      } else {
        document.getElementById("namaPelanggan").innerText = data.nama;
        document.getElementById("alamatPelanggan").innerText = data.alamat;
        document.getElementById("kelurahanPelanggan").innerText = data.kelurahan;
        document.getElementById("rtrwPelanggan").innerText = `${data.rt} / ${data.rw}`;
        document.getElementById("golonganPelanggan").innerText = data.gol;
        document.getElementById("meterPelanggan").innerText = data.meter;
      }
    })
    .catch(() => {
      document.getElementById("namaPelanggan").innerText = "❌ Gagal ambil data";
    });
}

// Kirim data
function submitData() {
  const nama = document.getElementById("nama").value.trim();
  const nomor = document.getElementById("nomorPelanggan").value.trim();
  const file = document.getElementById("foto").files[0];
  const catatan = document.getElementById("catatan").value.trim();
  const btn = document.getElementById("submitBtn");

  if (!nama || !nomor || !file || !latitude || !longitude) {
    alert("Semua data wajib diisi dan lokasi harus diambil.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Mengirim...";

  const reader = new FileReader();
  reader.onload = function () {
    const base64Foto = reader.result.split(",")[1];
    const formData = {
      nama,
      nomor,
      catatan,
      latitude,
      longitude,
      foto: base64Foto
    };

    fetch("https://script.google.com/macros/s/AKfycbwyKmL6dNBfr-VoP-JdTr2tO5ltDSmIDzKewQf0RsWepORUX1xW2C_L_-m3wCS8h4JE/exec", {
      method: "POST",
      body: new URLSearchParams(formData)
    })
    .then(res => res.text())
    .then(() => {
      alert("✅ Berhasil dikirim!");
      saveToHistory({ ...formData, status: "berhasil", waktu: new Date().toLocaleString() });
      btn.disabled = false;
      btn.innerText = "Kirim";
      resetForm();
    })
    .catch(() => {
      alert("📥 Disimpan karena gagal kirim (offline/jaringan)");
      saveToHistory({ ...formData, status: "tertunda", waktu: new Date().toLocaleString() });
      btn.disabled = false;
      btn.innerText = "Kirim";
      resetForm();
    });
  };

  reader.readAsDataURL(file);
}

function resetForm() {
  document.getElementById("foto").value = "";
  document.getElementById("catatan").value = "";
  document.getElementById("nomorPelanggan").value = "";
  document.getElementById("namaPelanggan").innerText = "-";
  document.getElementById("alamatPelanggan").innerText = "-";
  document.getElementById("kelurahanPelanggan").innerText = "-";
  document.getElementById("rtrwPelanggan").innerText = "-";
  document.getElementById("golonganPelanggan").innerText = "-";
  document.getElementById("meterPelanggan").innerText = "-";
  document.getElementById("lokasiText").innerText = "Lokasi: belum diambil";
  latitude = "";
  longitude = "";
}

// Simpan jika gagal kirim
function saveToHistory(data) {
  const logs = JSON.parse(localStorage.getItem("logPDAM") || "[]");
  logs.push(data);
  localStorage.setItem("logPDAM", JSON.stringify(logs));
}

// Upload ulang satuan
function uploadUlang(index) {
  const logs = JSON.parse(localStorage.getItem("logPDAM") || "[]");
  const data = logs[index];

  fetch("https://script.google.com/macros/s/AKfycbwyKmL6dNBfr-VoP-JdTr2tO5ltDSmIDzKewQf0RsWepORUX1xW2C_L_-m3wCS8h4JE/exec", {
    method: "POST",
    body: new URLSearchParams(data)
  })
    .then(res => res.text())
    .then(() => {
      logs[index].status = "berhasil";
      localStorage.setItem("logPDAM", JSON.stringify(logs));
      tampilkanRiwayat();
      tampilkanOfflineLog();
    })
    .catch(() => {
      alert("❌ Gagal upload ulang.");
    });
}

// Upload ulang semua
function uploadSemua() {
  const logs = JSON.parse(localStorage.getItem("logPDAM") || "[]");

  logs.forEach((data, i) => {
    if (data.status === "tertunda") {
      fetch("https://script.google.com/macros/s/AKfycbwyKmL6dNBfr-VoP-JdTr2tO5ltDSmIDzKewQf0RsWepORUX1xW2C_L_-m3wCS8h4JE/exec", {
        method: "POST",
        body: new URLSearchParams(data)
      })
        .then(res => res.text())
        .then(() => {
          logs[i].status = "berhasil";
          localStorage.setItem("logPDAM", JSON.stringify(logs));
          tampilkanRiwayat();
          tampilkanOfflineLog();
        });
    }
  });
}

// Tampilkan data lokal
function tampilkanRiwayat() {
  const logs = JSON.parse(localStorage.getItem("logPDAM") || "[]");
  const div = document.getElementById("riwayat");
  if (!div) return;

  div.innerHTML = "";

  if (logs.length === 0) {
    div.innerHTML = "<p>Tidak ada data.</p>";
    return;
  }

  logs.reverse().forEach((log, i) => {
    const card = document.createElement("div");
    card.className = "riwayat-card";
    card.innerHTML = `
      <b>${log.nama} (${log.nomor})</b><br>
      <small>${log.waktu}</small><br>
      <span>Status: ${log.status === "berhasil" ? "✅" : "⏳ Tertunda"}</span>
      ${log.status === "tertunda" ? `<br><button onclick="uploadUlang(${i})">Upload Ulang</button>` : ""}
      <hr>
    `;
    div.appendChild(card);
  });
}

// QR SCAN
function startQRScan() {
  const qrDiv = document.getElementById("reader");
  qrDiv.style.display = "block";

  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 200, height: 200 } },
    (decodedText) => {
      document.getElementById("nomorPelanggan").value = decodedText;
      lookupPelanggan();
      html5QrCode.stop();
      qrDiv.style.display = "none";
    }
  ).catch((err) => {
    alert("Gagal memulai scanner: " + err);
    qrDiv.style.display = "none";
  });
}

// Navigasi
function toggleMenu() {
  document.getElementById("menu").classList.toggle("hidden");
}

function showPage(pageId) {
  document.getElementById("formPage").style.display = "none";
  document.getElementById("riwayatPage").style.display = "none";

  document.getElementById(pageId).style.display = "block";
  document.getElementById("menu").classList.add("hidden");

  if (pageId === "riwayatPage") {
    loadRiwayat();
  }
}

// Riwayat kunjungan dari server
function loadRiwayat() {
  const riwayatList = document.getElementById("riwayatList");
  const namaPetugas = document.getElementById("nama").value.trim().toLowerCase();

  if (!riwayatList || !namaPetugas) {
    riwayatList.innerHTML = "<p>Masukkan nama petugas terlebih dahulu.</p>";
    return;
  }

  riwayatList.innerHTML = "⏳ Memuat data...";

  fetch("https://script.google.com/macros/s/AKfycbwyKmL6dNBfr-VoP-JdTr2tO5ltDSmIDzKewQf0RsWepORUX1xW2C_L_-m3wCS8h4JE/exec?log=true")
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        riwayatList.innerHTML = "❌ Gagal ambil data riwayat.";
        return;
      }

      const dataPetugas = data.filter(row => (row[1] || "").toLowerCase() === namaPetugas);

      if (dataPetugas.length === 0) {
        riwayatList.innerHTML = "<p>Tidak ada data kunjungan oleh Anda.</p>";
        return;
      }

      riwayatList.innerHTML = "";
      dataPetugas.forEach(row => {
        const div = document.createElement("div");
        div.className = "riwayat-card";
        div.innerHTML = `
          <p><strong>Nama:</strong> ${row[1]}</p>
          <p><strong>No PDAM:</strong> ${row[2]}</p>
          <p><strong>Lokasi:</strong> ${row[3]}, ${row[4]}</p>
          <p><strong>Catatan:</strong> ${row[5]}</p>
          <p><a href="${row[6]}" target="_blank">📷 Lihat Foto</a></p>
          <p><em>${new Date(row[0]).toLocaleString()}</em></p>
        `;
        riwayatList.appendChild(div);
      });
    })
    .catch(() => {
      riwayatList.innerHTML = "❌ Gagal ambil data riwayat.";
    });
}

// Tampilkan data tertunda (offline)
function tampilkanOfflineLog() {
  const div = document.getElementById("offlineLog");
  const logs = JSON.parse(localStorage.getItem("logPDAM") || "[]");
  const tertunda = logs.filter(log => log.status === "tertunda");

  if (tertunda.length === 0) {
    div.innerHTML = "<p>Tidak ada data offline yang tertunda.</p>";
  } else {
    div.innerHTML = "<b>🗃 Data Tertunda (Offline):</b><ul>" +
      tertunda.map(log => `<li>${log.nama} (${log.nomor}) - Lokasi: ${log.latitude}, ${log.longitude}</li>`).join("") +
      "</ul>";
  }

  div.style.display = "block";
}
