import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import Membership from './pages/Membership';
import Classes from './pages/Classes';
import Trainers from './pages/Trainers';
import Parking from './pages/Parking';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" />;
  }
  return children;
}

function Layout({ children }) {
  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="p-8 max-w-7xl mx-auto h-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/membership" element={<ProtectedRoute><Layout><Membership /></Layout></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute><Layout><Classes /></Layout></ProtectedRoute>} />
      <Route path="/trainers" element={<ProtectedRoute><Layout><Trainers /></Layout></ProtectedRoute>} />
      <Route path="/parking" element={<ProtectedRoute><Layout><Parking /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
