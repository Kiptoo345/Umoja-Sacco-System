DELIMITER //

CREATE PROCEDURE ApproveLoanApplication (
    IN p_application_id INT,
    IN p_loan_officer_staff_id INT,
    IN p_interest_rate DECIMAL(5, 2)
)
BEGIN
    DECLARE v_member_id INT;
    DECLARE v_amount DECIMAL(12, 2);
    DECLARE v_total DECIMAL(12, 2);

    -- Get application details
    SELECT member_id, amount_requested INTO v_member_id, v_amount
    FROM LoanApplication WHERE application_id = p_application_id;

    -- Update Application Status
    UPDATE LoanApplication
    SET status = 'Approved',
        reviewed_by_staff_id = p_loan_officer_staff_id,
        review_date = CURRENT_TIMESTAMP
    WHERE application_id = p_application_id;

    -- Calculate total with interest
    SET v_total = v_amount + (v_amount * (p_interest_rate / 100));

    -- Disburse Loan
    INSERT INTO Loan (application_id, member_id, principal_amount, interest_rate, total_amount, outstanding_balance, disbursement_date)
    VALUES (p_application_id, v_member_id, v_amount, p_interest_rate, v_total, v_total, CURRENT_DATE());

    SELECT p_application_id AS application_id, 'Loan approved and created successfully' AS status;
END //

DELIMITER ;