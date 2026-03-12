const token = localStorage.getItem("token");

let html5QrCode = null;
let scanDone = false;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultArea = document.getElementById("resultArea");

startBtn.addEventListener("click", () => {
  scanDone = false;
  resultArea.innerHTML = `<div class="result-info">📷 Starting camera...</div>`;

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
    resultArea.innerHTML = `<div class="result-info">🔍 Place the QR Code in front of the camera...</div>`;
  }).catch(err => {
    resultArea.innerHTML = `<div class="result-error">❌ Camera could not open: ${err}<br><small>Please allow camera permission in your browser!</small></div>`;
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
    let qrData;
    try {
      qrData = JSON.parse(decodedText);
    } catch {
      resultArea.innerHTML = `<div class="result-error">❌ Invalid QR Code! This is not a Smart Attendance QR Code.</div>`;
      scanDone = false;
      return;
    }

    const sessionId = qrData.sessionId;

    if (!sessionId) {
      resultArea.innerHTML = `<div class="result-error">❌ No Session ID found in QR Code!</div>`;
      scanDone = false;
      return;
    }

    resultArea.innerHTML = `<div class="result-info">⏳ Marking attendance...</div>`;

    const res = await fetchAPI("/api/attendance/mark", {
      method: "POST",
      body: JSON.stringify({ sessionId })
    });

    const data = await res.json();

    if (res.ok) {
      resultArea.innerHTML = `
        <div class="result-success">
          ✅ ${data.message}<br>
          <small>Go to the Dashboard to check your attendance</small>
        </div>
      `;
    } else {
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
  // Silent — scan errors are normal
}