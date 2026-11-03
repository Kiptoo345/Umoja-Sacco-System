CREATE VIEW View_MemberDashboard AS
SELECT 
    m.member_id,
    m.membership_number,
    CONCAT(m.first_name, ' ', m.last_name) AS full_name,
    m.savings_balance,
    COALESCE(SUM(l.outstanding_balance), 0.00) AS total_outstanding_loan_balance
FROM Member m
LEFT JOIN Loan l ON m.member_id = l.member_id AND l.status = 'Active'
GROUP BY m.member_id, m.membership_number, m.first_name, m.last_name, m.savings_balance;