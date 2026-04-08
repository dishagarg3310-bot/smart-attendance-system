document.addEventListener("DOMContentLoaded", () => {

  // Tab switch
  window.showTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(l => l.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    const titles = { classes: 'Classes & Subjects', teachers: 'Teachers', students: 'Students' };
    document.getElementById('pageTitle').innerText = titles[tabName];

    const index = ['classes', 'teachers', 'students'].indexOf(tabName);
    document.querySelectorAll('.sidebar-menu li')[index].classList.add('active');

    if (tabName === 'teachers') loadTeachers();
    if (tabName === 'students') loadStudents();
    if (tabName === 'classes') loadClasses();
  };

  // Logout
  window.adminLogout = function() {
    localStorage.clear();
    window.location.replace("admin-login.html");
  };

  // ===================== CLASSES =====================

  async function loadClasses() {
    try {
      const res = await fetchAPI("/api/admin/classes");
      const classes = await res.json();
      renderClasses(classes);
    } catch (err) {
      console.error(err);
    }
  }

  function renderClasses(classes) {
    const list = document.getElementById("classesList");
    if (classes.length === 0) {
      list.innerHTML = `<p style="color:#999">No classes added yet</p>`;
      return;
    }
    list.innerHTML = classes.map(c => `
      <div class="class-card">
        <h3>🏫 ${c.className}</h3>
        <div class="subjects-list">
          ${c.subjects.length > 0
            ? c.subjects.map(s => `<span class="subject-tag">${s}</span>`).join("")
            : `<span style="color:#999;font-size:13px">No subjects added</span>`
          }
        </div>
        <div class="card-actions">
          <button class="edit-btn" onclick="showEditClassModal('${c._id}', '${c.className}', '${c.subjects.join(",")}')">✏️ Edit</button>
          <button class="delete-btn" onclick="deleteClass('${c._id}')">🗑️ Delete</button>
        </div>
      </div>
    `).join("");
  }

  window.showAddClassModal = function() {
    document.getElementById("newClassName").value = "";
    document.getElementById("newSubjects").value = "";
    document.getElementById("classMsg").innerText = "";
    document.getElementById("addClassModal").classList.add("active");
  };

  window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove("active");
  };

  window.addClass = async function() {
    const className = document.getElementById("newClassName").value.trim();
    const subjectsRaw = document.getElementById("newSubjects").value.trim();
    const classMsg = document.getElementById("classMsg");

    if (!className) {
      classMsg.style.color = "red";
      classMsg.innerText = "Class name required!";
      return;
    }

    const subjects = subjectsRaw ? subjectsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

    try {
      const res = await fetchAPI("/api/admin/classes", {
        method: "POST",
        body: JSON.stringify({ className, subjects })
      });
      const data = await res.json();

      if (res.ok) {
        classMsg.style.color = "green";
        classMsg.innerText = "Class added!";
        setTimeout(() => {
          closeModal("addClassModal");
          loadClasses();
        }, 1000);
      } else {
        classMsg.style.color = "red";
        classMsg.innerText = data.message || "Error!";
      }
    } catch (err) {
      classMsg.style.color = "red";
      classMsg.innerText = "Connection failed!";
    }
  };

  window.showEditClassModal = function(id, className, subjects) {
    document.getElementById("newClassName").value = className;
    document.getElementById("newSubjects").value = subjects;
    document.getElementById("classMsg").innerText = "";

    const saveBtn = document.querySelector("#addClassModal .save-btn");
    saveBtn.innerText = "Update";
    saveBtn.onclick = () => updateClass(id);

    document.getElementById("addClassModal").classList.add("active");
  };

  async function updateClass(id) {
    const className = document.getElementById("newClassName").value.trim();
    const subjectsRaw = document.getElementById("newSubjects").value.trim();
    const subjects = subjectsRaw ? subjectsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
    const classMsg = document.getElementById("classMsg");

    try {
      const res = await fetchAPI(`/api/admin/classes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ className, subjects })
      });

      if (res.ok) {
        classMsg.style.color = "green";
        classMsg.innerText = "Updated!";
        setTimeout(() => {
          closeModal("addClassModal");
          loadClasses();
          // Reset button
          const saveBtn = document.querySelector("#addClassModal .save-btn");
          saveBtn.innerText = "Add Class";
          saveBtn.onclick = addClass;
        }, 1000);
      }
    } catch (err) {
      classMsg.style.color = "red";
      classMsg.innerText = "Error!";
    }
  }

  window.deleteClass = async function(id) {
    if (!confirm("Delete this class?")) return;
    try {
      await fetchAPI(`/api/admin/classes/${id}`, { method: "DELETE" });
      loadClasses();
    } catch (err) {
      console.error(err);
    }
  };

  // ===================== TEACHERS =====================

  async function loadTeachers() {
    try {
      const res = await fetchAPI("/api/admin/teachers");
      const teachers = await res.json();
      const tbody = document.getElementById("teachersBody");
      if (teachers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999">No teachers yet</td></tr>`;
        return;
      }
      tbody.innerHTML = teachers.map(t => `
        <tr>
          <td>${t.name}</td>
          <td>${t.email}</td>
          <td>${t.className || "-"}</td>
          <td>${t.subject || "-"}</td>
          <td>
            <button class="delete-btn" onclick="deleteTeacher('${t._id}')">🗑️ Delete</button>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      console.error(err);
    }
  }

  window.showAddTeacherModal = async function() {
    document.getElementById("teacherName").value = "";
    document.getElementById("teacherEmail").value = "";
    document.getElementById("teacherPassword").value = "";
    document.getElementById("teacherMsg").innerText = "";

    // Load classes in dropdown
    try {
      const res = await fetchAPI("/api/admin/classes");
      const classes = await res.json();
      const classSelect = document.getElementById("teacherClass");
      classSelect.innerHTML = `<option value="">Select Class</option>` +
        classes.map(c => `<option value="${c.className}">${c.className}</option>`).join("");

      // Subject dropdown update on class change
      classSelect.onchange = function() {
        const selected = classes.find(c => c.className === this.value);
        const subjectSelect = document.getElementById("teacherSubject");
        subjectSelect.innerHTML = `<option value="">Select Subject</option>` +
          (selected ? selected.subjects.map(s => `<option value="${s}">${s}</option>`).join("") : "");
      };
    } catch (err) {
      console.error(err);
    }

    document.getElementById("addTeacherModal").classList.add("active");
  };

  window.addTeacher = async function() {
    const name = document.getElementById("teacherName").value.trim();
    const email = document.getElementById("teacherEmail").value.trim();
    const password = document.getElementById("teacherPassword").value.trim();
    const className = document.getElementById("teacherClass").value;
    const subject = document.getElementById("teacherSubject").value;
    const teacherMsg = document.getElementById("teacherMsg");

    if (!name || !email || !password || !className || !subject) {
      teacherMsg.style.color = "red";
      teacherMsg.innerText = "All fields required!";
      return;
    }

    try {
      const res = await fetchAPI("/api/admin/register-teacher", {
        method: "POST",
        body: JSON.stringify({ name, email, password, className, subject })
      });
      const data = await res.json();

      if (res.ok) {
        teacherMsg.style.color = "green";
        teacherMsg.innerText = "Teacher registered!";
        setTimeout(() => {
          closeModal("addTeacherModal");
          loadTeachers();
        }, 1000);
      } else {
        teacherMsg.style.color = "red";
        teacherMsg.innerText = data.message || "Error!";
      }
    } catch (err) {
      teacherMsg.style.color = "red";
      teacherMsg.innerText = "Connection failed!";
    }
  };

  window.deleteTeacher = async function(id) {
    if (!confirm("Delete this teacher?")) return;
    try {
      await fetchAPI(`/api/admin/teachers/${id}`, { method: "DELETE" });
      loadTeachers();
    } catch (err) {
      console.error(err);
    }
  };

  // ===================== STUDENTS =====================

  async function loadStudents() {
    try {
      const res = await fetchAPI("/api/admin/students");
      const students = await res.json();
      const tbody = document.getElementById("studentsBody");
      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999">No students yet</td></tr>`;
        return;
      }
      tbody.innerHTML = students.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.email}</td>
          <td>${s.className || "-"}</td>
          <td>
            <button class="delete-btn" onclick="deleteStudent('${s._id}')">🗑️ Delete</button>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      console.error(err);
    }
  }

  window.deleteStudent = async function(id) {
    if (!confirm("Delete this student?")) return;
    try {
      await fetchAPI(`/api/admin/students/${id}`, { method: "DELETE" });
      loadStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // Load classes on start
  loadClasses();
});