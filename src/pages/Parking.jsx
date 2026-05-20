import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, setDoc, doc, addDoc, updateDoc, where, orderBy, getDoc } from 'firebase/firestore';
import { Car, History, Loader2, Wand2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Parking() {
  const { user } = useAuth();
  const [role, setRole] = useState('member');
  const [slots, setSlots] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState(null);

  const generateRandomVehicle = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const cities = ['B', 'M', 'HH', 'K', 'F', 'S', 'D', 'L', 'N'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const num = Math.floor(Math.random() * 9000 + 1000); // 1000-9999
    setVehicleNo(`${city} ${l1}${l2} ${num}`);
  };

  useEffect(() => {
    async function init() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const userRole = userSnap.exists() ? userSnap.data().role : 'member';
        setRole(userRole);
        
        await loadData(userRole);
      } catch (err) {
        console.error('Error loading parking data:', err);
        setError(err.message || 'Failed to load parking data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  async function loadData(currentRole) {
    let slotsData = [];
    let usedLocalSlots = false;

    try {
      let slotsSnap = await getDocs(collection(db, 'parking_slots'));
      if (slotsSnap.empty) {
        const initialSlots = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5'];
        if (currentRole === 'admin' || currentRole === 'staff') {
          for (const s of initialSlots) {
            await setDoc(doc(db, 'parking_slots', s), {
              slotNumber: s, status: 'available', currentVehicle: null, currentRecord: null, updatedAt: new Date().toISOString()
            });
          }
          slotsSnap = await getDocs(collection(db, 'parking_slots'));
          slotsData = slotsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          throw new Error('Not admin');
        }
      } else {
        slotsData = slotsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      usedLocalSlots = true;
      const localSlots = JSON.parse(localStorage.getItem('gym_parking_slots') || 'null');
      if (localSlots) {
        slotsData = localSlots;
      } else {
        const initialSlots = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5'];
        slotsData = initialSlots.map(s => ({
          id: s, slotNumber: s, status: 'available', currentVehicle: null, currentRecord: null
        }));
        localStorage.setItem('gym_parking_slots', JSON.stringify(slotsData));
      }
    }
    
    slotsData.sort((a,b) => (a.slotNumber || '').localeCompare(b.slotNumber || ''));
    setSlots(slotsData);

    try {
      let q;
      if (currentRole === 'admin' || currentRole === 'staff') {
        q = query(collection(db, 'parking_records'), orderBy('entryTime', 'desc'));
      } else {
        q = query(collection(db, 'parking_records'), where('userId', '==', user.uid));
      }
      const recordsSnap = await getDocs(q);
      const recData = recordsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      recData.sort((a,b) => new Date(b.entryTime) - new Date(a.entryTime));
      setRecords(recData);
    } catch (err) {
      const localRecs = JSON.parse(localStorage.getItem('gym_parking_records') || '[]');
      const filtered = (currentRole === 'admin' || currentRole === 'staff') 
        ? localRecs 
        : localRecs.filter(r => r.userId === user.uid);
      filtered.sort((a,b) => new Date(b.entryTime) - new Date(a.entryTime));
      setRecords(filtered);
    }
  }

  async function handlePark(e) {
    e.preventDefault();
    if(!vehicleNo || !selectedSlot) return;
    setProcessing(true);
    setError(null);
    try {
      const entryTime = new Date().toISOString();
      const recordId = 'rec_' + Date.now();
      const newRecord = {
        userId: user.uid,
        userName: user.displayName || 'User',
        vehicleNumber: vehicleNo,
        vehicleType,
        slotNumber: selectedSlot,
        entryTime,
        exitTime: null,
        status: 'active'
      };

      try {
        const recordRef = await addDoc(collection(db, 'parking_records'), newRecord);
        await setDoc(doc(db, 'parking_slots', selectedSlot), {
          slotNumber: selectedSlot,
          status: 'occupied',
          currentVehicle: vehicleNo,
          currentRecord: recordRef.id,
          updatedAt: entryTime
        }, { merge: true });
        await setDoc(doc(db, 'vehicle_details', vehicleNo), {
          userId: user.uid, vehicleNumber: vehicleNo, vehicleType, lastSeen: entryTime
        }, { merge: true });
      } catch (fbErr) {
        // Fallback to local storage if Firebase permissions deny it
        const localRecs = JSON.parse(localStorage.getItem('gym_parking_records') || '[]');
        newRecord.id = recordId;
        localRecs.push(newRecord);
        localStorage.setItem('gym_parking_records', JSON.stringify(localRecs));

        const localSlots = JSON.parse(localStorage.getItem('gym_parking_slots') || '[]');
        const updatedSlots = localSlots.map(s => {
          if (s.id === selectedSlot || s.slotNumber === selectedSlot) {
            return { ...s, status: 'occupied', currentVehicle: vehicleNo, currentRecord: recordId, updatedAt: entryTime };
          }
          return s;
        });
        localStorage.setItem('gym_parking_slots', JSON.stringify(updatedSlots));
      }

      setVehicleNo('');
      setSelectedSlot('');
      await loadData(role);
    } catch (err) {
      console.error(err);
      setError('Failed to park vehicle: ' + err.message);
    }
    setProcessing(false);
  }

  async function handleExit(slotId, recordId) {
    setProcessing(true);
    setError(null);
    try {
      const exitTime = new Date().toISOString();
      
      try {
        if(recordId && !recordId.startsWith('rec_')) {
          await setDoc(doc(db, 'parking_records', recordId), { exitTime, status: 'completed' }, { merge: true });
        }
        await setDoc(doc(db, 'parking_slots', slotId), {
          status: 'available', currentVehicle: null, currentRecord: null, updatedAt: exitTime
        }, { merge: true });
      } catch (fbErr) {
        // Fallback to local storage
        if (recordId) {
          const localRecs = JSON.parse(localStorage.getItem('gym_parking_records') || '[]');
          const updatedRecs = localRecs.map(r => r.id === recordId ? { ...r, exitTime, status: 'completed' } : r);
          localStorage.setItem('gym_parking_records', JSON.stringify(updatedRecs));
        }
        const localSlots = JSON.parse(localStorage.getItem('gym_parking_slots') || '[]');
        const updatedSlots = localSlots.map(s => {
          if (s.id === slotId || s.slotNumber === slotId) {
            return { ...s, status: 'available', currentVehicle: null, currentRecord: null, updatedAt: exitTime };
          }
          return s;
        });
        localStorage.setItem('gym_parking_slots', JSON.stringify(updatedSlots));
      }
      
      await loadData(role);
    } catch (err) {
      console.error(err);
      setError('Failed to exit vehicle: ' + err.message);
    }
    setProcessing(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const availableSlots = slots.filter(s => s.status === 'available');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">Parking Management</h1>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center shadow-sm">
          <Loader2 className="w-5 h-5 mr-3 animate-spin hidden" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Car className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Park Vehicle</h2>
            </div>
            
            <form onSubmit={handlePark} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Vehicle Type</label>
                <select 
                  value={vehicleType} 
                  onChange={e=>setVehicleType(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-semibold text-zinc-700">Vehicle Number</label>
                  <button type="button" onClick={generateRandomVehicle} className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center transition-colors bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                    <Wand2 className="w-3.5 h-3.5 mr-1" />
                    Auto
                  </button>
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. B AB 1234"
                  value={vehicleNo}
                  onChange={e=>setVehicleNo(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none uppercase transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Select Slot</label>
                <select 
                  value={selectedSlot}
                  onChange={e=>setSelectedSlot(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="">-- Choose available slot --</option>
                  {availableSlots.map(s => (
                    <option key={s.id} value={s.id}>{s.slotNumber}</option>
                  ))}
                </select>
              </div>
              <button 
                disabled={processing || !selectedSlot || !vehicleNo}
                type="submit"
                className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center shadow-lg shadow-zinc-200 mt-2"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register & Park'}
              </button>
            </form>
          </div>
          
          <div className="bg-zinc-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
            <h2 className="text-xl font-bold mb-6 relative z-10">Availability</h2>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-6xl font-black text-orange-500 mb-1">{availableSlots.length}</p>
                <p className="text-zinc-400 font-medium">Slots Available</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-zinc-300 mb-1">{slots.length - availableSlots.length}</p>
                <p className="text-sm text-zinc-500 font-medium">Occupied</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Parking Slots</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {slots.map(s => (
                <div key={s.id} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center ${s.status === 'available' ? 'border-zinc-100 bg-zinc-50 hover:border-orange-200' : 'border-orange-100 bg-orange-50 shadow-sm shadow-orange-500/10'}`}>
                  <span className={`text-xl font-black mb-2 ${s.status === 'available' ? 'text-zinc-400' : 'text-orange-600'}`}>{s.slotNumber}</span>
                  {s.status === 'available' ? (
                    <span className="text-xs font-bold text-zinc-400 bg-zinc-200/50 px-2.5 py-1 rounded-md uppercase tracking-wider">Empty</span>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-zinc-800 bg-white px-2.5 py-1 rounded-md shadow-sm mb-3 truncate w-full">{s.currentVehicle}</span>
                      {(role === 'admin' || role === 'staff') && (
                        <button 
                          onClick={() => handleExit(s.id, s.currentRecord)}
                          disabled={processing}
                          className="w-full text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg transition-colors shadow-sm shadow-orange-500/20"
                        >
                          Exit
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Recent Records</h2>
              <div className="p-2 bg-zinc-50 rounded-xl">
                <History className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-sm text-zinc-400 uppercase tracking-wider">
                    <th className="pb-4 font-bold">Vehicle</th>
                    <th className="pb-4 font-bold">Slot</th>
                    <th className="pb-4 font-bold">Entry</th>
                    <th className="pb-4 font-bold">Exit</th>
                    <th className="pb-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records.slice(0, 10).map(r => (
                    <tr key={r.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-bold text-zinc-900">{r.vehicleNumber}</div>
                        <div className="text-xs font-medium text-zinc-500">{r.vehicleType}</div>
                      </td>
                      <td className="py-4 pr-4 font-bold text-zinc-700">{r.slotNumber}</td>
                      <td className="py-4 pr-4 text-zinc-500 font-medium">{format(new Date(r.entryTime), 'MMM d, h:mm a')}</td>
                      <td className="py-4 pr-4 text-zinc-500 font-medium">{r.exitTime ? format(new Date(r.exitTime), 'MMM d, h:mm a') : '-'}</td>
                      <td className="py-4">
                        {r.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200/50">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200/50">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-zinc-400 font-medium">No parking records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
