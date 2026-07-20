/* eslint-disable no-undef */
self.addEventListener("push", (event) => {
  let data = { title: "WorthKart", body: "Order update", url: "/orders" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      data: { url: data.url || "/orders" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/orders";
  event.waitUntil(clients.openWindow(url));
});
