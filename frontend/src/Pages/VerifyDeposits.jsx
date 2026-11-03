
import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';
import './VerifyDeposits.css';

export default function VerifyDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [bankReference, setBankReference] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Retrieve deposits awaiting verification
  async function loadDeposits() {
    setError('');

    try {
      const rows = await apiFetch(
        '/deposits?status=Pending%20Verification'
      );

      setDeposits(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeposits();
  }, []);

  // Verify or reject a deposit
  async function decide(depositId, decision, reference) {
    setError('');
    setMessage('');
    setProcessingId(depositId);

    try {
      const result = await apiFetch(`/deposits/${depositId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          ...(decision === 'Verify'
            ? { bankReference: reference.trim() }
            : {}),
        }),
      });

      if (decision === 'Verify') {
        setMessage(
          `Deposit #${depositId} verified successfully. New savings balance: KES ${Number(result.memberSavingsBalance).toLocaleString()}.`
        );
      } else {
        setMessage(`Deposit #${depositId} has been rejected.`);
      }

      setSelectedId(null);
      setBankReference('');

      await loadDeposits();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  // Handle verification form submission
  function submitVerification(e, depositId) {
    e.preventDefault();

    if (bankReference.trim().length < 3) {
      setError('Please enter a valid bank reference.');
      return;
    }

    decide(depositId, 'Verify', bankReference);
  }

  return (
    <Layout>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <div>
          <h2>Verify Deposits</h2>
          <p>Review and verify deposits recorded by Staff.</p>
        </div>

        <button
          onClick={loadDeposits}
          disabled={loading || processingId !== null}
        >
          Refresh
        </button>
      </div>

      {error && (
        <p style={{ color: '#c00' }}>{error}</p>
      )}

      {message && (
        <p style={{ color: 'green' }}>{message}</p>
      )}

      {loading ? (
        <p>Loading pending deposits...</p>
      ) : deposits.length === 0 ? (
        <p>There are currently no deposits awaiting verification.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Deposit ID</th>
                <th>Member</th>
                <th>Membership No.</th>
                <th>Amount (KES)</th>
                <th>Deposit Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {deposits.map((deposit) => (
                <tr key={deposit.deposit_id}>
                  <td>#{deposit.deposit_id}</td>
                  <td>{deposit.full_name}</td>
                  <td>{deposit.membership_number}</td>
                  <td>
                    {Number(deposit.amount).toLocaleString()}
                  </td>
                  <td>
                    {new Date(deposit.deposit_date).toLocaleString()}
                  </td>

                  <td>
                    {selectedId === deposit.deposit_id ? (
                      <form
                        onSubmit={(e) =>
                          submitVerification(e, deposit.deposit_id)
                        }
                      >
                        <input
                          type="text"
                          placeholder="Bank reference"
                          value={bankReference}
                          onChange={(e) =>
                            setBankReference(e.target.value)
                          }
                          minLength={3}
                          maxLength={50}
                          required
                        />

                        <button
                          type="submit"
                          disabled={processingId !== null}
                        >
                          Confirm Verify
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(null);
                            setBankReference('');
                          }}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="action-buttons">
                        <button
                            className="verify-button"
                            onClick={() => {
                                setSelectedId(deposit.deposit_id);
                                setBankReference('');
                                setError('');
                            }}
                        disabled={processingId !== null}
                    >
                        Verify
                        </button>

                        <button
                            className="reject-button"
                            onClick={() =>
                                decide(deposit.deposit_id, 'Reject')
                            }
                            disabled={processingId !== null}
                        >
                            {processingId === deposit.deposit_id
                                ? 'Processing...'
                                : 'Reject'}
                        </button>
                    </div>
                    )}
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
