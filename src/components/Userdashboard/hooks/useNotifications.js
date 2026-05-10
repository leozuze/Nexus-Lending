import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Fetches notifications for the current user and subscribes to real-time updates.
// Returns: { notifications, unreadCount, loading, error, markAsRead, markAllRead }
//
// `notifications` shape:
// {
//   id, user_id, message, type, is_read, created_at
//   type → 'payment_due' | 'approved' | 'rejected' | 'identity' | 'general'
// }

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uid, setUid] = useState(null);

  const fetchNotifications = async (userId) => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  // Real-time subscription — new notifications appear instantly
  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [uid]);

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  };

  // Mark all as read
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