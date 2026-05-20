import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { Calendar as CalendarIcon, Clock, User, Loader2, Plus, Users, ShieldCheck, Trash2, ChevronDown, X } from 'lucide-react';

export default function Classes() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [trainerList, setTrainerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [role, setRole] = useState('member');
  
  // Roster modal state
  const [usersMap, setUsersMap] = useState({});
  const [viewingClass, setViewingClass] = useState(null);
  
  // New class form state
  const [className, setClassName] = useState('');
  const [classTime, setClassTime] = useState('');
  const [trainer, setTrainer] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        let currentRole = 'member';
        
        if (userSnap.exists()) {
          currentRole = userSnap.data().role || 'member';
          setRole(currentRole);
        }
        
        // Fetch all users to map UUIDs -> Names inside the modal
        if (currentRole === 'admin' || currentRole === 'staff') {
          const allUsersSnap = await getDocs(collection(db, 'users'));
          const map = {};
          allUsersSnap.docs.forEach(d => {
            map[d.id] = d.data();
          });
          setUsersMap(map);
        }

        await fetchClassesAndTrainers();
      } catch (err) {
        console.error(err);
        setErrorObj(err.message);
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  async function fetchClassesAndTrainers() {
    try {
      const classSnap = await getDocs(collection(db, 'classes'));
      const classesList = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesList);

      const trainerSnap = await getDocs(collection(db, 'trainers'));
      setTrainerList(trainerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      setErrorObj(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClass(e) {
    e.preventDefault();
    if (!className || !classTime || !trainer || adding) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: className,
        time: classTime,
        trainer: trainer,
        members: []
      });
      setClassName('');
      setClassTime('');
      setTrainer('');
      await fetchClassesAndTrainers();
    } catch (error) {
      console.error(error);
    } finally {
      setAdding(false);
    }
  }

  async function handleJoinClass(classId) {
    try {
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        members: arrayUnion(user.uid)
      });
      await fetchClassesAndTrainers();
    } catch (err) {
      console.error("Error joining class", err);
    }
  }
  
  async function handleDeleteClass(classId) {
    if (!window.confirm("Delete this scheduled class?")) return;
    try {
      await deleteDoc(doc(db, 'classes', classId));
      await fetchClassesAndTrainers();
    } catch (err) {
      console.error("Error deleting class", err);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium tracking-tight">Loading session schedules...</p>
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
        <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tight">Class Schedules</h1>
        <p className="text-lg text-zinc-500 font-medium tracking-tight">Browse, book, and conquer your next session.</p>
      </header>

      {/* Admin Panel for Adding Classes */}
      {(role === 'admin' || role === 'staff') && (
        <div className="bg-white border border-orange-100 rounded-3xl p-8 mb-10 shadow-xl shadow-orange-500/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          <h2 className="text-2xl font-black text-zinc-900 mb-6 flex items-center tracking-tight">
            <Plus className="w-6 h-6 text-orange-500 mr-2.5 bg-orange-50 rounded-lg p-1" /> Add New Class
          </h2>
          <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Class Name</label>
              <input type="text" required value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. HIIT Blast" className="w-full bg-slate-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Time Slot</label>
              <div className="relative">
                <select required value={classTime} onChange={e => setClassTime(e.target.value)} className="w-full bg-slate-50 border border-zinc-200 rounded-2xl pl-5 pr-12 py-4 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium cursor-pointer truncate appearance-none">
                  <option value="" disabled>Select a Time...</option>
                  <option value="06:00 AM">06:00 AM</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                  <option value="08:00 PM">08:00 PM</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Lead Trainer</label>
              <div className="relative">
                <select required value={trainer} onChange={e => setTrainer(e.target.value)} className="w-full bg-slate-50 border border-zinc-200 rounded-2xl pl-5 pr-12 py-4 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium cursor-pointer truncate appearance-none">
                  <option value="" disabled>Select a Trainer...</option>
                  {trainerList.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.specialty || t.assigned_class || 'General'})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <button disabled={adding} type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50">
               {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Schedule Class'}
            </button>
          </form>
        </div>
      )}

      {/* Class List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classes.map((cls) => {
          const isJoined = cls.members?.includes(user.uid);
          
          return (
            <div key={cls.id} className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 group hover:shadow-xl hover:shadow-orange-500/5 transition-all flex flex-col relative hover:border-orange-200">
              
              {(role === 'admin' || role === 'staff') && (
                <div className="absolute top-6 right-6 z-20">
                  <button 
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-xl transition-colors border border-red-100"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-100">
                <CalendarIcon className="w-6 h-6" />
              </div>
              
              <h3 className="text-2xl font-black text-zinc-900 mb-6 tracking-tight">{cls.name}</h3>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center text-zinc-500 font-medium bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <Clock className="w-5 h-5 mr-3 text-orange-400" /> {cls.time}
                </div>
                <div className="flex items-center text-zinc-500 font-medium bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <User className="w-5 h-5 mr-3 text-orange-400" /> {cls.trainer}
                </div>
                
                {/* Booked Metric (Clickable for Staff) */}
                <div 
                  className={`flex items-center justify-between text-zinc-500 font-medium px-2 py-1 ${
                    (role === 'admin' || role === 'staff') ? 'cursor-pointer hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors p-2 -mx-2 group/book' : ''
                  }`}
                  onClick={() => {
                    if (role === 'admin' || role === 'staff') setViewingClass(cls);
                  }}
                >
                  <span className="flex items-center"><Users className="w-4 h-4 mr-2" /> Booked</span>
                  <span className={`font-black text-zinc-900 bg-zinc-100 px-3 py-1 rounded-full ${(role === 'admin' || role === 'staff') ? 'group-hover/book:bg-orange-100' : ''}`}>
                    {cls.members?.length || 0}
                  </span>
                </div>
              </div>

              {!(role === 'admin' || role === 'staff') && (
                !isJoined ? (
                  <button 
                    onClick={() => handleJoinClass(cls.id)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 px-6 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
                  >
                    Join Class
                  </button>
                ) : (
                  <button disabled className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-4 px-6 rounded-2xl cursor-not-allowed">
                    Slot Reserved
                  </button>
                )
              )}
            </div>
          );
        })}
        
        {classes.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-[2rem] py-16 text-center">
            <CalendarIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-500">No classes scheduled</h3>
          </div>
        )}
      </div>

      {/* Class Roster Modal */}
      {viewingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingClass(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-zinc-100 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-orange-50/50">
              <h3 className="text-xl font-bold flex items-center text-zinc-900">
                <Users className="w-5 h-5 mr-2 text-orange-500" /> Class Roster
              </h3>
              <button onClick={() => setViewingClass(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-xl font-black text-zinc-900">{viewingClass.name}</h4>
                <p className="text-zinc-500 font-medium">Time: {viewingClass.time} • Trainer: {viewingClass.trainer}</p>
              </div>
              
              {!viewingClass.members || viewingClass.members.length === 0 ? (
                <div className="py-8 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center text-center">
                  <Users className="w-8 h-8 text-zinc-300 mb-3" />
                  <p className="text-zinc-500 font-medium">No members have registered<br/>for this class yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingClass.members.map((memberId, idx) => {
                    const memberData = usersMap[memberId];
                    return (
                      <div key={idx} className="flex items-center p-3 bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-100 rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 border border-orange-200 font-black text-lg flex items-center justify-center mr-4 shrink-0 uppercase shadow-sm">
                          {memberData?.name?.charAt(0) || '?'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-zinc-900 truncate">{memberData?.name || 'Unknown User'}</p>
                          <p className="text-xs text-zinc-500 font-medium truncate mt-0.5">{memberData?.email || 'N/A'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
