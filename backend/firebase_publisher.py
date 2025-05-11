import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from dotenv import load_dotenv
from sqlalchemy import inspect
from models.database import engine
from models.models import Base

load_dotenv()

def get_schema_info():
    """Extract schema information from SQLAlchemy models"""
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
    
    return schema_info

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    # Check if Firebase credentials are provided as environment variables
    firebase_creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    
    if not firebase_creds_path:
        raise ValueError("Firebase credentials path not found in environment variables")
    
    # Initialize Firebase Admin SDK
    cred = credentials.Certificate(firebase_creds_path)
    firebase_admin.initialize_app(cred)
    
    return firestore.client()

def publish_schema_to_firebase():
    """Publish database schema to Firebase"""
    try:
        # Get schema information
        schema_info = get_schema_info()
        
        # Initialize Firebase
        db = initialize_firebase()
        
        # Create a document with the schema information
        schema_ref = db.collection('database_schema').document('current_schema')
        schema_ref.set({
            'tables': schema_info,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        # Also save a versioned copy for history
        timestamp = firestore.SERVER_TIMESTAMP
        version_ref = db.collection('database_schema_versions').document()
        version_ref.set({
            'tables': schema_info,
            'created_at': timestamp
        })
        
        print("Schema successfully published to Firebase")
        return True
    
    except Exception as e:
        print(f"Error publishing schema to Firebase: {str(e)}")
        return False

if __name__ == "__main__":
    publish_schema_to_firebase()
