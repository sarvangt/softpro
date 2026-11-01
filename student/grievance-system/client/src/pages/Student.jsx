import { useEffect, useState } from 'react';
import { api, CATEGORIES } from '../api.js';

export function Badge({ status }) {
  return <span className={`badge ${status.toLowerCase()}`}>{status}</span>;
}

export default function Student() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: CATEGORIES[0], title: '', description: '' });
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => api('/grievances/mine').then(setTickets).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append('photo', photo);
    try {
      const t = await api('/grievances', { method: 'POST', form: fd });
      setMsg(`Submitted! Your ticket ID is ${t.ticketId}`);
      setForm({ ...form, title: '', description: '' });
      setPhoto(null);
      e.target.reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section className="card">
        <h3>Submit a grievance</h3>
        <form onSubmit={submit}>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea rows="4" placeholder="Describe the issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <label className="muted">Photo proof (optional)
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0] || null)} />
          </label>
          {msg && <div className="success">{msg}</div>}
          {error && <div className="error">{error}</div>}
          <button type="submit">Submit</button>
        </form>
      </section>

      <section className="card">
        <h3>My tickets</h3>
        {tickets.length === 0 ? <p className="muted">No tickets yet.</p> : (
          <table>
            <thead><tr><th>Ticket</th><th>Category</th><th>Title</th><th>Status</th><th>Officer remarks</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.ticketId}</td><td>{t.category}</td><td>{t.title}</td>
                  <td><Badge status={t.status} /></td><td>{t.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
