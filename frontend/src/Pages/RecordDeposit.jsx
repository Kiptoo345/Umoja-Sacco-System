import { useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';

export default function RecordDeposit() {
  const [number, setNumber] = useState('');
  const [member, setMember] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setError('');
    setMember(null);
    try {
      const n = number.trim();
      const rows = await apiFetch(`/members?search=${encodeURIComponent(n)}`);
      const found = rows.find((r) => r.membership_number === n);
      if (!found) throw new Error('Member not found');
      if (found.status !== 'Active') throw new Error('Member account is inactive');
      setMember(found);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/deposits', {
        method: 'POST',
        body: JSON.stringify({ membershipNumber: member.membership_number, amount: Number(amount) }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setNumber(''); setMember(null); setAmount(''); setResult(null); setError('');
  }

  if (result) {
    return (
      <Layout>
        <h2>Deposit recorded</h2>
        <p>{member.full_name} ({result.membershipNumber}): KES {result.amount} received.</p>
        <p>Status: <strong>{result.status}</strong></p>
        <p><em>{result.message}</em></p>
        <button onClick={reset}>Record another deposit</button>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2>Record Member Deposit</h2>
      <label>Membership No. *{' '}
        <input value={number} onChange={(e) => setNumber(e.target.value)} />
      </label>{' '}
      <button type="button" onClick={search}>Search</button>

      {member && (
        <form onSubmit={submit} style={{ marginTop: 16, display: 'grid', gap: 8, maxWidth: 360 }}>
          <div>Member: <strong>{member.full_name}</strong></div>
          <div>Current savings: KES {member.savings_balance}</div>
          <label>Deposit Amount (KES) *
            <input type="number" min="1" step="0.01" value={amount}
                   onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <div>
            <button type="button" onClick={reset}>Cancel</button>{' '}
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Record Deposit'}</button>
          </div>
        </form>
      )}
      {error && <div style={{ color: '#c00', marginTop: 12 }}>{error}</div>}
    </Layout>
  );
}