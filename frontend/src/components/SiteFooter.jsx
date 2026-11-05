import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './SiteFooter.css';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-brand-row">
            <img src={logo} alt="" className="footer-logo" />
            <strong>Umoja Community SACCO</strong>
          </div>
          <p className="footer-tagline">Together We Save, Together We Prosper.</p>
          <p className="footer-small">
            A member-owned savings and credit society for managing savings, deposits and loans in one place.
          </p>
        </div>

        <div>
          <h4>Quick links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#how-it-works">How it works</a></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4>Services</h4>
          <ul>
            <li>Member savings</li>
            <li>Loan applications</li>
            <li>Deposit verification</li>
            <li>Loan repayments</li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul>
            <li>Nairobi, Kenya</li>
            <li>+254 798 765 432</li>
            <li>info@umojasacco.co.ke</li>
            <li>Mon – Fri, 8:00 – 17:00</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Umoja Community SACCO. All rights reserved.</span>
        <span>Data privacy · Terms of use</span>
      </div>
    </footer>
  );
}
