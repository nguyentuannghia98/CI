// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// 🔧 Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyB13nSnVH0KHtSY3NkDCjXSvCDZ_6Z5aA",
  authDomain: "nexlot-2cecb3.firebaseapp.com",
  projectId: "nexlot-2cecb3",
  storageBucket: "nexlot-2cecb3.appspot.com",
  messagingSenderId: "114108856035",
  appId: "1:114108856035:web:9fa7dae596d45beeb8b1d6",
});

const messaging = firebase.messaging();

// 📥 Background notification handler
messaging.onBackgroundMessage((payload) => {
  console.log("📥 Background notification:", payload);

  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Thông báo", {
    body: body || "Bạn có thông báo mới",
    icon: icon || "/icon.png",
  });
});
