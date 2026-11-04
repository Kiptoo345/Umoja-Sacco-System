
import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';

export default function LoanRepayments() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    receiptNumber: '',
  });

  // Load active loans
  async function loadLoans() {
    setLoading(true);
    setError('');

    try {
      const rows = await apiFetch('/loans?status=Active');
      setLoans(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoans();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // Record repayment
  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!selectedLoan) return;

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid repayment amount.');
      return;
    }

    if (amount > Number(selectedLoan.outstanding_balance)) {
      setError('Repayment cannot exceed the outstanding loan balance.');
      return;
    }

    setSaving(true);

    try {
      const result = await apiFetch(
        `/loans/${selectedLoan.loan_id}/repayments`,
        {
          method: 'POST',
          body: JSON.stringify({
            amount,
            paymentMethod: form.paymentMethod,
            receiptNumber: form.receiptNumber.trim(),
          }),
        }
      );

      setMessage(
        `Repayment recorded successfully. Remaining balance: KES ${Number(result.outstandingBalance).toLocaleString()}. Loan status: ${result.loanStatus}.`
      );

      setSelectedLoan(null);

      setForm({
        amount: '',
        paymentMethod: 'Bank Transfer',
        receiptNumber: '',
      });

      await loadLoans();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h2>Loan Repayments</h2>
      <p>Record repayments made by members and monitor outstanding loans.</p>

      {error && (
        <p style={{ color: '#c0392b' }}>{error}</p>
      )}

      {message && (
        <p style={{ color: 'green' }}>{message}</p>
      )}

      {/* Repayment form */}
      {selectedLoan && (
        <section style={{
          padding: 20,
          border: '1px solid #cfd8d3',
          borderRadius: 8,
          marginBottom: 25,
          maxWidth: 500,
        }}>
          <h3>Record Loan Repayment</h3>

          <p>
            Member: <strong>{selectedLoan.full_name}</strong>
          </p>

          <p>
            Loan ID: #{selectedLoan.loan_id}
          </p>

          <p>
            Outstanding Balance: <strong>
              KES {Number(selectedLoan.outstanding_balance).toLocaleString()}
            </strong>
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: 12 }}
          >
            <label>
              Repayment Amount (KES)
              <input
                type="number"
                name="amount"
                min="0.01"
                max={selectedLoan.outstanding_balance}
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Payment Method
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cheque">Cheque</option>
              </select>
            </label>

            <label>
              Receipt Number
              <input
                type="text"
                name="receiptNumber"
                value={form.receiptNumber}
                onChange={handleChange}
                minLength={3}
                maxLength={50}
                placeholder="Enter receipt number"
                required
              />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving}>
                {saving ? 'Recording...' : 'Record Repayment'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Active loans */}
      <h3>Active Loans</h3>

      <div style={{ marginBottom: 15 }}>
        <button
          type="button"
          onClick={loadLoans}
          disabled={loading || saving}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading active loans...</p>
      ) : loans.length === 0 ? (
        <p>There are no active loans requiring repayment.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Member</th>
                <th>Membership No.</th>
                <th>Principal (KES)</th>
                <th>Outstanding (KES)</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((loan) => (
                <tr key={loan.loan_id}>
                  <td>#{loan.loan_id}</td>
                  <td>{loan.full_name}</td>
                  <td>{loan.membership_number}</td>

                  <td>
                    {Number(loan.principal_amount).toLocaleString()}
                  </td>

                  <td>
                    {Number(loan.outstanding_balance).toLocaleString()}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLoan(loan);
                        setError('');
                        setMessage('');
                      }}
                      disabled={saving}
                    >
                      Record Repayment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
