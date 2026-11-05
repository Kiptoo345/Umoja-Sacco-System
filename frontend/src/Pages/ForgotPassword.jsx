import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import logo from '../assets/logo.png';
import SiteFooter from '../components/SiteFooter';
import './Login.css';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = request code, 2 = new password, 3 = done
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestToken(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      setInfo(data.message);
      // In development the API returns the token directly (no email service yet).
      if (data.resetToken) setToken(data.resetToken);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <main className="login-main">
        <section className="login-brand">
          <Link to="/" className="login-back">← Back to home</Link>
          <img src={logo} alt="Umoja Community SACCO logo" className="login-logo" />
          <h1>Umoja Community SACCO</h1>
          <p>Together We Save, Together We Prosper.</p>
        </section>

        <section className="login-panel">
          {step === 1 && (
            <form className="login-card" onSubmit={requestToken}>
              <h2>Forgot Password</h2>
              <p className="login-sub">Enter your username or email</p>
              <label htmlFor="fp-user">Username or Email</label>
              <input id="fp-user" value={username} onChange={(e) => setUsername(e.target.value)} required />
              {error && <div className="error">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Please wait...' : 'GET RESET CODE'}
              </button>
              <small><Link to="/login">Back to login</Link></small>
            </form>
          )}

          {step === 2 && (
            <form className="login-card" onSubmit={resetPassword}>
              <h2>Set New Password</h2>
              <p className="login-sub">{info} The code expires in 30 minutes.</p>
              <label htmlFor="fp-token">Reset code</label>
              <input id="fp-token" value={token} onChange={(e) => setToken(e.target.value)} required />
              <label htmlFor="fp-new">New password</label>
              <input id="fp-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
              <label htmlFor="fp-confirm">Confirm new password</label>
              <input id="fp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
              {error && <div className="error">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Saving...' : 'RESET PASSWORD'}
              </button>
              <small><Link to="/login">Back to login</Link></small>
            </form>
          )}

          {step === 3 && (
            <div className="login-card">
              <h2>Password Updated</h2>
              <p className="login-sub">You can now log in with your new password.</p>
              <Link to="/login" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', color: '#fff', borderRadius: 6 }}>GO TO LOGIN</Link>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}