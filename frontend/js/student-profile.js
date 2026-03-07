document.addEventListener("DOMContentLoaded", async () => {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "student") {
    window.location.replace("login.html");
    return;
  }

  // ✅ FIX: loadProfile DOMContentLoaded ke andar
  async function loadProfile() {
    try {
      const res = await fetchAPI("/api/auth/me");

      // ✅ JSON check
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Server ne JSON nahi bheja");
        return;
      }

      const user = await res.json();

      if (res.ok) {
        document.getElementById("nameText").innerText = user.name || "N/A";
        document.getElementById("emailText").innerText = user.email || "N/A";
        document.getElementById("classText").innerText = user.className || "N/A";
        document.getElementById("idText").innerText = user._id.slice(-6).toUpperCase();
        document.getElementById("initials").innerText = user.name.charAt(0).toUpperCase();

        // Edit inputs mein bhi prefill karo
        document.getElementById("nameInput").value = user.name || "";
        document.getElementById("emailInput").value = user.email || "";
        document.getElementById("classInput").value = user.className || "";
      } else {
        console.error("Profile fetch failed:", user.message);
      }
    } catch (err) {
      console.error("Profile error:", err);
    }
  }

  // Edit button
  document.getElementById("editBtn").addEventListener("click", () => {
    const editSection = document.getElementById("editSection");
    editSection.style.display = editSection.style.display === "none" ? "flex" : "none";
  });

  // Save button — sirf localStorage update karo (backend update baad mein)
  document.getElementById("saveBtn").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value.trim();
    if (!name) return;

    document.getElementById("nameText").innerText = name;
    document.getElementById("initials").innerText = name.charAt(0).toUpperCase();
    localStorage.setItem("name", name);
    document.getElementById("editSection").style.display = "none";
  });

  loadProfile();
});