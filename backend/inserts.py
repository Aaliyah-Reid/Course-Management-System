from faker import Faker
import random
from datetime import datetime, timedelta
import mysql.connector
# import bcrypt
from typing import List, Dict, Set
import time

# Initialize Faker
fake = Faker()

# Database connection
db_config = {
    'host': 'localhost',
    'user': 'root',  # Replace with your MySQL username
    'password': '',  # Replace with your MySQL password
    'database': 'cms_db'  # Replace with your database name
}

def connect_db():
    return mysql.connector.connect(**db_config)

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def generate_users(num_users: int, role: str) -> List[int]:
    """Generate users and return their IDs"""
    conn = connect_db()
    cursor = conn.cursor()
    user_ids = []
    
    try:
        for _ in range(num_users):
            # Generate user data
            first_name = fake.first_name()
            last_name = fake.last_name()
            password = hash_password("password123")  # Default password for all users
            
            # Insert into User table
            cursor.execute(
                "INSERT INTO User (FirstName, LastName, Password) VALUES (%s, %s, %s)",
                (first_name, last_name, password)
            )
            user_id = cursor.lastrowid
            user_ids.append(user_id)
            
            # Insert into role-specific table
            if role == 'student':
                cursor.execute("INSERT INTO Student (StudentID) VALUES (%s)", (user_id,))
            elif role == 'lecturer':
                cursor.execute("INSERT INTO Lecturer (LecturerID) VALUES (%s)", (user_id,))
            elif role == 'admin':
                cursor.execute("INSERT INTO Admin (AdminID) VALUES (%s)", (user_id,))
            
            # Commit every 1000 insertions to avoid memory issues
            if len(user_ids) % 1000 == 0:
                conn.commit()
                print(f"Inserted {len(user_ids)} {role}s...")
        
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    
    return user_ids

def generate_courses(num_courses: int, admin_ids: List[int]) -> List[str]:
    """Generate courses and return their course codes"""
    conn = connect_db()
    cursor = conn.cursor()
    course_codes = []
    
    try:
        for i in range(num_courses):
            course_code = f"CSE{str(i+1).zfill(3)}"  # Generate course codes like CSE001, CSE002, etc.
            course_name = fake.catch_phrase()
            admin_id = random.choice(admin_ids)
            
            cursor.execute(
                "INSERT INTO Course (CourseCode, CourseName, AdminID) VALUES (%s, %s, %s)",
                (course_code, course_name, admin_id)
            )
            course_codes.append(course_code)
        
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    
    return course_codes

def assign_courses_to_lecturers(course_codes: List[str], lecturer_ids: List[int]) -> Dict[str, int]:
    """Assign courses to lecturers ensuring constraints are met"""
    courses_per_lecturer: Dict[int, List[str]] = {lid: [] for lid in lecturer_ids}
    course_to_lecturer: Dict[str, int] = {}
    
    # First pass: ensure each lecturer gets at least 1 course
    for lid in lecturer_ids:
        course = random.choice([c for c in course_codes if c not in course_to_lecturer])
        courses_per_lecturer[lid].append(course)
        course_to_lecturer[course] = lid
    
    # Second pass: assign remaining courses
    remaining_courses = [c for c in course_codes if c not in course_to_lecturer]
    for course in remaining_courses:
        eligible_lecturers = [lid for lid in lecturer_ids if len(courses_per_lecturer[lid]) < 5]
        if not eligible_lecturers:
            raise Exception("Not enough lecturers to satisfy course distribution constraints")
        
        chosen_lecturer = random.choice(eligible_lecturers)
        courses_per_lecturer[chosen_lecturer].append(course)
        course_to_lecturer[course] = chosen_lecturer
    
    return course_to_lecturer

def assign_students_to_courses(student_ids: List[int], course_codes: List[str]):
    """Assign students to courses ensuring all constraints are met"""
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Create a temporary table for course enrollments
        cursor.execute("""
            CREATE TEMPORARY TABLE IF NOT EXISTS CourseEnrollment (
                StudentID INT,
                CourseCode VARCHAR(10),
                PRIMARY KEY (StudentID, CourseCode)
            )
        """)
        
        # For each student, assign 3-6 random courses
        for student_id in student_ids:
            num_courses = random.randint(3, 6)
            assigned_courses = random.sample(course_codes, num_courses)
            
            for course_code in assigned_courses:
                cursor.execute(
                    "INSERT INTO CourseEnrollment (StudentID, CourseCode) VALUES (%s, %s)",
                    (student_id, course_code)
                )
            
            # Commit every 1000 students
            if student_id % 1000 == 0:
                conn.commit()
                print(f"Assigned courses to {student_id} students...")
        
        # Verify course membership constraint (at least 10 members per course)
        cursor.execute("""
            SELECT CourseCode, COUNT(*) as student_count 
            FROM CourseEnrollment 
            GROUP BY CourseCode
            HAVING student_count < 10
        """)
        
        inadequate_courses = cursor.fetchall()
        if inadequate_courses:
            # Add more students to courses with less than 10 members
            for course_code, count in inadequate_courses:
                needed = 10 - count
                additional_students = random.sample(
                    [sid for sid in student_ids if (sid, course_code) not in cursor.execute(
                        "SELECT StudentID FROM CourseEnrollment WHERE CourseCode = %s", 
                        (course_code,)
                    ).fetchall()],
                    needed
                )
                for student_id in additional_students:
                    cursor.execute(
                        "INSERT INTO CourseEnrollment (StudentID, CourseCode) VALUES (%s, %s)",
                        (student_id, course_code)
                    )
        
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def main():
    start_time = time.time()
    print("Starting data generation...")
    
    # Generate users
    print("Generating students...")
    student_ids = generate_users(100000, 'student')
    print("Generating lecturers...")
    lecturer_ids = generate_users(50, 'lecturer')  # Adjust number based on course constraints
    print("Generating admins...")
    admin_ids = generate_users(10, 'admin')
    
    # Generate courses
    print("Generating courses...")
    course_codes = generate_courses(200, admin_ids)
    
    # Assign courses to lecturers
    print("Assigning courses to lecturers...")
    course_lecturer_mapping = assign_courses_to_lecturers(course_codes, lecturer_ids)
    
    # Assign students to courses
    print("Assigning students to courses...")
    assign_students_to_courses(student_ids, course_codes)
    
    end_time = time.time()
    print(f"Data generation completed in {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    main()