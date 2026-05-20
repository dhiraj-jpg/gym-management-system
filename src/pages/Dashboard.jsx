import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { User, Activity, Loader2, Calendar, Edit2, Check, X, ShieldCheck, Target, Phone, Scale, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [role, setRole] = useState('member');
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    goal: '',
    weight: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setRole(data.role || 'member');
          setEditForm({
            name: data.name || user.displayName || '',
            phone: data.phone || '',
            goal: data.goal || 'General Fitness',
            weight: data.weight || ''
          });
        }
      } catch (err) {
        console.error(err);
        setErrorObj(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  async function handleSaveProfile() {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      if (editForm.name !== profile?.name) {
        await updateProfile(user, { displayName: editForm.name });
      }
      const userRef = doc(db, 'users', user.uid);
      const updates = {
        name: editForm.name,
        phone: editForm.phone,
        goal: editForm.goal,
        weight: editForm.weight
      };
      await updateDoc(userRef, updates);
      
      setProfile(prev => ({ ...prev, ...updates }));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium tracking-tight">Loading profile data...</p>
      </div>
    );
  }

  if (errorObj) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-3xl max-w-lg text-center shadow-lg shadow-red-500/5">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black mb-2">Access Denied</h2>
          <p className="text-sm font-medium">{errorObj}</p>
          <p className="text-xs mt-4 text-zinc-500">Firebase Firestore permissions missing or blocked.</p>
        </div>
      </div>
    );
  }

  const hasSubscription = profile?.plan && profile?.plan !== 'none';
  const planColor = profile?.plan === 'Premium' 
    ? 'from-orange-500 to-orange-400 text-white shadow-orange-500/30 border-orange-400' 
    : profile?.plan === 'Standard' 
      ? 'from-blue-500 to-blue-400 text-white shadow-blue-500/30 border-blue-400' 
      : 'from-zinc-200 to-zinc-100 text-zinc-700 shadow-zinc-200/50 border-zinc-200';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tight">
            {role === 'admin' || role === 'staff' ? 'Staff Portal' : 'Member Portal'}
          </h1>
          <p className="text-zinc-500 font-medium text-lg">
            {role === 'admin' || role === 'staff' ? 'Manage gym operations.' : 'Manage your personal metrics and active subscriptions.'}
          </p>
        </div>
        {role === 'member' && !hasSubscription && (
          <Link to="/membership" className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform">
            View Plans
          </Link>
        )}
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Personal Profile & Biometrics Management */}
        <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 relative shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <User className="w-40 h-40 text-orange-500" />
          </div>
          
          <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-6 relative z-20">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center tracking-tight">
              <User className="w-6 h-6 text-orange-500 mr-2.5" /> {role === 'admin' || role === 'staff' ? 'Staff Identity' : 'Identity & Biometrics'}
            </h2>
            
            {!(role === 'admin' || role === 'staff') && (
              !isEditing ? (
                <button onClick={() => setIsEditing(true)} className="p-2.5 bg-zinc-50 hover:bg-orange-50 text-zinc-400 border border-zinc-200 hover:text-orange-600 hover:border-orange-200 rounded-xl transition-all flex items-center shadow-sm">
                  <Edit2 className="w-4 h-4 mr-0 md:mr-2" />
                  <span className="hidden md:block text-sm font-bold">Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button onClick={handleSaveProfile} disabled={saving} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-xl transition-colors flex items-center shadow-sm">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button onClick={() => { 
                    setIsEditing(false); 
                    setEditForm({
                      name: profile?.name || user.displayName || '',
                      phone: profile?.phone || '',
                      goal: profile?.goal || 'General Fitness',
                      weight: profile?.weight || ''
                    });
                  }} className="p-2.5 bg-red-50 text-red-500 border border-red-200 hover:text-red-700 hover:bg-red-100 rounded-xl transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )
            )}
          </div>

          <div className="relative z-10">
            {isEditing ? (
              <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Full Legal Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Phone Number</label>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="+44 7700 900000" className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Current Weight</label>
                    <input type="text" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: e.target.value})} placeholder="e.g. 75 kg" className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Primary Fitness Goal</label>
                    <div className="relative">
                      <select value={editForm.goal} onChange={e => setEditForm({...editForm, goal: e.target.value})} className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium appearance-none">
                        <option value="General Fitness">General Fitness</option>
                        <option value="Weight Loss">Weight Loss & Toning</option>
                        <option value="Muscle Gain">Muscle Gain & Hypertrophy</option>
                        <option value="Endurance">Marathon / Endurance Training</option>
                        <option value="Flexibility">Flexibility & Core</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 border-2 border-orange-200 rounded-full flex items-center justify-center text-3xl font-black text-orange-600 uppercase mr-6 shadow-sm shrink-0">
                    {profile?.name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight truncate">{profile?.name || user.displayName}</h2>
                    <p className="text-zinc-500 font-medium mt-0.5 truncate">{user.email}</p>
                  </div>
                </div>

                {!(role === 'admin' || role === 'staff') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center">
                      <div className="w-10 h-10 bg-white shadow-sm border border-zinc-200 rounded-full flex items-center justify-center mr-4 shrink-0">
                        <Target className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Goal</p>
                        <p className="text-zinc-900 font-bold">{profile?.goal || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center">
                      <div className="w-10 h-10 bg-white shadow-sm border border-zinc-200 rounded-full flex items-center justify-center mr-4 shrink-0">
                        <Scale className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Current Body Weight</p>
                        <p className="text-zinc-900 font-bold">{profile?.weight || 'Not logged'}</p>
                      </div>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center md:col-span-2">
                      <div className="w-10 h-10 bg-white shadow-sm border border-zinc-200 rounded-full flex items-center justify-center mr-4 shrink-0">
                        <Phone className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Emergency / Contact</p>
                        <p className="text-zinc-900 font-bold">{profile?.phone || 'No phone number provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Membership / Staff Status & Billing */}
        <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 flex flex-col shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          {role === 'admin' || role === 'staff' ? (
            <>
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center tracking-tight">
                <ShieldCheck className="w-6 h-6 text-orange-500 mr-2.5" /> Staff Operations
              </h2>
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-orange-50 border border-orange-100 flex items-center justify-center mb-6 shadow-sm">
                  <Activity className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Administrative Override</h3>
                <p className="text-zinc-500 font-medium max-w-[280px] leading-relaxed">
                  Billing, subscriptions, and biometrics are disabled for Operator accounts. You possess omni-access natively.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center tracking-tight">
                <Activity className="w-6 h-6 text-orange-500 mr-2.5" /> Subscription Details
              </h2>
              
              {hasSubscription ? (
                <div className="flex-1 flex flex-col items-center">
                  <div className={`w-full rounded-[2rem] bg-gradient-to-br border ${planColor} p-8 flex flex-col items-center text-center mb-auto`}>
                    <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-2">Active Tariff Plan</p>
                    <h3 className="text-4xl font-black mb-6 tracking-tight">{profile.plan}</h3>
                    <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/30 text-white shadow-sm w-full">
                      <Calendar className="w-5 h-5 mr-3 shrink-0" /> 
                      <span className="font-semibold text-sm">
                        Renews on: {profile.subscription_end ? format(profile.subscription_end.toDate?.() || new Date(profile.subscription_end), 'MMM dd, yyyy') : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full mt-6 space-y-4">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start">
                      <AlertCircle className="w-5 h-5 text-orange-500 mr-3 shrink-0 mt-0.5" />
                      <p className="text-sm text-orange-800 font-medium">Your plan includes facility access and select classes. Manage auto-renew settings below.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center bg-zinc-50 border border-zinc-200 border-dashed rounded-[2rem] p-8">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-zinc-100 shadow-sm flex items-center justify-center mb-5 hover:scale-105 transition-transform duration-300">
                    <Activity className="w-8 h-8 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">No Active Plan</h3>
                  <p className="text-zinc-500 font-medium mb-8 max-w-[240px] leading-relaxed">
                    You do not currently hold a valid membership. Unlock the facility to proceed.
                  </p>
                  <Link to="/membership" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold shadow-md transition-all active:scale-[0.98]">
                    Subscribe Now
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
