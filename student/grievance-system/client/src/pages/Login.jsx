import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, getSession, setSession } from '../api.js';

const HOME = { student: '/student', officer: '/officer', admin: '/admin' };

export default function Login() {
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const existing = getSession();
  if (existing) return <Navigate to={HOME[existing.user.role]} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api(register ? '/auth/register' : '/auth/login', { method: 'POST', body: form });
      setSession(data);
      navigate(HOME[data.user.role]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit}>
        <h2>Grievance Portal</h2>
        <p className="muted">{register ? 'Create a student account' : 'Sign in to continue'}</p>
        {register && <input placeholder="Full name" value={form.name} onChange={set('name')} required />}
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
        {error && <div className="error">{error}</div>}
        <button type="submit">{register ? 'Register' : 'Login'}</button>
        <button type="button" className="link" onClick={() => setRegister(!register)}>
          {register ? 'Have an account? Login' : 'New student? Register'}
        </button>
      </form>
    </div>
  );
}
