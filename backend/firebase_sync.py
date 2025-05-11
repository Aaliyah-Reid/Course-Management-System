"""
Firebase Synchronization Utility

This script provides functions to:
1. Publish database schema to Firebase
2. Sync specific data from your database to Firebase
3. Set up real-time listeners for Firebase data changes
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from dotenv import load_dotenv
from sqlalchemy import inspect, select
from sqlalchemy.orm import Session
from models.database import engine
from models.models import User, Student, Lecturer, Admin, Course, Assignment
from models.models import DiscussionForum, DiscussionThread
import threading
import time

load_dotenv()

# Initialize Firebase
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    # Check if Firebase credentials are provided as environment variables
    firebase_creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    
    if not firebase_creds_path:
        raise ValueError("Firebase credentials path not found in environment variables")
    
    # Initialize Firebase Admin SDK if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate(firebase_creds_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

# Schema Publishing
def publish_schema_to_firebase():
    """Publish database schema to Firebase"""
    try:
        # Get schema information
        inspector = inspect(engine)
        schema_info = {}
        
        # Get all tables
        for table_name in inspector.get_table_names():
            table_info = {
                'columns': {},
                'foreign_keys': [],
                'primary_key': []
            }
            
            # Get columns
            for column in inspector.get_columns(table_name):
                col_type = str(column['type'])
                table_info['columns'][column['name']] = {
                    'type': col_type,
                    'nullable': column.get('nullable', True),
                    'default': str(column.get('default', None))
                }
            
            # Get primary keys
            for pk in inspector.get_pk_constraint(table_name).get('constrained_columns', []):
                table_info['primary_key'].append(pk)
            
            # Get foreign keys
            for fk in inspector.get_foreign_keys(table_name):
                table_info['foreign_keys'].append({
                    'constrained_columns': fk.get('constrained_columns', []),
                    'referred_table': fk.get('referred_table', ''),
                    'referred_columns': fk.get('referred_columns', [])
                })
            
            schema_info[table_name] = table_info
        
        # Initialize Firebase
        db = initialize_firebase()
        
        # Create a document with the schema information
        schema_ref = db.collection('database_schema').document('current_schema')
        schema_ref.set({
            'tables': schema_info,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        # Also save a versioned copy for history
        version_ref = db.collection('database_schema_versions').document()
        version_ref.set({
            'tables': schema_info,
            'created_at': firestore.SERVER_TIMESTAMP
        })
        
        print("Schema successfully published to Firebase")
        return True
    
    except Exception as e:
        print(f"Error publishing schema to Firebase: {str(e)}")
        return False

# Data Synchronization
def sync_courses_to_firebase():
    """Sync courses data to Firebase"""
    try:
        # Initialize Firebase
        db = initialize_firebase()
        
        # Get courses from database
        with Session(engine) as session:
            courses = session.query(Course).all()
            
            # Convert courses to dictionary
            courses_data = []
            for course in courses:
                # Get lecturer information
                lecturer = session.query(User).filter(User.UserID == course.LecturerID).first()
                
                course_dict = {
                    'courseCode': course.CourseCode,
                    'courseName': course.CourseName,
                    'lecturerId': course.LecturerID,
                    'lecturerName': f"{lecturer.FirstName} {lecturer.LastName}" if lecturer else "Unknown",
                    'adminId': course.AdminID
                }
                courses_data.append(course_dict)
        
        # Update Firebase collection
        courses_collection = db.collection('courses')
        
        # Delete existing documents
        existing_docs = courses_collection.stream()
        for doc in existing_docs:
            doc.reference.delete()
        
        # Add new documents
        for course_data in courses_data:
            courses_collection.document(course_data['courseCode']).set(course_data)
        
        print(f"Successfully synced {len(courses_data)} courses to Firebase")
        return True
    
    except Exception as e:
        print(f"Error syncing courses to Firebase: {str(e)}")
        return False

def sync_users_to_firebase():
    """Sync users data to Firebase"""
    try:
        # Initialize Firebase
        db = initialize_firebase()
        
        # Get users from database
        with Session(engine) as session:
            users = session.query(User).all()
            
            # Convert users to dictionary
            users_data = []
            for user in users:
                # Don't include password in Firebase data
                user_dict = {
                    'userId': user.UserID,
                    'firstName': user.FirstName,
                    'lastName': user.LastName,
                    'userType': user.UserType
                }
                users_data.append(user_dict)
        
        # Update Firebase collection
        users_collection = db.collection('users')
        
        # Delete existing documents
        existing_docs = users_collection.stream()
        for doc in existing_docs:
            doc.reference.delete()
        
        # Add new documents
        for user_data in users_data:
            users_collection.document(str(user_data['userId'])).set(user_data)
        
        print(f"Successfully synced {len(users_data)} users to Firebase")
        return True
    
    except Exception as e:
        print(f"Error syncing users to Firebase: {str(e)}")
        return False

def sync_discussions_to_firebase():
    """Sync discussion forums and threads to Firebase"""
    try:
        # Initialize Firebase
        db = initialize_firebase()
        
        # Get forums and threads from database
        with Session(engine) as session:
            forums = session.query(DiscussionForum).all()
            
            # Convert forums to dictionary
            forums_data = []
            for forum in forums:
                # Get threads for this forum
                threads = session.query(DiscussionThread).filter(DiscussionThread.ForumID == forum.ForumID).all()
                
                threads_data = []
                for thread in threads:
                    # Get creator information
                    creator = session.query(User).filter(User.UserID == thread.CreatedBy).first()
                    
                    thread_dict = {
                        'threadId': thread.ThreadID,
                        'title': thread.ThreadTitle,
                        'content': thread.Content,
                        'createdBy': thread.CreatedBy,
                        'creatorName': f"{creator.FirstName} {creator.LastName}" if creator else "Unknown",
                        'createdAt': thread.CreatedAt.isoformat() if thread.CreatedAt else None,
                        'updatedAt': thread.UpdatedAt.isoformat() if thread.UpdatedAt else None
                    }
                    threads_data.append(thread_dict)
                
                forum_dict = {
                    'forumId': forum.ForumID,
                    'forumName': forum.ForumName,
                    'courseCode': forum.CourseCode,
                    'threads': threads_data
                }
                forums_data.append(forum_dict)
        
        # Update Firebase collection
        forums_collection = db.collection('forums')
        
        # Delete existing documents
        existing_docs = forums_collection.stream()
        for doc in existing_docs:
            doc.reference.delete()
        
        # Add new documents
        for forum_data in forums_data:
            forums_collection.document(str(forum_data['forumId'])).set(forum_data)
        
        print(f"Successfully synced {len(forums_data)} forums to Firebase")
        return True
    
    except Exception as e:
        print(f"Error syncing discussions to Firebase: {str(e)}")
        return False

# Firebase Listeners
def setup_firebase_listeners():
    """Set up listeners for Firebase data changes"""
    try:
        # Initialize Firebase
        db = initialize_firebase()
        
        # Listen for changes to the courses collection
        courses_collection = db.collection('courses')
        
        # Define callback function for course changes
        def on_course_snapshot(col_snapshot, changes, read_time):
            for change in changes:
                if change.type.name == 'ADDED' or change.type.name == 'MODIFIED':
                    course_data = change.document.to_dict()
                    print(f"Course changed in Firebase: {course_data['courseCode']}")
                    
                    # Update database with changes
                    with Session(engine) as session:
                        course = session.query(Course).filter(Course.CourseCode == course_data['courseCode']).first()
                        if course:
                            course.CourseName = course_data['courseName']
                            course.LecturerID = course_data['lecturerId']
                            course.AdminID = course_data['adminId']
                            try:
                                session.commit()
                                print(f"Updated course in database: {course_data['courseCode']}")
                            except Exception as e:
                                session.rollback()
                                print(f"Error updating course in database: {str(e)}")
        
        # Watch the collection
        courses_watch = courses_collection.on_snapshot(on_course_snapshot)
        
        print("Firebase listeners set up successfully")
        return courses_watch
    
    except Exception as e:
        print(f"Error setting up Firebase listeners: {str(e)}")
        return None

# Sync All Data
def sync_all_to_firebase():
    """Sync all data to Firebase"""
    print("Starting data synchronization to Firebase...")
    
    # Publish schema
    if not publish_schema_to_firebase():
        print("Failed to publish schema to Firebase")
        return False
    
    # Sync data
    sync_functions = [
        sync_courses_to_firebase,
        sync_users_to_firebase,
        sync_discussions_to_firebase
    ]
    
    success = True
    for sync_func in sync_functions:
        if not sync_func():
            success = False
            print(f"Synchronization failed at {sync_func.__name__}")
            # Continue with other sync functions even if one fails
    
    if success:
        print("All data synchronized successfully to Firebase!")
    else:
        print("Some synchronization tasks failed. Please check the errors above.")
    
    return success

# Run as a service
def run_sync_service(interval_minutes=15):
    """Run the sync service at regular intervals"""
    print(f"Starting Firebase sync service (interval: {interval_minutes} minutes)")
    
    # Set up Firebase listeners
    listeners = setup_firebase_listeners()
    
    try:
        while True:
            # Sync all data to Firebase
            sync_all_to_firebase()
            
            # Wait for the next sync
            print(f"Next sync in {interval_minutes} minutes...")
            time.sleep(interval_minutes * 60)
    
    except KeyboardInterrupt:
        print("Sync service stopped by user")
        if listeners:
            listeners.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Firebase Synchronization Utility")
    parser.add_argument("--schema", action="store_true", help="Publish schema to Firebase")
    parser.add_argument("--sync", action="store_true", help="Sync all data to Firebase")
    parser.add_argument("--service", action="store_true", help="Run as a sync service")
    parser.add_argument("--interval", type=int, default=15, help="Sync interval in minutes (for service mode)")
    
    args = parser.parse_args()
    
    if args.schema:
        publish_schema_to_firebase()
    elif args.sync:
        sync_all_to_firebase()
    elif args.service:
        run_sync_service(args.interval)
    else:
        # Default action: sync all
        sync_all_to_firebase()
