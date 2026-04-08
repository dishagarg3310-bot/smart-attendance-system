document.addEventListener("DOMContentLoaded", () => {
  // Already logged in check
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (token && role === "admin") {
    window.location.replace("admin-dashboard.html");
  }

  document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");

    try {
      const res = await fetchAPI("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("name", data.name);
        window.location.replace("admin-dashboard.html");
      } else {
        errorMsg.innerText = data.message || "Invalid credentials";
      }
    } catch (err) {
      errorMsg.innerText = "Connection failed: " + err.message;
    }
  });
});