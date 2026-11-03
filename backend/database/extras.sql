-- ADDITIVE ONLY: tables the back-end needs that are not in Umoja_sacco_db.sql. Safe to run more than once.
-- Audit trail and password reset are marked items in Deliverable 4. Suggest the database owner merges these into the main schema.
USE umoja_sacco_db;

CREATE TABLE IF NOT EXISTS AuditLog (
  log_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  action      VARCHAR(60) NOT NULL,
  details     VARCHAR(500),
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE IF NOT EXISTS PasswordReset (
  reset_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used        TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);
