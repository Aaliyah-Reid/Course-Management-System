"""
Migrate data from existing MySQL database to SQLAlchemy models.
This script will:
1. Read data from the existing database using direct MySQL queries
2. Insert the data into the database using SQLAlchemy models
"""

import mysql.connector
from sqlalchemy.orm import Session
from models.database import engine, get_db
from models.models import User, Student, Lecturer, Admin, Course, Assignment, CalendarEvents
from models.models import DiscussionForum, DiscussionThread, Reply, ThreadVote, ReplyVote
from models.models import Section, SectionItem, Submission, Grade, Enrol
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def get_mysql_connection():
    """Get a connection to the MySQL database"""
    try:
        db_host = os.getenv('DB_HOST')
        db_username = os.getenv('DB_USERNAME')
        db_password = os.getenv('DB_PASSWORD')
        db_name = os.getenv('DB_NAME')

        conn = mysql.connector.connect(
            host=db_host,
            user=db_username,
            password=db_password,
            database=db_name
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None

def migrate_users():
    """Migrate users from MySQL to SQLAlchemy"""
    print("Migrating users...")
    conn = get_mysql_connection()
    if not conn:
        return False
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM User")
    users = cursor.fetchall()
    
    with Session(engine) as session:
        for user in users:
            new_user = User(
                UserID=user['UserID'],
                FirstName=user['FirstName'],
                LastName=user['LastName'],
                Password=user['Password'],
                UserType=user['UserType']
            )
            session.add(new_user)
        
        try:
            session.commit()
            print(f"Migrated {len(users)} users")
            return True
        except Exception as e:
            session.rollback()
            print(f"Error migrating users: {e}")
            return False
    
    cursor.close()
    conn.close()

def migrate_students():
    """Migrate students from MySQL to SQLAlchemy"""
    print("Migrating students...")
    conn = get_mysql_connection()
    if not conn:
        return False
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Student")
    students = cursor.fetchall()
    
    with Session(engine) as session:
        for student in students:
            new_student = Student(
                StudentID=student['StudentID']
            )
            session.add(new_student)
        
        try:
            session.commit()
            print(f"Migrated {len(students)} students")
            return True
        except Exception as e:
            session.rollback()
            print(f"Error migrating students: {e}")
            return False
    
    cursor.close()
    conn.close()

def migrate_lecturers():
    """Migrate lecturers from MySQL to SQLAlchemy"""
    print("Migrating lecturers...")
    conn = get_mysql_connection()
    if not conn:
        return False
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Lecturer")
    lecturers = cursor.fetchall()
    
    with Session(engine) as session:
        for lecturer in lecturers:
            new_lecturer = Lecturer(
                LecturerID=lecturer['LecturerID']
            )
            session.add(new_lecturer)
        
        try:
            session.commit()
            print(f"Migrated {len(lecturers)} lecturers")
            return True
        except Exception as e:
            session.rollback()
            print(f"Error migrating lecturers: {e}")
            return False
    
    cursor.close()
    conn.close()

def migrate_admins():
    """Migrate admins from MySQL to SQLAlchemy"""
    print("Migrating admins...")
    conn = get_mysql_connection()
    if not conn:
        return False
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Admin")
    admins = cursor.fetchall()
    
    with Session(engine) as session:
        for admin in admins:
            new_admin = Admin(
                AdminID=admin['AdminID']
            )
            session.add(new_admin)
        
        try:
            session.commit()
            print(f"Migrated {len(admins)} admins")
            return True
        except Exception as e:
            session.rollback()
            print(f"Error migrating admins: {e}")
            return False
    
    cursor.close()
    conn.close()

def migrate_courses():
    """Migrate courses from MySQL to SQLAlchemy"""
    print("Migrating courses...")
    conn = get_mysql_connection()
    if not conn:
        return False
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Course")
    courses = cursor.fetchall()
    
    with Session(engine) as session:
        for course in courses:
            new_course = Course(
                CourseCode=course['CourseCode'],
                CourseName=course['CourseName'],
                LecturerID=course['LecturerID'],
                AdminID=course['AdminID']
            )
            session.add(new_course)
        
        try:
            session.commit()
            print(f"Migrated {len(courses)} courses")
            return True
        except Exception as e:
            session.rollback()
            print(f"Error migrating courses: {e}")
            return False
    
    cursor.close()
    conn.close()

def migrate_assignments():
    """Migrate assignments from MySQL to SQLAlchemy"""
    print("Migrating assignments...")
    conn = get_mysql_connection()
    if not conn:
        return False
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Assignment")
    assignments = cursor.fetchall()
    
    with Session(engine) as session:
        for assignment in assignments:
            new_assignment = Assignment(
                AssignmentID=assignment['AssignmentID'],
                CourseCode=assignment['CourseCode'],
                Content=assignment['Content'],
                DueDate=assignment['DueDate']
            )
            session.add(new_assignment)
        
        try:
            session.commit()
            print(f"Migrated {len(assignments)} assignments")
            return True
        except Exception as e:
            session.rollback()
            print(f"Error migrating assignments: {e}")
            return False
    
    cursor.close()
    conn.close()

# Add similar functions for other tables...

def migrate_all():
    """Migrate all data from MySQL to SQLAlchemy"""
    print("Starting data migration...")
    
    # Order matters due to foreign key constraints
    migration_functions = [
        migrate_users,
        migrate_students,
        migrate_lecturers,
        migrate_admins,
        migrate_courses,
        migrate_assignments,
        # Add other migration functions here
    ]
    
    success = True
    for migrate_func in migration_functions:
        if not migrate_func():
            success = False
            print(f"Migration failed at {migrate_func.__name__}")
            break
    
    if success:
        print("All data migrated successfully!")
    else:
        print("Migration failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    migrate_all()
