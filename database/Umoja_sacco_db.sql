-- Create and use database
CREATE DATABASE umoja_sacco_db;
USE umoja_sacco_db;

-- 1. Role Table
CREATE TABLE Role (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL, -- Admin, System Administrator, Staff, Loan Officer, Accountant, Member
    description TEXT
);

-- Seed System Roles
INSERT INTO Role (role_name, description) VALUES
('Admin', 'Manages members and employees'),
('System Administrator', 'Manages user accounts, permissions, and security'),
('Staff', 'Registers members and records deposits'),
('Loan Officer', 'Reviews and approves/rejects loan applications'),
('Accountant', 'Maintains savings, deposit, loan records, and bank transactions'),
('Member', 'Views savings, applies for loans, checks balances');

-- 2. User Table (Authentication & Access Control)
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Role(role_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Member Table
CREATE TABLE Member (
    member_id INT PRIMARY KEY AUTO_INCREMENT,
    membership_number VARCHAR(20) UNIQUE NOT NULL, -- Format: SACCO-YYYY-XXXX
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    savings_balance DECIMAL(12, 2) DEFAULT 0.00,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Staff Table
CREATE TABLE Staff (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Deposit Table
CREATE TABLE Deposit (
    deposit_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    deposit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by_staff_id INT NOT NULL,
    verified_by_accountant_id INT NULL,
    status ENUM('Pending Verification', 'Verified', 'Rejected') DEFAULT 'Pending Verification',
    FOREIGN KEY (member_id) REFERENCES Member(member_id),
    FOREIGN KEY (recorded_by_staff_id) REFERENCES Staff(staff_id),
    FOREIGN KEY (verified_by_accountant_id) REFERENCES Staff(staff_id)
);

-- 6. LoanApplication Table
CREATE TABLE LoanApplication (
    application_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    amount_requested DECIMAL(12, 2) NOT NULL CHECK (amount_requested > 0),
    purpose TEXT NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    reviewed_by_staff_id INT NULL,
    review_date TIMESTAMP NULL,
    comments TEXT,
    FOREIGN KEY (member_id) REFERENCES Member(member_id),
    FOREIGN KEY (reviewed_by_staff_id) REFERENCES Staff(staff_id)
);

-- 7. Loan Table
CREATE TABLE Loan (
    loan_id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT UNIQUE NOT NULL,
    member_id INT NOT NULL,
    principal_amount DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL, -- e.g., 10.00 for 10%
    total_amount DECIMAL(12, 2) NOT NULL,   -- Principal + Interest
    outstanding_balance DECIMAL(12, 2) NOT NULL,
    disbursement_date DATE NOT NULL,
    status ENUM('Active', 'Closed', 'Defaulted') DEFAULT 'Active',
    FOREIGN KEY (application_id) REFERENCES LoanApplication(application_id),
    FOREIGN KEY (member_id) REFERENCES Member(member_id)
);

-- 8. LoanRepayment Table
CREATE TABLE LoanRepayment (
    repayment_id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL CHECK (amount_paid > 0),
    repayment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL, -- M-Pesa, Bank Transfer, Cash
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES Loan(loan_id)
);

-- 9. BankTransaction Table
CREATE TABLE BankTransaction (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    accountant_id INT NOT NULL,
    transaction_type ENUM('Credit', 'Debit') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    FOREIGN KEY (accountant_id) REFERENCES Staff(staff_id)
);