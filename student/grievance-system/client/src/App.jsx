import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { getSession, setSession } from './api.js';
import Login from './pages/Login.jsx';
import Student from './pages/Student.jsx';
import Officer from './pages/Officer.jsx';
import Admin from './pages/Admin.jsx';

const HOME = { student: '/student', officer: '/officer', admin: '/admin' };

function Protected({ role, children }) {
  const session = getSession();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/" replace />;
  if (session.user.role !== role) return <Navigate to={HOME[session.user.role]} replace />;
  const logout = () => {
    setSession(null);
    navigate('/');
  };
  return (
    <>
      <header className="topbar">
        <strong>Grievance Portal</strong>
        <span>
          {session.user.name} ({session.user.role}
          {session.user.department ? ` · ${session.user.department}` : ''})
          <button className="link" onClick={logout}>Logout</button>
        </span>
      </header>
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student" element={<Protected role="student"><Student /></Protected>} />
      <Route path="/officer" element={<Protected role="officer"><Officer /></Protected>} />
      <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { HOME };
