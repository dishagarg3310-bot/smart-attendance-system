self.addEventListener("push", function(event) {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/icon.png",
    badge: "/icon.png",
    data: { sessionId: data.sessionId }
  });
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/html/student-scan.html")
  );
});