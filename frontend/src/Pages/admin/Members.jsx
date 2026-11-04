import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';

export default function Members() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load(q = '') {
    setError('');
    try { setRows(await apiFetch(`/members?search=${encodeURIComponent(q.trim())}`)); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function save(body, successText) {
    setError(''); setMessage('');
    try {
      await apiFetch(`/members/${editing.member_id}`, { method: 'PUT', body: JSON.stringify(body) });
      setMessage(successText);
      setEditing(null);
      load(query);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(m) {
    const next = m.status === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Set ${m.full_name} to ${next}?`)) return;
    setError(''); setMessage('');
    try {
      await apiFetch(`/members/${m.member_id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
      setMessage(`${m.full_name} is now ${next}`);
      load(query);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Members</h2>
      <form onSubmit={(e) => { e.preventDefault(); load(query); }} style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
        <input placeholder="Search by name or membership no." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit">Search</button>
      </form>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {editing && (
        <form
          className="grid-form"
          style={{ margin: '16px 0', padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.target);
            save(
              { firstName: f.get('firstName'), lastName: f.get('lastName'), phone: f.get('phone'), address: f.get('address') },
              'Member updated'
            );
          }}
        >
          <h3 style={{ gridColumn: '1 / -1', margin: 0 }}>Edit {editing.membership_number}</h3>
          <label>First name<input name="firstName" defaultValue={editing.first_name} required /></label>
          <label>Last name<input name="lastName" defaultValue={editing.last_name} required /></label>
          <label>Phone<input name="phone" defaultValue={editing.phone_number} required minLength={7} /></label>
          <label>Address<input name="address" defaultValue={editing.address || ''} /></label>
          <div>
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>{' '}
            <button type="submit">Save</button>
          </div>
        </form>
      )}

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr><th>Membership No.</th><th>Name</th><th>Email</th><th>Phone</th><th>Savings (KES)</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.member_id}>
              <td>{m.membership_number}</td>
              <td>{m.full_name}</td>
              <td>{m.email}</td>
              <td>{m.phone_number}</td>
              <td>{Number(m.savings_balance).toLocaleString()}</td>
              <td>{m.status}</td>
              <td>
                <button type="button" onClick={() => setEditing(m)}>Edit</button>{' '}
                <button type="button" onClick={() => toggleStatus(m)}>
                  {m.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}