
import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';

export default function BankTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    type: 'Debit',
    amount: '',
    referenceNumber: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);

  // Retrieve bank transactions
  async function loadTransactions() {
    setLoading(true);
    setError('');

    try {
      const query = type ? `?type=${type}` : '';
      const rows = await apiFetch(`/bank-transactions${query}`);
      setTransactions(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [type]);

  // Update form fields
  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // Record a new transaction
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (Number(form.amount) <= 0) {
      setError('Enter a valid transaction amount.');
      return;
    }

    setSaving(true);

    try {
      await apiFetch('/bank-transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          amount: Number(form.amount),
          referenceNumber: form.referenceNumber.trim(),
          description: form.description.trim(),
        }),
      });

      setMessage('Bank transaction recorded successfully.');

      setForm({
        type: 'Debit',
        amount: '',
        referenceNumber: '',
        description: '',
      });

      await loadTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h2>Bank Transactions</h2>
      <p>View and record SACCO bank transactions.</p>

      {error && (
        <p style={{ color: '#c0392b' }}>{error}</p>
      )}

      {message && (
        <p style={{ color: 'green' }}>{message}</p>
      )}

      {/* Record Transaction */}
      <section style={{ marginBottom: 30 }}>
        <h3>Record New Transaction</h3>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 12,
            maxWidth: 450,
          }}
        >
          <label>
            Transaction Type
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </label>

          <label>
            Amount (KES)
            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Reference Number
            <input
              type="text"
              name="referenceNumber"
              value={form.referenceNumber}
              onChange={handleChange}
              minLength={3}
              maxLength={50}
              placeholder="Enter transaction reference"
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Transaction details..."
              rows="3"
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Recording...' : 'Record Transaction'}
          </button>
        </form>
      </section>

      <hr />

      {/* Transaction History */}
      <section style={{ marginTop: 25 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
          }}
        >
          <h3>Transaction History</h3>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: 150 }}
          >
            <option value="">All Transactions</option>
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
          </select>
        </div>

        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount (KES)</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td>#{transaction.transaction_id}</td>

                    <td>
                      <strong
                        style={{
                          color:
                            transaction.transaction_type === 'Credit'
                              ? '#17633f'
                              : '#c0392b',
                        }}
                      >
                        {transaction.transaction_type}
                      </strong>
                    </td>

                    <td>
                      {Number(transaction.amount).toLocaleString()}
                    </td>

                    <td>{transaction.reference_number}</td>

                    <td>{transaction.description || '-'}</td>

                    <td>
                      {new Date(
                        transaction.transaction_date
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
