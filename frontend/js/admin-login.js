document.addEventListener("DOMContentLoaded", () => {
  // Already logged in check
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (token && role === "admin") {
    window.location.replace("admin-dashboard.html");
  }

  // Remember me — email prefill
  const remembered = localStorage.getItem("rememberedEmail");
  if (remembered) {
    document.getElementById("email").value = remembered;
    document.getElementById("rememberMe").checked = true;
  }

  // Show/hide password
  window.togglePassword = function() {
    const pwd = document.getElementById("password");
    pwd.type = pwd.type === "password" ? "text" : "password";
  };

  // Login form submit
  document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rememberMe = document.getElementById("rememberMe").checked;
    const errorMsg = document.getElementById("errorMsg");
    const btn = e.target.querySelector("button[type=submit]");

    errorMsg.innerText = "";
    btn.disabled = true;
    btn.innerText = "Logging in...";

    try {
      const res = await fetchAPI("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Remember me
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("name", data.name);
        window.location.replace("admin-dashboard.html");
      } else {
        errorMsg.innerText = data.message || "Invalid credentials";
        btn.disabled = false;
        btn.innerText = "Login";
      }
    } catch (err) {
      errorMsg.innerText = "Connection failed: " + err.message;
      btn.disabled = false;
      btn.innerText = "Login";
    }
  });
  // DOMContentLoaded ke bahar
window.toggleHint = function() {
  const hint = document.getElementById("hintContent");
  hint.style.display = hint.style.display === "none" ? "block" : "none";
};

document.addEventListener("DOMContentLoaded", () => {
  // baki sab code...
});
});