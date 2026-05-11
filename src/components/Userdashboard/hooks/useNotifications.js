import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL channel registry — survives React StrictMode double-mount.
//
// THE ACTUAL ROOT CAUSE:
// React StrictMode: mount → cleanup → remount (in dev only).
// Between cleanup and remount, useRef resets to null.
// supabase.removeChannel() is internally async — the channel is queued for
// removal but NOT synchronously purged from Supabase's client registry.
// On the remount, supabase.channel('notifications:uid') returns the SAME
// already-SUBSCRIBED object (Supabase deduplicates channels by name).
// Calling .on() on an already-subscribed channel throws:
//   "cannot add postgres_changes callbacks after subscribe()"
//
// THE FIX:
// Store active channels at MODULE scope (outside React). Module-level state
// survives the StrictMode unmount/remount. On the second mount we find the
// channel already registered and skip re-creation entirely. On a real unmount
// (user navigates away, signs out) we destroy it after a 100ms delay — long
// enough for StrictMode to remount and cancel the timer, short enough that
// real navigation cleans up promptly.
// ─────────────────────────────────────────────────────────────────────────────

/** uid → Supabase RealtimeChannel */
const activeChannels = {};

/** uid → NodeJS.Timeout (pending destroy timer) */
const destroyTimers = {};

function getOrCreateChannel(uid, onInsert, onUpdate) {
  // Cancel any pending destroy for this uid (handles StrictMode remount)
  if (destroyTimers[uid]) {
    clearTimeout(destroyTimers[uid]);
    delete destroyTimers[uid];
  }

  // Channel already subscribed — return it, do NOT call .on() again
  if (activeChannels[uid]) {
    return activeChannels[uid];
  }

  // Build the full channel with ALL listeners before calling .subscribe()
  const channel = supabase
    .channel(`notifications:${uid}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT', schema: 'public',
        table: 'notifications', filter: `user_id=eq.${uid}`,
      },
      onInsert
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE', schema: 'public',
        table: 'notifications', filter: `user_id=eq.${uid}`,
      },
      onUpdate
    );

  // .subscribe() MUST come after all .on() calls — this order is mandatory
  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.warn('[useNotifications] Realtime error for uid:', uid);
    }
  });

  activeChannels[uid] = channel;
  return channel;
}

function scheduleDestroy(uid) {
  // Delay gives StrictMode time to remount and cancel before we actually remove
  destroyTimers[uid] = setTimeout(() => {
    if (activeChannels[uid]) {
      supabase.removeChannel(activeChannels[uid]);
      delete activeChannels[uid];
    }
    delete destroyTimers[uid];
  }, 150);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [uid, setUid]                     = useState(null);

  const handleInsert = useCallback((payload) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === payload.new.id)) return prev;
      return [payload.new, ...prev];
    });
  }, []);

  const handleUpdate = useCallback((payload) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === payload.new.id ? { ...n, ...payload.new } : n))
    );
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setNotifications(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Firebase auth listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
        fetchNotifications(firebaseUser.uid);
      } else {
        setUid(null);
        setNotifications([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchNotifications]);

  // ── Realtime subscription — uses module registry, safe in StrictMode ───
  useEffect(() => {
    if (!uid) return;

    getOrCreateChannel(uid, handleInsert, handleUpdate);

    return () => {
      // Schedule destroy — StrictMode remount will cancel it in time
      scheduleDestroy(uid);
    };
  }, [uid, handleInsert, handleUpdate]);

  // ── Mark single as read (optimistic) ──────────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) {
      // Roll back
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n))
      );
      setError('Failed to mark notification as read.');
    }
  }, []);

  // ── Mark all as read (optimistic) ─────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!uid) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', uid)
      .eq('is_read', false);

    if (updateError) {
      fetchNotifications(uid);
      setError('Failed to mark all notifications as read.');
    }
  }, [uid, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllRead,
    refetch: () => fetchNotifications(uid),
  };
}
