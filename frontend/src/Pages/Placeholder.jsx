import { useNavigate } from 'react-router-dom';

export default function Placeholder({ title }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>{title}</h2>
      <p>Logged in as {user?.fullName} ({user?.role})</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}