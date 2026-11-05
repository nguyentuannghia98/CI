"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestForToken, onMessageListener } from "@/lib/firebase-config";
import { MessagePayload, Unsubscribe } from "firebase/messaging";

// PHẢI CÓ CHỮ DEFAULT Ở ĐÂY
export default function FirebaseInit() {
  const isSyncing = useRef(false);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const syncToken = useCallback(async () => {
    if (typeof window === "undefined" || isSyncing.current || Notification.permission !== "granted") return;
    
    isSyncing.current = true;
    const supabase = createClient();

    try {
      const token = await requestForToken();
      if (!token) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_tokens")
          .upsert(
            { user_id: user.id, fcm_token: token, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
        console.log("✅ FCM Token synced");
      }
    } catch (err) {
      console.error("FCM Sync Error:", err);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => syncToken())
        .catch(console.error);
    }

    const setupListener = async () => {
      const unsubs = await onMessageListener((payload: MessagePayload) => {
        console.log("📥 Foreground Message:", payload);
      });
      if (unsubs) unsubscribeRef.current = unsubs;
    };

    setupListener();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [syncToken]);

  return null;
}