document.addEventListener("DOMContentLoaded", async () => {

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");

  const socket = io(API, { auth: { token } });

  socket.emit("joinTeacher");

  // Load announcements
  async function loadAnnouncements() {
    try {
      const res = await fetchAPI("/api/chat/announcements");
      const data = await res.json();
      if (Array.isArray(data)) {
        renderAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Send announcement
  document.getElementById("sendAnnouncement").addEventListener("click", async () => {
    const message = document.getElementById("announcementText").value.trim();
    if (!message) return;

    const btn = document.getElementById("sendAnnouncement");
    btn.disabled = true;
    btn.innerText = "Sending...";

    try {
      const res = await fetchAPI("/api/chat/announcement", {
        method: "POST",
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        document.getElementById("announcementText").value = "";
        loadAnnouncements();
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerText = "📢 Send Announcement";
    }
  });

  // Render announcements
  function renderAnnouncements(announcements) {
    const list = document.getElementById("announcementsList");
    if (announcements.length === 0) {
      list.innerHTML = `<p style="color:#999;text-align:center">No announcements yet</p>`;
      return;
    }

    list.innerHTML = announcements.map(a => {
      const time = new Date(a.createdAt).toLocaleString("en-IN");
      const handList = a.handRaises?.length > 0
        ? a.handRaises.map(h => `<span>✋ ${h.studentName}</span>`).join("")
        : "No queries yet";

      return `
        <div class="announcement-card" id="card-${a._id}">
          <div class="announcement-header">
            <span class="announcement-teacher">📢 ${a.teacherName}</span>
            <span class="announcement-time">${time}</span>
          </div>
          <p class="announcement-message">${a.message}</p>

          <div class="hand-section">
            <span class="hand-count" id="handcount-${a._id}">✋ Queries: ${a.handRaises?.length || 0}</span>
            <button class="chat-toggle-btn ${a.chatEnabled ? "enabled" : "disabled"}"
              id="toggleBtn-${a._id}"
              data-id="${a._id}"
              data-enabled="${a.chatEnabled}">
              ${a.chatEnabled ? "🔴 Disable Chat" : "🟢 Enable Chat"}
            </button>
          </div>

          <div class="hand-raise-list" id="hands-${a._id}">
            ${handList}
          </div>

          <div class="chat-box" id="chatbox-${a._id}">
            <div class="chat-messages" id="messages-${a._id}"></div>
            <div class="chat-input-box">
              <input type="text" id="input-${a._id}" placeholder="Type reply..." />
              <button class="send-msg-btn" data-id="${a._id}">Send</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Event listeners for buttons
    announcements.forEach(a => {
      // Toggle chat button
      const toggleBtn = document.getElementById(`toggleBtn-${a._id}`);
      if (toggleBtn) {
        toggleBtn.addEventListener("click", async () => {
          const currentState = toggleBtn.dataset.enabled === "true";
          try {
            const res = await fetchAPI(`/api/chat/announcement/${a._id}/chat`, {
              method: "PUT",
              body: JSON.stringify({ enabled: !currentState })
            });
            if (res.ok) loadAnnouncements();
          } catch (err) {
            console.error(err);
          }
        });
      }

      // Send message button
      const sendBtn = document.querySelector(`#chatbox-${a._id} .send-msg-btn`);
      if (sendBtn) {
        sendBtn.addEventListener("click", () => sendMessage(a._id));
      }

      // Enter key for input
      const input = document.getElementById(`input-${a._id}`);
      if (input) {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") sendMessage(a._id);
        });
      }

      loadMessages(a._id);
    });
  }

  // Load messages
  async function loadMessages(announcementId) {
    try {
      const res = await fetchAPI(`/api/chat/messages/${announcementId}`);
      const messages = await res.json();
      if (Array.isArray(messages)) renderMessages(announcementId, messages);
    } catch (err) {
      console.error(err);
    }
  }

  // Render messages
  function renderMessages(announcementId, messages) {
    const container = document.getElementById(`messages-${announcementId}`);
    if (!container) return;
    container.innerHTML = messages.map(m => `
      <div class="chat-msg ${m.senderRole === "teacher" ? "teacher-msg" : ""}">
        <div class="sender">${m.senderRole === "teacher" ? "👩‍🏫" : "👨‍🎓"} ${m.senderName}</div>
        <div class="text">${m.message}</div>
      </div>
    `).join("");
    container.scrollTop = container.scrollHeight;
  }

  // Send message
  async function sendMessage(announcementId) {
    const input = document.getElementById(`input-${announcementId}`);
    const message = input.value.trim();
    if (!message) return;

    try {
      const res = await fetchAPI("/api/chat/message", {
        method: "POST",
        body: JSON.stringify({ announcementId, message })
      });
      if (res.ok) {
        input.value = "";
        loadMessages(announcementId);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Socket events
  socket.on("handRaiseUpdate", (data) => {
    const handsEl = document.getElementById(`hands-${data.announcementId}`);
    const countEl = document.getElementById(`handcount-${data.announcementId}`);
    if (handsEl) {
      handsEl.innerHTML = data.handRaises.length > 0
        ? data.handRaises.map(h => `<span>✋ ${h.studentName}</span>`).join("")
        : "No queries yet";
    }
    if (countEl) {
      countEl.innerText = `✋ Queries: ${data.handRaises.length}`;
    }
  });

  socket.on("newMessage", (msg) => {
    loadMessages(msg.announcementId);
  });

  loadAnnouncements();
});