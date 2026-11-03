import { useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';

export default function RecordDeposit() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]); 
  const [member, setMember] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e?.preventDefault();
    setError('');
    setMember(null);
    setResults([]);
    try {
      const rows = await apiFetch(`/members?search=${encodeURIComponent(query.trim())}`);
      const active = rows.filter((r) => r.status === 'Active');
      if (!active.length) throw new Error('No active member found');
      setResults(active);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!member || !amount || Number(amount) <= 0) {
      setError('Please select a member and enter a valid deposit amount.');
      setLoading(false);
      return;
    }
    
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
    setQuery(''); setResults([]); setMember(null); setAmount(''); setResult(null); setError('');
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
    <form onSubmit={search} style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
      <input placeholder="Search by name or membership no." value={query}
          onChange={(e) => setQuery(e.target.value)} />
      <button type="submit">Search</button>
    </form>

    {!member && results.length > 0 && (
      <table style={{ marginTop: 16 }}>
        <thead>
          <tr><th>Name</th><th>Membership No.</th><th>Phone</th><th></th></tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.member_id}>
              <td>{r.full_name}</td>
              <td>{r.membership_number}</td>
              <td>{r.phone_number}</td>
              <td><button type="button" onClick={() => setMember(r)}>Select</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

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
      {error && <div style={{ color: '#c00', marginTop: 12 }}> {error} </div>}
      </Layout>
  ) ;
}