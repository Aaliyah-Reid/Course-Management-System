from flask import Flask, request, make_response, jsonify
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os
# import bcrypt #guys the for added security we can hash the password 

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        # Database connection details
        db_host = os.getenv('DB_HOST')
        db_username = os.getenv('DB_USERNAME')
        db_password = os.getenv('DB_PASSWORD')
        db_name = os.getenv('DB_NAME')  # It's a good practice to load the database name from .env too
        print(db_host)
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
    
@app.route('/test',methods=['GET'])
def test():
    conn= get_db_connection
    return "didn't fail"

@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    password = data.get('password')
    user_type = data.get('userType')

    if not first_name or not last_name or not password or not user_type:
        return jsonify({'error': 'Missing required fields'}), 400

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor()

    try:
        # 1. Insert into User table
        insert_user_query = """
        INSERT INTO User (FirstName, LastName, Password)
        VALUES (%s, %s, %s)
        """
        cursor.execute(insert_user_query, (first_name, last_name, hashed_password))
        
        # 2. Get the new UserID
        new_user_id = cursor.lastrowid

        # 3. Insert into Student/Lecturer/Admin table
        if user_type == 'student':
            insert_student_query = "INSERT INTO Student (StudentID) VALUES (%s)"
            cursor.execute(insert_student_query, (new_user_id,))
        elif user_type == 'lecturer':
            insert_lecturer_query = "INSERT INTO Lecturer (LecturerID) VALUES (%s)"
            cursor.execute(insert_lecturer_query, (new_user_id,))
        elif user_type == 'admin':
            insert_admin_query = "INSERT INTO Admin (AdminID) VALUES (%s)"
            cursor.execute(insert_admin_query, (new_user_id,))
        else:
            conn.rollback()  # Rollback if user type is invalid
            return jsonify({'error': 'Invalid user type'}), 400

        conn.commit()  # Save the changes
        
        return jsonify({
            'message': 'User registered successfully',
            'userId': new_user_id
        }), 201

    except mysql.connector.Error as err:
        conn.rollback()  # Rollback on error
        return jsonify({'error': f'Registration failed: {str(err)}'}), 500

    finally:
        if conn:  # Check if connection was established
            cursor.close()
            conn.close()



