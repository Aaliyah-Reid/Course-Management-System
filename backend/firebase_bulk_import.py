"""
Firebase Bulk Import Utility

This script exports data from your SQL database to JSON files in Firestore import format,
which can then be imported into Firebase using the Firebase Admin SDK or the Firebase console.
This approach is much faster than individual writes for large datasets.
"""

import json
import os
import time
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models.database import engine
from models.models import User, Student, Lecturer, Admin, Course, Assignment
from models.models import DiscussionForum, DiscussionThread, Reply, ThreadVote, ReplyVote
from models.models import Section, SectionItem, Submission, Grade, Enrol
import concurrent.futures
import subprocess

load_dotenv()

# Directory to store export files
EXPORT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase_exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

def generate_firestore_import_json(collection_name, data_list, id_field):
    """
    Generate JSON in Firestore import format
    
    Args:
        collection_name: Name of the Firebase collection
        data_list: List of dictionaries containing the data
        id_field: Field to use as document ID
    
    Returns:
        str: Path to the generated JSON file
    """
    # Format for Firestore import
    documents = []
    
    for item in data_list:
        doc_id = str(item.pop(id_field) if id_field in item else "auto_id")
        document = {
            "name": f"projects/comp3161-project/databases/(default)/documents/{collection_name}/{doc_id}",
            "fields": {}
        }
        
        # Convert each field to Firestore value format
        for key, value in item.items():
            if value is None:
                document["fields"][key] = {"nullValue": None}
            elif isinstance(value, bool):
                document["fields"][key] = {"booleanValue": value}
            elif isinstance(value, int):
                document["fields"][key] = {"integerValue": str(value)}
            elif isinstance(value, float):
                document["fields"][key] = {"doubleValue": value}
            elif isinstance(value, str):
                document["fields"][key] = {"stringValue": value}
            elif isinstance(value, list):
                array_values = []
                for v in value:
                    if isinstance(v, dict):
                        map_value = {"mapValue": {"fields": {}}}
                        for k, val in v.items():
                            if isinstance(val, str):
                                map_value["mapValue"]["fields"][k] = {"stringValue": val}
                            elif isinstance(val, int):
                                map_value["mapValue"]["fields"][k] = {"integerValue": str(val)}
                            elif isinstance(val, bool):
                                map_value["mapValue"]["fields"][k] = {"booleanValue": val}
                            # Add other types as needed
                        array_values.append(map_value)
                    elif isinstance(v, str):
                        array_values.append({"stringValue": v})
                    elif isinstance(v, int):
                        array_values.append({"integerValue": str(v)})
                    # Add other types as needed
                document["fields"][key] = {"arrayValue": {"values": array_values}}
            # Add other types as needed
        
        documents.append(document)
    
    # Create output file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(EXPORT_DIR, f"{collection_name}_{timestamp}.json")
    
    with open(output_file, 'w') as f:
        json.dump({"documents": documents}, f, indent=2)
    
    print(f"Generated Firestore import file: {output_file} with {len(documents)} documents")
    return output_file

def fetch_users_data(chunk_size=50000, offset=0):
    """Fetch users data in chunks"""
    with Session(engine) as session:
        users = session.query(User).limit(chunk_size).offset(offset).all()
        
        users_data = []
        for user in users:
            user_dict = {
                'userId': user.UserID,
                'firstName': user.FirstName,
                'lastName': user.LastName,
                'userType': user.UserType
                # Don't include password
            }
            users_data.append(user_dict)
        
        return users_data

def export_users_to_json(chunk_size=50000):
    """Export users to JSON files for Firebase import"""
    try:
        start_time = time.time()
        with Session(engine) as session:
            # Get total count
            total_users = session.query(User).count()
            print(f"Total users to export: {total_users}")
            
            # Process in chunks
            offset = 0
            file_paths = []
            
            while offset < total_users:
                print(f"Fetching users chunk: {offset} to {offset + chunk_size}")
                users_data = fetch_users_data(chunk_size, offset)
                
                if users_data:
                    # Generate import file
                    file_path = generate_firestore_import_json('users', users_data, 'userId')
                    file_paths.append(file_path)
                
                offset += chunk_size
            
            total_time = time.time() - start_time
            print(f"Exported {total_users} users to {len(file_paths)} files in {total_time:.2f} seconds")
            return file_paths
            
    except Exception as e:
        print(f"Error exporting users: {str(e)}")
        return []

def export_courses_to_json():
    """Export courses to JSON file for Firebase import"""
    try:
        with Session(engine) as session:
            courses = session.query(Course).all()
            
            courses_data = []
            for course in courses:
                lecturer = session.query(User).filter(User.UserID == course.LecturerID).first()
                
                course_dict = {
                    'courseCode': course.CourseCode,
                    'courseName': course.CourseName,
                    'lecturerId': course.LecturerID,
                    'lecturerName': f"{lecturer.FirstName} {lecturer.LastName}" if lecturer else "Unknown",
                    'adminId': course.AdminID
                }
                courses_data.append(course_dict)
        
        return generate_firestore_import_json('courses', courses_data, 'courseCode')
    
    except Exception as e:
        print(f"Error exporting courses: {str(e)}")
        return None

def export_discussions_to_json():
    """Export discussion forums to JSON file for Firebase import"""
    try:
        with Session(engine) as session:
            forums = session.query(DiscussionForum).all()
            
            forums_data = []
            for forum in forums:
                threads = session.query(DiscussionThread).filter(DiscussionThread.ForumID == forum.ForumID).all()
                
                threads_data = []
                for thread in threads:
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
        
        return generate_firestore_import_json('forums', forums_data, 'forumId')
    
    except Exception as e:
        print(f"Error exporting discussions: {str(e)}")
        return None

