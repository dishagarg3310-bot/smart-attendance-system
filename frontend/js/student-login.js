// ✅ FIX: Poora code DOMContentLoaded mein wrap kiya
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("studentLoginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");
    const btn = this.querySelector("button[type=submit]");

    errorMsg.innerText = "";
    btn.disabled = true;
    btn.innerText = "Logging in...";

    try {
      // ✅ FIX: localhost hataya — fetchAPI (config.js) use karo
      // Ab ngrok, localhost, koi bhi URL pe kaam karega
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

      // Role check
      if (data.role !== "student") {
        errorMsg.innerText = "You are not authorized as Student";
        btn.disabled = false;
        btn.innerText = "Login";
        return;
      }

      // Save to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);

      window.location.href = "stud-db.html";

    } catch (err) {
      console.error("Student login error:", err);
      errorMsg.innerText = "Connection failed: " + err.message;
      btn.disabled = false;
      btn.innerText = "Login";
    }
  });

});