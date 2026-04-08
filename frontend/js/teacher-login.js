document.addEventListener("DOMContentLoaded", () => {

  // Remember me prefill
  const remembered = localStorage.getItem("rememberedTeacherEmail");
  if (remembered) {
    document.getElementById("email").value = remembered;
    document.getElementById("rememberMe").checked = true;
  }

  // Fill demo
  window.fillDemo = function() {
    document.getElementById('email').value = 'priya@gmail.com';
    document.getElementById('password').value = 'priya123';
  };

  // Show/hide password
  window.togglePassword = function() {
    const pwd = document.getElementById("password");
    pwd.type = pwd.type === "password" ? "text" : "password";
  };

  document.getElementById("teacherLoginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;
    const errorMsg = document.getElementById("errorMsg");
    const btn = this.querySelector("button[type=submit]");

    errorMsg.innerText = "";
    btn.disabled = true;
    btn.innerText = "Logging in...";

    try {
      const res = await fetchAPI("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.innerText = data.message || "Invalid credentials";
        btn.disabled = false;
        btn.innerText = "Login";
        return;
      }

      if (data.role !== "teacher") {
        errorMsg.innerText = "You are not authorized as Teacher";
        btn.disabled = false;
        btn.innerText = "Login";
        return;
      }

      if (rememberMe) {
        localStorage.setItem("rememberedTeacherEmail", email);
      } else {
        localStorage.removeItem("rememberedTeacherEmail");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      window.location.href = "teacher-db.html";

    } catch (err) {
      console.error("Teacher login error:", err);
      errorMsg.innerText = "Connection failed: " + err.message;
      btn.disabled = false;
      btn.innerText = "Login";
    }
  });
});