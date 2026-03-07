document.addEventListener("DOMContentLoaded", async function () {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== "teacher") {
    window.location.replace("login.html");
    return;
  }

  let allStudents = [];
  let presentStudents = [];
  let absentStudents = [];
  let currentClassName = "";

  async function loadClassSummary() {
    try {
      const res = await fetchAPI("/api/attendance/class-summary");
      const data = await res.json();
      if (!res.ok) return;

      if (data.length === 0) {
        document.getElementById("mainContent2").innerHTML =
          `<p class="empty-msg">Abhi koi session nahi hua hai</p>`;
        return;
      }

      const classData = data[0];
      currentClassName = classData.className;
      renderClass(classData);

    } catch (err) {
      console.error("Load error:", err);
    }
  }

  function renderClass(classData) {
    allStudents = classData.students || [];
    presentStudents = allStudents.filter(s => s.present > 0);
    absentStudents = allStudents.filter(s => s.present === 0);

    document.getElementById("className").innerText = classData.className;
    document.getElementById("totalCount").innerText = allStudents.length;
    document.getElementById("presentCount").innerText = presentStudents.length;
    document.getElementById("absentCount").innerText = absentStudents.length;

    // Present list
    const presentList = document.getElementById("presentList");
    presentList.innerHTML = presentStudents.length > 0
      ? presentStudents.map(s => {
          const color = s.percent >= 75 ? "#16a34a" : s.percent >= 50 ? "#d97706" : "#dc2626";
          return `
            <div class="student-item present-item" onclick="openStudentProfile('${s._id}')" style="cursor:pointer;">
              <div class="student-info">
                <span class="student-name">👤 ${s.name}</span>
                <span class="student-email">${s.email}</span>
              </div>
              <div class="student-stats">
                <span class="stat-chip">${s.present}/${s.totalClasses} Classes</span>
                <span class="stat-chip percent-chip" style="color:${color};border-color:${color}">${s.percent}%</span>
              </div>
            </div>`;
        }).join("")
      : `<p class="empty-msg">Koi student present nahi hai</p>`;

    // Absent list
    const absentList = document.getElementById("absentList");
    absentList.innerHTML = absentStudents.length > 0
      ? absentStudents.map(s => `
          <div class="student-item absent-item" onclick="openStudentProfile('${s._id}')" style="cursor:pointer;">
            <div class="student-info">
              <span class="student-name">👤 ${s.name}</span>
              <span class="student-email">${s.email}</span>
            </div>
            <div class="student-stats">
              <span class="stat-chip">0/${s.totalClasses} Classes</span>
              <span class="stat-chip percent-chip" style="color:#dc2626;border-color:#dc2626">0%</span>
            </div>
          </div>`).join("")
      : `<p class="empty-msg">Sab students present hain ✅</p>`;
  }

  // ========== STUDENT PROFILE MODAL ==========
  window.openStudentProfile = async function(studentId) {
    const modal = document.getElementById("studentModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.innerText = "👤 Student Profile";
    modalBody.innerHTML = `<p style="text-align:center;color:#6b7280;padding:20px;">Loading...</p>`;
    modal.style.display = "flex";

    try {
      const res = await fetchAPI(`/api/attendance/student-profile/${studentId}`);
      const data = await res.json();

      if (!res.ok) {
        modalBody.innerHTML = `<p style="color:#dc2626;">Error loading profile!</p>`;
        return;
      }

      const attendanceColor = data.overallPercent >= 75 ? "#16a34a" : data.overallPercent >= 50 ? "#d97706" : "#dc2626";

      modalBody.innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding:16px;background:#f0fdfa;border-radius:14px;">
          <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#0f766e,#14b8a6);display:flex;align-items:center;justify-content:center;font-size:22px;color:white;font-weight:700;flex-shrink:0;">
            ${data.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:#0f766e;">${data.name}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px;">${data.email}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px;">🏫 ${data.className || "N/A"}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
          <div style="text-align:center;padding:12px;background:#f0fdf4;border-radius:12px;">
            <div style="font-size:22px;font-weight:700;color:#16a34a;">${data.totalPresent}</div>
            <div style="font-size:11px;color:#16a34a;font-weight:600;">Present</div>
          </div>
          <div style="text-align:center;padding:12px;background:#fff5f5;border-radius:12px;">
            <div style="font-size:22px;font-weight:700;color:#dc2626;">${data.totalAbsent}</div>
            <div style="font-size:11px;color:#dc2626;font-weight:600;">Absent</div>
          </div>
          <div style="text-align:center;padding:12px;background:#fefce8;border-radius:12px;">
            <div style="font-size:22px;font-weight:700;color:${attendanceColor};">${data.overallPercent}%</div>
            <div style="font-size:11px;color:${attendanceColor};font-weight:600;">Overall</div>
          </div>
        </div>

        <div style="padding:12px 16px;background:#f9fafb;border-radius:12px;margin-bottom:20px;font-size:14px;color:#374151;">
          🕐 <strong>Last Attended:</strong> ${data.lastAttended || "Kabhi nahi aaya"}
        </div>

        <div style="font-size:15px;font-weight:700;color:#374151;margin-bottom:12px;">📊 Subject-wise Attendance</div>
        ${data.subjects.length > 0
          ? data.subjects.map(sub => {
              const pct = sub.percent;
              const col = pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
              const bg = pct >= 75 ? "#f0fdf4" : pct >= 50 ? "#fffbeb" : "#fff5f5";
              return `
                <div style="margin-bottom:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-size:14px;font-weight:600;color:#374151;">📘 ${sub.subject}</span>
                    <span style="font-size:13px;font-weight:700;color:${col};background:${bg};padding:3px 10px;border-radius:20px;">${sub.present}/${sub.total} — ${pct}%</span>
                  </div>
                  <div style="height:8px;background:#e5e7eb;border-radius:10px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${col};border-radius:10px;transition:0.5s;"></div>
                  </div>
                </div>`;
            }).join("")
          : `<p style="color:#9ca3af;text-align:center;">Koi attendance record nahi</p>`
        }
      `;
    } catch (err) {
      console.error(err);
      modalBody.innerHTML = `<p style="color:#dc2626;">Server error!</p>`;
    }
  };

  // ========== CARDS MODAL ==========
  window.openModal = async function(type) {
    const modal = document.getElementById("studentModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modal.style.display = "flex";

    if (type === "total") {
      modalTitle.innerText = `👥 All Students — ${currentClassName}`;
      modalBody.innerHTML = `<p style="color:#6b7280;margin-bottom:15px;">Total: <strong>${allStudents.length}</strong> students</p>`;

      if (allStudents.length === 0) {
        modalBody.innerHTML += `<p class="empty-msg">Koi student nahi mila</p>`;
        return;
      }

      modalBody.innerHTML += allStudents.map(s => `
        <div class="modal-student-item" onclick="openStudentProfile('${s._id}')" style="cursor:pointer;">
          <div>
            <div class="modal-student-name">👤 ${s.name}</div>
            <div class="modal-student-email">${s.email}</div>
          </div>
          <span class="${s.present > 0 ? 'badge-present' : 'badge-absent'}">
            ${s.present > 0 ? `${s.percent}% Present` : 'Never Present'}
          </span>
        </div>
      `).join("");

    } else if (type === "present") {
      modalTitle.innerText = `✅ Present Students — ${currentClassName}`;
      modalBody.innerHTML = `<p style="color:#6b7280;margin-bottom:15px;">Total: <strong>${presentStudents.length}</strong> students</p>`;

      if (presentStudents.length === 0) {
        modalBody.innerHTML += `<p class="empty-msg">Koi student present nahi hai</p>`;
        return;
      }

      modalBody.innerHTML += presentStudents.map(s => {
        const color = s.percent >= 75 ? "#16a34a" : s.percent >= 50 ? "#d97706" : "#dc2626";
        return `
          <div class="modal-student-item" onclick="openStudentProfile('${s._id}')" style="cursor:pointer;">
            <div>
              <div class="modal-student-name">👤 ${s.name}</div>
              <div class="modal-student-email">${s.email}</div>
            </div>
            <span class="badge-present" style="color:${color}">
              ${s.present}/${s.totalClasses} — ${s.percent}%
            </span>
          </div>`;
      }).join("");

    } else if (type === "absent") {
      modalTitle.innerText = `❌ Absent Students — ${currentClassName}`;
      modalBody.innerHTML = `<p style="color:#6b7280;margin-bottom:15px;">Total: <strong>${absentStudents.length}</strong> students</p>`;

      if (absentStudents.length === 0) {
        modalBody.innerHTML += `<p class="empty-msg">Sab students present hain ✅</p>`;
        return;
      }

      modalBody.innerHTML += absentStudents.map(s => `
        <div class="modal-student-item" onclick="openStudentProfile('${s._id}')" style="cursor:pointer;">
          <div>
            <div class="modal-student-name">👤 ${s.name}</div>
            <div class="modal-student-email">${s.email}</div>
          </div>
          <span class="badge-absent">Never Present</span>
        </div>
      `).join("");
    }
  };

  // Modal close
  window.closeModal = function() {
    document.getElementById("studentModal").style.display = "none";
  };

  document.getElementById("studentModal").addEventListener("click", function(e) {
    if (e.target === this) closeModal();
  });

  loadClassSummary();
});