@app.route('/login', methods=['POST'])
def user_login():
    data = request.get_json()
    user_id = data.get('userId')  
    password = data.get('password')

    if not user_id or not password: 
        return jsonify({'error': 'Password or email incorrect'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor(dictionary=True)  
    try:
        cursor.execute("select userid, password from user where userid = %s", (user_id,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user.get('password').encode('utf-8')):
            return jsonify({'message': 'Login successful', 'userId': user['userid']}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except mysql.connector.Error as err:
        return jsonify({'error': f'Login failed: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/createcourse', methods=['POST'])
def create_course():
    data= request.get_json()
    admin_id = data.get('adminId')
    course_code = data.get('courseCode')
    course_name = data.get('courseName')

    if not admin_id or not course_code or not course_name:
        return jsonify({'error': 'Missing required fields'}), 400
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("select adminid from admin where adminid= %s", (admin_id,))

        if cursor.fetchone() is None:
            return jsonify({'error': 'Not an administrator'}), 403
        cursor.execute("insert into course (coursecode, coursename, adminid) values (%s, %s, %s)",
                       (course_code, course_name, admin_id))
        
        conn.commit()
        return jsonify({'message': 'Course created successfully', 'courseCode': course_code}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Course creation failed: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()

    
@app.route('/courses', methods=['GET'])
def retrieve_courses():
    conn= get_db_connection()
    if not conn:
        return jsonify({'error': conn}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("select coursecode, coursename from course")
        courses = cursor.fetchall()
        return jsonify({'courses': courses}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'Failed to retrieve courses: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/courses/student/<int:student_id>', methods=['GET'])
def retrieve_student_courses(student_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select c.coursecode, c.coursename from course c join registration r on c.coursecode = r.coursecode
            where r.studentid = %s """, (student_id,))
        courses = cursor.fetchall()

        return jsonify({'studentCourses': courses}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'Failed to retrieve student courses: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/courses/lecturer/<int:lecturer_id>', methods=['GET'])
def retrieve_lecturer_courses(lecturer_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select c.coursecode, c.coursename from course c
            join lecturer l on c.adminid = l.lecturerid 
            where l.lecturerid = %s""", (lecturer_id,))
        courses = cursor.fetchall()

        return jsonify({'lecturerCourses': courses}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'Failed to retrieve lecturer courses: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


# Register for Course
# Only one lecturer can be assigned to a course
# Students should be able to register for a course

@app.route('/assignlecturer', methods=['POST'])
def assign_lecturer():

    data = request.get_json()
    lecturer_id = data.get('lecturerId')
    course_code = data.get('courseCode')
    if not lecturer_id or not course_code:
        return jsonify({'error': 'Missing required fields.'}), 400
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'database connection failed'}), 500

    cursor = conn.cursor()
    try:
        
        cursor.execute("select lecturerid from lecturer where lecturerid = %s", (lecturer_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Lecturer does not exist.'}), 404

        cursor.execute("select lecturerid from course where coursecode = %s", (course_code,))
        assigned_lecturer = cursor.fetchone()
        if assigned_lecturer and assigned_lecturer[0] is not None:
            return jsonify({'error': 'Course already has an assigned lecturer.'}), 409

        cursor.execute("update course set lecturerid = %s where coursecode = %s", (lecturer_id, course_code))
        conn.commit()
        return jsonify({'message': 'Lecturer successfully assigned.'}), 200

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Failed to assign lecturer: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/assignstudent", methods=['POST'])
def register_student():
    data= request.get_json()
    student_id= data.get('studentId')
    course_code= data.get('courseCode')
    if not student_id or not course_code:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error':'Database connection failed'}), 500
    
    cursor= conn.cursor()
    try:
    
        cursor.execute("select studentid from student where studentid = %s", (student_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Student does not exist.'}), 404

        cursor.execute("select coursecode from course where coursecode = %s", (course_code,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Course does not exist.'}), 404

        cursor.execute("select count(*) from registration where studentid = %s", (student_id,))
        enrolled_courses = cursor.fetchone()[0]
        if enrolled_courses >= 6:
            return jsonify({'error': 'Student has reached the maximum enrollment limit.'}), 403

        cursor.execute("insert into registration (studentid, coursecode) values (%s, %s)", (student_id, course_code))
        conn.commit()
        return jsonify({'message': 'Student registered successfully.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Failed to register student: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()



# Retrieve Members
# Should return members of a particular course
@app.route('/course_members/<string:course_code>', methods=['GET'])
def get_course_members(course_code):
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        
        cursor.execute("select lecturerid from course where coursecode = %s", (course_code,))
        lecturer = cursor.fetchone()

        
        cursor.execute("select s.studentid, u.firstname, u.lastname from student s join user u on s.studentid = u.userid join registration r on s.studentid = r.studentid where r.coursecode = %s", (course_code,))
        students = cursor.fetchall()
        return jsonify({
            'courseCode': course_code,
            'lecturer': lecturer if lecturer else {'message': 'no lecturer assigned'},
            'students': students
        }), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'failed to retrieve course members: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


# Retrieve Calendar Events
# Should be able to retrieve all calendar events for a particular course.
# Should be able to retrieve all calendar events for a particular date for a particular student.

@app.route('/calendar_events/course/<string:course_code>', methods=['GET'])
def get_calendar_events_for_course(course_code):

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("select eventid, eventname, eventdate from calendarevents where coursecode = %s", (course_code,))
        events = cursor.fetchall()
        return jsonify({'courseCode': course_code, 'events': events}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'Failed to retrieve calendar events: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/calendar_events/student', methods=['GET'])
def get_calendar_events_for_student():
    
    student_id = request.args.get('studentId')
    event_date = request.args.get('eventDate')  # Expected format: YYYY-MM-DD

    if not student_id or not event_date:
        return jsonify({'error': 'Missing required fields.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select ce.eventid, ce.eventname, ce.eventdate, ce.coursecode
            from calendarevents ce
            join registration r on ce.coursecode = r.coursecode
            where r.studentid = %s and date(ce.eventdate) = %s
        """, (student_id, event_date))
        events = cursor.fetchall()

        return jsonify({'studentId': student_id, 'eventDate': event_date, 'events': events}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'Failed to retrieve student calendar events: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()

# Create Calendar Events
# Should be able to create calendar event for a course
@app.route('/create_calendar_event', methods=['POST'])
def create_calendar_event():
    
    data = request.get_json()
    course_code = data.get('courseCode')
    event_name = data.get('eventName')
    event_date = data.get('eventDate')  # Expected format: YYYY-MM-DD HH:MM:SS
    created_by = data.get('createdBy')  # UserID of the creator

    if not course_code or not event_name or not event_date or not created_by:
        return jsonify({'error': 'missing required fields'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'database connection failed'}), 500

    cursor = conn.cursor()

    try:

        cursor.execute("select coursecode from course where coursecode = %s", (course_code,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'course does not exist'}), 404

        cursor.execute("select userid from user where userid = %s", (created_by,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'event creator does not exist'}), 404

        cursor.execute("""
            insert into calendarevents (coursecode, eventname, eventdate, createdby)
            values (%s, %s, %s, %s)
        """, (course_code, event_name, event_date, created_by))
        conn.commit()

        return jsonify({'message': 'calendar event created successfully'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'failed to create calendar event: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


# Forums
# Should be able to retrieve all the forums for a particular course
# Should be able to create a forum for a particular course
@app.route('/forums/<string:course_code>', methods=['GET'])
def get_forums(course_code):
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("select forumid, forumname from discussionforum where coursecode = %s", (course_code,))
        forums = cursor.fetchall()

        return jsonify({'courseCode': course_code, 'forums': forums}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'failed to retrieve forums: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/create_forum', methods=['POST'])
def create_forum():
    
    data = request.get_json()
    course_code = data.get('courseCode')
    forum_name = data.get('forumName')

    if not course_code or not forum_name:
        return jsonify({'error': 'Missing required fields.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor()

    try:
    
        cursor.execute("select coursecode from course where coursecode = %s", (course_code,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'course does not exist'}), 404
        
        cursor.execute("insert into discussionforum (coursecode, forumname) values (%s, %s)", (course_code, forum_name))
        conn.commit()

        return jsonify({'message': 'Forum created successfully.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Failed to create forum: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


# Discussion Thread
# Should be able to retrieve all the discussion threads for a particular forum.
# Should be able to add a new discussion thread to a forum. Each discussion thread should have a title and the post that started the thread.
# Users should be able to reply to a thread and replies can have replies. (Think reddit)

@app.route('/threads/<int:forum_id>', methods=['GET'])
def get_threads(forum_id):
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("select threadid, threadtitle, content, createdby from discussionthread where forumid = %s", (forum_id,))
        threads = cursor.fetchall()

        return jsonify({'forumId': forum_id, 'threads': threads}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'Failed to retrieve discussion threads: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/create_thread', methods=['POST'])
def create_thread():
    
    data = request.get_json()
    forum_id = data.get('forumId')
    thread_title = data.get('threadTitle')
    content = data.get('content')
    created_by = data.get('createdBy')  # UserID of the creator

    if not forum_id or not thread_title or not content or not created_by:
        return jsonify({'error': 'Missing required fields.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor()
    try:
        
        cursor.execute("select forumid from discussionforum where forumid = %s", (forum_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Forum does not exist.'}), 404

        cursor.execute("select userid from user where userid = %s", (created_by,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Thread creator does not exist.'}), 404

        cursor.execute("""
            insert into discussionthread (forumid, threadtitle, content, createdby)
            values (%s, %s, %s, %s)
        """, (forum_id, thread_title, content, created_by))
        conn.commit()

        return jsonify({'message': 'Discussion thread created successfully.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Failed to create discussion thread: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/reply_thread', methods=['POST'])
def reply_thread():
    
    data = request.get_json()
    thread_id = data.get('threadId')
    parent_reply_id = data.get('parentReplyId')  # NULL if it's a direct reply to the thread
    content = data.get('content')
    created_by = data.get('createdBy')

    if not thread_id or not content or not created_by:
        return jsonify({'error': 'Missing required fields.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor()
    try:
    
        cursor.execute("select threadid from discussionthread where threadid = %s", (thread_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Thread does not exist.'}), 404

        cursor.execute("select userid from user where userid = %s", (created_by,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Reply creator does not exist.'}), 404

        cursor.execute("""
            insert into reply (threadid, parentreplyid, content, createdby, replydate)
            values (%s, %s, %s, %s, now())
        """, (thread_id, parent_reply_id, content, created_by))
        conn.commit()

        return jsonify({'message': 'Reply posted successfully.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Failed to post reply: {str(err)}'}), 500

    finally:
        cursor.close()
        conn.close()


# Course Content
# A lecturer should have the ability to add course content
# Course content can includes links, files, slides
# Course content is separated by sections.
# Should be able to retrieve all the course content for a particular course
@app.route('/course_content/<string:course_code>', methods=['GET'])
def get_course_content(course_code):

    conn = get_db_connection()
    if not conn:
        return jsonify({'Error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select s.sectionid, s.sectiontitle, si.sectionitemid, si.itemtitle, si.link, si.filename, si.description
            from section s
            join sectionitem si on s.sectionid = si.sectionid
            where s.coursecode = %s
        """, (course_code,))
        content = cursor.fetchall()

        return jsonify({'courseCode': course_code, 'content': content}), 200

    except mysql.connector.Error as err:
        return jsonify({'Error': f'Failed to retrieve course content: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/add_course_content', methods=['POST'])
def add_course_content():
   
    data = request.get_json()
    section_id = data.get('sectionId')
    item_title = data.get('itemTitle')
    link = data.get('link')  # Optional: external links
    filename = data.get('filename')  # Optional: uploaded files
    description = data.get('description')

    if not section_id or not item_title:
        return jsonify({'Error': 'Missing required fields.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'Error': 'Database connection failed.'}), 500

    cursor = conn.cursor()
    try:
       
        cursor.execute("select sectionid from section where sectionid = %s", (section_id,))
        if cursor.fetchone() is None:
            return jsonify({'Error': 'Section does not exist.'}), 404

        
        cursor.execute("""
            insert into sectionitem (sectionid, itemtitle, link, filename, description)
            values (%s, %s, %s, %s, %s)
        """, (section_id, item_title, link, filename, description))
        conn.commit()

        return jsonify({'Message': 'Course content added successfully.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'Error': f'Failed to add course content: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()



# Assignments
# A student can submit assignments for a course.
# A lecturer can submit a grade for a particular student for that assignment.
# Each grade a student gets goes to their final average.

@app.route('/assignments/<string:course_code>', methods=['GET'])
def get_assignments(course_code):
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'Error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("select assignmentid, content, duedate from assignment where coursecode = %s", (course_code,))
        assignments = cursor.fetchall()

        return jsonify({'CourseCode': course_code, 'Assignments': assignments}), 200

    except mysql.connector.Error as err:
        return jsonify({'Error': f'Failed to retrieve assignments: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()



def submit_assignment():
    """Allows students to submit assignments for a course."""
    data = request.get_json()
    student_id = data.get('studentId')
    assignment_id = data.get('assignmentId')
    submission_content = data.get('submissionContent')  # Text or file path

    if not student_id or not assignment_id or not submission_content:
        return jsonify({'error': 'Missing required fields.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor()
    try:
        # Verify user is a student
        cursor.execute("select studentid from student where studentid = %s", (student_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'User is not a student.'}), 403

        # Ensure assignment exists
        cursor.execute("select assignmentid from assignment where assignmentid = %s", (assignment_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Assignment does not exist.'}), 404

        # Prevent duplicate submissions
        cursor.execute("select submissionid from submission where studentid = %s and assignmentid = %s", (student_id, assignment_id))
        if cursor.fetchone():
            return jsonify({'error': 'Student has already submitted this assignment.'}), 409

        # Insert submission into the database
        cursor.execute("""
            insert into submission (studentid, assignmentid, submissioncontent, uploaddate)
            values (%s, %s, %s, now())
        """, (student_id, assignment_id, submission_content))
        conn.commit()

        return jsonify({'message': 'Assignment submitted successfully.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Failed to submit assignment: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()



def grade_assignment():
    """Allows lecturers to grade a student's assignment."""
    data = request.get_json()
    submission_id = data.get('submissionId')
    lecturer_id = data.get('lecturerId')
    score = data.get('score')

    if not submission_id or not lecturer_id or score is None:
        return jsonify({'error': 'Missing required fields.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor()
    try:
        # Verify user is a lecturer
        cursor.execute("select lecturerid from lecturer where lecturerid = %s", (lecturer_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'User is not a lecturer.'}), 403

        # Ensure submission exists
        cursor.execute("select submissionid from submission where submissionid = %s", (submission_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Submission does not exist.'}), 404

        # Insert grade into the database
        cursor.execute("""
            insert into grade (submissionid, lecturerid, score)
            values (%s, %s, %s)
        """, (submission_id, lecturer_id, score))
        conn.commit()

        return jsonify({'message': 'Assignment graded successfully.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f'Failed to grade assignment: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()



# Reports (You must also create views for the following)
# All courses that have 50 or more students
# All students that do 5 or more courses.
# All lecturers that teach 3 or more courses.
# The 10 most enrolled courses.
# The top 10 students with the highest overall averages.

@app.route('/reports/popular_courses', methods=['GET'])
def get_popular_courses():
    """Retrieves all courses that have 50 or more students."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.CourseCode, c.CourseName, COUNT(e.UserID) AS student_count
            FROM Course c
            JOIN Enrol e ON c.CourseCode = e.CourseCode
            GROUP BY c.CourseCode, c.CourseName
            HAVING student_count >= 50
        """)
        courses = cursor.fetchall()

        return jsonify({'PopularCourses': courses}), 200

    except mysql.connector.Error as err:
        return jsonify({'Error': f'Failed to retrieve popular courses: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/reports/active_students', methods=['GET'])
def get_active_students():
    """Retrieves all students enrolled in 5 or more courses."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT s.StudentID, u.FirstName, u.LastName, COUNT(e.CourseCode) AS course_count
            FROM Student s
            JOIN User u ON s.StudentID = u.UserID
            JOIN Enrol e ON s.StudentID = e.UserID
            GROUP BY s.StudentID, u.FirstName, u.LastName
            HAVING course_count >= 5
        """)
        students = cursor.fetchall()

        return jsonify({'ActiveStudents': students}), 200

    except mysql.connector.Error as err:
        return jsonify({'Error': f'Failed to retrieve active students: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/reports/busy_lecturers', methods=['GET'])
def get_busy_lecturers():
    """Retrieves all lecturers assigned to 3 or more courses."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select l.lecturerid, u.firstname, u.lastname, count(c.coursecode) as course_count
            from lecturer l
            join user u on l.lecturerid = u.userid
            join course c on l.lecturerid = c.lecturerid
            group by l.lecturerid
            having course_count >= 3
        """)
        lecturers = cursor.fetchall()

        return jsonify({'BusyLecturers': lecturers}), 200

    except mysql.connector.Error as err:
        return jsonify({'Error': f'Failed to retrieve busy lecturers: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()



@app.route('/reports/top_courses', methods=['GET'])
def get_top_courses():
    """Retrieves the 10 most enrolled courses."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.CourseCode, c.CourseName, COUNT(e.UserID) AS student_count
            FROM Course c
            JOIN Enrol e ON c.CourseCode = e.CourseCode
            GROUP BY c.CourseCode, c.CourseName
            ORDER BY student_count DESC
            LIMIT 10
        """)
        courses = cursor.fetchall()

        return jsonify({'TopEnrolledCourses': courses}), 200

    except mysql.connector.Error as err:
        return jsonify({'Error': f'Failed to retrieve top enrolled courses: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()




@app.route('/reports/top_students', methods=['GET'])
def get_top_students():
    """Retrieves the top 10 students with the highest overall averages."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select s.studentid, u.firstname, u.lastname, avg(g.score) as average_score
            from student s
            join user u on s.studentid = u.userid
            join submission sub on s.studentid = sub.studentid
            join grade g on sub.submissionid = g.submissionid
            group by s.studentid
            order by average_score desc
            limit 10
        """)
        students = cursor.fetchall()

        return jsonify({'TopStudents': students}), 200

    except mysql.connector.Error as err:
        return jsonify({'Error': f'Failed to retrieve top students: {str(err)}.'}), 500

    finally:
        cursor.close()
        conn.close()




if __name__ == '__main__':
    app.run(port=6000, debug=True)