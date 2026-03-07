document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== "student") {
    window.location.replace("login.html");
    return;
  }

  let allData = [];
  let subjectData = {};
  let currentSubject = null;
  let currentMonth = "all";
  let calendarYear = new Date().getFullYear();
  let calendarMonth = new Date().getMonth();

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  async function fetchAttendance() {
    try {
      const res = await fetchAPI("/api/attendance/my-history");
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) return;

      const data = await res.json();
      if (res.ok) {
        allData = data;
        buildUI(data);
        renderCalendar();
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  // ========== VIEW TOGGLE ==========
  window.switchView = function(view) {
    document.getElementById("tableView").style.display = view === "table" ? "block" : "none";
    document.getElementById("calendarView").style.display = view === "calendar" ? "block" : "none";
    document.getElementById("tableViewBtn").classList.toggle("active", view === "table");
    document.getElementById("calendarViewBtn").classList.toggle("active", view === "calendar");
    if (view === "calendar") renderCalendar();
  };

  // ========== TABLE VIEW ==========
  function buildUI(data) {
    const total = data.length;
    const present = data.filter(r => r.status === "present").length;
    const absent = total - present;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    document.getElementById("totalClasses").innerText = total;
    document.getElementById("presentCount").innerText = present;
    document.getElementById("absentCount").innerText = absent;
    document.getElementById("attendancePercent").innerText = percent + "%";

    subjectData = {};
    data.forEach(r => {
      const sub = r.subject || "Unknown";
      if (!subjectData[sub]) subjectData[sub] = [];
      subjectData[sub].push(r);
    });

    const subjects = Object.keys(subjectData);
    const tabsContainer = document.getElementById("subjectTabs");
    tabsContainer.innerHTML = subjects.map((sub, i) => `
      <button class="tab-btn ${i === 0 ? "active" : ""}" data-subject="${sub}">${sub}</button>
    `).join("");

    tabsContainer.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        tabsContainer.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentSubject = btn.dataset.subject;
        currentMonth = "all";
        renderMonthFilter(currentSubject);
        renderTable(currentSubject, "all");
      });
    });

    if (subjects.length > 0) {
      currentSubject = subjects[0];
      renderMonthFilter(currentSubject);
      renderTable(currentSubject, "all");
    }
  }

  function renderMonthFilter(subject) {
    const records = subjectData[subject] || [];
    const months = [...new Set(records.map(r => {
      const d = new Date(r.date);
      return d.getFullYear() + "-" + d.getMonth();
    }))];

    const section = document.getElementById("subjectWiseSection");
    let filterDiv = document.getElementById("monthFilter");
    if (!filterDiv) {
      filterDiv = document.createElement("div");
      filterDiv.id = "monthFilter";
      filterDiv.className = "month-filter";
      section.parentNode.insertBefore(filterDiv, section);
    }

    filterDiv.innerHTML = `
      <button class="month-btn ${currentMonth === "all" ? "active" : ""}" data-month="all">📅 All Months</button>
      ${months.map(m => {
        const [year, mon] = m.split("-");
        return `<button class="month-btn ${currentMonth === m ? "active" : ""}" data-month="${m}">
          ${MONTHS[parseInt(mon)]} ${year}
        </button>`;
      }).join("")}
    `;

    filterDiv.querySelectorAll(".month-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        filterDiv.querySelectorAll(".month-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentMonth = btn.dataset.month;
        renderTable(currentSubject, currentMonth);
      });
    });
  }

  function renderTable(subject, monthKey) {
    let records = subjectData[subject] || [];

    if (monthKey !== "all") {
      const [year, mon] = monthKey.split("-");
      records = records.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(mon);
      });
    }

    const subPresent = records.filter(r => r.status === "present").length;
    const subTotal = records.length;
    const subAbsent = subTotal - subPresent;
    const subPercent = subTotal > 0 ? Math.round((subPresent / subTotal) * 100) : 0;
    const pColor = subPercent >= 75 ? "#16a34a" : subPercent >= 50 ? "#d97706" : "#dc2626";

    const rows = records.map(r => {
      const date = new Date(r.date);
      const dateStr = date.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
      const dayStr = date.toLocaleDateString("en-IN", { weekday: "short" });
      return `
        <tr>
          <td>${dateStr} <span style="color:#888;font-size:12px">(${dayStr})</span></td>
          <td>${r.className || "N/A"}</td>
          <td class="status-${r.status}">${r.status === "present" ? "✅ Present" : "❌ Absent"}</td>
        </tr>
      `;
    }).join("");

    document.getElementById("subjectWiseSection").innerHTML = `
      <div class="subject-block">
        <div class="subject-header">
          <h3>📘 ${subject}</h3>
          <div class="subject-stats">
            <span>🟢 Present: <b>${subPresent}</b></span>
            <span>🔴 Absent: <b>${subAbsent}</b></span>
            <span>📊 Total: <b>${subTotal}</b></span>
            <span style="color:${pColor};font-weight:700">${subPercent}%</span>
          </div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${subPercent}%; background:${pColor}"></div>
        </div>
        ${rows.length > 0 ? `
          <table>
            <thead><tr><th>Date</th><th>Class</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        ` : `<p style="text-align:center;padding:20px;color:#888">Is month koi record nahi hai</p>`}
      </div>
    `;
  }

  // ========== CALENDAR VIEW ==========
  window.changeMonth = function(dir) {
    calendarMonth += dir;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
    document.getElementById("dayDetail").style.display = "none";
  };

  function renderCalendar() {
    document.getElementById("calendarTitle").innerText = `${MONTHS[calendarMonth]} ${calendarYear}`;

    const grid = document.getElementById("calendarGrid");

    // Day headers
    const headers = DAYS.map(d => `<div class="cal-day-header">${d}</div>`).join("");

    // Is month ke records
    const monthRecords = allData.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === calendarYear && d.getMonth() === calendarMonth;
    });

    // Date wise group
    const dateMap = {};
    monthRecords.forEach(r => {
      const key = new Date(r.date).getDate();
      if (!dateMap[key]) dateMap[key] = [];
      dateMap[key].push(r);
    });

    // First day of month
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();

    let cells = "";

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells += `<div class="cal-day empty"></div>`;
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const records = dateMap[day] || [];
      const isToday = today.getDate() === day && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;

      let cls = "no-class";
      let label = "";

      if (records.length > 0) {
        const hasPresent = records.some(r => r.status === "present");
        const hasAbsent = records.some(r => r.status === "absent");

        if (hasPresent && hasAbsent) {
          cls = "present"; // mixed — green prefer
          label = `<span class="dot-count">${records.length} class</span>`;
        } else if (hasPresent) {
          cls = "present";
          label = `<span class="dot-count">${records.length > 1 ? records.length + ' class' : ''}</span>`;
        } else {
          cls = "absent";
          label = `<span class="dot-count">${records.length > 1 ? records.length + ' class' : ''}</span>`;
        }
      }

      cells += `
        <div class="cal-day ${cls} ${isToday ? 'today' : ''}" 
             onclick="showDayDetail(${day}, ${calendarMonth}, ${calendarYear})">
          ${day}
          ${label}
        </div>
      `;
    }

    grid.innerHTML = headers + cells;
  }

  window.showDayDetail = function(day, month, year) {
    const records = allData.filter(r => {
      const d = new Date(r.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

    const detailEl = document.getElementById("dayDetail");
    const titleEl = document.getElementById("dayDetailTitle");
    const bodyEl = document.getElementById("dayDetailBody");

    const dateStr = new Date(year, month, day).toLocaleDateString("en-IN", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });

    titleEl.innerText = `📅 ${dateStr}`;

    if (records.length === 0) {
      detailEl.style.display = "none";
      return;
    }

    bodyEl.innerHTML = records.map(r => `
      <div class="day-record">
        <span class="day-record-subject">📘 ${r.subject}</span>
        <span class="day-record-status ${r.status === 'present' ? 'status-present-badge' : 'status-absent-badge'}">
          ${r.status === "present" ? "✅ Present" : "❌ Absent"}
        </span>
      </div>
    `).join("");

    detailEl.style.display = "block";
  };

  fetchAttendance();
});