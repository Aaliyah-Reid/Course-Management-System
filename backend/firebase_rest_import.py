"""
Firebase REST API Import Utility

This script uses Firebase's REST API to import data, which can help bypass some rate limiting
issues that occur with the Admin SDK. It also implements exponential backoff and parallel processing.
"""

import json
import os
import time
import requests
import random
from datetime import datetime
import concurrent.futures
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models.database import engine
from models.models import User, Student, Lecturer, Admin, Course, Assignment
from models.models import DiscussionForum, DiscussionThread

load_dotenv()

# Firebase project settings
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'comp3161-project')
FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY')

# We'll set this later if provided as a command-line argument

# Base URL for Firestore REST API
FIRESTORE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"

# Directory to store temporary data
TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase_temp")
os.makedirs(TEMP_DIR, exist_ok=True)

def convert_to_firestore_value(value):
    """Convert Python value to Firestore value format"""
    if value is None:
        return {"nullValue": None}
    elif isinstance(value, bool):
        return {"booleanValue": value}
    elif isinstance(value, int):
        return {"integerValue": str(value)}
    elif isinstance(value, float):
        return {"doubleValue": value}
    elif isinstance(value, str):
        return {"stringValue": value}
    elif isinstance(value, list):
        array_values = []
        for v in value:
            if isinstance(v, dict):
                map_value = {"mapValue": {"fields": {}}}
                for k, val in v.items():
                    map_value["mapValue"]["fields"][k] = convert_to_firestore_value(val)
                array_values.append(map_value)
            else:
                array_values.append(convert_to_firestore_value(v))
        return {"arrayValue": {"values": array_values}}
    elif isinstance(value, dict):
        map_fields = {}
        for k, v in value.items():
            map_fields[k] = convert_to_firestore_value(v)
        return {"mapValue": {"fields": map_fields}}
    else:
        # Default to string for unsupported types
        return {"stringValue": str(value)}

def convert_to_firestore_document(data):
    """Convert Python dict to Firestore document format"""
    fields = {}
    for key, value in data.items():
        fields[key] = convert_to_firestore_value(value)
    return {"fields": fields}

def upload_document_with_retry(collection, doc_id, data, max_retries=10, base_delay=2):
    """Upload a document to Firestore with exponential backoff retry"""
    url = f"{FIRESTORE_BASE_URL}/{collection}/{doc_id}?key={FIREBASE_API_KEY}"
    document = convert_to_firestore_document(data)
    
    for attempt in range(max_retries):
        try:
            response = requests.patch(url, json=document)
            
            if response.status_code == 200:
                return True
            elif response.status_code == 429:  # Rate limited
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"Rate limited. Retrying in {delay:.2f} seconds...")
                time.sleep(delay)
            else:
                print(f"Error uploading document: {response.status_code} - {response.text}")
                if attempt == max_retries - 1:
                    return False
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                time.sleep(delay)
        
        except Exception as e:
            print(f"Exception during upload: {str(e)}")
            if attempt == max_retries - 1:
                return False
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)
    
    return False

def batch_upload_documents(collection, data_list, id_field, batch_size=50, max_workers=5):
    """Upload documents in parallel batches with rate limiting awareness"""
    total_items = len(data_list)
    processed_items = 0
    successful_items = 0
    failed_items = 0
    
    start_time = time.time()
    print(f"Starting upload of {total_items} items to {collection}...")
    
    # Process in batches to avoid overwhelming the system
    for i in range(0, total_items, batch_size):
        batch = data_list[i:i+batch_size]
        batch_start_time = time.time()
        
        # Upload batch in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            for item in batch:
                doc_id = str(item.pop(id_field) if id_field in item else f"auto_{i}")
                future = executor.submit(upload_document_with_retry, collection, doc_id, item)
                futures[future] = doc_id
            
            # Process results
            for future in concurrent.futures.as_completed(futures):
                doc_id = futures[future]
                try:
                    result = future.result()
                    if result:
                        successful_items += 1
                    else:
                        failed_items += 1
                except Exception as e:
                    print(f"Error uploading document {doc_id}: {str(e)}")
                    failed_items += 1
        
        # Update progress
        processed_items += len(batch)
        batch_time = time.time() - batch_start_time
        total_time = time.time() - start_time
        items_per_second = processed_items / total_time if total_time > 0 else 0
        
        print(f"Progress: {processed_items}/{total_items} items "
              f"({(processed_items/total_items)*100:.1f}%) - "
              f"Speed: {items_per_second:.1f} items/sec - "
              f"Success: {successful_items}, Failed: {failed_items}")
        
        # Always add a delay between batches to avoid rate limiting
        delay = max(3.0, 10.0 - batch_time) if batch_time < 10.0 else 1.0
        print(f"Adding delay of {delay:.2f}s to avoid rate limiting")
        time.sleep(delay)
    
    total_time = time.time() - start_time
    print(f"Completed upload to {collection}: {successful_items} successful, "
          f"{failed_items} failed, in {total_time:.2f} seconds "
          f"({successful_items/total_time:.1f} items/sec)")
    
    return successful_items, failed_items

