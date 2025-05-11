"""
Mark the initial migration as completed without actually running it.
This is useful when you already have the database tables created and
you want to start using Alembic for future migrations.
"""

import os
import sys
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic import command
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def mark_migration_as_complete():
    # Get database connection string from environment
    db_uri = os.getenv('SQLALCHEMY_DATABASE_URI')
    if not db_uri:
        print("Error: SQLALCHEMY_DATABASE_URI not found in environment variables")
        return False
    
    try:
        # Create Alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Get the migration script directory
        script_directory = ScriptDirectory.from_config(alembic_cfg)
        
        # Get the latest revision
        head_revision = script_directory.get_current_head()
        if not head_revision:
            print("No migration found. Please run 'alembic revision --autogenerate' first.")
            return False
        
        print(f"Found migration revision: {head_revision}")
        
        # Connect to the database
        engine = create_engine(db_uri)
        
        # Create alembic_version table if it doesn't exist
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL, 
                    PRIMARY KEY (version_num)
                )
            """))
            
            # Check if there's already a version
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            existing_version = result.scalar()
            
            if existing_version:
                print(f"Current version in database: {existing_version}")
                # Update to the new version
                conn.execute(text("UPDATE alembic_version SET version_num = :version"), 
                            {"version": head_revision})
            else:
                # Insert the new version
                conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:version)"), 
                            {"version": head_revision})
            
            conn.commit()
        
        print(f"Successfully marked migration {head_revision} as completed.")
        return True
    
    except Exception as e:
        print(f"Error marking migration as complete: {e}")
        return False

if __name__ == "__main__":
    success = mark_migration_as_complete()
    if success:
        print("\nMigration marked as complete. You can now use Alembic for future migrations.")
    else:
        print("\nFailed to mark migration as complete.")
        sys.exit(1)
