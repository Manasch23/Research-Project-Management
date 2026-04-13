-- University Research Project Management System
-- MySQL Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS university_research;
USE university_research;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    head_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'coordinator', 'admin') NOT NULL,
    department VARCHAR(255),
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    proposal_id VARCHAR(36),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'not_started', 'in_progress', 'on_hold', 'completed', 'cancelled') DEFAULT 'open',
    progress INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    lead_researcher VARCHAR(36),
    faculty_advisor VARCHAR(36) NOT NULL,
    department VARCHAR(255) NOT NULL,
    max_team_size INT DEFAULT 5,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_researcher) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_advisor) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_department (department),
    INDEX idx_faculty_advisor (faculty_advisor)
);

-- Project team members junction table
CREATE TABLE IF NOT EXISTS project_team_members (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_member (project_id, user_id)
);

-- Project milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36),
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    objectives TEXT,
    methodology TEXT,
    timeline VARCHAR(255),
    budget DECIMAL(12, 2) DEFAULT 0,
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_required') DEFAULT 'draft',
    submitted_by VARCHAR(36) NOT NULL,
    department VARCHAR(255) NOT NULL,
    faculty_advisor VARCHAR(36),
    reviewed_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_advisor) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_submitted_by (submitted_by),
    INDEX idx_department (department)
);

-- Review comments table
CREATE TABLE IF NOT EXISTS review_comments (
    id VARCHAR(36) PRIMARY KEY,
    proposal_id VARCHAR(36) NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    applicant_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    message TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_application (project_id, applicant_id)
);

