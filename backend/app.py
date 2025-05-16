import bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os
import hashlib
from werkzeug.exceptions import HTTPException
from datetime import datetime, date as PyDate

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        db_host = 'db'
        db_username = 'root'
        db_password = 'helloworld'
        db_name = 'app_db'

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
        conn = get_db_connection()
        if conn:
            conn.close()
            return jsonify({'status': 'ok'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Database connection failed'}), 500
    except Exception as e:
        return jsonify({'error': 'Unexpected error during health check.'}), 500

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

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        try:
            insert_user_query = "INSERT INTO User (UserID, FirstName, LastName, Password, UserType) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(insert_user_query, (user_id, first_name, last_name, hashed_password, user_type))
            
            new_user_id = user_id

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
                conn.rollback()
                return jsonify({'error': 'Invalid User type'}), 400

            conn.commit()
            
            return jsonify({
                'message': 'User registered successfully',
                'userId': new_user_id
            }), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Registration failed: {str(err)}'}), 500
        finally:
            if conn:
                cursor.close()
                conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during registration.'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
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
            cursor.execute("SELECT userid, password FROM User WHERE userid = %s", (user_id,))
            User = cursor.fetchone()

            if User and User.get('password') == hashlib.sha256(password.encode('utf-8')).hexdigest():
                return jsonify({'message': 'Login successful', 'userId': User['userid']}), 200
            else:
                return jsonify({'error': 'Invalid credentials'}), 401

        except mysql.connector.Error as err:
            return jsonify({'error': f'Login failed: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during login.'}), 500

@app.route('/create_course', methods=['POST'])
def create_course():
    try:
        data = request.get_json()
        admin_id = data.get('adminId')
        course_code = data.get('courseCode')
        course_name = data.get('courseName')
        lecturer_id = data.get('lecturerId')

        if not admin_id or not course_code or not course_name:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("SELECT adminid FROM Admin WHERE adminid = %s", (admin_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Not an administrator'}), 403

            if lecturer_id:
                cursor.execute("SELECT COUNT(*) FROM course WHERE lecturerid = %s", (lecturer_id,))
                lecturer_course_count = cursor.fetchone()[0]
                if lecturer_course_count >= 5:
                    return jsonify({'error': 'Lecturer cannot be assigned to more than 5 courses'}), 403

            insert_query = "INSERT INTO Course (CourseCode, CourseName, LecturerID, AdminID) VALUES (%s, %s, %s, %s)"
            cursor.execute(insert_query, (course_code, course_name, lecturer_id, admin_id))

            conn.commit()
            return jsonify({'message': 'Course created successfully', 'courseCode': course_code}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Course creation failed: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during course creation.'}), 500

@app.route('/courses', methods=['GET'])
def get_courses():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        try:
            # Modified query to include lecturer's first and last name
            # Using LEFT JOIN in case a course has no lecturer assigned
            query = """
                SELECT c.coursecode, c.coursename, u.FirstName as lecturer_firstname, u.LastName as lecturer_lastname
                FROM Course c
                LEFT JOIN Lecturer l ON c.LecturerID = l.LecturerID
                LEFT JOIN User u ON l.LecturerID = u.UserID
            """
            cursor.execute(query)
            courses_raw = cursor.fetchall()
            
            # Combine firstname and lastname for lecturerName
            courses = []
            for course_data in courses_raw:
                lecturer_name = None
                if course_data['lecturer_firstname'] and course_data['lecturer_lastname']:
                    lecturer_name = f"{course_data['lecturer_firstname']} {course_data['lecturer_lastname']}"
                elif course_data['lecturer_firstname']:
                    lecturer_name = course_data['lecturer_firstname'] # Fallback if only firstname
                
                courses.append({
                    "coursecode": course_data['coursecode'],
                    "coursename": course_data['coursename'],
                    "lecturerName": lecturer_name
                })

            return jsonify({'courses': courses}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve courses: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during course retrieval.'}), 500

@app.route('/courses/student/<int:student_id>', methods=['GET'])
def get_student_courses(student_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT c.coursecode, c.coursename, u.FirstName as lecturer_firstname, u.LastName as lecturer_lastname
                FROM Course c
                JOIN Enrol e ON c.coursecode = e.coursecode
                LEFT JOIN Lecturer l ON c.LecturerID = l.LecturerID
                LEFT JOIN User u ON l.LecturerID = u.UserID
                WHERE e.UserID = %s
            """
            cursor.execute(query, (student_id,))
            courses_raw = cursor.fetchall()

            courses = []
            for course_data in courses_raw:
                lecturer_name = None
                if course_data['lecturer_firstname'] and course_data['lecturer_lastname']:
                    lecturer_name = f"{course_data['lecturer_firstname']} {course_data['lecturer_lastname']}"
                elif course_data['lecturer_firstname']:
                    lecturer_name = course_data['lecturer_firstname']
                
                courses.append({
                    "coursecode": course_data['coursecode'],
                    "coursename": course_data['coursename'],
                    "lecturerName": lecturer_name
                })

            return jsonify({'studentCourses': courses}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve student courses: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during student course retrieval.'}), 500

@app.route('/courses/lecturer/<int:lecturer_id>', methods=['GET'])
def get_lecturer_courses(lecturer_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            # The lecturer_id in the Course table is the UserID of the lecturer.
            # So, we join Course with User table directly where Course.LecturerID = User.UserID
            query = """
                SELECT c.coursecode, c.coursename, u.FirstName as lecturer_firstname, u.LastName as lecturer_lastname
                FROM Course c
                LEFT JOIN User u ON c.LecturerID = u.UserID
                WHERE c.lecturerid = %s
            """
            cursor.execute(query, (lecturer_id,))
            courses_raw = cursor.fetchall()

            courses = []
            # For courses taught by this lecturer, the lecturerName will be their own name.
            # This might seem redundant for a lecturer viewing their own courses, but it keeps the data structure consistent.
            for course_data in courses_raw:
                lecturer_name = None
                if course_data['lecturer_firstname'] and course_data['lecturer_lastname']:
                    lecturer_name = f"{course_data['lecturer_firstname']} {course_data['lecturer_lastname']}"
                elif course_data['lecturer_firstname']:
                    lecturer_name = course_data['lecturer_firstname']
                
                courses.append({
                    "coursecode": course_data['coursecode'],
                    "coursename": course_data['coursename'],
                    "lecturerName": lecturer_name 
                })

            return jsonify({'lecturerCourses': courses}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve lecturer courses: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during lecturer course retrieval.'}), 500

@app.route('/assign_lecturer', methods=['POST'])
def assign_lecturer():
    try:
        data = request.get_json()
        lecturer_id = data.get('lecturerId')
        course_code = data.get('courseCode')
        if not lecturer_id or not course_code:
            return jsonify({'error': 'Missing required fields'}), 400
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("SELECT lecturerid FROM Lecturer WHERE lecturerid = %s", (lecturer_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Lecturer does not exist'}), 404

            cursor.execute("SELECT COUNT(*) FROM course WHERE lecturerid = %s", (lecturer_id,))
            lecturer_course_count = cursor.fetchone()[0]
            if lecturer_course_count >= 5:
                return jsonify({'error': 'Lecturer cannot be assigned to more than 5 courses'}), 403

            cursor.execute("SELECT lecturerid FROM course WHERE coursecode = %s", (course_code,))
            assigned_lecturer = cursor.fetchone()
            if assigned_lecturer and assigned_lecturer[0] is not None:
                return jsonify({'error': 'Course already has an assigned lecturer'}), 409

            cursor.execute("UPDATE course SET lecturerid = %s WHERE coursecode = %s", (lecturer_id, course_code))
            conn.commit()
            return jsonify({'message': 'Lecturer successfully assigned'}), 200

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to assign lecturer: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during lecturer assignment.'}), 500

@app.route("/assign_student", methods=['POST'])
def register_student():
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        course_code = data.get('courseCode')
        if not student_id or not course_code:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT studentid FROM Student WHERE studentid = %s", (student_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Student does not exist'}), 404

            cursor.execute("SELECT coursecode FROM Course WHERE coursecode = %s", (course_code,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Course does not exist'}), 404

            cursor.execute("SELECT count(*) FROM Enrol WHERE UserID = %s", (student_id,))
            enrolled_courses = cursor.fetchone()[0]
            if enrolled_courses >= 6:
                return jsonify({'error': 'Student has reached the maximum enrollment limit'}), 403

            cursor.execute("INSERT INTO Enrol (UserID, CourseCode) VALUES (%s, %s)", (student_id, course_code))
            conn.commit()
            return jsonify({'message': 'Student registered successfully'}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to register student: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during student registration.'}), 500

@app.route('/course_members/<string:course_code>', methods=['GET'])
def get_course_members(course_code):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT lecturerid FROM Course WHERE coursecode = %s", (course_code,))
            lecturer = cursor.fetchone()
            
            cursor.execute("SELECT s.studentid, u.firstname, u.lastname FROM Student s JOIN User u ON s.studentid = u.userid JOIN Enrol e ON s.studentid = e.UserID WHERE e.coursecode = %s", (course_code,))
            students = cursor.fetchall()
            return jsonify({
                'courseCode': course_code,
                'lecturer': lecturer if lecturer else {'message': 'no lecturer assigned'},
                'students': students
            }), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve course members: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during course member retrieval.'}), 500

@app.route('/calendar_events/course/<string:course_code>', methods=['GET'])
def get_calendar_events_for_course(course_code):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            # Fetch regular calendar events
            cursor.execute("SELECT eventid, eventname, eventdate FROM CalendarEvents WHERE coursecode = %s", (course_code,))
            calendar_events_raw = cursor.fetchall()
            
            processed_events = []
            for event in calendar_events_raw:
                processed_events.append({
                    'eventid': f"event-{event['eventid']}",
                    'eventname': event['eventname'],
                    'eventdate': event['eventdate'],
                    'type': 'event'
                })

            # Fetch assignments
            cursor.execute("SELECT assignmentid, content, duedate FROM assignment WHERE coursecode = %s", (course_code,))
            assignments_raw = cursor.fetchall()

            for assign in assignments_raw:
                if assign['duedate']:
                    processed_events.append({
                        'eventid': f"assignment-{assign['assignmentid']}",
                        'eventname': f"Assignment Due: {assign['content']}",
                        'eventdate': assign['duedate'],
                        'type': 'assignment'
                    })
            
            def get_date_obj(event_item):
                date_val = event_item['eventdate']
                if date_val is None:
                    print(f"Warning: Event item {event_item.get('eventid')} has None date.")
                    return datetime.max
                if isinstance(date_val, datetime):
                    return date_val
                if isinstance(date_val, PyDate):
                    return datetime.combine(date_val, datetime.min.time())
                if isinstance(date_val, str):
                    try:
                        # Handle potential 'Z' for UTC timezone info if present
                        return datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    except ValueError as e:
                        print(f"Warning: Could not parse date string '{date_val}' for event {event_item.get('eventid')}: {e}")
                        return datetime.max
                
                print(f"Warning: Unknown date type for event {event_item.get('eventid')}: {type(date_val)}")
                return datetime.max

            processed_events.sort(key=get_date_obj)

            return jsonify({'courseCode': course_code, 'events': processed_events}), 200

        except mysql.connector.Error as err:
            print(f"Database error in get_calendar_events_for_course: {err}")
            return jsonify({'error': f'Failed to retrieve calendar events: {str(err)}'}), 500
        except Exception as e:
            print(f"Unexpected error in get_calendar_events_for_course: {e}")
            return jsonify({'error': 'An internal error occurred while fetching calendar events.'}), 500
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    except Exception as e:
        print(f"Outer error in get_calendar_events_for_course: {e}")
        return jsonify({'error': 'Unexpected error during calendar event retrieval.'}), 500

@app.route('/calendar_events/student', methods=['GET'])
def get_calendar_events_for_student():
    try:
        student_id = request.args.get('studentId')
        event_date = request.args.get('eventDate')

        if not student_id or not event_date:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT ce.eventid, ce.eventname, ce.eventdate, ce.coursecode
                FROM CalendarEvents ce
                JOIN Enrol e ON ce.coursecode = e.coursecode
                WHERE e.userid = %s AND date(ce.eventdate) = %s
            """, (student_id, event_date))
            events = cursor.fetchall()

            return jsonify({'studentId': student_id, 'eventDate': event_date, 'events': events}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve student calendar events: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during student calendar event retrieval.'}), 500

@app.route('/create_calendar_event', methods=['POST'])
def create_calendar_event():
    try:
        data = request.get_json()
        course_code = data.get('courseCode')
        event_name = data.get('eventName')
        event_date = data.get('eventDate')
        created_by = data.get('createdBy')

        if not course_code or not event_name or not event_date or not created_by:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("SELECT coursecode FROM course WHERE coursecode = %s", (course_code,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Course does not exist'}), 404

            cursor.execute("SELECT userid FROM User WHERE userid = %s", (created_by,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Event creator does not exist'}), 404

            cursor.execute("""
                INSERT INTO CalendarEvents (coursecode, eventname, eventdate, createdby)
                VALUES (%s, %s, %s, %s)
            """, (course_code, event_name, event_date, created_by))
            conn.commit()

            return jsonify({'message': 'Calendar event created successfully'}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to create calendar event: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during calendar event creation.'}), 500

@app.route('/forums/<string:course_code>', methods=['GET'])
def get_forums(course_code):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT forumid, forumname FROM discussionforum WHERE coursecode = %s", (course_code,))
            forums = cursor.fetchall()

            return jsonify({'courseCode': course_code, 'forums': forums}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve forums: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during forum retrieval.'}), 500

@app.route('/create_forum', methods=['POST'])
def create_forum():
    try:
        data = request.get_json()
        course_code = data.get('courseCode')
        forum_name = data.get('forumName')

        if not course_code or not forum_name:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("SELECT coursecode FROM course WHERE coursecode = %s", (course_code,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Course does not exist'}), 404
            
            cursor.execute("INSERT INTO discussionforum (coursecode, forumname) VALUES (%s, %s)", (course_code, forum_name))
            conn.commit()

            return jsonify({'message': 'Forum created successfully'}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to create forum: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during forum creation.'}), 500

@app.route('/forums/student/<int:student_id>', methods=['GET'])
def get_student_forums(student_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        try:
            # First, check if student exists
            cursor.execute("SELECT studentid FROM Student WHERE studentid = %s", (student_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Student not found'}), 404

            # Get courses the student is enrolled in
            cursor.execute("""
                SELECT c.coursecode, c.coursename 
                FROM Course c 
                JOIN Enrol e ON c.coursecode = e.coursecode
                WHERE e.UserID = %s
            """, (student_id,))
            courses = cursor.fetchall()

            student_forums_data = []
            if courses: # Ensure courses is not None and not empty
                for course in courses:
                    course_code = course['coursecode']
                    course_name = course['coursename']
                    
                    # Get forums for this course
                    cursor.execute("""
                        SELECT forumid, forumname 
                        FROM DiscussionForum 
                        WHERE coursecode = %s
                    """, (course_code,))
                    forums_for_course = cursor.fetchall()
                    
                    student_forums_data.append({
                        "courseCode": course_code,
                        "courseName": course_name,
                        "forums": forums_for_course
                    })

            return jsonify({'studentId': student_id, 'courses_forums': student_forums_data}), 200

        except mysql.connector.Error as err:
            # It's good practice to log the error server-side
            print(f"Database error in get_student_forums for student {student_id}: {err}")
            return jsonify({'error': f'Failed to retrieve student forums: {str(err)}'}), 500
        finally:
            if conn and conn.is_connected(): # Check if conn was successfully established and is still connected
                cursor.close()
                conn.close()
    except Exception as e:
        # Log the exception e for debugging
        print(f"Unexpected error in get_student_forums for student {student_id}: {e}")
        return jsonify({'error': 'Unexpected error during student forum retrieval.'}), 500

@app.route('/threads/<int:forum_id>', methods=['GET'])
def get_threads(forum_id):
    sort = request.args.get('sort', 'new')  # 'new' or 'top'
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            if sort == 'top':
                cursor.execute("""
                    SELECT t.threadid, t.threadtitle, t.content, t.createdby, t.createdat, t.updatedat,
                        u.firstname, u.lastname, COALESCE(SUM(v.vote), 0) AS votes
                    FROM DiscussionThread t
                    LEFT JOIN ThreadVote v ON t.threadid = v.threadid
                    LEFT JOIN User u ON t.createdby = u.userid
                    WHERE t.forumid = %s
                    GROUP BY t.threadid
                    ORDER BY votes DESC, t.createdat DESC
                """, (forum_id,))
            else:
                cursor.execute("""
                    SELECT t.threadid, t.threadtitle, t.content, t.createdby, t.createdat, t.updatedat,
                        u.firstname, u.lastname, COALESCE(SUM(v.vote), 0) AS votes
                    FROM DiscussionThread t
                    LEFT JOIN ThreadVote v ON t.threadid = v.threadid
                    LEFT JOIN User u ON t.createdby = u.userid
                    WHERE t.forumid = %s
                    GROUP BY t.threadid
                    ORDER BY t.createdat DESC
                """, (forum_id,))
            threads = cursor.fetchall()

            return jsonify({'forumId': forum_id, 'threads': threads}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve discussion threads: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during thread retrieval.'}), 500

@app.route('/thread/<int:thread_id>/replies', methods=['GET'])
def get_thread_replies(thread_id):
    """
    Returns all replies for a thread as a nested tree, with vote counts.
    """
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT r.replyid, r.parentreplyid, r.content, r.createdby, r.replydate,
                    u.firstname, u.lastname, COALESCE(SUM(rv.vote), 0) AS votes
                FROM Reply r
                LEFT JOIN ReplyVote rv ON r.replyid = rv.replyid
                LEFT JOIN User u ON r.createdby = u.userid
                WHERE r.threadid = %s
                GROUP BY r.replyid
                ORDER BY r.replydate ASC
            """, (thread_id,))
            replies = cursor.fetchall()

            # Build nested tree
            reply_map = {r['replyid']: dict(r, children=[]) for r in replies}
            root_replies = []
            for r in replies:
                if r['parentreplyid']:
                    parent = reply_map.get(r['parentreplyid'])
                    if parent:
                        parent['children'].append(reply_map[r['replyid']])
                else:
                    root_replies.append(reply_map[r['replyid']])

            return jsonify({'threadId': thread_id, 'replies': root_replies}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve replies: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during reply retrieval.'}), 500

@app.route('/thread/<int:thread_id>/replies_flat', methods=['GET'])
def get_thread_replies_flat(thread_id):
    """
    Returns all replies for a thread as a flat list, with vote counts.
    """
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT r.replyid, r.parentreplyid, r.content, r.createdby, r.replydate,
                    u.firstname, u.lastname, COALESCE(SUM(rv.vote), 0) AS votes
                FROM Reply r
                LEFT JOIN ReplyVote rv ON r.replyid = rv.replyid
                LEFT JOIN User u ON r.createdby = u.userid
                WHERE r.threadid = %s
                GROUP BY r.replyid
                ORDER BY r.replydate ASC
            """, (thread_id,))
            replies = cursor.fetchall()
            return jsonify({'threadId': thread_id, 'replies': replies}), 200
        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve replies: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during reply retrieval.'}), 500

@app.route('/vote/thread', methods=['POST'])
def vote_thread():
    """
    Body: { "threadId": int, "userId": int, "vote": 1 or -1 }
    """
    try:
        data = request.get_json()
        thread_id = data.get('threadId')
        user_id = data.get('userId')
        vote = data.get('vote')
        if not thread_id or not user_id or vote not in [1, -1]:
            return jsonify({'error': 'Missing or invalid fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        try:
            # Upsert vote
            cursor.execute("""
                INSERT INTO ThreadVote (threadid, userid, vote)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE vote = %s
            """, (thread_id, user_id, vote, vote))
            conn.commit()
            return jsonify({'message': 'Vote recorded'}), 200
        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to vote: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during voting.'}), 500

@app.route('/vote/reply', methods=['POST'])
def vote_reply():
    """
    Body: { "replyId": int, "userId": int, "vote": 1 or -1 }
    """
    try:
        data = request.get_json()
        reply_id = data.get('replyId')
        user_id = data.get('userId')
        vote = data.get('vote')
        if not reply_id or not user_id or vote not in [1, -1]:
            return jsonify({'error': 'Missing or invalid fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        try:
            # Upsert vote
            cursor.execute("""
                INSERT INTO ReplyVote (replyid, userid, vote)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE vote = %s
            """, (reply_id, user_id, vote, vote))
            conn.commit()
            return jsonify({'message': 'Vote recorded'}), 200
        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to vote: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during voting.'}), 500

@app.route('/course_content/<string:course_code>', methods=['GET'])
def get_course_content(course_code):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT s.sectionid, s.sectiontitle, si.sectionitemid, si.itemtitle, si.link, si.filename, si.description
                FROM Section s
                LEFT JOIN SectionItem si ON s.sectionid = si.sectionid
                WHERE s.coursecode = %s
            """, (course_code,))
            content = cursor.fetchall()

            return jsonify({'courseCode': course_code, 'content': content}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve course content: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during course content retrieval.'}), 500

@app.route('/add_course_content', methods=['POST'])
def add_course_content():
    try:
        data = request.get_json()
        section_id = data.get('sectionId')
        item_title = data.get('itemTitle')
        link = data.get('link')
        filename = data.get('filename')
        description = data.get('description')

        if not section_id or not item_title:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("SELECT sectionid FROM Section WHERE sectionid = %s", (section_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Section does not exist'}), 404
            
            cursor.execute("""
                INSERT INTO SectionItem (sectionid, itemtitle, link, filename, description)
                VALUES (%s, %s, %s, %s, %s)
            """, (section_id, item_title, link, filename, description))
            conn.commit()

            return jsonify({'message': 'Course content added successfully'}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to add course content: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during course content addition.'}), 500

@app.route('/assignments/<string:course_code>', methods=['GET'])
def get_assignments(course_code):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT assignmentid, content, duedate FROM Assignment WHERE coursecode = %s", (course_code,))
            assignments = cursor.fetchall()

            return jsonify({'courseCode': course_code, 'assignments': assignments}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve assignments: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during assignment retrieval.'}), 500

@app.route('/submit_assignment', methods=['POST'])
def submit_assignment():
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        assignment_id = data.get('assignmentId')
        submission_content = data.get('submissionContent')

        if not student_id or not assignment_id or not submission_content:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("SELECT studentid FROM Student WHERE studentid = %s", (student_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'User is not a student'}), 403

            cursor.execute("SELECT assignmentid FROM Assignment WHERE assignmentid = %s", (assignment_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Assignment does not exist'}), 404

            cursor.execute("SELECT submissionid FROM Submission WHERE studentid = %s AND assignmentid = %s", (student_id, assignment_id))
            if cursor.fetchone():
                return jsonify({'error': 'Student has already submitted this assignment'}), 409

            cursor.execute("""
                INSERT INTO Submission (studentid, assignmentid, submissioncontent, uploaddate)
                VALUES (%s, %s, %s, now())
            """, (student_id, assignment_id, submission_content))
            conn.commit()

            return jsonify({'message': 'Assignment submitted successfully'}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to submit assignment: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during assignment submission.'}), 500

@app.route('/grade_assignment', methods=['POST'])
def grade_assignment():
    try:
        data = request.get_json()
        submission_id = data.get('submissionId')
        lecturer_id = data.get('lecturerId')
        score = data.get('score')

        if not submission_id or not lecturer_id or score is None:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("SELECT lecturerid FROM Lecturer WHERE lecturerid = %s", (lecturer_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'User is not a lecturer'}), 403

            cursor.execute("SELECT submissionid FROM Submission WHERE submissionid = %s", (submission_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Submission does not exist'}), 404

            cursor.execute("""
                INSERT INTO Grade (submissionid, lecturerid, score)
                VALUES (%s, %s, %s)
            """, (submission_id, lecturer_id, score))
            conn.commit()

            return jsonify({'message': 'Assignment graded successfully'}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to grade assignment: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during assignment grading.'}), 500

@app.route('/student/<int:student_id>/grades', methods=['GET'])
def get_student_grades(student_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor(dictionary=True)
        try:
            # Check if student exists
            cursor.execute("SELECT studentid FROM Student WHERE studentid = %s", (student_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Student not found'}), 404

            query = """
                SELECT
                    c.coursecode,
                    c.coursename,
                    a.assignmentid,
                    a.content AS assignmentcontent,
                    a.duedate AS assignmentduedate,
                    s.submissionid,
                    s.submissioncontent,
                    s.uploaddate AS submissiondate,
                    g.score
                FROM Enrol e
                JOIN Course c ON e.coursecode = c.coursecode
                JOIN Assignment a ON c.coursecode = a.coursecode
                LEFT JOIN Submission s ON a.assignmentid = s.assignmentid AND s.studentid = e.userid
                LEFT JOIN Grade g ON s.submissionid = g.submissionid
                WHERE e.userid = %s
                ORDER BY c.coursecode, a.duedate;
            """
            cursor.execute(query, (student_id,))
            grades = cursor.fetchall()
            return jsonify({'studentGrades': grades}), 200
        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve student grades: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error while fetching student grades.'}), 500

@app.route('/assignments/student/<int:student_id>', methods=['GET'])
def get_student_assignments_with_submissions(student_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor(dictionary=True)

        # First, check if student exists
        cursor.execute("SELECT studentid FROM Student WHERE studentid = %s", (student_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Student not found'}), 404

        # Fetch all assignments for courses the student is enrolled in,
        # along with their submission details (if any) and grades (if any)
        query = """
            SELECT
                c.coursecode,
                c.coursename,
                a.assignmentid,
                a.content AS assignment_content,
                a.duedate AS assignment_duedate,
                s.submissionid,
                s.submissioncontent,
                s.uploaddate AS submission_uploaddate,
                g.score
            FROM Enrol e
            JOIN Course c ON e.coursecode = c.coursecode
            JOIN Assignment a ON c.coursecode = a.coursecode
            LEFT JOIN Submission s ON a.assignmentid = s.assignmentid AND s.studentid = e.userid
            LEFT JOIN Grade g ON s.submissionid = g.submissionid
            WHERE e.userid = %s
            ORDER BY c.coursecode, a.duedate;
        """
        cursor.execute(query, (student_id,))
        results = cursor.fetchall()

        assignments_with_submissions = []
        for row in results:
            submission_details = None
            if row['submissionid']:
                submission_details = {
                    'submissionid': row['submissionid'],
                    'submissioncontent': row['submissioncontent'],
                    'uploaddate': row['submission_uploaddate'].isoformat() if row['submission_uploaddate'] else None,
                    'score': row['score']
                }
            
            assignments_with_submissions.append({
                'coursecode': row['coursecode'],
                'coursename': row['coursename'],
                'assignmentid': row['assignmentid'],
                'content': row['assignment_content'],
                'duedate': row['assignment_duedate'].isoformat() if row['assignment_duedate'] else None,
                'submission': submission_details
            })

        return jsonify({'student_assignments': assignments_with_submissions}), 200

    except mysql.connector.Error as err:
        print(f"DB Error in get_student_assignments_with_submissions: {err}")
        return jsonify({'error': f'Failed to retrieve student assignments: {str(err)}'}), 500
    except Exception as e:
        print(f"Error in get_student_assignments_with_submissions: {e}")
        return jsonify({'error': 'An unexpected error occurred while fetching student assignments.'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/assignments/course/<string:course_code>/student/<int:student_id>', methods=['GET'])
def get_course_assignments_for_student(course_code, student_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor(dictionary=True)

        # Check if student exists
        cursor.execute("SELECT studentid FROM student WHERE studentid = %s", (student_id,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Student not found'}), 404

        # Check if course exists
        cursor.execute("SELECT coursecode FROM course WHERE coursecode = %s", (course_code,))
        if cursor.fetchone() is None:
            return jsonify({'error': 'Course not found'}), 404

        # Fetch assignments for the course and the student's submission details
        query = """
            SELECT
                a.assignmentid,
                a.content AS assignment_content,
                a.duedate AS assignment_duedate,
                s.submissionid,
                s.submissioncontent,
                s.uploaddate AS submission_uploaddate,
                g.score
            FROM Assignment a
            LEFT JOIN submission s ON a.assignmentid = s.assignmentid AND s.studentid = %s
            LEFT JOIN Grade g ON s.submissionid = g.submissionid
            WHERE a.coursecode = %s
            ORDER BY a.duedate;
        """
        cursor.execute(query, (student_id, course_code))
        results = cursor.fetchall()

        course_assignments = []
        for row in results:
            submission_details = None
            if row['submissionid']:
                submission_details = {
                    'submissionid': row['submissionid'],
                    'submissioncontent': row['submissioncontent'],
                    'uploaddate': row['submission_uploaddate'].isoformat() if row['submission_uploaddate'] else None,
                    'score': row['score']
                }
            
            course_assignments.append({
                'assignmentid': row['assignmentid'],
                'content': row['assignment_content'],
                'duedate': row['assignment_duedate'].isoformat() if row['assignment_duedate'] else None,
                'submission': submission_details
            })

        return jsonify({'course_assignments': course_assignments}), 200

    except mysql.connector.Error as err:
        print(f"DB Error in get_course_assignments_for_student: {err}")
        return jsonify({'error': f'Failed to retrieve course assignments for student: {str(err)}'}), 500
    except Exception as e:
        print(f"Error in get_course_assignments_for_student: {e}")
        return jsonify({'error': 'An unexpected error occurred while fetching course assignments.'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/lecturer/<int:lecturer_id>/course_grades', methods=['GET'])
def get_lecturer_course_grades(lecturer_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = conn.cursor(dictionary=True)
        try:
            # Check if lecturer exists
            cursor.execute("SELECT lecturerid FROM Lecturer WHERE lecturerid = %s", (lecturer_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Lecturer not found'}), 404

            query = """
                SELECT
                    c.coursecode,
                    c.coursename,
                    a.assignmentid,
                    a.content AS assignmentcontent,
                    a.duedate AS assignmentduedate,
                    s.submissionid,
                    s.studentid,
                    u.firstname AS studentfirstname,
                    u.lastname AS studentlastname,
                    s.submissioncontent,
                    s.uploaddate AS submissiondate,
                    g.score
                FROM course c
                JOIN Assignment a ON c.coursecode = a.coursecode
                LEFT JOIN submission s ON a.assignmentid = s.assignmentid
                LEFT JOIN User u ON s.studentid = u.userid
                LEFT JOIN Grade g ON s.submissionid = g.submissionid
                WHERE c.lecturerid = %s
                ORDER BY c.coursecode, a.duedate, s.studentid;
            """
            cursor.execute(query, (lecturer_id,))
            course_grades = cursor.fetchall()
            return jsonify({'lecturerCourseGrades': course_grades}), 200
        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve lecturer course grades: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error while fetching lecturer course grades.'}), 500

@app.route('/reports/popular_courses', methods=['GET'])
def get_popular_courses():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT c.coursecode, c.coursename, count(e.UserID) AS student_count
                FROM Course c
                JOIN Enrol e ON c.coursecode = e.coursecode
                GROUP BY c.coursecode
                HAVING student_count >= 50
            """)
            courses = cursor.fetchall()

            return jsonify({'popularCourses': courses}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve popular courses: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during popular courses report.'}), 500

@app.route('/reports/active_students', methods=['GET'])
def get_active_students():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT s.studentid, u.firstname, u.lastname, count(e.coursecode) AS course_count
                FROM Student s
                JOIN User u ON s.studentid = u.userid
                JOIN Enrol e ON s.studentid = e.UserID
                GROUP BY s.studentid
                HAVING course_count >= 5
            """)
            students = cursor.fetchall()

            return jsonify({'activeStudents': students}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve active students: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during active students report.'}), 500

@app.route('/reports/busy_lecturers', methods=['GET'])
def get_busy_lecturers():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT l.lecturerid, u.firstname, u.lastname, count(c.coursecode) AS course_count
                FROM Lecturer l
                JOIN User u ON l.lecturerid = u.userid
                JOIN Course c ON l.lecturerid = c.lecturerid
                GROUP BY l.lecturerid
                HAVING course_count >= 3
            """)
            lecturers = cursor.fetchall()

            return jsonify({'busyLecturers': lecturers}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve busy lecturers: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during busy lecturers report.'}), 500

@app.route('/reports/top_courses', methods=['GET'])
def get_top_courses():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT c.coursecode, c.coursename, count(e.userid) AS student_count
                FROM Course c
                JOIN Enrol e ON c.coursecode = e.coursecode
                GROUP BY c.coursecode
                ORDER BY student_count DESC
                LIMIT 10
            """)
            courses = cursor.fetchall()

            return jsonify({'topEnrolledCourses': courses}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve top enrolled courses: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during top courses report.'}), 500

@app.route('/reports/top_students', methods=['GET'])
def get_top_students():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT s.studentid, u.firstname, u.lastname, avg(g.score) AS average_score
                FROM Student s
                JOIN User u ON s.studentid = u.userid
                JOIN Submission sub ON s.studentid = sub.studentid
                JOIN Grade g ON sub.submissionid = g.submissionid
                GROUP BY s.studentid
                ORDER BY average_score DESC
                LIMIT 10
            """)
            students = cursor.fetchall()

            return jsonify({'topStudents': students}), 200

        except mysql.connector.Error as err:
            return jsonify({'error': f'Failed to retrieve top students: {str(err)}'}), 500

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': 'Unexpected error during top students report.'}), 500

@app.route('/reply_thread', methods=['POST'])
def reply_to_thread():
    """
    Creates a new reply to a thread or to another reply.
    
    Expected request body:
    {
        "threadId": int,
        "parentReplyId": int or null,
        "content": string,
        "createdBy": int (User ID)
    }
    """
    try:
        data = request.get_json()
        thread_id = data.get('threadId')
        parent_reply_id = data.get('parentReplyId')  # Can be None for top-level replies
        content = data.get('content')
        created_by = data.get('createdBy')

        # Validate required fields
        if not thread_id or not content or not created_by:
            return jsonify({'error': 'Missing required fields: threadId, content, and createdBy are required'}), 400
        
        # Validate the thread exists
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        try:
            # Check if thread exists
            cursor.execute("SELECT threadid FROM DiscussionThread WHERE threadid = %s", (thread_id,))
            thread = cursor.fetchone()
            if not thread:
                return jsonify({'error': 'Thread not found'}), 404
            
            # Check if parent reply exists (if provided)
            if parent_reply_id:
                cursor.execute("SELECT replyid FROM Reply WHERE replyid = %s AND threadid = %s", 
                               (parent_reply_id, thread_id))
                parent_reply = cursor.fetchone()
                if not parent_reply:
                    return jsonify({'error': 'Parent reply not found or does not belong to this thread'}), 404
            
            # Check if User exists
            cursor.execute("SELECT userid FROM User WHERE userid = %s", (created_by,))
            User = cursor.fetchone()
            if not User:
                return jsonify({'error': 'User not found'}), 404
            
            # Insert the reply
            insert_query = """
                INSERT INTO Reply (threadid, parentreplyid, content, createdby, replydate)
                VALUES (%s, %s, %s, %s, NOW())
            """
            cursor.execute(insert_query, (thread_id, parent_reply_id, content, created_by))
            conn.commit()
            
            reply_id = cursor.lastrowid
            
            return jsonify({
                'message': 'Reply posted successfully',
                'replyId': reply_id
            }), 201
            
        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({'error': f'Failed to post reply: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': f'Unexpected error during reply posting: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(port=5000, host="0.0.0.0")