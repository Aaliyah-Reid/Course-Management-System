# Using Alembic with SQLAlchemy for Database Migrations

This guide explains how to use Alembic to manage your database schema and how to publish your schema to Firebase.

## Setup

The following components have been set up in your project:

1. **SQLAlchemy Models** - Located in `models/models.py`
2. **Alembic Configuration** - Located in `alembic.ini` and `migrations/` directory
3. **Firebase Publisher** - Located in `firebase_publisher.py`

## Prerequisites

Before using these tools, make sure you have:

1. Set up your `.env` file with the following variables:
   ```
   DB_HOST=your_db_host
   DB_USERNAME=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   FIREBASE_CREDENTIALS_PATH=path/to/your/firebase-credentials.json
   ```

2. Installed the required dependencies:
   ```
   pip install SQLAlchemy alembic Flask-SQLAlchemy firebase-admin
   ```

## Using Alembic for Database Migrations

### Initialize Alembic (first time only)

Alembic has already been initialized in this project. If you were starting from scratch, you would run:

```
alembic init migrations
```

### Generate Your First Migration

To create a migration based on your SQLAlchemy models:

```
alembic revision --autogenerate -m "Initial migration"
```

This will create a new migration script in the `migrations/versions/` directory.

### Apply Migrations to Your Database

To apply migrations to your database:

```
alembic upgrade head
```

This will apply all pending migrations to your database.

### Creating Additional Migrations

Whenever you make changes to your SQLAlchemy models, you can generate a new migration:

```
alembic revision --autogenerate -m "Description of changes"
```

Then apply the migration:

```
alembic upgrade head
```

### Rolling Back Migrations

If you need to roll back a migration:

```
alembic downgrade -1
```

Or to roll back to a specific revision:

```
alembic downgrade revision_id
```

## Publishing Schema to Firebase

The `firebase_publisher.py` script allows you to publish your database schema to Firebase Firestore.

### Prerequisites for Firebase

1. Create a Firebase project in the Firebase Console
2. Generate a service account key (Project Settings > Service Accounts > Generate new private key)
3. Save the key file and set the path in your `.env` file as `FIREBASE_CREDENTIALS_PATH`

### Publishing the Schema

To publish your schema to Firebase:

```
python firebase_publisher.py
```

This will:
1. Extract the schema information from your SQLAlchemy models
2. Connect to Firebase using your credentials
3. Publish the schema to the `database_schema/current_schema` document
4. Create a versioned copy in the `database_schema_versions` collection

### Schema Structure in Firebase

The schema in Firebase will have the following structure:

```
{
  "tables": {
    "table_name": {
      "columns": {
        "column_name": {
          "type": "column_type",
          "nullable": true/false,
          "default": "default_value"
        },
        ...
      },
      "primary_key": ["column_name", ...],
      "foreign_keys": [
        {
          "constrained_columns": ["column_name", ...],
          "referred_table": "table_name",
          "referred_columns": ["column_name", ...]
        },
        ...
      ]
    },
    ...
  },
  "updated_at": timestamp
}
```

## Integrating with Your Flask Application

The `app_sqlalchemy.py` file shows how to integrate SQLAlchemy with your Flask application. You can either:

1. Rename it to `app.py` to replace your current application
2. Gradually migrate your existing routes to use SQLAlchemy ORM instead of direct MySQL queries

## Best Practices

1. **Always back up your database** before applying migrations in production
2. **Test migrations** in a development environment first
3. **Keep migrations small and focused** on specific changes
4. **Include meaningful messages** in your migration descriptions
5. **Commit migration scripts** to version control
6. **Publish schema to Firebase** after successful migrations

## Troubleshooting

If you encounter issues:

1. Check your database connection details in `.env`
2. Ensure your SQLAlchemy models match your existing database schema
3. Look for error messages in the Alembic output
4. Verify Firebase credentials and permissions
