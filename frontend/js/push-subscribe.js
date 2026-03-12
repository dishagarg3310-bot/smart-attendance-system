const VAPID_PUBLIC_KEY = "BLbatwvx_qVRCJFr_QgYaxRsJ6gE-vKA12Wy4aDVLaYYADvNbYbkhKU0VBIeY0RX2OQQ7aRlq3YdKrC7eF6l0Vs";

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications not supported ");
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    await fetchAPI("/api/notification/subscribe", {
      method: "POST",
      body: JSON.stringify({ subscription: sub })
    });

    console.log("Push subscription saved!");
  } catch (err) {
    console.error("Push subscribe error:", err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}