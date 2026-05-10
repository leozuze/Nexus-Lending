import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Fetches notifications for the current user and subscribes to real-time updates.
// Returns: { notifications, unreadCount, loading, error, markAsRead, markAllRead, refetch }
//
// FIX: The previous version threw:
//   "cannot add postgres_changes callbacks after subscribe()"
// because the channel was being created and subscribed multiple times on re-renders.
// Now we use a ref to track the active channel and remove it before creating a new one.

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [uid, setUid]                     = useState(null);
  const channelRef                        = useRef(null);   // tracks the live channel

  // ── Fetch all notifications for a user ──────────────────────────────────
  const fetchNotifications = async (userId) => {
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
  };

  // ── Listen to Firebase auth state ────────────────────────────────────────
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
  }, []);

  // ── Real-time Supabase subscription ─────────────────────────────────────
  // FIX: We tear down the previous channel before creating a new one.
  // This prevents the "cannot add callbacks after subscribe()" error
  // that happened because React StrictMode / re-renders called this effect
  // multiple times while a channel was still open.
  useEffect(() => {
    if (!uid) return;

    // Remove any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications-${uid}-${Date.now()}`) // unique name prevents collision
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [uid]);

  // ── Mark a single notification as read ──────────────────────────────────
  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  };

  // ── Mark all notifications as read ──────────────────────────────────────
  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (!uid) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', uid)
      .eq('is_read', false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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