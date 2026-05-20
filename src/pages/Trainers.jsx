import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Users, Clock, Loader2, Plus, Trash2, ShieldCheck, Dumbbell, ChevronDown } from 'lucide-react';

export default function Trainers() { 
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [role, setRole] = useState('member');

  // Form state
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setRole(userSnap.data().role || 'member');
        }
        await fetchTrainers();
      } catch (err) {
        console.error(err);
        setErrorObj(err.message);
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  async function fetchTrainers() {
    try {
      const trainerSnap = await getDocs(collection(db, 'trainers'));
      const trainersList = trainerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrainers(trainersList);
    } catch (err) {
      console.error(err);
      setErrorObj(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTrainer(e) {
    e.preventDefault();
    if (!name || !specialty || !workingHours || adding) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'trainers'), {
        name,
        specialty,
        working_hours: workingHours
      });
      setName('');
      setSpecialty('');
      setWorkingHours('');
      await fetchTrainers();
    } catch (error) {
      console.error(error);
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteTrainer(trainerId) {
    if (!window.confirm("Remove this trainer from active staff roster?")) return;
    try {
      await deleteDoc(doc(db, 'trainers', trainerId));
      await fetchTrainers();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Loading trainer roster...</p>
      </div>
    );
  }

  if (errorObj) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-3xl max-w-lg text-center shadow-lg shadow-red-500/5">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Firestore Error</h2>
          <p className="text-sm font-medium">{errorObj}</p>
          <p className="text-xs mt-4 text-zinc-500">Enable Firestore Database in your Console rules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tight">Our Elite Trainers</h1>
        <p className="text-lg text-zinc-500 font-medium tracking-tight">Meet the professional experts ready to guide your journey.</p>
      </header>

      {/* Admin Panel for Adding Trainers */}
      {(role === 'admin' || role === 'staff') && (
        <div className="bg-white border border-green-100 rounded-[2rem] p-8 mb-10 shadow-xl shadow-green-500/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-green-600"></div>
          <h2 className="text-2xl font-black text-zinc-900 mb-6 flex items-center tracking-tight">
            <Plus className="w-6 h-6 text-green-600 mr-2.5 bg-green-50 rounded-lg p-1 border border-green-100" /> Formally Assign New Trainer
          </h2>
          <form onSubmit={handleAddTrainer} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Trainer Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className="w-full bg-slate-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium placeholder-zinc-400" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Trainer Specialty</label>
              <input type="text" required value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g. Yoga Expert" className="w-full bg-slate-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium placeholder-zinc-400" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Tracked Hours</label>
              <div className="relative">
                <select required value={workingHours} onChange={e => setWorkingHours(e.target.value)} className="w-full bg-slate-50 border border-zinc-200 rounded-2xl pl-5 pr-12 py-4 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium cursor-pointer truncate appearance-none">
                  <option value="" disabled>Select a Shift...</option>
                  <option value="Morning (06:00 AM - 02:00 PM)">Morning (06:00 AM - 02:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 08:00 PM)">Afternoon (12:00 PM - 08:00 PM)</option>
                  <option value="Evening (04:00 PM - 12:00 AM)">Evening (04:00 PM - 12:00 AM)</option>
                  <option value="Flexible / Custom">Flexible / Custom</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <button disabled={adding} type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50">
              {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Assignment'}
            </button>
          </form>
        </div>
      )}

      {/* Trainers List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trainers.map((trainer) => (
          <div key={trainer.id} className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 group hover:shadow-xl hover:shadow-orange-500/5 transition-all flex flex-col items-center text-center relative overflow-hidden hover:border-orange-200">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-32 h-32 text-orange-500" />
            </div>
            
            {(role === 'admin' || role === 'staff') && (
              <div className="absolute top-6 right-6 z-20">
                <button 
                  onClick={() => handleDeleteTrainer(trainer.id)}
                  className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-xl transition-colors border border-red-100 shadow-sm"
                  title="Remove Trainer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 border-2 border-orange-200 shadow-lg shadow-orange-500/10 flex items-center justify-center text-3xl font-black text-orange-600 uppercase mb-6 z-10 relative">
              {trainer.name.charAt(0)}
            </div>
            
            <h3 className="text-2xl font-black text-zinc-900 mb-3 relative z-10 tracking-tight">{trainer.name}</h3>
            
            <div className="space-y-3 mb-2 w-full relative z-10">
              <div className="flex items-center justify-center text-zinc-500 font-medium bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <Dumbbell className="w-4 h-4 mr-2 text-orange-400" /> 
                <span className="text-zinc-400 mr-2 text-sm uppercase tracking-wider font-bold">Specialty</span>
                <span className="text-zinc-900 font-bold">{trainer.specialty || trainer.assigned_class || 'General'}</span>
              </div>
              <div className="flex items-center justify-center text-zinc-500 font-medium bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <Clock className="w-4 h-4 mr-2 text-orange-400" />
                <span className="text-zinc-400 mr-2 text-sm uppercase tracking-wider font-bold">Shift</span>
                <span className="text-zinc-900 font-bold">{trainer.working_hours}</span>
              </div>
            </div>
          </div>
        ))}
        {trainers.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-[2rem] py-16 text-center text-zinc-500">
            <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <span className="text-lg font-bold text-zinc-400">No active trainers currently logged.</span>
          </div>
        )}
      </div>
    </div>
  );
}
