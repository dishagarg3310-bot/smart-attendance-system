const token = localStorage.getItem("token");

let html5QrCode = null;
let scanDone = false;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultArea = document.getElementById("resultArea");

// Camera start karo
startBtn.addEventListener("click", () => {
  scanDone = false;
  resultArea.innerHTML = `<div class="result-info">📷 Camera start...</div>`;

  html5QrCode = new Html5Qrcode("qr-reader");

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    onScanSuccess,
    onScanError
  ).then(() => {
    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    resultArea.innerHTML = `<div class="result-info">🔍 Set Camera in front of QR Code...</div>`;
  }).catch(err => {
    resultArea.innerHTML = `<div class="result-error">❌ Camera not opened: ${err}<br><small>Give Camera permission to browser!</small></div>`;
  });
});

stopBtn.addEventListener("click", () => {
  stopCamera();
});

function stopCamera() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
    }).catch(() => {});
  }
  startBtn.style.display = "inline-block";
  stopBtn.style.display = "none";
}

async function onScanSuccess(decodedText) {
  if (scanDone) return;
  scanDone = true;

  stopCamera();

  try {
    // ✅ FIX: QR data parse karo — invalid JSON check
    let qrData;
    try {
      qrData = JSON.parse(decodedText);
    } catch {
      resultArea.innerHTML = `<div class="result-error">❌ Invalid QR Code! That is not a Smart Attendance QR Code.</div>`;
      scanDone = false;
      return;
    }

    const sessionId = qrData.sessionId;

    if (!sessionId) {
      resultArea.innerHTML = `<div class="result-error">❌ No Session Id in QR!</div>`;
      scanDone = false;
      return;
    }

    resultArea.innerHTML = `<div class="result-info">⏳ Attendance marked!...</div>`;

    const res = await fetchAPI("/api/attendance/mark", {
      method: "POST",
      body: JSON.stringify({ sessionId })
    });

    const data = await res.json();

    if (res.ok) {
      resultArea.innerHTML = `
        <div class="result-success">
          ✅ ${data.message}<br>
          <small>Go To the Dashboard to Check Attendance</small>
        </div>
      `;
    } else {
      // ✅ FIX: Exact server message dikhao
      resultArea.innerHTML = `<div class="result-error">❌ ${data.message}</div>`;
      scanDone = false;
    }

  } catch (err) {
    console.error("Scan error:", err);
    resultArea.innerHTML = `<div class="result-error">❌ Connection failed: ${err.message}</div>`;
    scanDone = false;
  }
}

function onScanError(err) {
  // Silent — scan errors normal hote hain
}