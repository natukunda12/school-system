-- =====================================================================
-- School Management and Student Registration System
-- MySQL 8.x schema (v1)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS school_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_management;

-- ---------------------------------------------------------------------
-- 1. ROLES AND USERS
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,   -- super_admin, registrar, staff, student, parent
  description VARCHAR(255)
);

INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Highest access, manages whole system'),
  ('registrar',   'Manages students, registration and permissions'),
  ('staff',       'Authorized staff: verify requirements and permissions'),
  ('student',     'Student account'),
  ('parent',      'Parent or guardian account');

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id       TINYINT UNSIGNED NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) UNIQUE,
  phone         VARCHAR(20),
  username      VARCHAR(60) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. ACADEMIC STRUCTURE
-- ---------------------------------------------------------------------
CREATE TABLE academic_years (
  id         SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(20) NOT NULL UNIQUE,    -- e.g. 2026
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE terms (
  id               SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academic_year_id SMALLINT UNSIGNED NOT NULL,
  name             VARCHAR(30) NOT NULL,     -- Term 1, Term 2, Term 3
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  is_current       BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (academic_year_id, name),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

CREATE TABLE classes (
  id    SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(30) NOT NULL UNIQUE,         -- S4, S5, S6
  level TINYINT UNSIGNED                     -- for ordering / promotion
);

CREATE TABLE combinations (
  id   SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,          -- SOD, MPC, PCB ...
  name VARCHAR(100)
);

-- ---------------------------------------------------------------------
-- 3. STUDENTS AND PARENTS
-- ---------------------------------------------------------------------
CREATE TABLE students (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_code     VARCHAR(20) NOT NULL UNIQUE,   -- STU-2026-0001
  qr_token         CHAR(64) NOT NULL UNIQUE,      -- random opaque token placed in the student ID QR code
  user_id          INT UNSIGNED NULL UNIQUE,      -- linked after account creation
  full_name        VARCHAR(150) NOT NULL,
  gender           ENUM('Male','Female') NOT NULL,
  date_of_birth    DATE NOT NULL,
  place_of_birth   VARCHAR(100),
  email            VARCHAR(150),
  phone            VARCHAR(20),
  previous_school  VARCHAR(150),
  photo_path       VARCHAR(255),
  current_class_id       SMALLINT UNSIGNED NULL,
  current_combination_id SMALLINT UNSIGNED NULL,
  boarding_status  ENUM('boarding','day') NOT NULL DEFAULT 'day',
  status           ENUM('active','graduated','transferred','suspended') NOT NULL DEFAULT 'active',
  created_by       INT UNSIGNED NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (current_class_id) REFERENCES classes(id),
  FOREIGN KEY (current_combination_id) REFERENCES combinations(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_students_name (full_name)
);

CREATE TABLE parents (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id   INT UNSIGNED NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  phone     VARCHAR(20) NOT NULL,
  email     VARCHAR(150),
  address   VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE student_parents (
  student_id   INT UNSIGNED NOT NULL,
  parent_id    INT UNSIGNED NOT NULL,
  relationship VARCHAR(30) NOT NULL,         -- Father, Mother, Guardian
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (student_id, parent_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id)  REFERENCES parents(id)  ON DELETE CASCADE
);

-- Verification codes used when a student creates an account with Student ID
CREATE TABLE account_verifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  channel    ENUM('email','phone') NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,
  attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE student_documents (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  INT UNSIGNED NOT NULL,
  doc_type    VARCHAR(60) NOT NULL,          -- Medical, ID, Report card
  file_path   VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 4. REGISTRATION (one row per student per term)
-- ---------------------------------------------------------------------
CREATE TABLE registrations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id      INT UNSIGNED NOT NULL,
  academic_year_id SMALLINT UNSIGNED NOT NULL,
  term_id         SMALLINT UNSIGNED NOT NULL,
  class_id        SMALLINT UNSIGNED NOT NULL,
  combination_id  SMALLINT UNSIGNED NULL,
  student_type    ENUM('new','returning') NOT NULL,
  boarding_status ENUM('boarding','day') NOT NULL,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by     INT UNSIGNED NULL,
  reviewed_at     DATETIME NULL,
  review_note     VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, term_id),              -- no double registration in a term
  FOREIGN KEY (student_id)       REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (term_id)          REFERENCES terms(id),
  FOREIGN KEY (class_id)         REFERENCES classes(id),
  FOREIGN KEY (combination_id)   REFERENCES combinations(id),
  FOREIGN KEY (reviewed_by)      REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 5. REQUIREMENTS
-- ---------------------------------------------------------------------
-- Rules live in data, so the school can change them without code changes.
CREATE TABLE requirements (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,        -- Mattress, Uniform ...
  description  VARCHAR(255),
  category     ENUM('item','document') NOT NULL DEFAULT 'item',
  applies_to_type     ENUM('all','new','returning') NOT NULL DEFAULT 'all',
  applies_to_boarding ENUM('all','boarding','day')  NOT NULL DEFAULT 'all',
  term_id      SMALLINT UNSIGNED NULL,       -- NULL = every term
  class_id     SMALLINT UNSIGNED NULL,       -- NULL = every class
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (term_id)  REFERENCES terms(id)   ON DELETE SET NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

CREATE TABLE student_requirements (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_id INT UNSIGNED NOT NULL,
  requirement_id  INT UNSIGNED NOT NULL,
  status          ENUM('pending','complete') NOT NULL DEFAULT 'pending',
  checked_by      INT UNSIGNED NULL,
  checked_at      DATETIME NULL,
  note            VARCHAR(255),
  UNIQUE (registration_id, requirement_id),
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (requirement_id)  REFERENCES requirements(id)  ON DELETE CASCADE,
  FOREIGN KEY (checked_by)      REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 6. PERMISSIONS AND CARDS
-- ---------------------------------------------------------------------
CREATE TABLE permission_requests (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id        INT UNSIGNED NOT NULL,
  destination       VARCHAR(150) NOT NULL,
  reason            VARCHAR(255) NOT NULL,
  departure_at      DATETIME NOT NULL,
  expected_return_at DATETIME NOT NULL,
  additional_info   TEXT,
  document_path     VARCHAR(255),
  status            ENUM('pending','approved','rejected','returned','expired')
                    NOT NULL DEFAULT 'pending',
  reviewed_by       INT UNSIGNED NULL,
  reviewed_at       DATETIME NULL,
  review_note       VARCHAR(255),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_perm_status (status)
);

CREATE TABLE permission_cards (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  permission_request_id INT UNSIGNED NOT NULL UNIQUE,
  permission_number  VARCHAR(30) NOT NULL UNIQUE,   -- PRM-2026-000123
  verification_token CHAR(64) NOT NULL UNIQUE,      -- random token placed in QR code
  issued_by          INT UNSIGNED NULL,
  issued_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_path           VARCHAR(255),
  FOREIGN KEY (permission_request_id) REFERENCES permission_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Who scanned which card and when (exit/return tracking)
CREATE TABLE permission_scans (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  card_id     INT UNSIGNED NOT NULL,
  scanned_by  INT UNSIGNED NULL,
  scan_type   ENUM('verify','exit','return') NOT NULL DEFAULT 'verify',
  scanned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id)    REFERENCES permission_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 7. EXCEL IMPORT TRACKING
-- ---------------------------------------------------------------------
CREATE TABLE import_batches (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  import_type   ENUM('students_new','students_update') NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  total_rows    INT UNSIGNED DEFAULT 0,
  valid_rows    INT UNSIGNED DEFAULT 0,
  error_rows    INT UNSIGNED DEFAULT 0,
  status        ENUM('uploaded','validated','confirmed','cancelled') NOT NULL DEFAULT 'uploaded',
  error_report  JSON NULL,
  rows_data     JSON NULL,
  uploaded_by   INT UNSIGNED NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at  DATETIME NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 8. SETTINGS AND AUDIT
-- ---------------------------------------------------------------------
CREATE TABLE settings (
  setting_key   VARCHAR(80) PRIMARY KEY,     -- school_name, school_logo, id_prefix
  setting_value TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  action      VARCHAR(80) NOT NULL,          -- LOGIN, UPDATE_STUDENT, APPROVE_PERMISSION
  entity      VARCHAR(50),
  entity_id   INT UNSIGNED,
  details     JSON NULL,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity, entity_id)
);
