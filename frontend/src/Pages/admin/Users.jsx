import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setRows(await apiFetch('/users'));
      setRoles(await apiFetch('/roles'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function patch(u, body, text) {
    setError(''); setMessage('');
    try {
      await apiFetch(`/users/${u.user_id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setMessage(text);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(u) {
    const pw = window.prompt(`New password for ${u.username}:`);
    if (!pw) return;
    setError(''); setMessage('');
    try {
      await apiFetch(`/users/${u.user_id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword: pw }) });
      setMessage(`Password reset for ${u.username}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>User Accounts</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <table>
        <thead>
          <tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.user_id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role_name}
                        onChange={(e) => patch(u, { role: e.target.value }, `Role changed for ${u.username}`)}>
                  {roles.map((r) => <option key={r.role_id}>{r.role_name}</option>)}
                </select>
              </td>
              <td>{u.status}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td>
                <button type="button"
                        onClick={() => patch(u, { status: u.status === 'Active' ? 'Inactive' : 'Active' }, `Status changed for ${u.username}`)}>
                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>{' '}
                <button type="button" onClick={() => resetPassword(u)}>Reset password</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}