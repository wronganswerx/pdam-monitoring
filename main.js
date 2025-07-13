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

// Cari data pelanggan dari Google Sheet
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
        window.location.reload();
      })
      .catch(err => {
        alert("📥 Disimpan karena gagal kirim (offline/jaringan)");
        saveToHistory({ ...formData, status: "tertunda", waktu: new Date().toLocaleString() });
        btn.disabled = false;
        btn.innerText = "Kirim";
        window.location.reload();
      });
  };

  reader.readAsDataURL(file);
}

// Simpan data lokal
function saveToHistory(data) {
  const logs = JSON.parse(localStorage.getItem("logPDAM") || "[]");
  logs.push(data);
  localStorage.setItem("logPDAM", JSON.stringify(logs));
}

// Tampilkan riwayat
function tampilkanRiwayat() {
  const logs = JSON.parse(localStorage.getItem("logPDAM") || "[]");
  const div = document.getElementById("riwayat");
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

// Upload ulang data tertunda
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
    })
    .catch(() => {
      alert("❌ Gagal upload ulang.");
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

// Navigasi halaman
function showPage(pageId) {
  document.getElementById("formPage").style.display = pageId === "formPage" ? "block" : "none";
  document.getElementById("riwayatPage").style.display = pageId === "riwayatPage" ? "block" : "none";

  if (pageId === "riwayatPage") {
    tampilkanRiwayat();
  }
}

// Menu hamburger
function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("show");
}
