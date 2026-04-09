document.addEventListener("DOMContentLoaded", () => {
  loadClasses();
  loadTeachers();
  loadStudents();
});

// ========== TAB SWITCH ==========
function showTab(tab) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".sidebar-menu li").forEach(l => l.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  event.target.classList.add("active");

  const titles = { classes: "Classes & Subjects", teachers: "Teachers", students: "Students" };
  document.getElementById("pageTitle").innerText = titles[tab];
}

// ========== LOGOUT ==========
function adminLogout() {
  localStorage.clear();
  window.location.replace("admin-login.html");
}

// ========== MODAL ==========
function showAddClassModal() {
  document.getElementById("newClassName").value = "";
  document.getElementById("newSubjects").value = "";
  document.getElementById("classMsg").innerText = "";
  document.getElementById("addClassModal").style.display = "flex";
}

function showAddTeacherModal() {
  document.getElementById("teacherName").value = "";
  document.getElementById("teacherEmail").value = "";
  document.getElementById("teacherPassword").value = "";
  document.getElementById("teacherMsg").innerText = "";
  populateClassDropdown();
  document.getElementById("addTeacherModal").style.display = "flex";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// ========== CLASSES ==========
let allClasses = [];

async function loadClasses() {
  try {
    const res = await fetchAPI("/api/admin/classes");
    allClasses = await res.json();
    renderClasses();
  } catch (err) {
    console.error(err);
  }
}

function renderClasses() {
  const container = document.getElementById("classesList");
  if (allClasses.length === 0) {
    container.innerHTML = `<p class="empty-msg">No classes added yet</p>`;
    return;
  }

  container.innerHTML = allClasses.map(c => `
    <div class="class-card">
      <div class="class-card-header">
        <h3>🏫 ${c.className}</h3>
        <button class="delete-btn" onclick="deleteClass('${c._id}')">🗑️</button>
      </div>
      <div class="subjects-list">
        ${c.subjects.length > 0
          ? c.subjects.map(s => `<span class="subject-tag">${s}</span>`).join("")
          : `<span class="empty-subject">No subjects added</span>`
        }
      </div>
      <button class="edit-subjects-btn" onclick="editSubjects('${c._id}', '${c.className}', ${JSON.stringify(c.subjects)})">
        ✏️ Edit Subjects
      </button>
    </div>
  `).join("");
}

async function addClass() {
  const className = document.getElementById("newClassName").value.trim();
  const subjectsRaw = document.getElementById("newSubjects").value.trim();
  const msg = document.getElementById("classMsg");

  if (!className) { msg.innerText = "Class name required!"; return; }

  const subjects = subjectsRaw ? subjectsRaw.split(",").map(s => s.trim()).filter(s => s) : [];

  try {
    const res = await fetchAPI("/api/admin/classes", {
      method: "POST",
      body: JSON.stringify({ className, subjects })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = "green";
      msg.innerText = "Class added!";
      loadClasses();
      setTimeout(() => closeModal("addClassModal"), 1000);
    } else {
      msg.style.color = "red";
      msg.innerText = data.message;
    }
  } catch (err) {
    msg.innerText = "Error: " + err.message;
  }
}

async function deleteClass(id) {
  if (!confirm("Delete this class?")) return;
  await fetchAPI(`/api/admin/classes/${id}`, { method: "DELETE" });
  loadClasses();
}

function editSubjects(id, className, subjects) {
  const newSubjects = prompt(`Edit subjects for ${className} (comma separated):`, subjects.join(", "));
  if (newSubjects === null) return;
  const subjectArr = newSubjects.split(",").map(s => s.trim()).filter(s => s);
  fetchAPI(`/api/admin/classes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ className, subjects: subjectArr })
  }).then(() => loadClasses());
}

// ========== TEACHERS ==========
async function loadTeachers() {
  try {
    const res = await fetchAPI("/api/admin/teachers");
    const teachers = await res.json();
    const tbody = document.getElementById("teachersBody");

    if (teachers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#9ca3af;">No teachers found</td></tr>`;
      return;
    }

    tbody.innerHTML = teachers.map(t => `
      <tr>
        <td>👤 ${t.name}</td>
        <td>${t.email}</td>
        <td>${t.className || "—"}</td>
        <td>${t.subject || "—"}</td>
        <td><button class="delete-btn" onclick="deleteTeacher('${t._id}')">🗑️ Delete</button></td>
      </tr>
    `).join("");
  } catch (err) {
    console.error(err);
  }
}

async function populateClassDropdown() {
  const classSelect = document.getElementById("teacherClass");
  classSelect.innerHTML = `<option value="">Select Class</option>`;
  document.getElementById("teacherSubject").innerHTML = `<option value="">Select Subject</option>`;

  allClasses.forEach(c => {
    classSelect.innerHTML += `<option value="${c.className}">${c.className}</option>`;
  });

  classSelect.onchange = function() {
    const selected = allClasses.find(c => c.className === this.value);
    const subjectSelect = document.getElementById("teacherSubject");
    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
    if (selected) {
      selected.subjects.forEach(s => {
        subjectSelect.innerHTML += `<option value="${s}">${s}</option>`;
      });
    }
  };
}

async function addTeacher() {
  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  const password = document.getElementById("teacherPassword").value.trim();
  const className = document.getElementById("teacherClass").value;
  const subject = document.getElementById("teacherSubject").value;
  const msg = document.getElementById("teacherMsg");

  if (!name || !email || !password || !className || !subject) {
    msg.style.color = "red";
    msg.innerText = "All fields required!";
    return;
  }

  try {
    const res = await fetchAPI("/api/admin/register-teacher", {
      method: "POST",
      body: JSON.stringify({ name, email, password, className, subject })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = "green";
      msg.innerText = "Teacher registered!";
      loadTeachers();
      setTimeout(() => closeModal("addTeacherModal"), 1000);
    } else {
      msg.style.color = "red";
      msg.innerText = data.message;
    }
  } catch (err) {
    msg.innerText = "Error: " + err.message;
  }
}

async function deleteTeacher(id) {
  if (!confirm("Delete this teacher?")) return;
  await fetchAPI(`/api/admin/teachers/${id}`, { method: "DELETE" });
  loadTeachers();
}

// ========== STUDENTS ==========
async function loadStudents() {
  try {
    const res = await fetchAPI("/api/admin/students");
    const students = await res.json();
    const tbody = document.getElementById("studentsBody");

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#9ca3af;">No students found</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => `
      <tr>
        <td>👤 ${s.name}</td>
        <td>${s.email}</td>
        <td>${s.className || "—"}</td>
        <td><button class="delete-btn" onclick="deleteStudent('${s._id}')">🗑️ Delete</button></td>
      </tr>
    `).join("");
  } catch (err) {
    console.error(err);
  }
}

async function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;
  await fetchAPI(`/api/admin/students/${id}`, { method: "DELETE" });
  loadStudents();
}