import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/login';
import Placeholder from './Pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Placeholder title="Member Dashboard" />} />
      <Route path="/register-member" element={<Placeholder title="Register Member" />} />
      <Route path="/pending-applications" element={<Placeholder title="Pending Applications" />} />
      <Route path="/bank-transactions" element={<Placeholder title="Bank Transactions" />} />
      <Route path="/admin" element={<Placeholder title="Admin Panel" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}