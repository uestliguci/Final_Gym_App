-- Create database
CREATE DATABASE gymapp;

-- Connect to database
\c gymapp;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('client', 'instructor', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'pending', 'cancelled');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE progress_type AS ENUM ('weight', 'measurement', 'exercise', 'photo');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_image_url TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notification_email BOOLEAN DEFAULT true,
    notification_sms BOOLEAN DEFAULT false,
    notification_push BOOLEAN DEFAULT true,
    theme_preference VARCHAR(20) DEFAULT 'light',
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Instructor profiles
CREATE TABLE instructor_profiles (
    instructor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[],
    certification_info TEXT[],
    years_of_experience INTEGER,
    hourly_rate DECIMAL(10,2),
    availability_schedule JSONB,
    rating DECIMAL(3,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client profiles
CREATE TABLE client_profiles (
    client_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    date_of_birth DATE,
    gender VARCHAR(50),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    health_conditions TEXT[],
    fitness_goals TEXT[],
    medical_history TEXT,
    allergies TEXT[],
    blood_type VARCHAR(10),
    occupation VARCHAR(100),
    lifestyle_habits JSONB,
    body_measurements JSONB,
    subscription_status subscription_status DEFAULT 'inactive',
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    subscription_type VARCHAR(50),
    subscription_plan VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER NOT NULL, -- in seconds
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Video access permissions
CREATE TABLE video_permissions (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT true,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (video_id, user_id)
);

-- Training sessions
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id),
    client_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status session_status DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress tracking
CREATE TABLE progress_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type progress_type NOT NULL,
    measurement_value DECIMAL(10,2),
    measurement_unit VARCHAR(20),
    notes TEXT,
    photo_url TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercise library
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instruction_video_url TEXT,
    muscle_groups TEXT[],
    equipment_needed TEXT[],
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans
CREATE TYPE subscription_period AS ENUM ('monthly', 'quarterly', 'biannual', 'annual', 'one_time');

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    period subscription_period NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features JSONB,
    is_platform_plan BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    instructor_id UUID REFERENCES users(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status subscription_status DEFAULT 'active',
    payment_status VARCHAR(50),
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout plans
CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_weeks INTEGER,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    equipment_needed TEXT[],
    target_muscles TEXT[],
    is_platform_plan BOOLEAN DEFAULT false,
    price DECIMAL(10,2),
    preview_video_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User workout plans
CREATE TABLE user_workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    workout_plan_id UUID NOT NULL REFERENCES workout_plans(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    progress JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout exercises (modified to include more details)
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    week_number INTEGER,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7),
    sets INTEGER,
    reps INTEGER,
    rest_time INTEGER, -- in seconds
    weight_suggestion TEXT,
    form_tips TEXT,
    alternatives TEXT[],
    notes TEXT,
    sequence_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout plan reviews
CREATE TABLE workout_plan_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PDF workout guides
CREATE TABLE workout_guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    access_level VARCHAR(50) DEFAULT 'subscriber', -- 'public', 'subscriber', 'premium'
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Instructor fees
CREATE TABLE instructor_fees (
    instructor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    session_fee DECIMAL(10,2),
    video_fee DECIMAL(10,2),
    workout_plan_fee DECIMAL(10,2),
    platform_commission_rate DECIMAL(5,2), -- percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create additional indexes
CREATE INDEX idx_subscription_plans_period ON subscription_plans(period);
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_instructor ON user_subscriptions(instructor_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_workout_plans_instructor ON workout_plans(instructor_id);
CREATE INDEX idx_workout_plans_platform ON workout_plans(is_platform_plan);
CREATE INDEX idx_user_workout_plans_user ON user_workout_plans(user_id);
CREATE INDEX idx_workout_exercises_plan ON workout_exercises(workout_plan_id);
CREATE INDEX idx_workout_plan_reviews_plan ON workout_plan_reviews(workout_plan_id);

-- Create triggers for new tables
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workout_plans_updated_at
    BEFORE UPDATE ON user_workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at
    BEFORE UPDATE ON workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plan_reviews_updated_at
    BEFORE UPDATE ON workout_plan_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_guides_updated_at
    BEFORE UPDATE ON workout_guides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_fees_updated_at
    BEFORE UPDATE ON instructor_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages (moved after new tables)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_videos_instructor ON videos(instructor_id);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_training_sessions_instructor ON training_sessions(instructor_id);
CREATE INDEX idx_training_sessions_client ON training_sessions(client_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(start_time);
CREATE INDEX idx_progress_client ON progress_records(client_id);
CREATE INDEX idx_progress_type_date ON progress_records(type, recorded_at);
CREATE INDEX idx_workout_plans_instructor ON workout_plans(instructor_id);
CREATE INDEX idx_workout_plans_client ON workout_plans(client_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_profiles_updated_at
    BEFORE UPDATE ON instructor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
    BEFORE UPDATE ON workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW instructor_schedule AS
SELECT 
    ts.id,
    ts.instructor_id,
    u.first_name || ' ' || u.last_name as client_name,
    ts.title,
    ts.start_time,
    ts.end_time,
    ts.status,
    ts.location
FROM training_sessions ts
JOIN users u ON ts.client_id = u.id
WHERE ts.start_time >= CURRENT_DATE
ORDER BY ts.start_time;

CREATE VIEW client_progress_summary AS
SELECT 
    client_id,
    type,
    COUNT(*) as total_records,
    MIN(measurement_value) as min_value,
    MAX(measurement_value) as max_value,
    AVG(measurement_value) as avg_value,
    MIN(recorded_at) as first_record,
    MAX(recorded_at) as last_record
FROM progress_records
GROUP BY client_id, type;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gymapp_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gymapp_user;
