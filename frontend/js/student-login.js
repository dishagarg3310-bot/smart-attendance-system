document.addEventListener("DOMContentLoaded", async () => {

  // Auth check
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (token && role === "student") {
    window.location.replace("stud-db.html");
    return;
  }

  // Remember me prefill
  const savedEmail = localStorage.getItem("rememberedStudentEmail");
  if (savedEmail) {
    document.getElementById("email").value = savedEmail;
    document.getElementById("rememberMe").checked = true;
  }

  // Dynamic class dropdown load
  await loadClasses();

  // ========== TAB SWITCH ==========
  function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    if (tab === 'login') {
      document.getElementById('loginTab').classList.add('active');
      document.getElementById('loginSection').classList.add('active');
    } else {
      document.getElementById('signupTab').classList.add('active');
      document.getElementById('signupSection').classList.add('active');
    }
  }

  // Tab click events
  document.getElementById('loginTab').addEventListener('click', () => switchTab('login'));
  document.getElementById('signupTab').addEventListener('click', () => switchTab('signup'));

  // ========== SHOW/HIDE PASSWORD ==========
  document.getElementById("toggleLoginPass").addEventListener("click", function() {
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
    this.innerText = input.type === "password" ? "👁️" : "🙈";
  });

  document.getElementById("toggleSignupPass").addEventListener("click", function() {
    const input = document.getElementById("signupPassword");
    input.type = input.type === "password" ? "text" : "password";
    this.innerText = input.type === "password" ? "👁️" : "🙈";
  });

  // ========== LOAD CLASSES ==========
  async function loadClasses() {
    try {
      const res = await fetchAPI("/api/admin/public/classes");
      const classes = await res.json();
      const select = document.getElementById("signupClass");
      select.innerHTML = `<option value="">Select Class</option>`;
      if (Array.isArray(classes)) {
        classes.forEach(c => {
          select.innerHTML += `<option value="${c.className}">${c.className}</option>`;
        });
      }
    } catch (err) {
      console.error("Classes load error:", err);
    }
  }

  // ========== LOGIN ==========
  document.getElementById("studentLoginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;
    const errorMsg = document.getElementById("errorMsg");
    const btn = this.querySelector("button[type=submit]");

    errorMsg.innerText = "";
    btn.disabled = true;
    btn.innerText = "Logging in...";

    if (rememberMe) {
      localStorage.setItem("rememberedStudentEmail", email);
    } else {
      localStorage.removeItem("rememberedStudentEmail");
    }

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
      window.location.replace("stud-db.html");

    } catch (err) {
      errorMsg.innerText = "Connection failed: " + err.message;
      btn.disabled = false;
      btn.innerText = "Login";
    }
  });

  // ========== SIGN UP ==========
  document.getElementById("studentSignupForm").addEventListener("submit", async function(e) {
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