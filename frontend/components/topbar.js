function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hide');
  const content = document.getElementById('mainContent');
  content.classList.toggle('full');
}

function logout() {
  const role = localStorage.getItem("role");
  localStorage.clear();
  if (role === "student") {
    window.location.replace("student-login.html");
  } else {
    window.location.replace("teacher-login.html");
  }
}

const role = localStorage.getItem('role');

const teacherLinks = `
  <li onclick="window.location.href='teacher-db.html'">🏠 Dashboard</li>
  <li onclick="window.location.href='attendance.html'">📋 Attendance</li>
  <li onclick="window.location.href='teacher-chat.html'">💬 Announcements</li>
  <li onclick="window.location.href='session-history.html'">📅 Session</li>
  <li onclick="window.location.href='teacher-profile.html'">👤 Profile</li>
  <li onclick="window.location.href='change-password.html'">🔒 Change Password</li>
`;

const studentLinks = `
  <li onclick="window.location.href='stud-db.html'">🏠 Dashboard</li>
  <li onclick="window.location.href='student-scan.html'">📷 Scan QR</li>
  <li onclick="window.location.href='student-attendance.html'">📊 My Attendance</li>
  <li onclick="window.location.href='student-chat.html'">💬 Announcements</li>
  <li onclick="window.location.href='student-profile.html'">👤 Profile</li>
  <li onclick="window.location.href='change-password.html'">🔒 Change Password</li>
`;

fetch('../components/sidebar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('sidebar-container').innerHTML = html;
    document.getElementById('sidebarMenu').innerHTML =
      role === 'student' ? studentLinks : teacherLinks;
  });

fetch('../components/topbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('topbar-container').innerHTML = html;
  });