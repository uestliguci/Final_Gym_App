-- Initial database setup and migrations

-- Create database user with limited permissions
CREATE USER gymapp_user WITH PASSWORD 'your_secure_password_here';

-- Connect to gymapp database
\c gymapp;

-- Create extensions if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create function for handling password hashing
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 8));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for password verification
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hashed_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN hashed_password = crypt(password, hashed_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to register a new user
CREATE OR REPLACE FUNCTION register_user(
    p_email TEXT,
    p_password TEXT,
    p_role user_role,
    p_first_name TEXT,
    p_last_name TEXT
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Insert new user
    INSERT INTO users (
        email,
        password_hash,
        role,
        first_name,
        last_name
    ) VALUES (
        p_email,
        hash_password(p_password),
        p_role,
        p_first_name,
        p_last_name
    ) RETURNING id INTO v_user_id;

    -- Create user settings
    INSERT INTO user_settings (user_id) VALUES (v_user_id);

    -- Create role-specific profile
    IF p_role = 'instructor' THEN
        INSERT INTO instructor_profiles (instructor_id) VALUES (v_user_id);
    ELSIF p_role = 'client' THEN
        INSERT INTO client_profiles (client_id) VALUES (v_user_id);
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    p_user_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_profile_image_url TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_date_of_birth DATE DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        profile_image_url = COALESCE(p_profile_image_url, profile_image_url),
        phone = COALESCE(p_phone, phone),
        date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to schedule a training session
CREATE OR REPLACE FUNCTION schedule_training_session(
    p_instructor_id UUID,
    p_client_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_location TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Validate instructor
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_instructor_id AND role = 'instructor') THEN
        RAISE EXCEPTION 'Invalid instructor ID';
    END IF;

    -- Validate client
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_client_id AND role = 'client') THEN
        RAISE EXCEPTION 'Invalid client ID';
    END IF;

    -- Check for scheduling conflicts
    IF EXISTS (
        SELECT 1 FROM training_sessions
        WHERE instructor_id = p_instructor_id
        AND status != 'cancelled'
        AND (
            (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Scheduling conflict detected';
    END IF;

    -- Create session
    INSERT INTO training_sessions (
        instructor_id,
        client_id,
        title,
        description,
        start_time,
        end_time,
        location
    ) VALUES (
        p_instructor_id,
        p_client_id,
        p_title,
        p_description,
        p_start_time,
        p_end_time,
        p_location
    ) RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to record progress
CREATE OR REPLACE FUNCTION record_progress(
    p_client_id UUID,
    p_type progress_type,
    p_value DECIMAL,
    p_unit TEXT,
    p_notes TEXT DEFAULT NULL,
    p_photo_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_progress_id UUID;
BEGIN
    -- Validate client
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_client_id AND role = 'client') THEN
        RAISE EXCEPTION 'Invalid client ID';
    END IF;

    -- Record progress
    INSERT INTO progress_records (
        client_id,
        type,
        measurement_value,
        measurement_unit,
        notes,
        photo_url
    ) VALUES (
        p_client_id,
        p_type,
        p_value,
        p_unit,
        p_notes,
        p_photo_url
    ) RETURNING id INTO v_progress_id;

    RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_training_sessions_dates ON training_sessions(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_progress_records_client_type ON progress_records(client_id, type);

-- Grant necessary permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO gymapp_user;
