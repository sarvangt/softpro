import { useEffect, useState } from 'react';
import { api, CATEGORIES } from '../api.js';
import { Badge } from './Student.jsx';

const EMPTY = { name: '', email: '', password: '', role: 'officer', department: CATEGORIES[0] };

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [report, setReport] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api('/admin/users'), api('/grievances/all'), api('/admin/reports')])
      .then(([u, t, r]) => { setUsers(u); setTickets(t); setReport(r); })
      .catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/users', { method: 'POST', body: form });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await api(`/admin/users/${id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  };

  const count = (s) => report?.byStatus.find((x) => x._id === s)?.count || 0;

  return (
    <>
      {error && <div className="error">{error}</div>}
      <section className="stats">
        {['Pending', 'Resolved', 'Rejected'].map((s) => (
          <div className="card stat" key={s}><div className="num">{count(s)}</div><Badge status={s} /></div>
        ))}
      </section>

      <section className="card">
        <h3>Add user</h3>
        <form onSubmit={create} className="row wrap">
          <input placeholder="Name" value={form.name} onChange={set('name')} required />
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
          <select value={form.role} onChange={set('role')}>
            <option value="officer">Grievance Officer</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          {form.role === 'officer' && (
            <select value={form.department} onChange={set('department')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <button type="submit">Add</button>
        </form>
      </section>

      <section className="card">
        <h3>Users ({users.length})</h3>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.department || '—'}</td>
                <td><button className="small danger" onClick={() => remove(u._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>All grievances ({tickets.length})</h3>
        <table>
          <thead><tr><th>Ticket</th><th>Student</th><th>Category</th><th>Title</th><th>Status</th></tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t._id}>
                <td>{t.ticketId}</td><td>{t.student?.name || '(deleted)'}</td><td>{t.category}</td>
                <td>{t.title}</td><td><Badge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
