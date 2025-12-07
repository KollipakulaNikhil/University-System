-- Users Table (Students, Instructors, Admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programs Table
CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    code VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    credits INT NOT NULL,
    program_id INT,
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL
);

-- Timeslots Table
CREATE TABLE IF NOT EXISTS timeslots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE(day, start_time, end_time)
);

-- Sections Table
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    section_number INT NOT NULL,
    instructor_id INT,
    room_id INT,
    timeslot_id INT,
    capacity INT NOT NULL,
    enrolled INT DEFAULT 0,
    FOREIGN KEY (course_code) REFERENCES courses(code),
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (timeslot_id) REFERENCES timeslots(id),
    -- Prevent double booking of rooms
    UNIQUE(room_id, timeslot_id),
    -- Prevent instructor double booking
    UNIQUE(instructor_id, timeslot_id)
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    status ENUM('enrolled', 'dropped', 'waitlisted') DEFAULT 'enrolled',
    grade VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    UNIQUE(student_id, section_id)
);

-- Waitlist Table
CREATE TABLE IF NOT EXISTS waitlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    student_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Payments Table (Simulated)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Prerequisites Table
CREATE TABLE IF NOT EXISTS prerequisites (
    course_code VARCHAR(20) NOT NULL,
    prerequisite_code VARCHAR(20) NOT NULL,
    PRIMARY KEY (course_code, prerequisite_code),
    FOREIGN KEY (course_code) REFERENCES courses(code),
    FOREIGN KEY (prerequisite_code) REFERENCES courses(code)
);

-- Indexes for Optimization
CREATE INDEX idx_course_term ON sections(course_code, term);
CREATE INDEX idx_section_availability ON sections(id, enrolled, capacity);

-- Disciplinary Reports Table
CREATE TABLE IF NOT EXISTS disciplinary_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    instructor_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    suspension_days INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Note: Run this manually if users table already exists:
-- ALTER TABLE users ADD COLUMN suspended_until TIMESTAMP NULL;
