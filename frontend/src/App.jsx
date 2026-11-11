
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';
import Landing from './Pages/Landing';
import ForgotPassword from './Pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Employees from './Pages/admin/Employees';
import Members from './Pages/admin/Members';
import Reports from './Pages/admin/Reports';
import Users from './Pages/admin/Users';
import AuditLog from './Pages/admin/AuditLog';

import RegisterMember from './Pages/RegisterMember';
import RecordDeposit from './Pages/RecordDeposit';
import VerifyDeposits from './Pages/VerifyDeposits';
import BankTransactions from './Pages/BankTransactions';
import LoanRepayments from './Pages/LoanRepayments';
import MemberDashboard from './Pages/MemberDashboard';
import ApplyLoan from './Pages/ApplyLoan';
import PendingApplications from './Pages/PendingApplications';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={
        <ForgotPassword />
      } />

      <Route path="/register-member" element={
        <ProtectedRoute roles={['Staff']}>
          <Layout><RegisterMember /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/record-deposit" element={
        <ProtectedRoute roles={['Staff']}>
          <Layout><RecordDeposit /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/verify-deposits" element={
        <ProtectedRoute roles={['Accountant']}>
          <Layout><VerifyDeposits /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/bank-transactions" element={
        <ProtectedRoute roles={['Accountant']}>
          <Layout><BankTransactions /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/loan-repayments" element={
        <ProtectedRoute roles={['Accountant']}>
          <Layout><LoanRepayments /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute roles={['Member']}>
          <Layout><MemberDashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/apply-loan" element={
        <ProtectedRoute roles={['Member']}>
          <Layout><ApplyLoan /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/pending-applications" element={
        <ProtectedRoute roles={['Loan Officer']}>
          <Layout><PendingApplications /></Layout>
        </ProtectedRoute>
      } />

     {[
        ['/admin/employees', ['Admin', 'Accountant'], <Employees />],
        ['/admin/members', ['Admin', 'Accountant'], <Members />],
        ['/admin/reports', ['Admin', 'Accountant'], <Reports />],
        ['/admin/users', ['System Administrator'], <Users />],
        ['/admin/audit-log', ['System Administrator'], <AuditLog />],
      ].map(([path, roles, page]) => (
        <Route key={path} path={path} element={
          <ProtectedRoute roles={roles}><Layout>{page}</Layout></ProtectedRoute>
        } />
      ))}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
