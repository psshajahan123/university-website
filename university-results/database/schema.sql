-- ============================================================
-- University Results System - MySQL Schema & Seed Data
-- Run: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS university_results;
USE university_results;

-- Universities
CREATE TABLE universities (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  short       VARCHAR(10) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  location    VARCHAR(100),
  website     VARCHAR(200),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  university_id  INT NOT NULL,
  code           VARCHAR(10) NOT NULL,
  name           VARCHAR(100) NOT NULL,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- Students
CREATE TABLE students (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  reg_no           VARCHAR(20) UNIQUE NOT NULL,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(150),
  university_id    INT NOT NULL,
  department_id    INT NOT NULL,
  admission_year   YEAR,
  current_semester TINYINT DEFAULT 1,
  `rank`           VARCHAR(20),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (university_id) REFERENCES universities(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Subjects
CREATE TABLE subjects (
  id      INT PRIMARY KEY AUTO_INCREMENT,
  code    VARCHAR(20) UNIQUE NOT NULL,
  name    VARCHAR(150) NOT NULL,
  credits TINYINT DEFAULT 3
);

-- Results
CREATE TABLE results (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  student_id     INT NOT NULL,
  university_id  INT NOT NULL,
  subject_id     INT NOT NULL,
  semester       TINYINT NOT NULL,
  year           YEAR NOT NULL,
  internal_marks TINYINT DEFAULT 0,
  external_marks TINYINT DEFAULT 0,
  marks          TINYINT GENERATED ALWAYS AS (internal_marks + external_marks) STORED,
  grade          VARCHAR(3),
  status         ENUM('Pass', 'Fail') DEFAULT 'Fail',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (university_id) REFERENCES universities(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY uq_result (student_id, subject_id, semester, year)
);

-- Trigger: auto-assign grade and status
DELIMITER $$
CREATE TRIGGER before_result_insert
BEFORE INSERT ON results FOR EACH ROW
BEGIN
  DECLARE total INT;
  SET total = NEW.internal_marks + NEW.external_marks;
  SET NEW.grade = CASE
    WHEN total >= 90 THEN 'A+'
    WHEN total >= 80 THEN 'A'
    WHEN total >= 70 THEN 'B'
    WHEN total >= 60 THEN 'C'
    WHEN total >= 50 THEN 'D'
    ELSE 'F'
  END;
  SET NEW.status = IF(total >= 40, 'Pass', 'Fail');
END$$
DELIMITER ;

-- ── SEED DATA ──────────────────────────────────────────────

INSERT INTO universities (short, name, location) VALUES
('AU',   'Anna University',              'Chennai, TN'),
('VTU',  'Visvesvaraya Tech University', 'Belagavi, KA'),
('JNTU', 'JNTU Hyderabad',              'Hyderabad, TS'),
('MU',   'Mumbai University',            'Mumbai, MH'),
('DU',   'Delhi University',             'New Delhi, DL'),
('CU',   'Calcutta University',          'Kolkata, WB');

INSERT INTO departments (university_id, code, name) VALUES
(1,'CS','Computer Science'), (1,'EC','Electronics'), (1,'ME','Mechanical'),
(2,'CS','Computer Science'), (2,'IS','Information Science'),
(3,'CS','Computer Science'), (3,'CE','Civil Engineering'),
(4,'CS','Computer Science'), (4,'IT','Information Technology'),
(5,'CS','Computer Science'), (5,'PH','Physics'),
(6,'CS','Computer Science'), (6,'MA','Mathematics');

INSERT INTO subjects (code, name, credits) VALUES
('CS301','Data Structures',3),('CS302','Computer Architecture',3),
('CS303','Discrete Mathematics',4),('CS304','Operating Systems',3),
('CS305','Database Management Systems',3),('CS306','Software Engineering',3),
('EC301','Digital Electronics',3),('ME301','Thermodynamics',3),
('MA301','Engineering Mathematics III',4),('CS401','Machine Learning',3);

INSERT INTO students (reg_no, name, email, university_id, department_id, admission_year, current_semester, `rank`) VALUES
('2021CS001','Arjun Sharma',   'arjun@au.edu',  1,1,2021,3,'5 / 120'),
('2021CS002','Priya Menon',    'priya@au.edu',  1,1,2021,3,'1 / 120'),
('2021EC003','Rahul Verma',    'rahul@vtu.edu', 2,4,2021,4,'12 / 90'),
('2021ME004','Sneha Rao',      'sneha@jntu.edu',3,7,2021,5,'8 / 80'),
('2021CS005','Karan Patel',    'karan@mu.edu',  4,8,2021,2,'N/A'),
('2021IT006','Divya Kumar',    'divya@du.edu',  5,10,2021,6,'3 / 110');

INSERT INTO results (student_id, university_id, subject_id, semester, year, internal_marks, external_marks) VALUES
(1,1,1,3,2023,45,42),(1,1,2,3,2023,40,38),(1,1,3,3,2023,48,47),
(1,1,4,3,2023,42,41),(1,1,5,3,2023,46,44),(1,1,6,3,2023,38,41),
(2,1,1,3,2023,48,44),(2,1,2,3,2023,47,45),(2,1,3,3,2023,49,48),
(2,1,4,3,2023,46,46),(2,1,5,3,2023,48,47),(2,1,6,3,2023,45,44),
(3,2,7,4,2023,38,36),(4,3,8,5,2023,30,31),(5,4,9,2,2022,15,20),
(6,5,10,6,2023,49,46);
