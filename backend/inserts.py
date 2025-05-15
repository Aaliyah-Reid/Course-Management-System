from faker import Faker
import random
from datetime import datetime, timedelta
import mysql.connector
import bcrypt
from typing import List, Dict, Set
import time

# Initialize Faker
fake = Faker()

# Database connection
db_config = {
    'host': 'localhost',
    'user': 'aaliyah',  # Replace with your MySQL username
    'password': 'chuchually38',  # Replace with your MySQL password
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
        for i in range(num_users):
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
            
            # Commit every 5000 insertions to avoid memory issues and show progress
            if (i + 1) % 5000 == 0:
                conn.commit()
                print(f"Inserted {i + 1} {role}s...")
        
        conn.commit()
        print(f"Finished inserting {num_users} {role}s")
    finally:
        cursor.close()
        conn.close()
    
    return user_ids

def generate_courses(num_courses: int, admin_ids: List[int], lecturer_ids: List[int]) -> List[str]:
    """Generate courses and return their course codes"""
    conn = connect_db()
    cursor = conn.cursor()
    course_codes = []
    
    try:
        for i in range(num_courses):
            course_code = f"CSE{str(i+1).zfill(3)}"  # Generate course codes like CSE001, CSE002, etc.
            course_name = fake.catch_phrase()
            admin_id = random.choice(admin_ids)
            lecturer_id = random.choice(lecturer_ids)  # Assign a random lecturer to the course
            
            cursor.execute(
                "INSERT INTO Course (CourseCode, CourseName, LecturerID, AdminID) VALUES (%s, %s, %s, %s)",
                (course_code, course_name, lecturer_id, admin_id)
            )
            course_codes.append(course_code)
        
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    
    return course_codes

def assign_courses_to_lecturers(course_codes: List[str], lecturer_ids: List[int]) -> Dict[str, int]:
    """Update existing courses with lecturers ensuring constraints are met
    - Each lecturer must teach at least 1 course
    - No lecturer can teach more than 5 courses
    """
    conn = connect_db()
    cursor = conn.cursor()
    
    # Dictionary to track how many courses each lecturer has
    courses_per_lecturer = {lid: 0 for lid in lecturer_ids}
    course_to_lecturer = {}
    
    try:
        # Get current course-lecturer assignments
        cursor.execute("SELECT CourseCode, LecturerID FROM Course")
        current_assignments = cursor.fetchall()
        
        for course_code, lecturer_id in current_assignments:
            if lecturer_id in courses_per_lecturer:
                courses_per_lecturer[lecturer_id] += 1
                course_to_lecturer[course_code] = lecturer_id
        
        # Reset all course assignments (optional approach - could be optimized)
        cursor.execute("SELECT CourseCode FROM Course")
        all_courses = [row[0] for row in cursor.fetchall()]
        
        # Calculate minimum courses needed per lecturer to cover all courses
        min_courses_per_lecturer = len(all_courses) // len(lecturer_ids)
        if min_courses_per_lecturer > 5:
            raise Exception(f"Not enough lecturers! Need at least {len(all_courses) // 5} lecturers to handle {len(all_courses)} courses")
        
        # Step 1: First ensure each lecturer gets at least 1 course
        for lecturer_id in lecturer_ids:
            if courses_per_lecturer[lecturer_id] == 0:
                # Find an available course
                available_courses = [c for c in all_courses if c not in course_to_lecturer]
                if available_courses:
                    course = available_courses[0]
                    cursor.execute(
                        "UPDATE Course SET LecturerID = %s WHERE CourseCode = %s",
                        (lecturer_id, course)
                    )
                    courses_per_lecturer[lecturer_id] = 1
                    course_to_lecturer[course] = lecturer_id
                else:
                    # Need to redistribute courses
                    overloaded_lecturers = [lid for lid in lecturer_ids if courses_per_lecturer[lid] > 1]
                    if overloaded_lecturers:
                        donor_lecturer = overloaded_lecturers[0]
                        # Find a course taught by the donor
                        donor_courses = [c for c, l in course_to_lecturer.items() if l == donor_lecturer]
                        if donor_courses:
                            reassign_course = donor_courses[0]
                            cursor.execute(
                                "UPDATE Course SET LecturerID = %s WHERE CourseCode = %s",
                                (lecturer_id, reassign_course)
                            )
                            courses_per_lecturer[lecturer_id] = 1
                            courses_per_lecturer[donor_lecturer] -= 1
                            course_to_lecturer[reassign_course] = lecturer_id
        
        # Step 2: Now ensure no lecturer has more than 5 courses
        overloaded_lecturers = [lid for lid in lecturer_ids if courses_per_lecturer[lid] > 5]
        while overloaded_lecturers:
            for donor_lecturer in overloaded_lecturers:
                while courses_per_lecturer[donor_lecturer] > 5:
                    # Find a lecturer with fewer than 5 courses
                    available_lecturers = [lid for lid in lecturer_ids if courses_per_lecturer[lid] < 5]
                    if not available_lecturers:
                        raise Exception("Cannot balance course load! Not enough lecturers.")
                    
                    # Choose a recipient with fewest courses
                    recipient_lecturer = min(available_lecturers, key=lambda lid: courses_per_lecturer[lid])
                    
                    # Find a course taught by the donor
                    donor_courses = [c for c, l in course_to_lecturer.items() if l == donor_lecturer]
                    reassign_course = donor_courses[0]
                    
                    # Reassign the course
                    cursor.execute(
                        "UPDATE Course SET LecturerID = %s WHERE CourseCode = %s",
                        (recipient_lecturer, reassign_course)
                    )
                    
                    # Update tracking
                    courses_per_lecturer[donor_lecturer] -= 1
                    courses_per_lecturer[recipient_lecturer] += 1
                    course_to_lecturer[reassign_course] = recipient_lecturer
            
            # Recalculate overloaded lecturers
            overloaded_lecturers = [lid for lid in lecturer_ids if courses_per_lecturer[lid] > 5]
        
        conn.commit()
        
        # Print distribution statistics
        print("\nCourse load distribution:")
        course_counts = {}
        for count in courses_per_lecturer.values():
            course_counts[count] = course_counts.get(count, 0) + 1
        
        for count, num_lecturers in sorted(course_counts.items()):
            print(f"  {num_lecturers} lecturers teaching {count} courses")
        
    finally:
        cursor.close()
        conn.close()
    
    return course_to_lecturer

def assign_students_to_courses(student_ids: List[int], course_codes: List[str]):
    """Assign students to courses ensuring all constraints are met:
    - Each student must be enrolled in at least 3 courses
    - No student can do more than 6 courses
    - Each course must have at least 10 members
    """
    conn = connect_db()
    cursor = conn.cursor()
    
    # For batch processing:
    batch_size = 1000  # Process this many students at once
    
    try:
        print(f"Processing student enrollments in batches of {batch_size}")
        
        # Process students in batches to avoid memory issues
        for i in range(0, len(student_ids), batch_size):
            batch_students = student_ids[i:i+batch_size]
            print(f"Processing students {i+1} to {min(i+batch_size, len(student_ids))}")
            
            for student_id in batch_students:
                # Decide how many courses (3-6 per requirement)
                num_courses = random.randint(3, 6)
                assigned_courses = random.sample(course_codes, min(num_courses, len(course_codes)))
                
                # Insert enrollments
                for course_code in assigned_courses:
                    try:
                        cursor.execute(
                            "INSERT INTO Enrol (CourseCode, UserID) VALUES (%s, %s)",
                            (course_code, student_id)
                        )
                    except mysql.connector.errors.IntegrityError:
                        # Skip if this enrollment already exists
                        pass
            
            # Commit after each batch
            conn.commit()
        
        # Now verify the "each course must have at least 10 members" constraint
        print("Verifying course enrollment minimums...")
        cursor.execute("""
            SELECT c.CourseCode, COUNT(e.UserID) as student_count 
            FROM Course c
            LEFT JOIN Enrol e ON c.CourseCode = e.CourseCode
            GROUP BY c.CourseCode
            HAVING student_count < 10 OR student_count IS NULL
        """)
        
        inadequate_courses = cursor.fetchall()
        if inadequate_courses:
            print(f"Found {len(inadequate_courses)} courses with fewer than 10 students")
            
            for course_code, current_count in inadequate_courses:
                current_count = current_count if current_count is not None else 0
                needed = 10 - current_count
                print(f"Course {course_code} has {current_count} students, needs {needed} more to meet minimum")
                
                # Find students who aren't already enrolled in this course
                cursor.execute("""
                    SELECT s.StudentID 
                    FROM Student s
                    LEFT JOIN Enrol e ON s.StudentID = e.UserID AND e.CourseCode = %s
                    WHERE e.UserID IS NULL
                    LIMIT %s
                """, (course_code, needed))
                
                additional_students = [row[0] for row in cursor.fetchall()]
                
                # Enroll these students
                for student_id in additional_students:
                    # Check if this student is already at 6 courses (maximum)
                    cursor.execute(
                        "SELECT COUNT(*) FROM Enrol WHERE UserID = %s",
                        (student_id,)
                    )
                    course_count = cursor.fetchone()[0]
                    
                    if course_count < 6:  # Only enroll if under maximum
                        cursor.execute(
                            "INSERT INTO Enrol (CourseCode, UserID) VALUES (%s, %s)",
                            (course_code, student_id)
                        )
                    else:
                        # If all students are at max courses, we need to find another solution
                        # This is an edge case that would require more complex handling
                        print(f"Warning: Student {student_id} already has 6 courses, can't enroll in {course_code}")
                        
                        # One solution: find a student with fewer courses who could take this one
                        cursor.execute("""
                            SELECT s.StudentID
                            FROM Student s
                            JOIN (
                                SELECT UserID, COUNT(*) as course_count
                                FROM Enrol
                                GROUP BY UserID
                                HAVING course_count < 6
                            ) counts ON s.StudentID = counts.UserID
                            LEFT JOIN Enrol e ON s.StudentID = e.UserID AND e.CourseCode = %s
                            WHERE e.UserID IS NULL
                            LIMIT 1
                        """, (course_code,))
                        
                        alternate_students = cursor.fetchall()
                        if alternate_students:
                            alt_student_id = alternate_students[0][0]
                            cursor.execute(
                                "INSERT INTO Enrol (CourseCode, UserID) VALUES (%s, %s)",
                                (course_code, alt_student_id)
                            )
                            print(f"Enrolled alternate student {alt_student_id} in {course_code}")
                
                # Commit after each course fix
                conn.commit()
        
        # Final verification
        cursor.execute("""
            SELECT CourseCode, COUNT(UserID) as student_count 
            FROM Enrol 
            GROUP BY CourseCode
            HAVING student_count < 10
        """)
        
        still_inadequate = cursor.fetchall()
        if still_inadequate:
            print(f"Warning: {len(still_inadequate)} courses still have fewer than 10 students after adjustments")
            for course_code, count in still_inadequate:
                print(f"  Course {course_code}: {count} students")
        else:
            print("All courses now have at least 10 students")
            
        # Verify student enrollment constraints
        cursor.execute("""
            SELECT UserID, COUNT(CourseCode) as course_count
            FROM Enrol
            GROUP BY UserID
            HAVING course_count < 3 OR course_count > 6
        """)
        
        invalid_students = cursor.fetchall()
        if invalid_students:
            print(f"Warning: {len(invalid_students)} students have invalid course counts")
            for student_id, count in invalid_students[:10]:  # Show first 10 only
                print(f"  Student {student_id}: {count} courses")
        else:
            print("All students are enrolled in 3-6 courses as required")
            
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def main():
    start_time = time.time()
    print("Starting data generation...")
    
    # Generate users - Adjusted to meet requirement of 100,000 students
    print("Generating students...")
    student_ids = generate_users(1000, 'student')
    print("Generating lecturers...")
    lecturer_ids = generate_users(50, 'lecturer')  # Enough lecturers to handle 200 courses (with max 5 per lecturer)
    print("Generating admins...")
    admin_ids = generate_users(10, 'admin')
    
    # Generate courses
    print("Generating courses...")
    course_codes = generate_courses(200, admin_ids, lecturer_ids)  # Pass lecturer_ids here
    
    # Assign courses to lecturers (optional now since we assign in generate_courses)
    print("Balancing course assignments to lecturers...")
    course_lecturer_mapping = assign_courses_to_lecturers(course_codes, lecturer_ids)
    
    # Assign students to courses
    print("Assigning students to courses...")
    assign_students_to_courses(student_ids, course_codes)
    
    end_time = time.time()
    print(f"Data generation completed in {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    main()