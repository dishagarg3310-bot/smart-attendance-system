// Clear inputs on page load
document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
});

const form = document.getElementById("loginForm");

form.addEventListener("submit", async e => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  try {
    const res = await fetchAPI("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);

      if (data.role === "teacher") {
        window.location.replace("teacher-db.html");
      } else {
        window.location.replace("stud-db.html");
      }
    } else {
      errorMsg.innerText = data.message || "Invalid credentials";
    }
  } catch (err) {
    console.error(err);
    errorMsg.innerText = "Connection failed: " + err.message;
  }
});