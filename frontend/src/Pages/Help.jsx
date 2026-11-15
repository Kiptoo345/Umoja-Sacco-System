import './Help.css';

// Help content for each role. To change the help text, edit this object only.
const GUIDES = {
  'Staff': [
    ['Register a new member',
      ['Open Register Member.', 'Fill in first name, last name, email, phone and address. The phone must be a Kenyan number such as 0712345678.',
       'Optionally type a username. If you leave it blank, the member logs in with their email.',
       'Click Register Member. The membership number and a temporary password appear once, so write them down for the member.']],
    ['Record a deposit',
      ['Open Record Deposit.', 'Enter the membership number and the amount received at the counter.',
       'Click save. The deposit is marked Pending Verification. Savings only change after the accountant verifies it.']],
  ],
  'Member': [
    ['Check your savings and loan balance',
      ['Open Dashboard.', 'You will see your total savings and your outstanding loan balance.']],
    ['Apply for a loan',
      ['Open Apply for Loan.', 'Enter the amount you need and the purpose.',
       'Submit. You can only have one open loan at a time, so you cannot apply while you have a pending application or an active loan.']],
  ],
  'Loan Officer': [
    ['Decide on loan applications',
      ['Open Pending Applications.', 'Read the member, amount and purpose.',
       'Click Approve (green) to create the loan, or Reject (red) and give a reason in the comments.']],
  ],
  'Accountant': [
    ['Verify deposits',
      ['Open Verify Deposits.', 'Check the deposit against the bank. Click Verify and enter the bank reference, or click Reject.',
       'A verified deposit adds to the member savings and is recorded as a bank credit.']],
    ['Record a loan repayment',
      ['Open Loan Repayments.', 'Pick the loan, then enter the amount, payment method and receipt number.',
       'The loan balance goes down, and the loan closes when it reaches zero.']],
    ['Bank transactions and reports',
      ['Bank Transactions shows the ledger of credits and debits.', 'Reports shows totals, with date filters, sortable columns and a Print / Save as PDF button.']],
  ],
  'Admin': [
    ['Manage employees',
      ['Open Employees to add a staff member and choose their role.', 'The username must be unique and the phone a valid Kenyan number.']],
    ['Manage members',
      ['Open Members to search for a member, edit their details or deactivate them.']],
    ['Reports',
      ['Open Reports for totals, deposit and loan tables, filters, sorting and printing.']],
  ],
  'System Administrator': [
    ['Manage user accounts',
      ['Open User Accounts to change a role, activate or deactivate an account, or reset a password.']],
    ['Review the audit log',
      ['Open Audit Log to see who did what and when, including logins and password resets.']],
  ],
};

const FAQ = [
  ['I forgot my password. What do I do?',
    'On the login page click "Forgot password?", enter your username or email, then use the reset code to set a new password.'],
  ['Why has my deposit not increased my savings?',
    'A deposit stays Pending Verification until an accountant verifies it against the bank.'],
  ['Why can I not apply for a loan?',
    'A member can only have one open loan. You need to finish repaying, or wait for your pending application to be decided.'],
  ['Why am I sent back to the login page?',
    'Your session may have ended, or your role does not have access to that page. Log in again with the right account.'],
  ['How do I log out?',
    'Click Logout at the top right of any page.'],
];

export default function Help() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const guide = GUIDES[user?.role] || [];

  return (
    <div className="help">
      <h2>Help</h2>
      <p className="help-intro">
        Guides for your role{user?.role ? ` (${user.role})` : ''} and answers to common questions.
      </p>

      <h3>How to use your pages</h3>
      {guide.map(([title, steps]) => (
        <details key={title} className="help-item" open>
          <summary>{title}</summary>
          <ol>
            {steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </details>
      ))}

      <h3>Common questions</h3>
      {FAQ.map(([q, a]) => (
        <details key={q} className="help-item">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}

      <p className="help-contact">Still stuck? Contact the SACCO office or your System Administrator.</p>
    </div>
  );
}