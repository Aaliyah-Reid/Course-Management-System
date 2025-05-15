"""
Optimized Firebase Batch Synchronization Utility

This script provides optimized functions to sync large datasets to Firebase using batch operations.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models.database import engine
from models.models import User, Student, Lecturer, Admin, Course, Assignment
from models.models import DiscussionForum, DiscussionThread
import time
import concurrent.futures

load_dotenv()

# Initialize Firebase
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    firebase_creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    
    if not firebase_creds_path:
        raise ValueError("Firebase credentials path not found in environment variables")
    
    if not firebase_admin._apps:
        cred = credentials.Certificate(firebase_creds_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

def batch_sync_to_firebase(collection_name, data_list, id_field, batch_size=500):
    """
    Sync data to Firebase using batched writes
    
    Args:
        collection_name: Name of the Firebase collection
        data_list: List of dictionaries containing the data to sync
        id_field: Field to use as document ID
        batch_size: Number of operations per batch (max 500 for Firestore)
    
    Returns:
        bool: Success status
    """
    try:
        # Initialize Firebase
        db = initialize_firebase()
        collection_ref = db.collection(collection_name)
        
        # Track progress
        total_items = len(data_list)
        processed_items = 0
        start_time = time.time()
        
        # Process in batches
        for i in range(0, total_items, batch_size):
            # Create a batch
            batch = db.batch()
            
            # Add operations to batch
            current_batch = data_list[i:i+batch_size]
            for item in current_batch:
                doc_id = str(item[id_field])
                doc_ref = collection_ref.document(doc_id)
                batch.set(doc_ref, item)
            
            # Commit the batch
            batch.commit()
            
            # Update progress
            processed_items += len(current_batch)
            elapsed_time = time.time() - start_time
            items_per_second = processed_items / elapsed_time if elapsed_time > 0 else 0
            
            print(f"Progress: {processed_items}/{total_items} items "
                  f"({(processed_items/total_items)*100:.1f}%) - "
                  f"Speed: {items_per_second:.1f} items/sec")
            
            # Small delay to avoid overwhelming Firebase
            time.sleep(0.5)
        
        total_time = time.time() - start_time
        print(f"Successfully synced {total_items} items to Firebase collection '{collection_name}' "
              f"in {total_time:.1f} seconds ({total_items/total_time:.1f} items/sec)")
        return True
        
    except Exception as e:
        print(f"Error in batch sync to Firebase: {str(e)}")
        return False

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

def sync_users_in_chunks(chunk_size=10000):
    """Sync users to Firebase in chunks"""
    try:
        with Session(engine) as session:
            # Get total count
            total_users = session.query(User).count()
            print(f"Total users to sync: {total_users}")
            
            # Process in chunks
            offset = 0
            while offset < total_users:
                print(f"Fetching users chunk: {offset} to {offset + chunk_size}")
                users_data = fetch_users_data(chunk_size, offset)
                
                if users_data:
                    batch_sync_to_firebase('users', users_data, 'userId')
                
                offset += chunk_size
                
            return True
            
    except Exception as e:
        print(f"Error syncing users in chunks: {str(e)}")
        return False

def parallel_sync_collections():
    """Sync multiple collections in parallel"""
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # Submit sync tasks
            users_future = executor.submit(sync_users_in_chunks)
            courses_future = executor.submit(sync_courses_to_firebase)
            discussions_future = executor.submit(sync_discussions_to_firebase)
            
            # Wait for completion
            for future in concurrent.futures.as_completed([users_future, courses_future, discussions_future]):
                try:
                    result = future.result()
                    print(f"Task completed with result: {result}")
                except Exception as e:
                    print(f"Task failed with error: {str(e)}")
        
        return True
    
    except Exception as e:
        print(f"Error in parallel sync: {str(e)}")
        return False

def sync_courses_to_firebase():
    """Sync courses data to Firebase using batch operations"""
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
        
        return batch_sync_to_firebase('courses', courses_data, 'courseCode')
    
    except Exception as e:
        print(f"Error syncing courses: {str(e)}")
        return False

def sync_discussions_to_firebase():
    """Sync discussion forums to Firebase using batch operations"""
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
        
        return batch_sync_to_firebase('forums', forums_data, 'forumId')
    
    except Exception as e:
        print(f"Error syncing discussions: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Optimized Firebase Batch Synchronization")
    parser.add_argument("--users", action="store_true", help="Sync users to Firebase")
    parser.add_argument("--courses", action="store_true", help="Sync courses to Firebase")
    parser.add_argument("--discussions", action="store_true", help="Sync discussions to Firebase")
    parser.add_argument("--all", action="store_true", help="Sync all collections to Firebase")
    parser.add_argument("--parallel", action="store_true", help="Sync collections in parallel")
    parser.add_argument("--chunk-size", type=int, default=10000, help="Chunk size for large collections")
    
    args = parser.parse_args()
    
    if args.users:
        sync_users_in_chunks(args.chunk_size)
    elif args.courses:
        sync_courses_to_firebase()
    elif args.discussions:
        sync_discussions_to_firebase()
    elif args.parallel:
        parallel_sync_collections()
    elif args.all:
        sync_users_in_chunks(args.chunk_size)
        sync_courses_to_firebase()
        sync_discussions_to_firebase()
    else:
        # Default action: sync all sequentially
        sync_users_in_chunks(args.chunk_size)
        sync_courses_to_firebase()
        sync_discussions_to_firebase()
