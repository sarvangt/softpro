import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Badge } from './Student.jsx';

export default function Officer() {
  const [tickets, setTickets] = useState([]);
  const [open, setOpen] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const load = () => api('/grievances/department').then(setTickets).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const act = async (status) => {
    setError('');
    try {
      await api(`/grievances/${open._id}/status`, { method: 'PATCH', body: { status, remarks } });
      setOpen(null); setRemarks('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section className="card">
        <h3>Department tickets</h3>
        {error && <div className="error">{error}</div>}
        {tickets.length === 0 ? <p className="muted">No tickets for your department.</p> : (
          <table>
            <thead><tr><th>Ticket</th><th>Student</th><th>Title</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.ticketId}</td><td>{t.student?.name}</td><td>{t.title}</td>
                  <td><Badge status={t.status} /></td>
                  <td><button className="small" onClick={() => { setOpen(t); setRemarks(t.remarks); setError(''); }}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {open && (
        <section className="card">
          <h3>{open.ticketId} — {open.title}</h3>
          <p className="muted">From {open.student?.name} ({open.student?.email})</p>
          <p>{open.description}</p>
          {open.attachmentUrl && <a href={open.attachmentUrl} target="_blank" rel="noreferrer"><img className="proof" src={open.attachmentUrl} alt="Proof" /></a>}
          {open.status === 'Pending' ? (
            <>
              <textarea rows="3" placeholder="Remarks / reason (required)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              <div className="row">
                <button onClick={() => act('Resolved')}>Mark Resolved</button>
                <button className="danger" onClick={() => act('Rejected')}>Reject (out of scope)</button>
                <button className="link" onClick={() => setOpen(null)}>Close</button>
              </div>
            </>
          ) : (
            <p><Badge status={open.status} /> {open.remarks}</p>
          )}
        </section>
      )}
    </>
  );
}
