import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Check, Loader2, CreditCard, ShieldCheck } from 'lucide-react';

const plans = [
  {
    id: 'Basic',
    name: 'Basic Entry',
    price: 29,
    duration: '1 Month',
    features: ['Access to gym equipment', 'Locker room access', '1 free PT session'],
    color: 'border-zinc-200'
  },
  {
    id: 'Standard',
    name: 'Pro Standard',
    price: 59,
    duration: '3 Months',
    features: ['All Basic features', 'Group classes included', 'Pool access', 'Sauna access', 'Free gym towel'],
    color: 'border-blue-200 bg-blue-50/30'
  },
  {
    id: 'Premium',
    name: 'Elite Premium',
    price: 89,
    duration: '6 Months',
    features: ['All Standard features', 'Unlimited PT sessions', 'Nutrition tracking', 'Guest passes (2/month)', 'VIP Lounge Access'],
    color: 'border-orange-500 border-2 shadow-xl shadow-orange-500/10 relative overflow-hidden'
  }
];

export default function Membership() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState('member');

  useEffect(() => {
    async function loadPlan() {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setCurrentPlan(docSnap.data().plan || 'none');
          setRole(docSnap.data().role || 'member');
        }
      } catch (err) {
        console.error(err);
        setErrorObj(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [user]);

  async function handleSelectPlan(planInfo) {
    if (!window.confirm(`Are you sure you want to purchase the ${planInfo.name} plan?`)) return;
    
    setUpdating(true);
    setSuccess('');
    try {
      let monthsToAdd = 1;
      if (planInfo.duration.includes('3')) monthsToAdd = 3;
      if (planInfo.duration.includes('6')) monthsToAdd = 6;

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + monthsToAdd);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        plan: planInfo.id,
        subscription_end: endDate
      });

      setCurrentPlan(planInfo.id);
      setSuccess(`Successfully subscribed to ${planInfo.name}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Loading memberships catalog...</p>
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

  if (role === 'admin' || role === 'staff') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto pb-20">
        <div className="w-28 h-28 bg-orange-50 border border-orange-100 rounded-[3rem] flex items-center justify-center mb-8 shadow-sm">
          <ShieldCheck className="w-14 h-14 text-orange-500" />
        </div>
        <h2 className="text-4xl font-black text-zinc-900 mb-4 tracking-tight">Staff Framework</h2>
        <p className="text-lg text-zinc-500 font-medium leading-relaxed">Membership billing is restricted strictly to general clientele. As an authorized operator, you possess unrestricted access natively.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full mb-6">
          <CreditCard className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm font-bold text-orange-600 tracking-wide uppercase">Billing & Upgrades</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">Elevate Your Journey</h1>
        <p className="text-lg text-zinc-500 font-medium">Choose a subscription plan that aligns perfectly with your physical ambitions and schedule.</p>
      </header>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-5 rounded-2xl mb-8 flex justify-center items-center shadow-sm max-w-2xl mx-auto">
          <Check className="w-5 h-5 mr-3 text-green-600" /> <span className="font-bold">{success}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 items-stretch pt-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-[2.5rem] p-8 flex flex-col border transition-all hover:-translate-y-2 hover:shadow-xl ${plan.color}`}>
            {plan.id === 'Premium' && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{plan.name}</h3>
                <p className="text-zinc-500 font-bold mt-1 text-sm">{plan.duration}</p>
              </div>
              {plan.id === 'Premium' && (
                <span className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">Most Popular</span>
              )}
            </div>
            
            <div className="mb-8 border-b border-zinc-100 pb-8">
              <span className="text-5xl font-black text-zinc-900 tracking-tighter">£{plan.price}</span>
              <span className="text-zinc-400 font-medium ml-2">/ flat</span>
            </div>
            
            <ul className="space-y-4 mb-auto flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-zinc-600 font-medium">
                  <Check className={`w-5 h-5 mr-3 shrink-0 ${plan.id === 'Premium' ? 'text-orange-500' : 'text-zinc-400'}`} />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              disabled={updating || currentPlan === plan.id}
              onClick={() => handleSelectPlan(plan)}
              className={`w-full mt-10 py-4 px-4 rounded-2xl font-bold transition-all shadow-sm ${
                currentPlan === plan.id 
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' 
                  : plan.id === 'Premium'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/25 active:scale-[0.98]'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white active:scale-[0.98]'
              }`}
            >
              {updating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 
                currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
