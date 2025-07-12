let latitude = "";
let longitude = "";

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      document.getElementById("lokasiText").innerText =
        "Lokasi: " + latitude + ", " + longitude;
    }, function() {
      alert("Gagal ambil lokasi.");
    });
  } else {
    alert("Browser tidak mendukung GPS.");
  }
}

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
        document.getElementById("kelurahanPelanggan").innerText = "-";
        document.getElementById("rtrwPelanggan").innerText = "-";
        document.getElementById("golonganPelanggan").innerText = "-";
        document.getElementById("meterPelanggan").innerText = "-";
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

function submitData() {
  const nama = document.getElementById("nama").value.trim();
  const nomor = document.getElementById("nomorPelanggan").value.trim();
  const file = document.getElementById("foto").files[0];
  const btn = document.getElementById("submitBtn");

  if (!nama || !nomor || !file || !latitude || !longitude) {
    alert("Semua data wajib diisi dan lokasi harus diambil.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Mengirim...";

  const reader = new FileReader();
  reader.onload = function() {
    const base64Foto = reader.result.split(",")[1];

    fetch("https://script.google.com/macros/s/AKfycbwyKmL6dNBfr-VoP-JdTr2tO5ltDSmIDzKewQf0RsWepORUX1xW2C_L_-m3wCS8h4JE/exec", {
      method: "POST",
      body: new URLSearchParams({
        nama: nama,
        nomor: nomor,
        latitude: latitude,
        longitude: longitude,
        foto: base64Foto
      })
    })
    .then(res => res.text())
    .then(res => {
      alert("✅ Berhasil dikirim!");
      window.location.reload();
    })
    .catch(err => {
      alert("❌ Gagal kirim: " + err);
      btn.disabled = false;
      btn.innerText = "Kirim";
    });
  };

  reader.readAsDataURL(file);
}
