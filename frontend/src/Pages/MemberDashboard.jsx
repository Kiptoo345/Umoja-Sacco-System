
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import Layout from '../components/Layout';

export default function MemberDashboard() {
  const [profile, setProfile] = useState(null);
  const [loans, setLoans] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [memberData, loanData, applicationData] = await Promise.all([
          apiFetch('/members/me'),
          apiFetch('/loans/me'),
          apiFetch('/loans/applications'),
        ]);

        setProfile(memberData);
        setLoans(loanData);
        setApplications(applicationData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <Layout><p>Loading your dashboard...</p></Layout>;
  }

  if (error) {
    return <Layout><p className="error">{error}</p></Layout>;
  }

  if (!profile) {
    return <Layout><p>Member information could not be found.</p></Layout>;
  }

  const money = (value) =>
    `KES ${Number(value || 0).toLocaleString()}`;

  const activeLoans = loans.filter(
  (loan) => loan.status === 'Active'
);

const totalOutstanding = activeLoans.reduce(
  (total, loan) => total + Number(loan.outstanding_balance || 0),
  0
);
  const pendingApplications = applications.filter(
    (application) => application.status === 'Pending'
  );

  return (
    <Layout>
      <div className="dashboard-heading">
        <div>
          <h2>Member Dashboard</h2>
          <p>Welcome, {profile.full_name || 'Member'}!</p>
          <p>
            Membership Number: <strong>{profile.membership_number}</strong>
          </p>
        </div>

        <Link to="/apply-loan" className="dashboard-link">
          Apply for Loan
        </Link>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span>Savings Balance</span>
          <h3>{money(profile.savings_balance)}</h3>
        </div>

        <div className="dashboard-card">
          <span>Outstanding Loans</span>
          <h3>{money(totalOutstanding)}</h3>
        </div>

        <div className="dashboard-card">
          <span>Active Loans</span>
          <h3>{activeLoans.length}</h3>
        </div>

        <div className="dashboard-card">
          <span>Pending Applications</span>
          <h3>{pendingApplications.length}</h3>
        </div>
      </div>

      <section className="dashboard-section">
        <h3>My Loans</h3>

        {loans.length === 0 ? (
          <p>You currently have no loans.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Principal</th>
                  <th>Total Amount</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.loan_id}>
                    <td>#{loan.loan_id}</td>
                    <td>{money(loan.principal_amount)}</td>
                    <td>{money(loan.total_amount)}</td>
                    <td>{money(loan.outstanding_balance)}</td>
                    <td>{loan.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h3>My Loan Applications</h3>

        {applications.length === 0 ? (
          <p>You haven't submitted any loan applications.</p>
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
                    <td>{money(application.amount_requested)}</td>
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
    </ Layout>
  );
}