-- Progress updates table
CREATE TABLE IF NOT EXISTS progress_updates (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    progress_percentage INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- INSERT SEED DATA
-- =============================================

-- Insert departments
INSERT INTO departments (id, name, description, head_name) VALUES
('dept-1', 'Computer Science', 'Department of Computer Science and Engineering', 'Dr. Robert Chen'),
('dept-2', 'Physics', 'Department of Physics and Applied Sciences', 'Dr. Maria Santos'),
('dept-3', 'Biology', 'Department of Biological Sciences', 'Dr. James Wilson'),
('dept-4', 'Chemistry', 'Department of Chemistry and Biochemistry', 'Dr. Lisa Park'),
('dept-5', 'Mathematics', 'Department of Mathematics and Statistics', 'Dr. Alan Foster'),
('dept-6', 'Engineering', 'Department of Mechanical and Electrical Engineering', 'Dr. Sarah Mitchell');

-- Insert admin user (password: admin123)
INSERT INTO users (id, email, password, name, role, department) VALUES
('admin-1', 'admin@university.edu', '$2b$10$hashedpassword', 'System Administrator', 'admin', 'Administration');

-- Insert 10 faculty members (password: faculty123)
INSERT INTO users (id, email, password, name, role, department) VALUES
('faculty-1', 'dr.williams@university.edu', '$2b$10$hashedpassword', 'Dr. Sarah Williams', 'faculty', 'Computer Science'),
('faculty-2', 'dr.johnson@university.edu', '$2b$10$hashedpassword', 'Dr. Michael Johnson', 'faculty', 'Computer Science'),
('faculty-3', 'dr.martinez@university.edu', '$2b$10$hashedpassword', 'Dr. Elena Martinez', 'faculty', 'Physics'),
('faculty-4', 'dr.thompson@university.edu', '$2b$10$hashedpassword', 'Dr. James Thompson', 'faculty', 'Biology'),
('faculty-5', 'dr.anderson@university.edu', '$2b$10$hashedpassword', 'Dr. Patricia Anderson', 'faculty', 'Chemistry'),
('faculty-6', 'dr.taylor@university.edu', '$2b$10$hashedpassword', 'Dr. Richard Taylor', 'faculty', 'Mathematics'),
('faculty-7', 'dr.brown@university.edu', '$2b$10$hashedpassword', 'Dr. Jennifer Brown', 'faculty', 'Engineering'),
('faculty-8', 'dr.davis@university.edu', '$2b$10$hashedpassword', 'Dr. Christopher Davis', 'faculty', 'Computer Science'),
('faculty-9', 'dr.miller@university.edu', '$2b$10$hashedpassword', 'Dr. Amanda Miller', 'faculty', 'Physics'),
('faculty-10', 'dr.wilson@university.edu', '$2b$10$hashedpassword', 'Dr. Robert Wilson', 'faculty', 'Biology');

-- Insert coordinator (password: coord123)
INSERT INTO users (id, email, password, name, role, department) VALUES
('coord-1', 'dr.chen@university.edu', '$2b$10$hashedpassword', 'Dr. Robert Chen', 'coordinator', 'Computer Science');

-- Insert sample students (password: student123)
INSERT INTO users (id, email, password, name, role, department) VALUES
('student-1', 'john.smith@university.edu', '$2b$10$hashedpassword', 'John Smith', 'student', 'Computer Science'),
('student-2', 'emily.davis@university.edu', '$2b$10$hashedpassword', 'Emily Davis', 'student', 'Physics'),
('student-3', 'michael.brown@university.edu', '$2b$10$hashedpassword', 'Michael Brown', 'student', 'Biology');

-- Insert research projects (open for applications)
INSERT INTO projects (id, proposal_id, title, description, status, progress, start_date, end_date, lead_researcher, faculty_advisor, department, max_team_size, requirements) VALUES
('proj-1', NULL, 'Machine Learning for Medical Diagnosis', 
 'Developing advanced machine learning algorithms for early disease detection using medical imaging data. This project aims to improve diagnostic accuracy and reduce healthcare costs through AI-assisted analysis.',
 'open', 0, '2026-02-01', '2026-12-31', NULL, 'faculty-1', 'Computer Science', 5,
 'Python programming, Machine Learning basics, Interest in healthcare applications'),

('proj-2', NULL, 'Quantum Computing Simulation Framework',
 'Building a comprehensive simulation framework for quantum computing algorithms. The project will create tools for researchers to test quantum algorithms before implementation on actual quantum hardware.',
 'open', 0, '2026-03-01', '2027-02-28', NULL, 'faculty-3', 'Physics', 4,
 'Quantum mechanics fundamentals, Linear algebra, Python or C++ programming'),

('proj-3', NULL, 'Sustainable Urban Agriculture Systems',
 'Researching innovative approaches to urban farming including vertical gardens, hydroponics, and smart irrigation systems for sustainable food production in metropolitan areas.',
 'open', 0, '2026-02-15', '2026-11-30', NULL, 'faculty-4', 'Biology', 6,
 'Biology background, Interest in sustainability, Data analysis skills'),

('proj-4', NULL, 'Advanced Cryptographic Protocols',
 'Developing next-generation cryptographic protocols for secure communication in the post-quantum era. Focus on lattice-based cryptography and zero-knowledge proofs.',
 'open', 0, '2026-04-01', '2027-03-31', NULL, 'faculty-2', 'Computer Science', 4,
 'Cryptography basics, Strong mathematics background, Programming skills'),

('proj-5', NULL, 'Renewable Energy Storage Solutions',
 'Investigating novel materials and methods for efficient energy storage from renewable sources. Focus on advanced battery technologies and hydrogen storage systems.',
 'open', 0, '2026-03-15', '2027-01-31', NULL, 'faculty-5', 'Chemistry', 5,
 'Chemistry background, Lab experience, Interest in clean energy'),

('proj-6', NULL, 'Natural Language Processing for Accessibility',
 'Creating NLP tools to improve digital accessibility for people with disabilities. Including real-time captioning, text simplification, and voice-controlled interfaces.',
 'in_progress', 25, '2026-01-01', '2026-10-31', 'student-1', 'faculty-8', 'Computer Science', 4,
 'NLP knowledge, Python programming, Accessibility awareness'),

('proj-7', NULL, 'Climate Change Impact Modeling',
 'Developing mathematical models to predict and visualize the impact of climate change on local ecosystems. Integration of satellite data and ground observations.',
 'in_progress', 40, '2025-10-01', '2026-09-30', NULL, 'faculty-6', 'Mathematics', 5,
 'Statistical modeling, Climate science interest, GIS tools familiarity'),

('proj-8', NULL, 'Robotics for Elderly Care',
 'Designing and prototyping assistive robots for elderly care facilities. Focus on safety, user-friendly interfaces, and integration with healthcare monitoring systems.',
 'open', 0, '2026-05-01', '2027-04-30', NULL, 'faculty-7', 'Engineering', 5,
 'Robotics basics, Electronics, Programming (Python/ROS)'),

('proj-9', NULL, 'Gene Expression Analysis in Cancer Research',
 'Using bioinformatics tools to analyze gene expression patterns in cancer cells. Aim to identify potential therapeutic targets and biomarkers for early detection.',
 'in_progress', 60, '2025-08-01', '2026-07-31', NULL, 'faculty-10', 'Biology', 4,
 'Bioinformatics, Statistics, Molecular biology background'),

('proj-10', NULL, 'Blockchain for Academic Credentials',
 'Implementing a blockchain-based system for verifying and sharing academic credentials securely. Focus on privacy, interoperability, and user experience.',
 'open', 0, '2026-04-15', '2026-12-15', NULL, 'faculty-2', 'Computer Science', 4,
 'Blockchain fundamentals, Web development, Database design');

-- Insert milestones for in-progress projects
INSERT INTO milestones (id, project_id, title, description, due_date, status) VALUES
('mile-1', 'proj-6', 'Literature Review', 'Complete comprehensive review of existing NLP accessibility tools', '2026-02-01', 'completed'),
('mile-2', 'proj-6', 'Prototype Development', 'Build initial prototype of captioning system', '2026-04-15', 'in_progress'),
('mile-3', 'proj-6', 'User Testing Phase 1', 'Conduct initial user testing with target demographics', '2026-07-01', 'pending'),
('mile-4', 'proj-6', 'Final Implementation', 'Complete final system with all features', '2026-09-30', 'pending'),

('mile-5', 'proj-7', 'Data Collection', 'Gather satellite and ground observation data', '2025-12-01', 'completed'),
('mile-6', 'proj-7', 'Model Development', 'Develop initial climate prediction models', '2026-03-01', 'completed'),
('mile-7', 'proj-7', 'Validation Phase', 'Validate models against historical data', '2026-06-01', 'in_progress'),
('mile-8', 'proj-7', 'Publication', 'Prepare and submit research paper', '2026-08-31', 'pending'),

('mile-9', 'proj-9', 'Sample Collection', 'Collect and process cancer cell samples', '2025-10-01', 'completed'),
('mile-10', 'proj-9', 'Sequencing', 'Complete gene sequencing for all samples', '2026-01-15', 'completed'),
('mile-11', 'proj-9', 'Data Analysis', 'Analyze expression patterns and identify markers', '2026-04-30', 'completed'),
('mile-12', 'proj-9', 'Validation', 'Validate findings with independent samples', '2026-06-30', 'in_progress');

-- Add team member to project
INSERT INTO project_team_members (id, project_id, user_id) VALUES
('tm-1', 'proj-6', 'student-1');
