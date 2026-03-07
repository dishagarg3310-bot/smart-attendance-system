document.getElementById("changeBtn").addEventListener("click", async () => {
  const currentPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  const successMsg = document.getElementById("successMsg");

  errorMsg.innerText = "";
  successMsg.innerText = "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    errorMsg.innerText = "Saare fields fill karo!";
    return;
  }

  if (newPassword.length < 6) {
    errorMsg.innerText = "Password kam se kam 6 characters ka hona chahiye!";
    return;
  }

  if (newPassword !== confirmPassword) {
    errorMsg.innerText = "New password aur confirm password match nahi kar rahe!";
    return;
  }

  try {
    const res = await fetchAPI("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (res.ok) {
      successMsg.innerText = "✅ Password successfully change ho gaya!";
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } else {
      errorMsg.innerText = data.message || "Password change nahi hua!";
    }
  } catch (err) {
    console.error(err);
    errorMsg.innerText = "Server error!";
  }
});