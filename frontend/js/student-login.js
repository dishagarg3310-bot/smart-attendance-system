document.addEventListener("DOMContentLoaded", () => {

  // Tab switch
  window.switchTab = function(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    if (tab === 'login') {
      document.querySelectorAll('.tab')[0].classList.add('active');
      document.getElementById('loginSection').classList.add('active');
    } else {
      document.querySelectorAll('.tab')[1].classList.add('active');
      document.getElementById('signupSection').classList.add('active');
    }
  }

  // Login
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

      if (data.role !== "student") {
        errorMsg.innerText = "You are not authorized as Student";
        btn.disabled = false;
        btn.innerText = "Login";
        return;
      }

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

  // Sign Up
  document.getElementById("studentSignupForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const className = document.getElementById("signupClass").value;
    const signupMsg = document.getElementById("signupMsg");
    const btn = this.querySelector("button[type=submit]");

    if (!className) {
      signupMsg.style.color = "red";
      signupMsg.innerText = "Please select a class!";
      return;
    }

    signupMsg.innerText = "";
    btn.disabled = true;
    btn.innerText = "Creating account...";

    try {
      const res = await fetchAPI("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role: "student", className })
      });

      const data = await res.json();

      if (res.ok) {
        signupMsg.style.color = "green";
        signupMsg.innerText = "Account created! Please login now.";
        document.getElementById("studentSignupForm").reset();
        setTimeout(() => switchTab('login'), 2000);
      } else {
        signupMsg.style.color = "red";
        signupMsg.innerText = data.message || "Signup failed!";
        btn.disabled = false;
        btn.innerText = "Sign Up";
      }
    } catch (err) {
      signupMsg.style.color = "red";
      signupMsg.innerText = "Connection failed: " + err.message;
      btn.disabled = false;
      btn.innerText = "Sign Up";
    }
  });

});