from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, DECIMAL, TIMESTAMP, func, UniqueConstraint, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from .database import Base
import enum

# User model
class User(Base):
    __tablename__ = "User"

    UserID = Column(Integer, primary_key=True, autoincrement=True)
    FirstName = Column(String(100), nullable=False)
    LastName = Column(String(100), nullable=False)
    Password = Column(String(255), nullable=False)
    UserType = Column(Enum('student', 'lecturer', 'admin', name='usertype'), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lecturer = relationship("Lecturer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_events = relationship("CalendarEvents", back_populates="creator")
    created_threads = relationship("DiscussionThread", back_populates="creator")
    created_replies = relationship("Reply", back_populates="creator")
    thread_votes = relationship("ThreadVote", back_populates="user")
    reply_votes = relationship("ReplyVote", back_populates="user")
    enrollments = relationship("Enrol", back_populates="user")

# Student model
class Student(Base):
    __tablename__ = "Student"

    StudentID = Column(Integer, ForeignKey('User.UserID', ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    user = relationship("User", back_populates="student")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")

# Admin model
class Admin(Base):
    __tablename__ = "Admin"

    AdminID = Column(Integer, ForeignKey('User.UserID', ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    user = relationship("User", back_populates="admin")
    courses = relationship("Course", back_populates="admin")

# Lecturer model
class Lecturer(Base):
    __tablename__ = "Lecturer"

    LecturerID = Column(Integer, ForeignKey('User.UserID', ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    user = relationship("User", back_populates="lecturer")
    courses = relationship("Course", back_populates="lecturer")
    grades = relationship("Grade", back_populates="lecturer")

# Course model
class Course(Base):
    __tablename__ = "Course"

    CourseCode = Column(String(8), primary_key=True)
    CourseName = Column(String(255), nullable=False)
    LecturerID = Column(Integer, ForeignKey('Lecturer.LecturerID', ondelete="RESTRICT"), nullable=False)
    AdminID = Column(Integer, ForeignKey('Admin.AdminID', ondelete="RESTRICT"), nullable=False)
    
    # Relationships
    lecturer = relationship("Lecturer", back_populates="courses")
    admin = relationship("Admin", back_populates="courses")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")
    events = relationship("CalendarEvents", back_populates="course", cascade="all, delete-orphan")
    forums = relationship("DiscussionForum", back_populates="course", cascade="all, delete-orphan")
    sections = relationship("Section", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrol", back_populates="course", cascade="all, delete-orphan")

# Assignment model
class Assignment(Base):
    __tablename__ = "Assignment"

    AssignmentID = Column(Integer, primary_key=True, autoincrement=True)
    CourseCode = Column(String(8), ForeignKey('Course.CourseCode', ondelete="CASCADE"), nullable=False)
    Content = Column(Text)
    DueDate = Column(DateTime)
    
    # Relationships
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")

# CalendarEvents model
class CalendarEvents(Base):
    __tablename__ = "CalendarEvents"

    EventID = Column(Integer, primary_key=True, autoincrement=True)
    CourseCode = Column(String(8), ForeignKey('Course.CourseCode', ondelete="CASCADE"), nullable=False)
    EventName = Column(String(255), nullable=False)
    EventDate = Column(DateTime, nullable=False)
    CreatedBy = Column(Integer, ForeignKey('User.UserID', ondelete="RESTRICT"), nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="events")
    creator = relationship("User", back_populates="created_events")

# DiscussionForum model
class DiscussionForum(Base):
    __tablename__ = "DiscussionForum"

    ForumID = Column(Integer, primary_key=True, autoincrement=True)
    CourseCode = Column(String(8), ForeignKey('Course.CourseCode', ondelete="CASCADE"), nullable=False)
    ForumName = Column(String(255), nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="forums")
    threads = relationship("DiscussionThread", back_populates="forum", cascade="all, delete-orphan")

# DiscussionThread model
class DiscussionThread(Base):
    __tablename__ = "DiscussionThread"

    ThreadID = Column(Integer, primary_key=True, autoincrement=True)
    ForumID = Column(Integer, ForeignKey('DiscussionForum.ForumID', ondelete="CASCADE"), nullable=False)
    ThreadTitle = Column(String(255), nullable=False)
    Content = Column(Text)
    CreatedBy = Column(Integer, ForeignKey('User.UserID', ondelete="RESTRICT"), nullable=False)
    CreatedAt = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    UpdatedAt = Column(DateTime, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    forum = relationship("DiscussionForum", back_populates="threads")
    creator = relationship("User", back_populates="created_threads")
    replies = relationship("Reply", back_populates="thread", cascade="all, delete-orphan")
    votes = relationship("ThreadVote", back_populates="thread", cascade="all, delete-orphan")

# Reply model
class Reply(Base):
    __tablename__ = "Reply"

    ReplyID = Column(Integer, primary_key=True, autoincrement=True)
    ThreadID = Column(Integer, ForeignKey('DiscussionThread.ThreadID', ondelete="CASCADE"), nullable=False)
    ParentReplyID = Column(Integer, ForeignKey('Reply.ReplyID', ondelete="CASCADE"), nullable=True)
    Content = Column(Text, nullable=False)
    CreatedBy = Column(Integer, ForeignKey('User.UserID', ondelete="RESTRICT"), nullable=False)
    ReplyDate = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    
    # Relationships
    thread = relationship("DiscussionThread", back_populates="replies")
    parent = relationship("Reply", remote_side=[ReplyID], backref="children")
    creator = relationship("User", back_populates="created_replies")
    votes = relationship("ReplyVote", back_populates="reply", cascade="all, delete-orphan")

# ThreadVote model
class ThreadVote(Base):
    __tablename__ = "ThreadVote"

    ThreadID = Column(Integer, ForeignKey('DiscussionThread.ThreadID', ondelete="CASCADE"), primary_key=True)
    UserID = Column(Integer, ForeignKey('User.UserID', ondelete="CASCADE"), primary_key=True)
    Vote = Column(SmallInteger, nullable=False)  # 1 for upvote, -1 for downvote
    
    # Relationships
    thread = relationship("DiscussionThread", back_populates="votes")
    user = relationship("User", back_populates="thread_votes")

# ReplyVote model
class ReplyVote(Base):
    __tablename__ = "ReplyVote"

    ReplyID = Column(Integer, ForeignKey('Reply.ReplyID', ondelete="CASCADE"), primary_key=True)
    UserID = Column(Integer, ForeignKey('User.UserID', ondelete="CASCADE"), primary_key=True)
    Vote = Column(SmallInteger, nullable=False)  # 1 for upvote, -1 for downvote
    
    # Relationships
    reply = relationship("Reply", back_populates="votes")
    user = relationship("User", back_populates="reply_votes")

# Section model
class Section(Base):
    __tablename__ = "Section"

    SectionID = Column(Integer, primary_key=True, autoincrement=True)
    CourseCode = Column(String(8), ForeignKey('Course.CourseCode', ondelete="CASCADE"), nullable=False)
    SectionTitle = Column(String(255), nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="sections")
    items = relationship("SectionItem", back_populates="section", cascade="all, delete-orphan")

# SectionItem model
class SectionItem(Base):
    __tablename__ = "SectionItem"

    SectionItemID = Column(Integer, primary_key=True, autoincrement=True)
    SectionID = Column(Integer, ForeignKey('Section.SectionID', ondelete="CASCADE"), nullable=False)
    ItemTitle = Column(String(255), nullable=False)
    Link = Column(String(2083))
    Filename = Column(String(255))
    Description = Column(Text)
    
    # Relationships
    section = relationship("Section", back_populates="items")

# Submission model
class Submission(Base):
    __tablename__ = "Submission"

    SubmissionID = Column(Integer, primary_key=True, autoincrement=True)
    StudentID = Column(Integer, ForeignKey('Student.StudentID', ondelete="CASCADE"), nullable=False)
    AssignmentID = Column(Integer, ForeignKey('Assignment.AssignmentID', ondelete="CASCADE"), nullable=False)
    SubmissionContent = Column(Text)
    UploadDate = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('StudentID', 'AssignmentID', name='uq_student_assignment'),)
    
    # Relationships
    student = relationship("Student", back_populates="submissions")
    assignment = relationship("Assignment", back_populates="submissions")
    grade = relationship("Grade", back_populates="submission", uselist=False, cascade="all, delete-orphan")

# Grade model
class Grade(Base):
    __tablename__ = "Grade"

    SubmissionID = Column(Integer, ForeignKey('Submission.SubmissionID', ondelete="CASCADE"), primary_key=True)
    LecturerID = Column(Integer, ForeignKey('Lecturer.LecturerID', ondelete="RESTRICT"), nullable=False)
    Score = Column(DECIMAL(5, 2))
    
    # Relationships
    submission = relationship("Submission", back_populates="grade")
    lecturer = relationship("Lecturer", back_populates="grades")

# Enrol model
class Enrol(Base):
    __tablename__ = "Enrol"

    CourseCode = Column(String(8), ForeignKey('Course.CourseCode'), primary_key=True)
    UserID = Column(Integer, ForeignKey('User.UserID'), primary_key=True)
    
    # Relationships
    course = relationship("Course", back_populates="enrollments")
    user = relationship("User", back_populates="enrollments")
