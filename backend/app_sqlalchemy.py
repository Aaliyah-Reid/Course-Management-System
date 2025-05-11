import bcrypt
from flask import Flask, request, make_response, jsonify
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os
import hashlib
from werkzeug.exceptions import HTTPException
from sqlalchemy.orm import Session
from models.database import engine, db, get_db
from models.models import User, Student, Lecturer, Admin, Course, Assignment, CalendarEvents
from models.models import DiscussionForum, DiscussionThread, Reply, ThreadVote, ReplyVote
from models.models import Section, SectionItem, Submission, Grade, Enrol

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db.init_app(app)

# Legacy database connection function (kept for backward compatibility)
def get_db_connection():
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

# Global error handler for unhandled exceptions
@app.errorhandler(Exception)
def handle_unexpected_error(error):
    if isinstance(error, HTTPException):
        return jsonify({'error': error.description}), error.code
    return jsonify({'error': 'An unexpected error occurred.'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Check SQLAlchemy connection
        with Session(engine) as session:
            session.execute("SELECT 1")
            return jsonify({'status': 'ok'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Database connection failed: {str(e)}'}), 500

@app.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        password = data.get('password')
        user_type = data.get('userType')

        if not user_id or not first_name or not last_name or not password or not user_type:
            return jsonify({'error': 'Missing required fields'}), 400

        # Use SHA-256 for password hashing (to match insert.py)
        hashed_password = hashlib.sha256(password.encode('utf-8')).hexdigest()

        # Using SQLAlchemy session
        with Session(engine) as session:
            # Create new user
            new_user = User(
                UserID=user_id,
                FirstName=first_name,
                LastName=last_name,
                Password=hashed_password,
                UserType=user_type
            )
            session.add(new_user)
            
            # Create specialized user type
            if user_type == 'student':
                new_student = Student(StudentID=user_id)
                session.add(new_student)
            elif user_type == 'lecturer':
                new_lecturer = Lecturer(LecturerID=user_id)
                session.add(new_lecturer)
            elif user_type == 'admin':
                new_admin = Admin(AdminID=user_id)
                session.add(new_admin)
            else:
                return jsonify({'error': 'Invalid user type'}), 400

            try:
                session.commit()
                return jsonify({
                    'message': 'User registered successfully',
                    'userId': user_id
                }), 201
            except Exception as e:
                session.rollback()
                return jsonify({'error': f'Registration failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error during registration: {str(e)}'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user_id = data.get('userId')  
        password = data.get('password')

        if not user_id or not password:
            return jsonify({'error': 'Missing required fields'}), 400

        # Hash the password for comparison
        hashed_password = hashlib.sha256(password.encode('utf-8')).hexdigest()

        # Using SQLAlchemy session
        with Session(engine) as session:
            user = session.query(User).filter(User.UserID == user_id).first()
            
            if not user or user.Password != hashed_password:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Determine user type and get additional info
            user_info = {
                'userId': user.UserID,
                'firstName': user.FirstName,
                'lastName': user.LastName,
                'userType': user.UserType
            }
            
            return jsonify({
                'message': 'Login successful',
                'user': user_info
            }), 200
    except Exception as e:
        return jsonify({'error': f'Unexpected error during login: {str(e)}'}), 500

@app.route('/create_course', methods=['POST'])
def create_course():
    try:
        data = request.get_json()
        course_code = data.get('courseCode')
        course_name = data.get('courseName')
        lecturer_id = data.get('lecturerId')
        admin_id = data.get('adminId')

        if not course_code or not course_name or not lecturer_id or not admin_id:
            return jsonify({'error': 'Missing required fields'}), 400

        with Session(engine) as session:
            # Check if course already exists
            existing_course = session.query(Course).filter(Course.CourseCode == course_code).first()
            if existing_course:
                return jsonify({'error': 'Course with this code already exists'}), 400

            # Check if lecturer exists
            lecturer = session.query(Lecturer).filter(Lecturer.LecturerID == lecturer_id).first()
            if not lecturer:
                return jsonify({'error': 'Lecturer not found'}), 404

            # Check if admin exists
            admin = session.query(Admin).filter(Admin.AdminID == admin_id).first()
            if not admin:
                return jsonify({'error': 'Admin not found'}), 404

            # Create new course
            new_course = Course(
                CourseCode=course_code,
                CourseName=course_name,
                LecturerID=lecturer_id,
                AdminID=admin_id
            )
            session.add(new_course)

            try:
                session.commit()
                return jsonify({
                    'message': 'Course created successfully',
                    'courseCode': course_code
                }), 201
            except Exception as e:
                session.rollback()
                return jsonify({'error': f'Failed to create course: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error during course creation: {str(e)}'}), 500

@app.route('/courses', methods=['GET'])
def get_courses():
    try:
        with Session(engine) as session:
            # Query all courses with lecturer information
            courses = session.query(
                Course.CourseCode, 
                Course.CourseName, 
                User.FirstName, 
                User.LastName
            ).join(
                Lecturer, Course.LecturerID == Lecturer.LecturerID
            ).join(
                User, Lecturer.LecturerID == User.UserID
            ).all()

            # Format the results
            result = [{
                'courseCode': course[0],
                'courseName': course[1],
                'lecturerFirstName': course[2],
                'lecturerLastName': course[3]
            } for course in courses]

            return jsonify({'courses': result}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve courses: {str(e)}'}), 500

@app.route('/students/<int:student_id>/courses', methods=['GET'])
def get_student_courses(student_id):
    try:
        with Session(engine) as session:
            # Check if student exists
            student = session.query(Student).filter(Student.StudentID == student_id).first()
            if not student:
                return jsonify({'error': 'Student not found'}), 404

            # Query courses the student is enrolled in
            courses = session.query(
                Course.CourseCode,
                Course.CourseName,
                User.FirstName,
                User.LastName
            ).join(
                Enrol, Course.CourseCode == Enrol.CourseCode
            ).join(
                Lecturer, Course.LecturerID == Lecturer.LecturerID
            ).join(
                User, Lecturer.LecturerID == User.UserID
            ).filter(
                Enrol.UserID == student_id
            ).all()

            # Format the results
            result = [{
                'courseCode': course[0],
                'courseName': course[1],
                'lecturerFirstName': course[2],
                'lecturerLastName': course[3]
            } for course in courses]

            return jsonify({'courses': result}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve student courses: {str(e)}'}), 500

@app.route('/lecturers/<int:lecturer_id>/courses', methods=['GET'])
def get_lecturer_courses(lecturer_id):
    try:
        with Session(engine) as session:
            # Check if lecturer exists
            lecturer = session.query(Lecturer).filter(Lecturer.LecturerID == lecturer_id).first()
            if not lecturer:
                return jsonify({'error': 'Lecturer not found'}), 404

            # Query courses taught by the lecturer
            courses = session.query(
                Course.CourseCode,
                Course.CourseName
            ).filter(
                Course.LecturerID == lecturer_id
            ).all()

            # Format the results
            result = [{
                'courseCode': course[0],
                'courseName': course[1]
            } for course in courses]

            return jsonify({'courses': result}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve lecturer courses: {str(e)}'}), 500

@app.route('/assign_lecturer', methods=['POST'])
def assign_lecturer():
    try:
        data = request.get_json()
        course_code = data.get('courseCode')
        lecturer_id = data.get('lecturerId')

        if not course_code or not lecturer_id:
            return jsonify({'error': 'Missing required fields'}), 400

        with Session(engine) as session:
            # Check if course exists
            course = session.query(Course).filter(Course.CourseCode == course_code).first()
            if not course:
                return jsonify({'error': 'Course not found'}), 404

            # Check if lecturer exists
            lecturer = session.query(Lecturer).filter(Lecturer.LecturerID == lecturer_id).first()
            if not lecturer:
                return jsonify({'error': 'Lecturer not found'}), 404

            # Update course with new lecturer
            course.LecturerID = lecturer_id

            try:
                session.commit()
                return jsonify({
                    'message': 'Lecturer assigned successfully',
                    'courseCode': course_code,
                    'lecturerId': lecturer_id
                }), 200
            except Exception as e:
                session.rollback()
                return jsonify({'error': f'Failed to assign lecturer: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error during lecturer assignment: {str(e)}'}), 500

@app.route('/register_student', methods=['POST'])
def register_student():
    try:
        data = request.get_json()
        course_code = data.get('courseCode')
        student_id = data.get('studentId')

        if not course_code or not student_id:
            return jsonify({'error': 'Missing required fields'}), 400

        with Session(engine) as session:
            # Check if course exists
            course = session.query(Course).filter(Course.CourseCode == course_code).first()
            if not course:
                return jsonify({'error': 'Course not found'}), 404

            # Check if student exists
            student = session.query(Student).filter(Student.StudentID == student_id).first()
            if not student:
                return jsonify({'error': 'Student not found'}), 404

            # Check if student is already enrolled
            enrollment = session.query(Enrol).filter(
                Enrol.CourseCode == course_code,
                Enrol.UserID == student_id
            ).first()

            if enrollment:
                return jsonify({'error': 'Student already enrolled in this course'}), 400

            # Create new enrollment
            new_enrollment = Enrol(
                CourseCode=course_code,
                UserID=student_id
            )
            session.add(new_enrollment)

            try:
                session.commit()
                return jsonify({
                    'message': 'Student registered successfully',
                    'courseCode': course_code,
                    'studentId': student_id
                }), 201
            except Exception as e:
                session.rollback()
                return jsonify({'error': f'Failed to register student: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error during student registration: {str(e)}'}), 500

@app.route('/courses/<string:course_code>/members', methods=['GET'])
def get_course_members(course_code):
    try:
        with Session(engine) as session:
            # Check if course exists
            course = session.query(Course).filter(Course.CourseCode == course_code).first()
            if not course:
                return jsonify({'error': 'Course not found'}), 404

            # Get all students enrolled in the course
            students = session.query(
                User.UserID,
                User.FirstName,
                User.LastName
            ).join(
                Enrol, User.UserID == Enrol.UserID
            ).filter(
                Enrol.CourseCode == course_code,
                User.UserType == 'student'
            ).all()

            # Format the results
            result = [{
                'studentId': student[0],
                'firstName': student[1],
                'lastName': student[2]
            } for student in students]

            return jsonify({'members': result}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve course members: {str(e)}'}), 500

# Additional routes can be implemented similarly

if __name__ == '__main__':
    app.run(port=5000, debug=True)
