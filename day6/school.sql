-- ============================================================================
-- 1. DROP TABLES IF THEY EXIST (For clean playground reruns)
-- ============================================================================
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- ============================================================================
-- 2. CREATE TABLE STATEMENTS
-- ============================================================================

-- Students Table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses Table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- Enrolments Join Table (with composite UNIQUE constraint)
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id) -- Prevents duplicate enrolments
);

-- ============================================================================
-- 3. INSERT SAMPLE DATA (3 Students, 3 Courses, 5 Enrolments)
-- ============================================================================

INSERT INTO students (name, email) VALUES 
('Alice Smith', 'alice@example.com'),
('Bob Jones', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com'),
('Diana Prince', 'diana@example.com'); -- Added 4th student to demonstrate NO enrolments query

INSERT INTO courses (title, code) VALUES 
('Web Foundations', 'CS-101'),
('Database Systems', 'CS-102'),
('JavaScript Basics', 'CS-103');

INSERT INTO enrolments (student_id, course_id, grade) VALUES 
(1, 1, 'A'), -- Alice in Web Foundations
(1, 2, 'B'), -- Alice in Database Systems
(2, 1, 'C'), -- Bob in Web Foundations
(2, 3, 'A'), -- Bob in JavaScript Basics
(3, 2, 'B'); -- Charlie in Database Systems

-- ============================================================================
-- 4. THE FIVE REQUIRED QUERIES
-- ============================================================================

-- Query 1: All courses for one student (by name)
SELECT c.title, c.code, e.grade 
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE s.name = 'Alice Smith';

-- Query 2: All students on one course (by course title)
SELECT s.name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE c.title = 'Web Foundations';

-- Query 3: The number of students per course
SELECT c.title, COUNT(e.enrolment_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.title;

-- Query 4: Students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update one enrolment's grade
UPDATE enrolments 
SET grade = 'A+' 
WHERE student_id = 1 AND course_id = 2;

-- Verify the update worked
SELECT s.name, c.title, e.grade 
FROM enrolments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.student_id = 1 AND c.course_id = 2;
