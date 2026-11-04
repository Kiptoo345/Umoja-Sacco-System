import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';

const EMPTY = { username: '', email: '', firstName: '', lastName: '', position: '', phone: '', password: '', role: 'Staff' };

export default function Employees() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  async function load() {
    try { setRows(await apiFetch('/employees')); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const data = await apiFetch('/employees', { method: 'POST', body: JSON.stringify(form) });
      setMessage(`Employee created: ${data.username} (${data.role})`);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2>Employees</h2>
      <h3>Add employee</h3>
      <form onSubmit={submit} className="grid-form">
        <label>First name *<input value={form.firstName} onChange={set('firstName')} required /></label>
        <label>Last name *<input value={form.lastName} onChange={set('lastName')} required /></label>
        <label>Username *<input value={form.username} onChange={set('username')} required minLength={3} /></label>
        <label>Email *<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Phone *<input value={form.phone} onChange={set('phone')} required minLength={7} /></label>
        <label>Position *<input value={form.position} onChange={set('position')} required /></label>
        <label>Role *
          <select value={form.role} onChange={set('role')}>
            <option>Staff</option>
            <option>Loan Officer</option>
            <option>Accountant</option>
          </select>
        </label>
        <label>Temporary password *<input type="password" value={form.password} onChange={set('password')} required /></label>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Employee'}</button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <h3 style={{ marginTop: 28 }}>All employees</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Username</th><th>Role</th><th>Position</th><th>Phone</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.staff_id}>
              <td>{r.first_name} {r.last_name}</td>
              <td>{r.username}</td>
              <td>{r.role_name}</td>
              <td>{r.position}</td>
              <td>{r.phone_number}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}