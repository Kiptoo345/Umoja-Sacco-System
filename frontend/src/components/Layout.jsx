import { NavLink, useNavigate } from 'react-router-dom';
import './Layout.css';

const TABS = {
  'Staff': [['/register-member', 'Register Member'], ['/record-deposit', 'Record Deposit']],
  'Member': [['/dashboard', 'Dashboard'], ['/apply-loan', 'Apply for Loan']],
  'Loan Officer': [['/pending-applications', 'Pending Applications']],
  'Accountant': [
  ['/verify-deposits', 'Verify Deposits'],
  ['/bank-transactions', 'Bank Transactions'],
  ['/loan-repayments', 'Loan Repayments']
  ],
};

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const tabs = TABS[user?.role] || [];

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="page">
      <header className="app-header">
        <span className="title">Umoja Community SACCO</span>
        <span className="welcome">
          Welcome, {user?.fullName}
          <button onClick={logout}>Logout</button>
        </span>
      </header>
      <nav className="tabs">
        {tabs.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="content">{children}</main>
      <footer className="footer">© Umoja Community SACCO</footer>
    </div>
  );
}