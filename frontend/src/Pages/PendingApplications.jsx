import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

function PendingApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('Pending');

  // Fetch all loan applications
  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await apiFetch('/loans/applications');

      // Handles either an array or an object containing applications
      const records = Array.isArray(data)
        ? data
        : data.applications || [];

      setApplications(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Approve or reject an application
  const handleDecision = async (applicationId, decision) => {
    let comments = '';

    if (decision === 'Reject') {
      comments = window.prompt('Enter the reason for rejecting this application:');

      if (comments === null) return;

      if (!comments.trim()) {
        alert('Please provide a reason for rejection.');
        return;
      }
    }

    try {
      setError('');
      setMessage('');

      await apiFetch(`/loans/applications/${applicationId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          ...(decision === 'Reject' ? { comments } : {}),
        }),
      });

      setMessage(
        decision === 'Approve'
            ? 'Application approved successfully.'
            : 'Application rejected successfully.'
        );;
      await loadApplications();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredApplications =
    filter === 'All'
      ? applications
      : applications.filter(
          (application) => application.status === filter
        );

  if (loading) {
    return <p>Loading loan applications...</p>;
  }

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <h2>Loan Applications</h2>
          <p>Review and make decisions on member loan applications.</p>
        </div>

        <button onClick={loadApplications} className="refresh-button">
          Refresh
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="application-filter">
        <label htmlFor="applicationStatus">Filter applications:</label>

        <select
          id="applicationStatus"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="All">All Applications</option>
        </select>
      </div>

      {filteredApplications.length === 0 ? (
        <p>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}applications found.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Member</th>
                <th>Amount Requested</th>
                <th>Purpose</th>
                <th>Application Date</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.application_id}>
                  <td>{application.application_id}</td>
                  <td>
                    {application.full_name ||
                      application.member_name ||
                      application.membership_number ||
                      'Member'}
                  </td>
                  <td>
                    KES {Number(application.amount_requested).toLocaleString()}
                  </td>
                  <td>{application.purpose}</td>
                  <td>
                    {application.application_date
                      ? new Date(application.application_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`status-${application.status?.toLowerCase()}`}>
                      {application.status}
                    </span>
                  </td>
                  <td>{application.comments || '—'}</td>
                  <td>
                    {application.status === 'Pending' ? (
                      <div className="action-buttons">
                        <button
                          className="approve-button"
                          onClick={() =>
                            handleDecision(application.application_id, 'Approve')
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="reject-button"
                          onClick={() =>
                            handleDecision(application.application_id, 'Reject')
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PendingApplications;