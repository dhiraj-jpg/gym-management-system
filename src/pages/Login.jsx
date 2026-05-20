import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
      }
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    if (!email) {
      setError('Please provide your email address first');
      return;
    }
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to reset password. Please check your email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500 rounded-full blur-[140px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[140px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-white border border-orange-100 rounded-3xl mb-6 shadow-xl shadow-orange-500/10">
            <Dumbbell className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-3">Welcome back</h1>
          <p className="text-zinc-500 font-medium">Authentication required to proceed.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-zinc-200/50 border border-white space-y-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-semibold flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></span>
              {error}
            </div>
          )}
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-2xl text-sm font-semibold flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></span>
              {message}
            </div>
          )}
          <div className="space-y-5">
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
              <div className="flex justify-end mt-2">
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          </div>
          
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none text-lg"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Sign In <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-500 mt-10 font-medium">
          Don't have an account? <Link to="/register" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">Sign up securely</Link>
        </p>
      </div>
    </div>
  );
}
