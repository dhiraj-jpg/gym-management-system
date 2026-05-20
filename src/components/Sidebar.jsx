import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LayoutDashboard, CreditCard, Calendar, Users, LogOut, Dumbbell, Car } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [role, setRole] = useState('member');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function fetchRole() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setRole(snap.data().role || 'member');
      } catch (err) {}
    }
    fetchRole();
  }, [user]);

  const allLinks = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/membership', label: 'Membership', icon: CreditCard, hiddenForStaff: true },
    { path: '/classes', label: 'Classes', icon: Calendar },
    { path: '/trainers', label: 'Trainers', icon: Users },
    { path: '/parking', label: 'Parking', icon: Car },
  ];

  const links = allLinks.filter(link => {
    if (link.hiddenForStaff && (role === 'admin' || role === 'staff')) return false;
    return true;
  });

  return (
    <div className="w-64 bg-white border-r border-zinc-200/60 flex flex-col h-full shadow-sm">
      <div className="h-20 flex items-center px-8 border-b border-zinc-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mr-3">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-black tracking-tight text-zinc-900">Core<span className="text-orange-500">Fit</span></span>
      </div>

      <div className="flex-1 py-8 px-5 space-y-2 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Main Menu</p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-4 py-3.5 rounded-2xl transition-all font-medium ${
                isActive 
                  ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50' 
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-orange-500' : 'text-zinc-400'}`} />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-5 border-t border-zinc-100">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center w-full px-4 py-3.5 rounded-2xl text-zinc-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all font-medium group"
        >
          <LogOut className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-red-500" />
          Logout User
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-100 transform transition-all scale-105 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6 mx-auto">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 text-center mb-2">Confirm Logout</h3>
            <p className="text-zinc-500 text-center mb-8">Are you sure you want to log out of your account?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-3 rounded-2xl text-zinc-600 font-medium hover:bg-zinc-100 transition-colors border border-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
