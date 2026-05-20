import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, ArrowRight, Loader2, ChevronDown } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const DEVELOPER_CODE = 'ADMIN123';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if ((role === 'admin' || role === 'staff') && adminCode !== DEVELOPER_CODE) {
      setError('Invalid developer code for Staff/Admin registration');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await register(email, password, name, role);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500 rounded-full blur-[140px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[140px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md z-10 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-white border border-orange-100 rounded-3xl mb-6 shadow-xl shadow-orange-500/10">
            <Dumbbell className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-3">Create Account</h1>
          <p className="text-zinc-500 font-medium">Join the premium fitness experience</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-zinc-200/50 border border-white space-y-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-semibold flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-slate-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
              <input 
                type="password" 
                className="w-full bg-slate-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Account Type</label>
              <div className="relative">
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-2xl pl-5 pr-12 py-4 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium cursor-pointer truncate appearance-none"
                >
                  <option value="member">Basic Member Profile</option>
                  <option value="admin">Staff / Admin Management</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            
            {role === 'admin' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-zinc-700 mb-2 flex items-center">
                  Developer Code
                  <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Required</span>
                </label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                  placeholder="Enter Validation Code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none text-lg"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Create Account <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-500 mt-10 font-medium">
          Already have an account? <Link to="/login" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
