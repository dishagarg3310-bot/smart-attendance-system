document.addEventListener("DOMContentLoaded", async () => {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "student") {
    window.location.replace("login.html");
    return;
  }

  // Student name dikhao
  const name = localStorage.getItem("name");
  const nameEl = document.getElementById("studentName");
  if (name && nameEl) nameEl.innerText = name;

  // ========== STATS ==========
  try {
    const res = await fetchAPI("/api/attendance/student-stats");
    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) return;

    const data = await res.json();

    if (res.ok) {
      const total = data.total || 0;
      const present = data.present || 0;
      const absent = data.absent || 0;
      const percent = total > 0 ? Math.round((present / total) * 100) : 0;

      if (document.getElementById("totalClasses")) document.getElementById("totalClasses").innerText = total;
      if (document.getElementById("presentCount")) document.getElementById("presentCount").innerText = present;
      if (document.getElementById("absentCount")) document.getElementById("absentCount").innerText = absent;

      const percentEl = document.getElementById("attendancePercent");
      if (percentEl) {
        percentEl.innerText = percent + "%";
        if (percent < 75) {
          percentEl.style.color = "#dc2626";
        } else if (percent < 85) {
          percentEl.style.color = "#d97706";
        } else {
          percentEl.style.color = "#16a34a";
        }
      }

      // Low attendance warning
      const warningEl = document.getElementById("attendanceWarning");
      if (warningEl) {
        if (total > 0 && percent < 75) {
          const needed = Math.ceil((0.75 * total - present) / (1 - 0.75));
          warningEl.style.display = "flex";
          warningEl.innerHTML = `
            <span>⚠️ your attendance <strong>${percent}%</strong> less than 75%! 
            For more Attendance <strong>${needed}</strong> attend classes .</span>
          `;
        } else if (total > 0 && percent < 85) {
          warningEl.style.display = "flex";
          warningEl.style.background = "#fef3c7";
          warningEl.style.borderColor = "#d97706";
          warningEl.style.color = "#92400e";
          warningEl.innerHTML = `
            <span>🔔 your attendance <strong>${percent}%</strong> that is more than  — 75% !</span>
          `;
        } else {
          warningEl.style.display = "none";
        }
      }
    }
  } catch (err) {
    console.error("Dashboard load error:", err);
  }

  // ========== NOTIFICATIONS ==========
  async function loadNotifications() {
    try {
      const res = await fetchAPI("/api/notification/my-notifications");
      const data = await res.json();
      if (!res.ok) return;

      const unread = data.filter(n => !n.isRead).length;
      const bellCount = document.getElementById("bellCount");
      if (bellCount) bellCount.innerText = unread > 0 ? unread : "";

      const notifList = document.getElementById("notifList");
      if (!notifList) return;

      notifList.innerHTML = data.length > 0
        ? data.map(n => `
            <div class="notif-item ${n.isRead ? '' : 'unread'}">
              <div class="notif-title">${n.title}</div>
              <div class="notif-body">${n.body}</div>
              <div class="notif-time">${new Date(n.createdAt).toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"})}</div>
            </div>
          `).join("")
        : `<p style="text-align:center;color:#9ca3af;padding:15px;">No notification</p>`;
    } catch (err) {
      console.error(err);
    }
  }

  // ========== TOGGLE PANEL ==========
  window.toggleNotifPanel = function() {
    const panel = document.getElementById("notifPanel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  };

  // ========== MARK ALL READ ==========
  window.markAllRead = async function() {
    try {
      await fetchAPI("/api/notification/mark-read", { method: "POST" });
      document.getElementById("bellCount").innerText = "";
      document.querySelectorAll(".notif-item.unread").forEach(el => {
        el.classList.remove("unread");
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Panel bahar click pe band ho
  document.addEventListener("click", function(e) {
    const wrapper = document.querySelector(".bell-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
      const panel = document.getElementById("notifPanel");
      if (panel) panel.style.display = "none";
    }
  });

  // Push subscribe
  if (typeof subscribeToPush === "function") {
    subscribeToPush();
  }

  loadNotifications();
});