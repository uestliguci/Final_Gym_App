import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from './services/emailService';
const { Pool } = pkg;

type UserRole = 'client' | 'instructor';

interface SignupRequest {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  profile_image_url?: string | null;
  phone?: string;
  date_of_birth?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gym'
});

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
app.get('/api/test', (async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Email routes
app.post('/api/send-welcome-email', (async (req: Request, res: Response) => {
  try {
    const { to, name, type } = req.body;
    await sendWelcomeEmail(to, name, type);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

app.post('/api/send-password-reset', (async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const resetLink = `${process.env.CLIENT_URL}/reset-password?email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, resetLink);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

app.post('/api/send-verification-email', (async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(email)}`;
    await sendVerificationEmail(email, verificationLink);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Auth routes
app.post('/api/auth/signup', (async (req: Request<{}, any, SignupRequest>, res: Response) => {
  try {
    const { 
      id, 
      email, 
      password, 
      role, 
      first_name, 
      last_name, 
      profile_image_url,
      phone,
      date_of_birth 
    } = req.body;
    
    // First check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO users (
        id, 
        email, 
        password_hash, 
        role, 
        first_name, 
        last_name, 
        profile_image_url,
        phone,
        date_of_birth,
        created_at,
        updated_at
      )
      VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, role, first_name, last_name, profile_image_url, phone, date_of_birth`,
      [
        id, 
        email, 
        password, 
        role, 
        first_name, 
        last_name, 
        profile_image_url || null,
        phone || null,
        date_of_birth ? new Date(date_of_birth) : null
      ]
    );

    // Create default user settings
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)`,
      [id]
    );

    // Create role-specific profile
    if (role === 'instructor') {
      await pool.query(
        `INSERT INTO instructor_profiles (instructor_id) VALUES ($1)`,
        [id]
      );
    } else if (role === 'client') {
      await pool.query(
        `INSERT INTO client_profiles (client_id) VALUES ($1)`,
        [id]
      );
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, `${first_name} ${last_name}`, role);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error: any) {
    // Check for unique constraint violations
    if (error.code === '23505') { // unique_violation
      res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    } else {
      console.error('Signup error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}) as RequestHandler);

app.post('/api/auth/login', (async (req: Request<{}, any, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, profile_image_url, phone, date_of_birth
       FROM users
       WHERE email = $1 AND password_hash = crypt($2, password_hash)`,
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// User routes
app.get('/api/users/:id', (async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, profile_image_url, phone, date_of_birth
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Video routes
app.get('/api/videos', (async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.first_name, u.last_name
       FROM videos v
       JOIN users u ON v.instructor_id = u.id
       ORDER BY v.created_at DESC`
    );
    res.json({ success: true, videos: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

app.post('/api/videos', (async (req: Request, res: Response) => {
  try {
    const { title, description, url, instructorId, duration, category, tags } = req.body;
    const result = await pool.query(
      `INSERT INTO videos (title, description, url, instructor_id, duration, category, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, url, instructorId, duration, category, tags]
    );
    res.json({ success: true, video: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Training session routes
app.get('/api/sessions/:userId', (async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ts.*, 
              i.first_name as instructor_first_name,
              i.last_name as instructor_last_name,
              c.first_name as client_first_name,
              c.last_name as client_last_name
       FROM training_sessions ts
       JOIN users i ON ts.instructor_id = i.id
       JOIN users c ON ts.client_id = c.id
       WHERE ts.instructor_id = $1 OR ts.client_id = $1
       ORDER BY ts.start_time DESC`,
      [req.params.userId]
    );
    res.json({ success: true, sessions: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

app.post('/api/sessions', (async (req: Request, res: Response) => {
  try {
    const { instructorId, clientId, title, description, startTime, endTime, price } = req.body;
    const result = await pool.query(
      `INSERT INTO training_sessions 
       (instructor_id, client_id, title, description, start_time, end_time, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [instructorId, clientId, title, description, startTime, endTime, price]
    );
    res.json({ success: true, session: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Client profile routes
app.post('/api/create-client-profile', (async (req: Request, res: Response) => {
  try {
    const { userId, demographic, health, measurements } = req.body;

    // Update client profile with demographic data
    await pool.query(
      `UPDATE client_profiles 
       SET height = $1,
           weight = $2,
           date_of_birth = $3,
           gender = $4,
           occupation = $5,
           emergency_contact_name = $6,
           emergency_contact_phone = $7,
           health_conditions = $8,
           medical_history = $9,
           allergies = $10,
           blood_type = $11,
           lifestyle_habits = $12,
           body_measurements = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE client_id = $14`,
      [
        demographic.height,
        demographic.weight,
        demographic.dateOfBirth,
        demographic.gender,
        demographic.occupation,
        demographic.emergencyContactName,
        demographic.emergencyContactPhone,
        health.healthConditions,
        health.medicalHistory,
        health.allergies,
        health.bloodType,
        JSON.stringify(health.lifestyleHabits),
        JSON.stringify(measurements),
        userId
      ]
    );

    // Create initial progress record for weight and measurements
    await pool.query(
      `INSERT INTO progress_records 
       (client_id, type, measurement_value, measurement_unit, recorded_at)
       VALUES 
       ($1, 'weight', $2, 'kg', CURRENT_TIMESTAMP),
       ($1, 'measurement', $3, 'cm', CURRENT_TIMESTAMP)`,
      [
        userId,
        demographic.weight,
        measurements.chest // Using chest measurement as an example
      ]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating client profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Subscription plan routes
app.get('/api/subscription-plans', (async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM subscription_plans ORDER BY price ASC`
    );
    res.json({ success: true, plans: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

app.post('/api/subscribe', (async (req: Request, res: Response) => {
  try {
    const { userId, planId, instructorId } = req.body;
    
    // Get plan details
    const planResult = await pool.query(
      `SELECT * FROM subscription_plans WHERE id = $1`,
      [planId]
    );
    const plan = planResult.rows[0];
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Calculate end date based on subscription period
    const startDate = new Date();
    let endDate = new Date(startDate);
    switch (plan.period) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'biannual':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'one_time':
        endDate.setFullYear(endDate.getFullYear() + 100); // Effectively unlimited
        break;
    }

    // Create subscription
    const result = await pool.query(
      `INSERT INTO user_subscriptions 
       (user_id, plan_id, instructor_id, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [userId, planId, instructorId, startDate, endDate]
    );

    // Update client profile subscription status
    await pool.query(
      `UPDATE client_profiles 
       SET subscription_status = 'active',
           subscription_end_date = $1,
           subscription_type = $2,
           subscription_plan = $3
       WHERE client_id = $4`,
      [endDate, plan.is_platform_plan ? 'platform' : 'instructor', plan.name, userId]
    );

    res.json({ success: true, subscription: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Workout plan routes
app.get('/api/workout-plans', (async (req: Request, res: Response) => {
  try {
    const { instructorId, isPlatform } = req.query;
    let query = `
      SELECT wp.*, u.first_name, u.last_name,
             COUNT(DISTINCT r.id) as review_count,
             AVG(r.rating) as average_rating
      FROM workout_plans wp
      LEFT JOIN users u ON wp.instructor_id = u.id
      LEFT JOIN workout_plan_reviews r ON wp.id = r.workout_plan_id
    `;
    
    const params = [];
    if (instructorId) {
      query += ` WHERE wp.instructor_id = $1`;
      params.push(instructorId);
    } else if (isPlatform === 'true') {
      query += ` WHERE wp.is_platform_plan = true`;
    }
    
    query += ` GROUP BY wp.id, u.first_name, u.last_name ORDER BY wp.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, plans: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

app.post('/api/workout-plans', (async (req: Request, res: Response) => {
  try {
    const {
      instructorId,
      title,
      description,
      durationWeeks,
      difficultyLevel,
      equipmentNeeded,
      targetMuscles,
      isPlatformPlan,
      price,
      previewVideoUrl,
      thumbnailUrl,
      exercises
    } = req.body;

    // Start transaction
    await pool.query('BEGIN');

    // Create workout plan
    const planResult = await pool.query(
      `INSERT INTO workout_plans (
        instructor_id, title, description, duration_weeks,
        difficulty_level, equipment_needed, target_muscles,
        is_platform_plan, price, preview_video_url, thumbnail_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        instructorId, title, description, durationWeeks,
        difficultyLevel, equipmentNeeded, targetMuscles,
        isPlatformPlan, price, previewVideoUrl, thumbnailUrl
      ]
    );

    // Add exercises to the workout plan
    if (exercises && exercises.length > 0) {
      for (const exercise of exercises) {
        await pool.query(
          `INSERT INTO workout_exercises (
            workout_plan_id, exercise_id, week_number,
            day_of_week, sets, reps, rest_time,
            weight_suggestion, form_tips, alternatives,
            notes, sequence_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            planResult.rows[0].id, exercise.exerciseId, exercise.weekNumber,
            exercise.dayOfWeek, exercise.sets, exercise.reps, exercise.restTime,
            exercise.weightSuggestion, exercise.formTips, exercise.alternatives,
            exercise.notes, exercise.sequenceOrder
          ]
        );
      }
    }

    await pool.query('COMMIT');
    res.json({ success: true, plan: planResult.rows[0] });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// PDF workout guide routes
app.post('/api/workout-guides', (async (req: Request, res: Response) => {
  try {
    const { workoutPlanId, title, description, fileUrl, accessLevel } = req.body;
    const result = await pool.query(
      `INSERT INTO workout_guides (
        workout_plan_id, title, description, file_url, access_level
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [workoutPlanId, title, description, fileUrl, accessLevel]
    );
    res.json({ success: true, guide: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Instructor fee routes
app.post('/api/instructor-fees', (async (req: Request, res: Response) => {
  try {
    const {
      instructorId,
      sessionFee,
      videoFee,
      workoutPlanFee,
      platformCommissionRate
    } = req.body;

    const result = await pool.query(
      `INSERT INTO instructor_fees (
        instructor_id, session_fee, video_fee,
        workout_plan_fee, platform_commission_rate
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (instructor_id) DO UPDATE
      SET session_fee = $2,
          video_fee = $3,
          workout_plan_fee = $4,
          platform_commission_rate = $5
      RETURNING *`,
      [instructorId, sessionFee, videoFee, workoutPlanFee, platformCommissionRate]
    );
    res.json({ success: true, fees: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Progress routes
app.get('/api/progress/:userId', (async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM progress_records
       WHERE client_id = $1
       ORDER BY recorded_at DESC`,
      [req.params.userId]
    );
    res.json({ success: true, progress: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

app.post('/api/progress', (async (req: Request, res: Response) => {
  try {
    const { userId, type, value, unit, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO progress_records (client_id, type, measurement_value, measurement_unit, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, value, unit, notes]
    );
    res.json({ success: true, progress: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
