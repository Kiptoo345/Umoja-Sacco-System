DELIMITER //

CREATE TRIGGER AfterLoanRepayment
AFTER INSERT ON LoanRepayment
FOR EACH ROW
BEGIN
    -- Deduct repayment amount from outstanding balance
    UPDATE Loan
    SET outstanding_balance = outstanding_balance - NEW.amount_paid
    WHERE loan_id = NEW.loan_id;

    -- Auto-close loan if balance reaches 0
    UPDATE Loan
    SET status = 'Closed'
    WHERE loan_id = NEW.loan_id AND outstanding_balance <= 0;
END //

DELIMITER ;