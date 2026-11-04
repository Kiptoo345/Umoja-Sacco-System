import { createContext, useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import SiteFooter from './SiteFooter';
import './Layout.css';

const TABS = {
  'Staff': [
    ['/register-member', 'Register Member'],
    ['/record-deposit', 'Record Deposit']
  ],
  'Member': [
    ['/dashboard', 'Dashboard'],
    ['/apply-loan', 'Apply for Loan']
  ],
  'Loan Officer': [
    ['/pending-applications', 'Pending Applications']
  ],
  'Accountant': [
    ['/verify-deposits', 'Verify Deposits'],
    ['/bank-transactions', 'Bank Transactions'],
    ['/loan-repayments', 'Loan Repayments']
  ],
  'Admin': [
    ['/admin/employees', 'Employees'],
    ['/admin/members', 'Members'],
    ['/admin/reports', 'Reports'],
  ],
  'System Administrator': [
    ['/admin/users', 'User Accounts'],
    ['/admin/audit-log', 'Audit Log'],
  ],
};

// Some pages wrap themselves in <Layout> as well as App.jsx doing it.
// This context makes the inner one render only its children, so the header never appears twice.
const InsideLayout = createContext(false);

export default function Layout({ children }) {
  const inside = useContext(InsideLayout);
  const navigate = useNavigate();
  if (inside) return <>{children}</>;

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const tabs = TABS[user?.role] || [];

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <InsideLayout.Provider value={true}>
      <div className="page">
        <header className="app-header">
          <Link to="/" className="brand">
            <img src={logo} alt="Umoja Community SACCO logo" className="brand-logo" />
            <span className="brand-name">Umoja Community SACCO</span>
          </Link>
          <span className="welcome">
            <span className="welcome-text">Welcome, {user?.fullName}</span>
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
        <SiteFooter />
      </div>
    </InsideLayout.Provider>
  );
}
