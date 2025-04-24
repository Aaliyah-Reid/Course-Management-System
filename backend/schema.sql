-- Active: 1739830206872@@127.0.0.1@3306@dbproj
--  User Table (Generalization)
CREATE TABLE User (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL -- Store hashed passwords in a real application
);

--  Student Table (Specialization of User)
CREATE TABLE Student (
    StudentID INT PRIMARY KEY, -- Uses the same ID as the User table
    FOREIGN KEY (StudentID) REFERENCES User(UserID) ON DELETE CASCADE -- If a User is deleted, the Student role is also deleted
);

--  Admin Table (Specialization of User)
CREATE TABLE Admin (
    AdminID INT PRIMARY KEY, -- Uses the same ID as the User table
    FOREIGN KEY (AdminID) REFERENCES User(UserID) ON DELETE CASCADE
);

--  Lecturer Table (Specialization of User)
CREATE TABLE Lecturer (
    LecturerID INT PRIMARY KEY, -- Uses the same ID as the User table
    FOREIGN KEY (LecturerID) REFERENCES User(UserID) ON DELETE CASCADE
);

--  Course Table
CREATE TABLE Course (
    CourseID INT AUTO_INCREMENT PRIMARY KEY,
    CourseCode VARCHAR(20) NOT NUll, 
    CourseName VARCHAR(255) NOT NULL,
    LecturerID INT NOT NULL,
    AdminID INT NOT NULL, -- The Admin responsible for managing the course setup
    FOREIGN KEY (AdminID) REFERENCES Admin(AdminID) ON DELETE RESTRICT -- Prevent deleting an Admin if they manage courses
);

-- Assignment Table
CREATE TABLE Assignment (
    AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
    CourseCode VARCHAR(10) NOT NULL,
    Content TEXT, 
    DueDate DATETIME
    -- FOREIGN KEY (CourseCode) REFERENCES Course(CourseCode) ON DELETE CASCADE -- If Course is deleted, delete its Assignments
);

-- CalendarEvents Table
CREATE TABLE CalendarEvents (
    EventID INT AUTO_INCREMENT PRIMARY KEY,
    CourseCode VARCHAR(10) NOT NULL,
    EventName VARCHAR(255) NOT NULL,
    EventDate DATETIME NOT NULL,
    CreatedBy INT NOT NULL -- UserID of the person who created the event
    -- FOREIGN KEY (CourseCode) REFERENCES Course(CourseCode) ON DELETE CASCADE, -- If Course is deleted, delete its Events
    -- FOREIGN KEY (CreatedBy) REFERENCES User(UserID) ON DELETE RESTRICT -- Keep event even if user deleted? Or SET NULL? RESTRICT is safer.
);

-- DiscussionForum Table
CREATE TABLE DiscussionForum (
    ForumID INT AUTO_INCREMENT PRIMARY KEY,
    CourseCode VARCHAR(10) NOT NULL,
    ForumName VARCHAR(255) NOT NULL
    -- FOREIGN KEY (CourseCode) REFERENCES Course(CourseCode) ON DELETE CASCADE -- If Course is deleted, delete its Forums
);

-- DiscussionThread Table
CREATE TABLE DiscussionThread (
    ThreadID INT AUTO_INCREMENT PRIMARY KEY,
    ForumID INT NOT NULL,
    ThreadTitle VARCHAR(255) NOT NULL,
    Content TEXT,
    CreatedBy INT NOT NULL -- UserID of the thread creator
    -- FOREIGN KEY (ForumID) REFERENCES DiscussionForum(ForumID) ON DELETE CASCADE, -- If Forum is deleted, delete its Threads
    -- FOREIGN KEY (CreatedBy) REFERENCES User(UserID) ON DELETE RESTRICT -- Or SET NULL if user deleted
);

--  Reply Table
CREATE TABLE Reply (
    ReplyID INT AUTO_INCREMENT PRIMARY KEY,
    ThreadID INT NOT NULL,
    ParentReplyID INT NULL, -- NULL if it's a direct reply to the thread, otherwise references another ReplyID
    Content TEXT NOT NULL,
    CreatedBy INT NOT NULL, -- UserID of the replier
    ReplyDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ThreadID) REFERENCES DiscussionThread(ThreadID) ON DELETE CASCADE, -- If Thread is deleted, delete its Replies
    FOREIGN KEY (ParentReplyID) REFERENCES Reply(ReplyID) ON DELETE CASCADE, -- If a parent reply is deleted, delete child replies
    FOREIGN KEY (CreatedBy) REFERENCES User(UserID) ON DELETE RESTRICT -- Or SET NULL if user deleted
);

--  Section Table (Course Sections/Modules)
CREATE TABLE Section (
    SectionID INT AUTO_INCREMENT PRIMARY KEY,
    CourseCode VARCHAR(10) NOT NULL,
    SectionTitle VARCHAR(255) NOT NULL
    -- FOREIGN KEY (CourseCode) REFERENCES Course(CourseCode) ON DELETE CASCADE -- If Course is deleted, delete its Sections
);

--  SectionItem Table (Content within a Section)
CREATE TABLE SectionItem (
    SectionItemID INT AUTO_INCREMENT PRIMARY KEY,
    SectionID INT NOT NULL,
    ItemTitle VARCHAR(255) NOT NULL,
    Link VARCHAR(2083), -- For external links
    Filename VARCHAR(255), -- For uploaded files
    Description TEXT
    -- FOREIGN KEY (SectionID) REFERENCES Section(SectionID) ON DELETE CASCADE -- If Section is deleted, delete its Items
);

--  Submission Table (Associative Entity for Student+Assignment)
CREATE TABLE Submission (
    SubmissionID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID INT NOT NULL,
    AssignmentID INT NOT NULL,
    SubmissionContent TEXT, -- Could be text, or a path to an uploaded file
    UploadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (StudentID, AssignmentID), -- A student typically submits only once per assignment
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID) ON DELETE CASCADE, -- If Student record deleted, remove their submissions
    FOREIGN KEY (AssignmentID) REFERENCES Assignment(AssignmentID) ON DELETE CASCADE -- If Assignment deleted, remove its submissions
);

--  Grade Table
CREATE TABLE Grade (
    SubmissionID INT PRIMARY KEY, -- Each submission gets exactly one grade entry
    LecturerID INT NOT NULL, -- The Lecturer who graded it
    Score DECIMAL(5, 2), -- e.g., Allows scores like 95.50 or 100.00
    FOREIGN KEY (SubmissionID) REFERENCES Submission(SubmissionID) ON DELETE CASCADE, -- If Submission deleted, grade is irrelevant
    FOREIGN KEY (LecturerID) REFERENCES Lecturer(LecturerID) ON DELETE RESTRICT -- Prevent deleting lecturer if they have graded submissions (or SET NULL)
);
CREATE TABLE Enrol (
    CourseCode varchar(255) NOT NULL,
    UserID int NOT NULL, 
    PRIMARY KEY (CourseCode, UserID),
	FOREIGN KEY (UserID) REFERENCES User(UserID)
	-- FOREIGN KEY (CourseCode) REFERENCES Course(CourseCode)

);
