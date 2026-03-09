const API = window.location.origin;

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