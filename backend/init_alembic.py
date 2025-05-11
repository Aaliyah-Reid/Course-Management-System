"""
Initialize Alembic and create the first migration.
This script will:
1. Create the versions directory if it doesn't exist
2. Generate an initial migration based on the SQLAlchemy models
3. Apply the migration to create the database tables
"""

import os
import subprocess
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_alembic_command(cmd_name, *args):
    """Run an Alembic command using Python's module execution"""
    print(f"Running: alembic {cmd_name} {' '.join(args)}")
    
    # Import alembic modules here to avoid import errors
    from alembic.config import Config
    from alembic import command as alembic_command
    
    try:
        # Create Alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Run the appropriate command
        if cmd_name == "revision":
            alembic_command.revision(alembic_cfg, autogenerate=True, message=args[1] if len(args) > 1 else "")
        elif cmd_name == "upgrade":
            alembic_command.upgrade(alembic_cfg, args[0] if args else "head")
        else:
            print(f"Unknown Alembic command: {cmd_name}")
            return False
        
        return True
    except Exception as e:
        print(f"Error running Alembic command: {e}")
        return False

def main():
    # Ensure versions directory exists
    if not os.path.exists('migrations/versions'):
        os.makedirs('migrations/versions')
        print("Created migrations/versions directory")
    
    # Generate initial migration
    print("\n=== Generating initial migration ===")
    if not run_alembic_command("revision", "-m", "Initial migration"):
        print("Failed to generate migration")
        return False
    
    # Ask user if they want to apply the migration
    apply_migration = input("\nDo you want to apply the migration to create database tables? (y/n): ")
    if apply_migration.lower() == 'y':
        print("\n=== Applying migration ===")
        if not run_alembic_command("upgrade", "head"):
            print("Failed to apply migration")
            return False
        print("\nDatabase tables created successfully!")
    
    # Ask user if they want to publish schema to Firebase
    publish_to_firebase = input("\nDo you want to publish the schema to Firebase? (y/n): ")
    if publish_to_firebase.lower() == 'y':
        print("\n=== Publishing schema to Firebase ===")
        try:
            # Import the firebase publisher module
            import firebase_publisher
            if not firebase_publisher.publish_schema_to_firebase():
                print("Failed to publish schema to Firebase")
                return False
            print("\nSchema published to Firebase successfully!")
        except Exception as e:
            print(f"Error importing firebase_publisher: {e}")
            return False
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\nAlembic initialization completed successfully!")
    else:
        print("\nAlembic initialization failed.")
        sys.exit(1)
