document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "teacher") {
    window.location.replace("login.html");
    return;
  }

  const startBtn = document.getElementById("startSession");
  const sessionStatus = document.getElementById("session-status");
  const sessionTimer = document.getElementById("session-timer");
  const presentCount = document.getElementById("present-count");
  const qrCode = document.getElementById("qrCode");
  const qrExpire = document.getElementById("qrExpire");
  const subjectInput = document.getElementById("subjectInput");
  const classInput = document.getElementById("classInput");

  let sessionActive = false;
  let totalSeconds = 300;
  let timerInterval = null;
  let qrInterval = null;
  let countInterval = null;
  let currentSessionId = null;

  // ✅ Session history load karo
  async function loadSessionHistory() {
    try {
      const res = await fetchAPI("/api/attendance/session-history");
      const data = await res.json();
      if (!res.ok) return;

      const historyEl = document.getElementById("sessionHistory");
      const totalEl = document.getElementById("total-sessions");
      if (totalEl) totalEl.innerText = data.length;

      if (data.length === 0) {
        historyEl.innerHTML = `<p class="empty-msg">There is no Session history yet.</p>`;
        return;
      }

      historyEl.innerHTML = data.map(s => {
        const date = new Date(s.date).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric"
        });
        const time = new Date(s.date).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit"
        });
        return `
          <div class="history-item">
            <div class="history-info">
              <span class="history-subject">📘 ${s.subject}</span>
              <span class="history-class">🏫 ${s.className}</span>
              <span class="history-date">📅 ${date} ${time}</span>
            </div>
            <div class="history-right">
              <span class="history-present">✅ ${s.presentCount} Present</span>
              <span class="history-badge ${s.isActive ? 'badge-active' : 'badge-closed'}">
                ${s.isActive ? "Active" : "Closed"}
              </span>
            </div>
          </div>
        `;
      }).join("");
    } catch (err) {
      console.error("History load error:", err);
    }
  }

  // ✅ Restore session on page refresh
  function restoreSession() {
    const savedSessionId = localStorage.getItem("activeSessionId");
    const savedSeconds = parseInt(localStorage.getItem("sessionSeconds"));
    const savedSubject = localStorage.getItem("sessionSubject");
    const savedClass = localStorage.getItem("sessionClass");

    if (savedSessionId && savedSeconds && savedSeconds > 0) {
      currentSessionId = savedSessionId;
      sessionActive = true;
      totalSeconds = savedSeconds;

      sessionStatus.innerText = "ACTIVE";
      sessionStatus.style.color = "#16a34a";
      startBtn.innerText = "Stop Session";
      startBtn.style.background = "linear-gradient(90deg,#dc2626,#ef4444)";

      if (subjectInput && savedSubject) subjectInput.value = savedSubject;
      if (classInput && savedClass) classInput.value = savedClass;

      refreshQR();
      startTimer();
      countInterval = setInterval(() => fetchPresentCount(), 5000);
      qrInterval = setInterval(() => refreshQR(), 60000);
      fetchPresentCount();
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      sessionActive ? stopSession() : startSession();
    });
  }

  async function startSession() {
    const subject = subjectInput?.value.trim() || "General";
    const className = classInput?.value.trim() || "General";

    if (!subject || !className) {
      alert("Fill Subject and Classes!");
      return;
    }

    try {
      const res = await fetchAPI("/api/session/start", {
        method: "POST",
        body: JSON.stringify({ subject, className })
      });

      const data = await res.json();
      if (!res.ok) { alert(data.message || "Session has not started yet!"); return; }

      currentSessionId = data.sessionId;
      sessionActive = true;
      totalSeconds = 300;

      localStorage.setItem("activeSessionId", currentSessionId);
      localStorage.setItem("sessionSeconds", totalSeconds);
      localStorage.setItem("sessionSubject", subject);
      localStorage.setItem("sessionClass", className);

      sessionStatus.innerText = "ACTIVE";
      sessionStatus.style.color = "#16a34a";
      startBtn.innerText = "Stop Session";
      startBtn.style.background = "linear-gradient(90deg,#dc2626,#ef4444)";
      if (presentCount) presentCount.innerText = "0";

      showQR(data.qrCode);
      startTimer();
      countInterval = setInterval(() => fetchPresentCount(), 5000);
      qrInterval = setInterval(() => refreshQR(), 60000);

    } catch (err) {
      console.error(err);
      alert("Server error!");
    }
  }

  async function fetchPresentCount() {
    if (!currentSessionId) return;
    try {
      const res = await fetchAPI(`/api/attendance/session-count/${currentSessionId}`);
      const data = await res.json();
      if (res.ok && presentCount) presentCount.innerText = data.count || 0;
    } catch (err) {
      console.error("Count fetch error:", err);
    }
  }

  async function stopSession() {
    if (currentSessionId) {
      await fetchAPI(`/api/session/stop/${currentSessionId}`, { method: "POST" });
      await fetchPresentCount();
    }

    sessionActive = false;
    currentSessionId = null;

    clearInterval(timerInterval);
    clearInterval(qrInterval);
    clearInterval(countInterval);
    timerInterval = qrInterval = countInterval = null;

    localStorage.removeItem("activeSessionId");
    localStorage.removeItem("sessionSeconds");
    localStorage.removeItem("sessionSubject");
    localStorage.removeItem("sessionClass");

    sessionStatus.innerText = "INACTIVE";
    sessionStatus.style.color = "#dc2626";
    if (sessionTimer) sessionTimer.innerText = "00:00:00";
    qrCode.innerHTML = "SESSION CLOSED";
    if (qrExpire) qrExpire.innerText = "";

    startBtn.innerText = "Start Session";
    startBtn.style.background = "linear-gradient(90deg,#0f766e,#14b8a6)";

    // ✅ History reload karo
    loadSessionHistory();
  }

  async function refreshQR() {
    if (!currentSessionId) return;
    try {
      const res = await fetchAPI(`/api/session/refresh-qr/${currentSessionId}`);
      const data = await res.json();
      if (res.ok) showQR(data.qrCode);
    } catch (err) {
      console.error("QR refresh error:", err);
    }
  }

  function showQR(qrDataUrl) {
    qrCode.innerHTML = `<img src="${qrDataUrl}" style="width:200px;height:200px;border-radius:12px;">`;
    let seconds = 60;
    if (qrExpire._countdown) clearInterval(qrExpire._countdown);
    qrExpire._countdown = setInterval(() => {
      seconds--;
      if (qrExpire) qrExpire.innerText = `QR refreshes in ${seconds}s`;
      if (seconds <= 0) clearInterval(qrExpire._countdown);
    }, 1000);
  }

  function startTimer() {
    updateTimer();
    timerInterval = setInterval(() => {
      totalSeconds--;
      localStorage.setItem("sessionSeconds", totalSeconds);
      updateTimer();
      if (totalSeconds <= 0) {
        stopSession();
        alert("Session Time Over!");
      }
    }, 1000);
  }

  function updateTimer() {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    if (sessionTimer) sessionTimer.innerText = `00:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }

  restoreSession();
  loadSessionHistory();
});