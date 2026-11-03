DELIMITER //

CREATE TRIGGER AfterDepositVerified
AFTER UPDATE ON Deposit
FOR EACH ROW
BEGIN
    -- If deposit status changes from 'Pending Verification' to 'Verified'
    IF OLD.status = 'Pending Verification' AND NEW.status = 'Verified' THEN
        UPDATE Member 
        SET savings_balance = savings_balance + NEW.amount
        WHERE member_id = NEW.member_id;
    END IF;
END //

DELIMITER ;