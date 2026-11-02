DELIMITER //

CREATE PROCEDURE RegisterNewMember (
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_email VARCHAR(100),
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_phone_number VARCHAR(20),
    IN p_address TEXT
)
BEGIN
    DECLARE new_user_id INT;
    DECLARE member_role_id INT;
    DECLARE new_mem_num VARCHAR(20);
    DECLARE next_seq INT;

    -- Retrieve role_id for 'Member'
    SELECT role_id INTO member_role_id FROM Role WHERE role_name = 'Member' LIMIT 1;

    -- Insert User Account
    INSERT INTO User (username, password_hash, email, role_id)
    VALUES (p_username, p_password_hash, p_email, member_role_id);
    
    SET new_user_id = LAST_INSERT_ID();

    -- Generate unique membership number: SACCO-YEAR-ID
    SET new_mem_num = CONCAT('SACCO-', YEAR(CURRENT_DATE()), '-', LPAD(new_user_id, 4, '0'));

    -- Insert Member Profile
    INSERT INTO Member (membership_number, user_id, first_name, last_name, phone_number, address)
    VALUES (new_mem_num, new_user_id, p_first_name, p_last_name, p_phone_number, p_address);

    SELECT new_user_id AS user_id, new_mem_num AS membership_number, 'Member successfully registered' AS message;
END //

DELIMITER ;