def fetch_users_data(chunk_size=10000, offset=0):
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

def upload_users_in_chunks(chunk_size=10000, batch_size=100, max_workers=10):
    """Upload users to Firebase in chunks"""
    try:
        with Session(engine) as session:
            # Get total count
            total_users = session.query(User).count()
            print(f"Total users to upload: {total_users}")
            
            # Process in chunks
            offset = 0
            total_successful = 0
            total_failed = 0
            
            while offset < total_users:
                print(f"Fetching users chunk: {offset} to {offset + chunk_size}")
                users_data = fetch_users_data(chunk_size, offset)
                
                if users_data:
                    successful, failed = batch_upload_documents(
                        'users', users_data, 'userId', batch_size, max_workers
                    )
                    total_successful += successful
                    total_failed += failed
                
                offset += chunk_size
            
            print(f"Users upload complete: {total_successful} successful, {total_failed} failed")
            return total_successful, total_failed
            
    except Exception as e:
        print(f"Error uploading users: {str(e)}")
        return 0, 0

def upload_courses():
    """Upload courses to Firebase"""
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
        
        return batch_upload_documents('courses', courses_data, 'courseCode')
    
    except Exception as e:
        print(f"Error uploading courses: {str(e)}")
        return 0, 0

def upload_discussions():
    """Upload discussion forums to Firebase"""
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
        
        return batch_upload_documents('forums', forums_data, 'forumId')
    
    except Exception as e:
        print(f"Error uploading discussions: {str(e)}")
        return 0, 0

def upload_all_collections(chunk_size=10000, batch_size=100, max_workers=10):
    """Upload all collections to Firebase"""
    try:
        start_time = time.time()
        
        print("=== Starting upload of all collections ===")
        
        # Upload collections sequentially to avoid overwhelming Firebase
        users_result = upload_users_in_chunks(chunk_size, batch_size, max_workers)
        courses_result = upload_courses()
        discussions_result = upload_discussions()
        
        total_time = time.time() - start_time
        
        print("\n=== Upload Summary ===")
        print(f"Users: {users_result[0]} successful, {users_result[1]} failed")
        print(f"Courses: {courses_result[0]} successful, {courses_result[1]} failed")
        print(f"Discussions: {discussions_result[0]} successful, {discussions_result[1]} failed")
        print(f"Total time: {total_time:.2f} seconds")
        
        return True
    
    except Exception as e:
        print(f"Error in upload_all_collections: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Firebase REST API Import Utility")
    parser.add_argument("--users", action="store_true", help="Upload only users")
    parser.add_argument("--courses", action="store_true", help="Upload only courses")
    parser.add_argument("--discussions", action="store_true", help="Upload only discussions")
    parser.add_argument("--all", action="store_true", help="Upload all collections")
    parser.add_argument("--chunk-size", type=int, default=5000, help="Chunk size for large collections")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for uploads")
    parser.add_argument("--workers", type=int, default=5, help="Number of parallel workers")
    parser.add_argument("--api-key", type=str, help="Firebase API key (if not set in environment)")
    
    args = parser.parse_args()
    
    # Set API key from command line if provided
    global FIREBASE_API_KEY
    if args.api_key:
        FIREBASE_API_KEY = args.api_key
    
    # Make sure we have the API key
    if not FIREBASE_API_KEY:
        print("Error: Firebase API key is required. Either set FIREBASE_API_KEY environment variable or use --api-key")
        exit(1)
    
    if args.users:
        upload_users_in_chunks(args.chunk_size, args.batch_size, args.workers)
    elif args.courses:
        upload_courses()
    elif args.discussions:
        upload_discussions()
    elif args.all or not (args.users or args.courses or args.discussions):
        upload_all_collections(args.chunk_size, args.batch_size, args.workers)
