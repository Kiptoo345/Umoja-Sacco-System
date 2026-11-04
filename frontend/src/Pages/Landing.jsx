import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { HOME } from '../roles';
import SiteFooter from '../components/SiteFooter';
import './Landing.css';

const FEATURES = [
  ['💰', 'Member savings', 'Every deposit is recorded against your membership, so your savings balance is always clear and up to date.'],
  ['🤝', 'Fair, simple loans', 'Apply for a loan online, track its status, and see your outstanding balance as repayments come in.'],
  ['✅', 'Verified deposits', 'Deposits are checked by the accountant before they count, keeping the books accurate and trustworthy.'],
  ['🔒', 'Secure access', 'Role-based access means people only see what their job requires, and every action is logged.'],
];

const STEPS = [
  ['1', 'Register', 'A staff member registers you and gives you your membership number.'],
  ['2', 'Save', 'Make deposits at the counter. The accountant verifies them and your savings grow.'],
  ['3', 'Borrow', 'Submit a loan application. A loan officer reviews and approves or rejects it.'],
  ['4', 'Repay & track', 'Repayments are recorded and your outstanding balance updates automatically.'],
];

const PEOPLE = [
  ['Members', 'View savings and loan balances, and apply for loans.'],
  ['Staff', 'Register members and record deposits.'],
  ['Loan Officers', 'Review and decide on loan applications.'],
  ['Accountants', 'Verify deposits, record repayments and bank transactions.'],
  ['Administrators', 'Manage employees, members, accounts and security.'],
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Landing() {
  useReveal();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const loggedIn = Boolean(token && user);
  const cta = loggedIn ? { to: HOME[user.role] || '/login', label: 'Go to my page' } : { to: '/login', label: 'Member Login' };

  return (
    <div className="page landing">
      <header className="land-nav">
        <Link to="/" className="brand">
          <img src={logo} alt="Umoja Community SACCO logo" className="brand-logo" />
          <span className="brand-name">Umoja Community SACCO</span>
        </Link>
        <nav className="land-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
          <Link to={cta.to} className="nav-cta">{cta.label}</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="hero-badge">Savings &amp; Credit Cooperative</span>
          <h1>Save together.<br />Borrow with confidence.</h1>
          <p className="hero-tag">Together We Save, Together We Prosper.</p>
          <p className="hero-lead">
            The Umoja Community SACCO system keeps your savings, deposits and loans in one place, so
            members, staff and administrators always see the same accurate picture.
          </p>
          <div className="hero-actions">
            <Link to={cta.to} className="btn-gold">{cta.label}</Link>
            <a href="#how-it-works" className="btn-outline">See how it works</a>
          </div>
        </div>
        <div className="hero-art">
          <img src={logo} alt="Umoja Community SACCO emblem" />
        </div>
      </section>

      <section id="features" className="land-section">
        <h2 className="reveal">Everything your SACCO needs</h2>
        <p className="section-sub reveal">Built around the way a SACCO really works, from the counter to the committee.</p>
        <div className="feature-grid">
          {FEATURES.map(([icon, title, text], i) => (
            <article className="feature reveal" style={{ transitionDelay: `${i * 80}ms` }} key={title}>
              <div className="feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="land-section alt">
        <h2 className="reveal">How it works</h2>
        <p className="section-sub reveal">Four simple steps from joining to repaying.</p>
        <div className="steps">
          {STEPS.map(([n, title, text], i) => (
            <div className="step reveal" style={{ transitionDelay: `${i * 100}ms` }} key={n}>
              <div className="step-num">{n}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="land-section">
        <h2 className="reveal">One system, every role</h2>
        <p className="section-sub reveal">
          Umoja Community SACCO is a member-owned society. The system gives each person the tools for their job and nothing more.
        </p>
        <div className="people">
          {PEOPLE.map(([title, text], i) => (
            <div className="person reveal" style={{ transitionDelay: `${i * 70}ms` }} key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band reveal">
        <h2>Ready to get started?</h2>
        <p>Log in to view your account, or visit the SACCO office to become a member.</p>
        <Link to={cta.to} className="btn-gold">{cta.label}</Link>
      </section>

      <SiteFooter />
    </div>
  );
}
