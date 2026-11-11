import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api';
import logo from '../../assets/logo.png';
import './Reports.css';


const money = (v) => `KES ${Number(v).toLocaleString()}`;
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : '-');

// MySQL decimals arrive as strings like "5000.00". Turn them into numbers so they sort properly.
const num = (v) => (v !== null && v !== '' && !isNaN(Number(v)) ? Number(v) : v);

// Reusable sorting: give it rows and a starting column, it returns the sorted rows
// and a toggle() function to call when a column header is clicked.
function useSort(rows, startKey) {
  const [key, setKey] = useState(startKey);
  const [dir, setDir] = useState('desc');

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = num(a[key]);
        const y = num(b[key]);
        if (x === y) return 0;
        return (x > y ? 1 : -1) * (dir === 'asc' ? 1 : -1);
      }),
    [rows, key, dir]
  );

  const toggle = (k) => {
    if (k === key) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setKey(k); setDir('asc'); }
  };
  return { sorted, key, dir, toggle };
}

// A clickable table header cell that shows an arrow on the active column.
function SortTh({ label, field, sort }) {
  const arrow = sort.key === field ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <th className="sortable" onClick={() => sort.toggle(field)}>
      {label}{arrow}
    </th>
  );
}
export default function Reports() {
    const [summary, setSummary] = useState(null);
    const [deposits, setDeposits] = useState([]);
    const [loans, setLoans] = useState([]);
    const [error, setError] = useState('');

      // Filters
      const [from, setFrom] = useState('');
      const [to, setTo] = useState('');
      const [depStatus, setDepStatus] = useState('');
      const [loanStatus, setLoanStatus] = useState('');
 
  useEffect(() => {
    Promise.all([
      apiFetch('/reports/summary'),
      apiFetch('/deposits'),
      apiFetch('/loans'),
    ])
      .then(([s, d, l]) => { setSummary(s); setDeposits(d); setLoans(l); })
      .catch((e) => setError(e.message));
  }, []);

  // Filtering happens in the browser: keep only rows that match the chosen dates and status.
  const inRange = (value) => {
    if (!value) return !from && !to;
    const t = new Date(value);
    if (from && t < new Date(from)) return false;
    if (to && t > new Date(`${to}T23:59:59`)) return false;
    return true;
  };

  const filteredDeposits = useMemo(
    () => deposits.filter((d) => inRange(d.deposit_date) && (!depStatus || d.status === depStatus)),
    [deposits, from, to, depStatus]
  );
  const filteredLoans = useMemo(
    () => loans.filter((l) => inRange(l.disbursement_date) && (!loanStatus || l.status === loanStatus)),
    [loans, from, to, loanStatus]
  );

  const depSort = useSort(filteredDeposits, 'deposit_date');
  const loanSort = useSort(filteredLoans, 'disbursement_date');

  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p>Loading...</p>;
  
  const cards = [
    ['Active members', summary.active_members],
    ['Total savings', money(summary.total_savings)],
    ['Verified deposits', money(summary.total_verified_deposits)],
    ['Deposits awaiting verification', summary.deposits_awaiting_verification],
    ['Active loans', summary.active_loans],
    ['Outstanding loan balance', money(summary.outstanding_loans)],
  ];

  const depTotal = filteredDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const loanTotal = filteredLoans.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
  const period = from || to ? `${from || 'start'} to ${to || 'today'}` : 'All dates';

  return (
    <>
      {/* Letterhead: company name, logo and date */}
      <div className="report-head">
        <img src={logo} alt="Umoja Community SACCO logo" />
        <div>
          <h1>Umoja Community SACCO</h1>
          <div className="report-title">Financial Summary Report</div>
          <div className="report-meta">
            Generated: {new Date().toLocaleString()} &middot; Period: {period}
          </div>
        </div>
      </div>

      <div className="report-actions no-print">
        <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button type="button" onClick={() => { setFrom(''); setTo(''); setDepStatus(''); setLoanStatus(''); }}>
          Clear filters
        </button>
        <button type="button" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div className="cards">
        {cards.map(([label, value]) => (
          <div className="stat" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <h2>Deposits</h2>
      <div className="report-actions no-print">
        <label>Status{' '}
          <select value={depStatus} onChange={(e) => setDepStatus(e.target.value)}>
            <option value="">All</option>
            <option>Pending Verification</option>
            <option>Verified</option>
            <option>Rejected</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <SortTh label="Date" field="deposit_date" sort={depSort} />
            <SortTh label="Membership No." field="membership_number" sort={depSort} />
            <SortTh label="Member" field="full_name" sort={depSort} />
            <SortTh label="Amount (KES)" field="amount" sort={depSort} />
            <SortTh label="Status" field="status" sort={depSort} />
          </tr>
        </thead>
        <tbody>
          {depSort.sorted.map((d) => (
            <tr key={d.deposit_id}>
              <td>{fmtDate(d.deposit_date)}</td>
              <td>{d.membership_number}</td>
              <td>{d.full_name}</td>
              <td>{Number(d.amount).toLocaleString()}</td>
              <td>{d.status}</td>
            </tr>
          ))}
          {depSort.sorted.length === 0 && <tr><td colSpan="5">No deposits match the filters.</td></tr>}
        </tbody>
        <tfoot>
          <tr><td colSpan="3"><strong>Total ({filteredDeposits.length} deposits)</strong></td><td colSpan="2"><strong>{money(depTotal)}</strong></td></tr>
        </tfoot>
      </table>

      <h2>Loans</h2>
      <div className="report-actions no-print">
        <label>Status{' '}
          <select value={loanStatus} onChange={(e) => setLoanStatus(e.target.value)}>
            <option value="">All</option>
            <option>Active</option>
            <option>Closed</option>
            <option>Defaulted</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <SortTh label="Disbursed" field="disbursement_date" sort={loanSort} />
            <SortTh label="Membership No." field="membership_number" sort={loanSort} />
            <SortTh label="Member" field="full_name" sort={loanSort} />
            <SortTh label="Principal (KES)" field="principal_amount" sort={loanSort} />
            <SortTh label="Outstanding (KES)" field="outstanding_balance" sort={loanSort} />
            <SortTh label="Status" field="status" sort={loanSort} />
          </tr>
        </thead>
        <tbody>
          {loanSort.sorted.map((l) => (
            <tr key={l.loan_id}>
              <td>{fmtDate(l.disbursement_date)}</td>
              <td>{l.membership_number}</td>
              <td>{l.full_name}</td>
              <td>{Number(l.principal_amount).toLocaleString()}</td>
              <td>{Number(l.outstanding_balance).toLocaleString()}</td>
              <td>{l.status}</td>
            </tr>
          ))}
          {loanSort.sorted.length === 0 && <tr><td colSpan="6">No loans match the filters.</td></tr>}
        </tbody>
        <tfoot>
          <tr><td colSpan="4"><strong>Total outstanding ({filteredLoans.length} loans)</strong></td><td colSpan="2"><strong>{money(loanTotal)}</strong></td></tr>
        </tfoot>
      </table>
    </>
  );
}