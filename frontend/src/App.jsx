import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';
import Placeholder from './Pages/Placeholder';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterMember from './Pages/RegisterMember';
import RecordDeposit from './Pages/RecordDeposit';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/register-member" element={
        <ProtectedRoute roles={['Staff']}><RegisterMember /></ProtectedRoute>
      } />
      <Route path="/record-deposit" element={
        <ProtectedRoute roles={['Staff']}><RecordDeposit /></ProtectedRoute>
      } />

      {/* still placeholders, to be replaced one at a time */}
      <Route path="/dashboard" element={<Placeholder title="Member Dashboard" />} />
      <Route path="/apply-loan" element={<Placeholder title="Apply for Loan" />} />
      <Route path="/pending-applications" element={<Placeholder title="Pending Applications" />} />
      <Route path="/bank-transactions" element={<Placeholder title="Bank Transactions" />} />
      <Route path="/admin" element={<Placeholder title="Admin Panel" />} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}