import { useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';
import { PHONE_PATTERN, PHONE_TITLE, cleanPhone } from '../validators';

const EMPTY = { firstName: '', lastName: '', username: '', email: '', phone: '', address: '' };

export default function RegisterMember() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.username.trim()) delete payload.username; // blank = API defaults to email
      else payload.username = payload.username.trim();
      const data = await apiFetch('/members', { method: 'POST', body: JSON.stringify(payload) });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Layout>
        <h2>Member registered successfully.</h2>
        <p>Membership No.: <strong>{result.membershipNumber}</strong></p>
        <p>Username: <strong>{result.username}</strong></p>
        <p>Temporary password: <strong>{result.temporaryPassword}</strong></p>
        <p><em>Give the member their username and this temporary password. It is shown only once.</em></p>
        <button onClick={() => { setResult(null); setForm(EMPTY); }}>Register Another Member</button>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2>Register New Member</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
        <label>First Name *<input value={form.firstName} onChange={set('firstName')} required /></label>
        <label>Last Name *<input value={form.lastName} onChange={set('lastName')} required /></label>
        <label>Email *<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Username (optional)<input value={form.username} onChange={set('username')} minLength={3} maxLength={50} placeholder="Leave blank to use the email" autoComplete="off" /></label>
        <label>Phone Number *<input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: cleanPhone(e.target.value) })} pattern={PHONE_PATTERN} title={PHONE_TITLE} maxLength={13} placeholder="0712345678" required /></label>
        <label>Residential Address<input value={form.address} onChange={set('address')} /></label>
        {error && <div style={{ color: '#c00' }}>{error}</div>}
        <div>
          <button type="button" onClick={() => setForm(EMPTY)}>Clear</button>{' '}
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Register Member'}</button>
        </div>
      </form>
    </Layout>
  );
}