def export_assignments_to_json():
    """Export assignments to JSON file for Firebase import"""
    try:
        with Session(engine) as session:
            assignments = session.query(Assignment).all()
            
            assignments_data = []
            for assignment in assignments:
                assignment_dict = {
                    'assignmentId': assignment.AssignmentID,
                    'courseCode': assignment.CourseCode,
                    'content': assignment.Content,
                    'dueDate': assignment.DueDate.isoformat() if assignment.DueDate else None
                }
                assignments_data.append(assignment_dict)
        
        return generate_firestore_import_json('assignments', assignments_data, 'assignmentId')
    
    except Exception as e:
        print(f"Error exporting assignments: {str(e)}")
        return None

def export_all_collections():
    """Export all collections to JSON files for Firebase import"""
    try:
        start_time = time.time()
        
        # Export collections in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            users_future = executor.submit(export_users_to_json)
            courses_future = executor.submit(export_courses_to_json)
            discussions_future = executor.submit(export_discussions_to_json)
            assignments_future = executor.submit(export_assignments_to_json)
            
            # Wait for completion and collect results
            export_files = []
            for future in concurrent.futures.as_completed([users_future, courses_future, discussions_future, assignments_future]):
                try:
                    result = future.result()
                    if isinstance(result, list):
                        export_files.extend(result)
                    elif result:
                        export_files.append(result)
                except Exception as e:
                    print(f"Export task failed: {str(e)}")
        
        total_time = time.time() - start_time
        print(f"Exported all collections to {len(export_files)} files in {total_time:.2f} seconds")
        
        # Print import command instructions
        print("\n=== Firebase Import Instructions ===")
        print("To import these files to Firebase, use the Firebase Admin SDK or the gcloud command:")
        print("\nExample gcloud command:")
        print("gcloud firestore import gs://[BUCKET_NAME]/[IMPORT_DIRECTORY] --collection-ids=users,courses,forums,assignments")
        print("\nOr upload the files to the Firebase console and import them from there.")
        
        return export_files
    
    except Exception as e:
        print(f"Error in export_all_collections: {str(e)}")
        return []

def import_to_firebase_using_admin_sdk(export_files):
    """
    Import the generated JSON files to Firebase using the Admin SDK
    Note: This requires the firebase-admin package and proper credentials
    """
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Initialize Firebase
        firebase_creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
        if not firebase_creds_path:
            raise ValueError("Firebase credentials path not found in environment variables")
        
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_creds_path)
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        
        for file_path in export_files:
            print(f"Importing {file_path}...")
            with open(file_path, 'r') as f:
                data = json.load(f)
                
                # Extract collection name from file path
                file_name = os.path.basename(file_path)
                collection_name = file_name.split('_')[0]
                
                # Create a batch
                batch = db.batch()
                batch_count = 0
                batch_size = 500  # Firestore batch limit
                
                for doc in data.get('documents', []):
                    # Extract document ID from document name
                    doc_path = doc['name']
                    doc_id = doc_path.split('/')[-1]
                    
                    # Convert Firestore format back to Python dict
                    fields = {}
                    for key, value_obj in doc.get('fields', {}).items():
                        value_type = list(value_obj.keys())[0]
                        value = value_obj[value_type]
                        
                        if value_type == 'stringValue':
                            fields[key] = value
                        elif value_type == 'integerValue':
                            fields[key] = int(value)
                        elif value_type == 'doubleValue':
                            fields[key] = float(value)
                        elif value_type == 'booleanValue':
                            fields[key] = bool(value)
                        elif value_type == 'nullValue':
                            fields[key] = None
                        # Handle other types as needed
                    
                    # Add to batch
                    doc_ref = db.collection(collection_name).document(doc_id)
                    batch.set(doc_ref, fields)
                    batch_count += 1
                    
                    # Commit batch if it reaches the limit
                    if batch_count >= batch_size:
                        batch.commit()
                        print(f"Committed batch of {batch_count} documents")
                        batch = db.batch()
                        batch_count = 0
                
                # Commit any remaining documents
                if batch_count > 0:
                    batch.commit()
                    print(f"Committed final batch of {batch_count} documents")
            
            print(f"Imported {file_path} successfully")
        
        return True
    
    except Exception as e:
        print(f"Error importing to Firebase: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Firebase Bulk Import Utility")
    parser.add_argument("--export", action="store_true", help="Export data to JSON files")
    parser.add_argument("--import", dest="import_data", action="store_true", help="Import JSON files to Firebase")
    parser.add_argument("--users", action="store_true", help="Process only users")
    parser.add_argument("--courses", action="store_true", help="Process only courses")
    parser.add_argument("--discussions", action="store_true", help="Process only discussions")
    parser.add_argument("--assignments", action="store_true", help="Process only assignments")
    parser.add_argument("--all", action="store_true", help="Process all collections")
    parser.add_argument("--chunk-size", type=int, default=50000, help="Chunk size for large collections")
    
    args = parser.parse_args()
    
    if args.export:
        if args.users:
            export_users_to_json(args.chunk_size)
        elif args.courses:
            export_courses_to_json()
        elif args.discussions:
            export_discussions_to_json()
        elif args.assignments:
            export_assignments_to_json()
        elif args.all or not (args.users or args.courses or args.discussions or args.assignments):
            export_all_collections()
    
    elif args.import_data:
        # Find all JSON files in the export directory
        export_files = [os.path.join(EXPORT_DIR, f) for f in os.listdir(EXPORT_DIR) if f.endswith('.json')]
        if export_files:
            import_to_firebase_using_admin_sdk(export_files)
        else:
            print("No export files found. Run with --export first.")
    
    else:
        # Default action: export all
        export_all_collections()
