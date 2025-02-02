-- Test 1: Create a test instructor
WITH new_instructor AS (
    INSERT INTO users (email, password, role, first_name, last_name)
    VALUES ('instructor@test.com', crypt('password123', gen_salt('bf')), 'instructor', 'John', 'Doe')
    RETURNING id, email, role
)
SELECT * FROM new_instructor;

-- Test 2: Create a test client
WITH new_client AS (
    INSERT INTO users (email, password, role, first_name, last_name)
    VALUES ('client@test.com', crypt('password123', gen_salt('bf')), 'client', 'Jane', 'Smith')
    RETURNING id, email, role
)
SELECT * FROM new_client;

-- Test 3: Create a subscription for the client
WITH new_subscription AS (
    INSERT INTO subscriptions (user_id, status, plan_type, start_date)
    SELECT id, 'active', 'premium', CURRENT_TIMESTAMP
    FROM users WHERE email = 'client@test.com'
    RETURNING id, user_id, status
)
SELECT * FROM new_subscription;

-- Test 4: Create a video by the instructor
WITH new_video AS (
    INSERT INTO videos (title, description, url, instructor_id, duration, category, tags)
    SELECT 
        'Test Workout Video',
        'Full body workout for beginners',
        'https://example.com/video1',
        id,
        1800,
        'Full Body',
        ARRAY['beginner', 'full body', 'strength']
    FROM users WHERE email = 'instructor@test.com'
    RETURNING id, title, instructor_id
)
SELECT * FROM new_video;

-- Test 5: Schedule a training session
WITH new_session AS (
    INSERT INTO training_sessions (
        instructor_id,
        client_id,
        title,
        description,
        start_time,
        end_time,
        price
    )
    SELECT 
        i.id,
        c.id,
        'Personal Training Session',
        'Initial fitness assessment and goal setting',
        CURRENT_TIMESTAMP + interval '1 day',
        CURRENT_TIMESTAMP + interval '1 day' + interval '1 hour',
        50.00
    FROM users i, users c
    WHERE i.email = 'instructor@test.com'
    AND c.email = 'client@test.com'
    RETURNING id, instructor_id, client_id, start_time
)
SELECT * FROM new_session;

-- Test 6: Record client progress
WITH new_progress AS (
    INSERT INTO progress_records (
        user_id,
        type,
        value,
        unit,
        notes
    )
    SELECT 
        id,
        'weight',
        75.5,
        'kg',
        'Initial weight measurement'
    FROM users WHERE email = 'client@test.com'
    RETURNING id, user_id, type, value
)
SELECT * FROM new_progress;

-- Test 7: Send a message
WITH new_message AS (
    INSERT INTO messages (
        sender_id,
        recipient_id,
        content
    )
    SELECT 
        i.id,
        c.id,
        'Welcome to your fitness journey! Looking forward to our first session.'
    FROM users i, users c
    WHERE i.email = 'instructor@test.com'
    AND c.email = 'client@test.com'
    RETURNING id, sender_id, recipient_id
)
SELECT * FROM new_message;

-- Test 8: Create a notification
WITH new_notification AS (
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type
    )
    SELECT 
        id,
        'Session Reminder',
        'You have a training session scheduled for tomorrow',
        'reminder'
    FROM users WHERE email = 'client@test.com'
    RETURNING id, user_id, title
)
SELECT * FROM new_notification;

-- Test 9: Verify relationships
SELECT 
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    s.status as subscription_status,
    s.plan_type,
    COUNT(DISTINCT ts.id) as total_sessions,
    COUNT(DISTINCT pr.id) as progress_records,
    COUNT(DISTINCT m.id) as unread_messages
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN training_sessions ts ON u.id = ts.client_id
LEFT JOIN progress_records pr ON u.id = pr.user_id
LEFT JOIN messages m ON u.id = m.recipient_id AND m.read_at IS NULL
WHERE u.email IN ('client@test.com', 'instructor@test.com')
GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, s.status, s.plan_type;

-- Test 10: View instructor's schedule
SELECT 
    ts.start_time,
    ts.end_time,
    ts.title,
    c.first_name as client_first_name,
    c.last_name as client_last_name,
    ts.status
FROM training_sessions ts
JOIN users c ON ts.client_id = c.id
WHERE ts.instructor_id = (SELECT id FROM users WHERE email = 'instructor@test.com')
ORDER BY ts.start_time;

-- Test 11: View client's videos
SELECT 
    v.title,
    v.description,
    v.duration,
    v.category,
    v.tags,
    i.first_name as instructor_first_name,
    i.last_name as instructor_last_name
FROM videos v
JOIN users i ON v.instructor_id = i.id
WHERE i.email = 'instructor@test.com';

-- Clean up test data (if needed)
-- DELETE FROM notifications;
-- DELETE FROM messages;
-- DELETE FROM progress_records;
-- DELETE FROM training_sessions;
-- DELETE FROM videos;
-- DELETE FROM subscriptions;
-- DELETE FROM users WHERE email IN ('instructor@test.com', 'client@test.com');
