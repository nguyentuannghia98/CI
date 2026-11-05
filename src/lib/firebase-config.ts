import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getMessaging, 
  getToken, 
  onMessage, 
  isSupported, 
  Messaging, 
  MessagePayload, 
  Unsubscribe 
} from "firebase/messaging";

const firebaseConfig = { 
  apiKey: "AIzaSyBYI3nSnHVQHKSIY3NkDCjXSVdCZ_6Z50A", 
  authDomain: "nexlot-2ceb3.firebaseapp.com", 
  projectId: "nexlot-2ceb3", 
  storageBucket: "nexlot-2ceb3.firebasestorage.app", 
  messagingSenderId: "141108856035", 
  appId: "1:141108856035:web:9fa7dae596d45beeb8b1d6", 
  measurementId: "G-0719VE9XQF"
};

// 1. Initialize App
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Safe Messaging Instance helper
const getMessagingInstance = async (): Promise<Messaging | null> => {
  try {
    const isBrowser = typeof window !== "undefined";
    // Ensure isSupported() is awaited and typed as boolean
    const supported: boolean = isBrowser && await isSupported();
    if (supported) {
      return getMessaging(app);
    }
    return null;
  } catch (err: unknown) {
    console.error("FCM isSupported error:", err);
    return null;
  }
};

// 3. Request FCM token
export const requestForToken = async (): Promise<string | null> => {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const currentToken: string = await getToken(messaging, {
      vapidKey: "BIgunHcVieLZbSj-R5g9M3mrY5ATVFOEyN8sEUuVoK9Ot_hJS0gd6wD7jfWHmrU4XAsRBgXomy4noNo_b7l35iY",
    });

    return currentToken || null;
  } catch (error: unknown) {
    console.error("❌ Error getting token:", error);
    return null;
  }
};

// 4. Foreground Message Listener
export const onMessageListener = async (
  callback: (payload: MessagePayload) => void
): Promise<Unsubscribe | null> => {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  // Explicitly return the Unsubscribe function
  return onMessage(messaging, (payload: MessagePayload) => {
    callback(payload);
  });
};