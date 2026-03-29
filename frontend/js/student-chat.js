document.addEventListener("DOMContentLoaded", async () => {

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");

  const socket = io(API, { auth: { token } });

  // Class room join
  async function joinRoom() {
    try {
      const res = await fetchAPI("/api/auth/me");
      const data = await res.json();
      socket.emit("joinRoom", data.className);
    } catch (err) {
      console.error(err);
    }
  }

  joinRoom();

  // Load announcements
  async function loadAnnouncements() {
    try {
      const res = await fetchAPI("/api/chat/announcements");
      const data = await res.json();
      renderAnnouncements(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Render announcements
  function renderAnnouncements(announcements) {
    const list = document.getElementById("announcementsList");
    if (announcements.length === 0) {
      list.innerHTML = `<p style="color:#999;text-align:center">No announcements yet</p>`;
      return;
    }

    list.innerHTML = announcements.map(a => {
      const time = new Date(a.createdAt).toLocaleString("en-IN");
      const myRaise = a.handRaises?.find(h => h.studentName === name);

      return `
        <div class="announcement-card" id="card-${a._id}">
          <div class="announcement-header">
            <span class="announcement-teacher">📢 ${a.teacherName}</span>
            <span class="announcement-time">${time}</span>
          </div>
          <p class="announcement-message">${a.message}</p>

          <div class="hand-section">
            <button class="hand-btn ${myRaise ? "raised" : "not-raised"}"
              id="handbtn-${a._id}"
              onclick="toggleHand('${a._id}')">
              ${myRaise ? "✋ Hand Raised" : "🖐️ Raise Hand"}
            </button>
            <span class="hand-count" id="handcount-${a._id}">
              ${a.handRaises?.length || 0} queries
            </span>
          </div>

          <!-- Chat Box -->
          <div id="chatarea-${a._id}">
            ${a.chatEnabled
              ? `
                <div class="chat-box">
                  <div class="chat-messages" id="messages-${a._id}"></div>
                  <div class="chat-input-box">
                    <input type="text" id="input-${a._id}" placeholder="Type message..." />
                    <button onclick="sendMessage('${a._id}')">Send</button>
                  </div>
                </div>
              `
              : `<p class="chat-disabled-msg">💬 Chat is disabled by teacher</p>`
            }
          </div>

        </div>
      `;
    }).join("");

    // Load messages
    announcements.forEach(a => {
      if (a.chatEnabled) loadMessages(a._id);
    });
  }

  // Load messages
  async function loadMessages(announcementId) {
    try {
      const res = await fetchAPI(`/api/chat/messages/${announcementId}`);
      const messages = await res.json();
      renderMessages(announcementId, messages);
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

  // Toggle hand raise
  window.toggleHand = async (announcementId) => {
    try {
      const res = await fetchAPI(`/api/chat/announcement/${announcementId}/handraise`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  // Send message
  window.sendMessage = async (announcementId) => {
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
  };

  // Socket events
  socket.on("newAnnouncement", () => {
    loadAnnouncements();
  });

  socket.on("chatToggled", (data) => {
    loadAnnouncements();
  });

  socket.on("newMessage", (msg) => {
    loadMessages(msg.announcementId);
  });

  loadAnnouncements();
});