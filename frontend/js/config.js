// ✅ FIX: Hardcoded ngrok URL hatao
// Ab automatically current URL detect hoga
// Chahe localhost ho, ya ngrok ka koi bhi URL - sab kaam karega

const API = "https://smart-attendance-system-3-xtyv.onrender.com";

async function fetchAPI(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...options.headers
  };

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const res = await fetch(API + url, {
    ...options,
    headers
  });

  return res;
}