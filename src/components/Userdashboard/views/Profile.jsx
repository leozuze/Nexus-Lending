import React, { useState, useEffect } from 'react';
import { Save, Loader2, User, Mail, MapPin } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { useUser } from '../hooks/useUser';

const ZIM_PROVINCES = [
  'Bulawayo','Harare','Manicaland','Mashonaland Central',
  'Mashonaland East','Mashonaland West','Masvingo',
  'Matabeleland North','Matabeleland South','Midlands'
];

export default function Profile() {
  const { user, loading, refetch } = useUser();
  const [form, setForm] = useState({ first_name:'', last_name:'', province:'' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? '',
        last_name:  user.last_name  ?? '',
        province:   user.province   ?? '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...form })
        .eq('id', uid);
      if (error) throw error;
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-start pt-4">
        <div className="max-w-xl w-full h-96 bg-white rounded-[2rem] border border-gray-100 animate-pulse shadow-sm" />
      </div>
    );
  }

  const initials = `${form.first_name?.[0] ?? ''}${form.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="mx-auto max-w-xl w-full px-4 sm:px-0 space-y-6 flex flex-col items-center">
      
      {/* Header Profile Section */}
      <div className="w-full bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 transition-all">
        <div className="w-20 h-20 rounded-[1.5rem] bg-[#0B1E3D] flex items-center justify-center text-[#22D3EE] text-2xl font-black shadow-lg shadow-navy-900/10 ring-4 ring-cyan-50 flex-shrink-0">
          {initials || <User size={32} />}
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-black text-[#0B1E3D] tracking-tight">
            {form.first_name || 'Incomplete'} {form.last_name || 'Profile'}
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400">
            <Mail size={12} />
            <p className="text-xs font-bold">{user?.email}</p>
          </div>
          <p className="text-[10px] text-cyan-600 font-black uppercase tracking-widest pt-2">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="w-full bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-1 h-4 bg-cyan-500 rounded-full" />
          <h2 className="text-xs font-black text-[#0B1E3D] uppercase tracking-[0.2em]">Account Security & Identity</h2>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-black text-red-600 uppercase tracking-tight text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="First Name" value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} />
          <Field label="Last Name"  value={form.last_name}  onChange={v => setForm(f => ({ ...f, last_name: v }))} />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
            <Mail size={10} className="text-cyan-500" />
            Verified Email Address
          </label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed"
          />
          <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter px-1">
            Institutional email cannot be modified manually.
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
            <MapPin size={10} className="text-cyan-500" />
            Primary Province
          </label>
          <select
            value={form.province}
            onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-[#0B1E3D] outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-200 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select geographic region</option>
            {ZIM_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-lg ${
            saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
            saving ? 'bg-[#0B1E3D] opacity-80' :
            'bg-[#0B1E3D] text-white hover:bg-[#22D3EE] hover:text-[#0B1E3D] shadow-navy-900/10 active:scale-[0.98]'
          }`}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : (saved ? null : <Save size={16} />)}
          {saved ? 'Changes Secured' : saving ? 'Syncing...' : 'Update Profile'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-[#0B1E3D] outline-none focus:bg-white focus:border-cyan-200 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-gray-300"
      />
    </div>
  );
}