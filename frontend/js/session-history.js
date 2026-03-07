document.addEventListener("DOMContentLoaded", async () => {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== "teacher") {
    window.location.replace("login.html");
    return;
  }

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  let allSessions = [];
  let currentMonth = "all";

  async function loadHistory() {
    try {
      const res = await fetchAPI("/api/attendance/session-history-full");
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) return;

      const data = await res.json();
      if (!res.ok) return;

      allSessions = data;
      updateSummaryCards(data);
      renderMonthFilter(data);
      renderSessions(data);

    } catch (err) {
      console.error("History load error:", err);
    }
  }

  function updateSummaryCards(data) {
    const totalPresent = data.reduce((sum, s) => sum + s.presentCount, 0);
    const totalAbsent = data.reduce((sum, s) => sum + s.absentCount, 0);

    const now = new Date();
    const thisMonthCount = data.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    document.getElementById("totalSessions").innerText = data.length;
    document.getElementById("totalPresent").innerText = totalPresent;
    document.getElementById("totalAbsent").innerText = totalAbsent;
    document.getElementById("thisMonth").innerText = thisMonthCount;
  }

  function renderMonthFilter(data) {
    const months = [...new Set(data.map(s => {
      const d = new Date(s.date);
      return d.getFullYear() + "-" + d.getMonth();
    }))];

    const filterEl = document.getElementById("monthFilter");
    filterEl.innerHTML = `
      <button class="month-btn active" data-month="all">📅 All Months</button>
      ${months.map(m => {
        const [year, mon] = m.split("-");
        return `<button class="month-btn" data-month="${m}">${MONTHS[parseInt(mon)]} ${year}</button>`;
      }).join("")}
    `;

    filterEl.querySelectorAll(".month-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        filterEl.querySelectorAll(".month-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentMonth = btn.dataset.month;

        let filtered = allSessions;
        if (currentMonth !== "all") {
          const [year, mon] = currentMonth.split("-");
          filtered = allSessions.filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(mon);
          });
        }
        renderSessions(filtered);
      });
    });
  }

  function renderSessions(sessions) {
    const listEl = document.getElementById("sessionList");

    if (sessions.length === 0) {
      listEl.innerHTML = `<p class="empty-msg">Is month koi session nahi hua</p>`;
      return;
    }

    listEl.innerHTML = sessions.map(s => {
      const date = new Date(s.date);
      const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const dayStr = date.toLocaleDateString("en-IN", { weekday: "long" });

      // Duration format
      const dur = s.duration ? `${Math.floor(s.duration / 60)}m ${s.duration % 60}s` : "N/A";

      // Present students list
      const studentsList = s.presentStudents?.length > 0
        ? s.presentStudents.map(name => `<span class="student-chip">👤 ${name}</span>`).join("")
        : `<span style="color:#9ca3af;font-size:13px">Koi present nahi tha</span>`;

      return `
        <div class="session-card ${s.isActive ? "active-session" : ""}">

          <div class="session-top">
            <div class="session-left">
              <span class="session-subject">📘 ${s.subject}</span>
              <span class="session-class">🏫 ${s.className}</span>
            </div>
            <span class="session-badge ${s.isActive ? "badge-active" : "badge-closed"}">
              ${s.isActive ? "🟢 Active" : "⚫ Closed"}
            </span>
          </div>

          <div class="session-meta">
            <span>📅 ${dateStr}</span>
            <span>🕐 ${timeStr}</span>
            <span>📆 ${dayStr}</span>
            <span>⏱️ Duration: ${dur}</span>
          </div>

          <div class="session-stats">
            <div class="stat-box present-box">
              <span class="stat-num">${s.presentCount}</span>
              <span class="stat-label">Present</span>
            </div>
            <div class="stat-box absent-box">
              <span class="stat-num">${s.absentCount}</span>
              <span class="stat-label">Absent</span>
            </div>
            <div class="stat-box total-box">
              <span class="stat-num">${s.presentCount + s.absentCount}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-box percent-box">
              <span class="stat-num">${s.presentCount + s.absentCount > 0
                ? Math.round((s.presentCount / (s.presentCount + s.absentCount)) * 100)
                : 0}%</span>
              <span class="stat-label">Attendance</span>
            </div>
          </div>

          <div class="present-students">
            <p class="students-label">✅ Present Students:</p>
            <div class="students-chips">${studentsList}</div>
          </div>

        </div>
      `;
    }).join("");
  }

  loadHistory();
});