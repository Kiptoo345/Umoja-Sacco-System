import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/audit-logs?limit=200').then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <h2>Audit Log</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Time</th><th>User</th><th>Action</th><th>Details</th><th>IP</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.log_id}>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>{r.username || '-'}</td>
              <td>{r.action}</td>
              <td>{r.details}</td>
              <td>{r.ip_address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}