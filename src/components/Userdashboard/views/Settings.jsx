import React, { useState } from 'react';
import { Shield, Bell, Trash2, ChevronRight, Loader2, Lock, Cookie } from 'lucide-react';
import { auth } from '../../../firebase';
import { signOut, deleteUser, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({ payment_due: true, approved: true, general: true });
  const [cookies, setCookies] = useState({ analytics: true, marketing: false });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState(null); // null | 'saving' | 'success' | 'error'
  const [pwError, setPwError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveNotifications = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await supabase.from('users').update({ notification_prefs: notifications }).eq('id', uid);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.next !== passwordForm.confirm) {
      setPwError('Passwords do not match.');
      return;
    }
    if (passwordForm.next.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwStatus('saving');
    setPwError('');
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordForm.next);
      setPwStatus('success');
      setPasswordForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwStatus(null), 3000);
    } catch (err) {
      setPwStatus('error');
      setPwError(err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : err.message);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const uid = auth.currentUser?.uid;
      await supabase.from('notifications').delete().eq('user_id', uid);
      await supabase.from('users').delete().eq('id', uid);
      await deleteUser(auth.currentUser);
      navigate('/');
    } catch (err) {
      setDeleting(false);
      alert('Could not delete account. Please sign out and sign back in first, then try again.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Notification preferences */}
      <SettingsCard title="Notification preferences" icon={Bell}>
        {[
          { key: 'payment_due', label: 'Payment reminders', desc: 'Get notified before a payment is due' },
          { key: 'approved',    label: 'Loan status updates', desc: 'Approvals, rejections, and offer alerts' },
          { key: 'general',     label: 'General news',        desc: 'Product updates and announcements' },
        ].map(item => (
          <ToggleRow
            key={item.key}
            label={item.label}
            desc={item.desc}
            checked={notifications[item.key]}
            onChange={v => { setNotifications(n => ({ ...n, [item.key]: v })); saveNotifications(); }}
          />
        ))}
      </SettingsCard>

      {/* Cookie preferences */}
      <SettingsCard title="Privacy & Tracking" icon={Cookie}>
        <ToggleRow label="Essential" desc="Required for security and session management" checked={true} disabled />
        <ToggleRow
          label="Analytics"
          desc="Helps us improve the platform (anonymized)"
          checked={cookies.analytics}
          onChange={v => setCookies(c => ({ ...c, analytics: v }))}
        />
        <ToggleRow
          label="Personalization"
          desc="Tailored financial content based on your usage"
          checked={cookies.marketing}
          onChange={v => setCookies(c => ({ ...c, marketing: v }))}
        />
      </SettingsCard>

      {/* Change password */}
      <SettingsCard title="Security Credentials" icon={Lock}>
        {pwError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-black text-red-600 uppercase tracking-tight mb-4 text-center">{pwError}</div>
        )}
        {pwStatus === 'success' && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-black text-emerald-600 uppercase tracking-tight mb-4 text-center">Credentials Updated Successfully</div>
        )}
        <div className="space-y-3">
          {[
            { key: 'current', placeholder: 'Current password' },
            { key: 'next',    placeholder: 'New password' },
            { key: 'confirm', placeholder: 'Confirm new password' },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              type="password"
              placeholder={placeholder}
              value={passwordForm[key]}
              onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-[#0B1E3D] outline-none focus:bg-white focus:border-cyan-200 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-gray-300"
            />
          ))}
        </div>
        <button
          onClick={handlePasswordChange}
          disabled={pwStatus === 'saving'}
          className="w-full flex items-center justify-center gap-3 py-4 mt-4 bg-[#0B1E3D] text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-cyan-600 transition-all shadow-lg shadow-navy-900/10 active:scale-[0.98]"
        >
          {pwStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
          {pwStatus === 'saving' ? 'Verifying...' : 'Update credentials'}
        </button>
        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tight mt-3 text-center">Note: Passwords can only be updated for native email accounts.</p>
      </SettingsCard>

      {/* Danger zone */}
      <div className="bg-white rounded-[2rem] border border-red-100 p-8 shadow-sm transition-all hover:shadow-red-500/5">
        <h2 className="text-xs font-black text-red-600 mb-4 flex items-center gap-2 uppercase tracking-[0.15em]">
          <Trash2 size={16} />
          Critical Actions
        </h2>
        <p className="text-[11px] text-gray-400 font-bold mb-6 leading-relaxed">
          Account deletion is irreversible. Your profile, active sessions, and notification history will be permanently purged. Financial records may be archived for audit compliance.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-full sm:w-auto px-8 py-3 border-2 border-red-50 text-red-600 text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-red-50 transition-colors"
          >
            Deactivate Account
          </button>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <p className="text-[11px] font-black text-red-700 uppercase tracking-tighter">Confirm immediate permanent deletion?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-8 py-3 bg-red-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Purge All Data
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-8 py-3 bg-gray-50 text-gray-500 text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-gray-100"
              >
                Abort
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 bg-cyan-500 rounded-full" />
        <h2 className="text-xs font-black text-[#0B1E3D] flex items-center gap-2 uppercase tracking-[0.2em]">
          <Icon size={14} className="text-cyan-600" strokeWidth={3} />
          {title}
        </h2>
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-black text-[#0B1E3D] tracking-tight">{label}</p>
        <p className="text-[11px] font-bold text-gray-400 mt-0.5 tracking-tight">{desc}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
          checked ? 'bg-[#22D3EE] shadow-inner' : 'bg-gray-200'
        } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:ring-4 hover:ring-cyan-500/10'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}