
import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';

export default function ApplyLoan() {
  const [applications, setApplications] = useState([]);
  const [loans, setLoans] = useState([]);
  const [amountRequested, setAmountRequested] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setError('');

    try {
      const [applicationData, loanData] = await Promise.all([
        apiFetch('/loans/applications'),
        apiFetch('/loans/me'),
      ]);

      setApplications(applicationData);
      setLoans(loanData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const hasPendingApplication = applications.some(
    (application) => application.status === 'Pending'
  );

  const hasActiveLoan = loans.some(
    (loan) => loan.status === 'Active'
  );

  const cannotApply = hasPendingApplication || hasActiveLoan;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const amount = Number(amountRequested);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    if (purpose.trim().length < 3) {
      setError('Please explain the purpose of your loan.');
      return;
    }

    setSaving(true);

    try {
      const result = await apiFetch('/loans/applications', {
        method: 'POST',
        body: JSON.stringify({
          amountRequested: amount,
          purpose: purpose.trim(),
        }),
      });

      setMessage(
        `Your loan application #${result.applicationId} was submitted successfully.`
      );

      setAmountRequested('');
      setPurpose('');

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <p>Loading loan application information...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2>Apply for a Loan</h2>
      <p>Submit a loan application to Umoja Community SACCO.</p>

      {error && (
        <p className="error" role="alert">{error}</p>
      )}

      {message && (
        <p role="status" style={{ color: 'green' }}>{message}</p>
      )}

      {cannotApply ? (
        <div className="loan-notice">
          <h3>Loan Application Unavailable</h3>

          {hasPendingApplication && (
            <p>
              You already have a loan application awaiting review.
              Please wait for the Loan Officer's decision.
            </p>
          )}

          {hasActiveLoan && (
            <p>
              You currently have an active loan. You must clear it
              before applying for another loan.
            </p>
          )}
        </div>
      ) : (
        <section className="loan-form-section">
          <h3>Loan Application Form</h3>

          <form onSubmit={handleSubmit} className="loan-form">
            <label>
              Amount Requested (KES)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amountRequested}
                onChange={(e) => setAmountRequested(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </label>

            <label>
              Purpose of Loan
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Explain why you need the loan..."
                rows={5}
                minLength={3}
                maxLength={1000}
                required
              />
            </label>

            <button type="submit" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </section>
      )}

      <section className="dashboard-section">
        <h3>My Application History</h3>

        {applications.length === 0 ? (
          <p>You have not submitted any loan applications yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Amount Requested</th>
                  <th>Purpose</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Comments</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => (
                  <tr key={application.application_id}>
                    <td>#{application.application_id}</td>

                    <td>
                      KES {Number(application.amount_requested).toLocaleString()}
                    </td>

                    <td>{application.purpose}</td>

                    <td>
                      {new Date(application.application_date).toLocaleDateString()}
                    </td>

                    <td>{application.status}</td>

                    <td>{application.comments || '-'}</td>
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
