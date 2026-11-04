import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { HOME } from '../roles';
import logo from '../assets/logo.png';
import SiteFooter from '../components/SiteFooter';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(HOME[data.user.role] || '/login');
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
          <form className="login-card" onSubmit={handleSubmit}>
            <h2>Welcome Back</h2>
            <p className="login-sub">Sign in to your account</p>

            <label htmlFor="username">Username or Email</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="password">Password</label>
            <div className="password-row">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'LOGIN'}
            </button>

            <small>Forgot password? Contact the System Administrator</small>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
