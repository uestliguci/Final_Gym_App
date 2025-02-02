# GymApp Database Documentation

## Overview
This PostgreSQL database is designed to support a comprehensive gym management system, handling user authentication, video management, scheduling, progress tracking, and more.

## Setup Instructions

1. Install PostgreSQL 12 or higher
2. Create the database and schema:
```bash
psql -U postgres -f schema.sql
```

3. Run migrations:
```bash
psql -U postgres -f migrations.sql
```

4. Update the gymapp_user password in migrations.sql before running in production

## Database Structure

### Core Tables
- `users`: Main user table for both clients and instructors
  - Primary user information including authentication
  - Role-based access control (client/instructor/admin)
  - Basic profile information

- `user_settings`: User preferences and settings
  - Notification preferences
  - Theme and language settings
  - Timezone preferences

- `instructor_profiles`: Additional instructor information
  - Specialties and certifications
  - Availability schedule
  - Hourly rates and ratings

- `client_profiles`: Additional client information
  - Health information
  - Emergency contacts
  - Subscription status

### Content Management
- `videos`: Training video content
  - Instructor-created content
  - Categories and tags
  - View tracking

- `video_permissions`: Access control for videos
  - User-specific access rights
  - Time-based permissions

### Training Management
- `training_sessions`: Schedule management
  - One-on-one sessions
  - Session status tracking
  - Location and notes

- `exercises`: Exercise library
  - Exercise descriptions
  - Video instructions
  - Difficulty levels

- `workout_plans`: Structured workout programs
  - Client-specific plans
  - Duration and description
  - Created by instructors

- `workout_exercises`: Exercise details within workout plans
  - Sets, reps, and rest periods
  - Day-specific assignments
  - Exercise sequencing

### Progress Tracking
- `progress_records`: Client progress monitoring
  - Multiple measurement types
  - Photo progress tracking
  - Timestamped records

### Communication
- `messages`: Internal messaging system
  - Client-instructor communication
  - Read status tracking
  - Timestamp tracking

## Key Features

### Authentication & Authorization
- Secure password hashing using pgcrypto
- Role-based access control
- Session management

### Data Integrity
- Foreign key constraints
- Automatic timestamp updates
- Data validation triggers

### Performance Optimization
- Strategic indexing
- Materialized views for common queries
- Efficient query patterns

## Utility Functions

### User Management
- `register_user(email, password, role, first_name, last_name)`: Creates new user accounts
- `update_user_profile(user_id, ...)`: Updates user information
- `hash_password(password)`: Securely hashes passwords
- `verify_password(password, hash)`: Verifies password matches

### Training Management
- `schedule_training_session(...)`: Creates new training sessions
- `record_progress(...)`: Records client progress

## Views

### Instructor Schedule
```sql
SELECT * FROM instructor_schedule;
```
Shows upcoming sessions with client information

### Client Progress Summary
```sql
SELECT * FROM client_progress_summary;
```
Provides progress statistics by client and measurement type

## Best Practices

1. Always use parameterized queries to prevent SQL injection
2. Use the provided utility functions for common operations
3. Implement proper error handling for database operations
4. Regular backup of database
5. Monitor query performance using EXPLAIN ANALYZE
6. Use transactions for operations that modify multiple tables

## Security Considerations

1. Database user (gymapp_user) has limited permissions
2. Passwords are securely hashed using pgcrypto
3. Row-level security policies enforce data access control
4. Sensitive data is properly encrypted
5. Regular security audits recommended

## Maintenance

1. Regular VACUUM ANALYZE for optimal performance
2. Monitor and maintain indexes
3. Archive old data periodically
4. Keep PostgreSQL version updated
5. Regular backup strategy implementation

## Error Handling

The database includes various checks and constraints:
- Foreign key constraints
- Check constraints for valid values
- Unique constraints for data integrity
- Custom error messages for common issues

## Scaling Considerations

1. Partitioning strategy for large tables
2. Efficient indexing strategy
3. Connection pooling configuration
4. Regular performance monitoring
5. Caching strategy implementation

## Support

For issues or questions:
1. Check PostgreSQL logs for detailed error messages
2. Review function definitions for expected parameters
3. Consult schema.sql for table structures
4. Verify permissions for database operations
