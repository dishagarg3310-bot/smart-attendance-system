document.addEventListener("DOMContentLoaded", async function () {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== "teacher") {
    window.location.replace("login.html");
    return;
  }

  const nameText = document.getElementById("nameText");
  const emailText = document.getElementById("emailText");
  const subjectText = document.getElementById("subjectText");
  const initials = document.getElementById("initials");
  const editSection = document.getElementById("editSection");
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const subjectInput = document.getElementById("subjectInput");

  // ✅ Profile fetch karo
  async function loadProfile() {
    try {
      const res = await fetchAPI("/api/auth/me");

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Server ne JSON nahi bheja");
        return;
      }

      const user = await res.json();

      if (res.ok) {
        nameText.textContent = user.name || "N/A";
        emailText.textContent = user.email || "N/A";
        subjectText.textContent = user.subject || "N/A";
        document.getElementById("idText").textContent = user._id.slice(-6).toUpperCase();
        initials.textContent = user.name.charAt(0).toUpperCase();

        // Edit inputs prefill
        nameInput.value = user.name || "";
        emailInput.value = user.email || "";
        subjectInput.value = user.subject || "";
      }
    } catch (err) {
      console.error("Profile error:", err);
    }
  }

  // Edit button
  document.getElementById("editBtn").addEventListener("click", function () {
    editSection.style.display = editSection.style.display === "none" ? "block" : "none";
  });

  // Save button
  document.getElementById("saveBtn").addEventListener("click", function () {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value.trim();

    if (!name || !email || !subject) {
      alert("Please fill all fields.");
      return;
    }

    nameText.textContent = name;
    emailText.textContent = email;
    subjectText.textContent = subject;
    initials.textContent = name.charAt(0).toUpperCase();
    localStorage.setItem("name", name);

    editSection.style.display = "none";
    alert("Profile Updated ✔");
  });

  loadProfile();
});