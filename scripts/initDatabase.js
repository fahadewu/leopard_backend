const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDatabase = async () => {
  let connection;
  
  try {
    // Connect to MySQL without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'leopard',
      password: process.env.DB_PASSWORD || 'leopard',
      database: process.env.DB_NAME || 'portfolio_db'
    });

    console.log('Connected to MySQL server');

    // Create database
    const dbName = process.env.DB_NAME || 'portfolio_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database ${dbName} created or already exists`);

    // Use the database
    await connection.execute(`USE ${dbName}`);

    // Create tables
    const tables = [
      // Users table for admin authentication
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Profile information
      `CREATE TABLE IF NOT EXISTS profile (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        bio TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        location VARCHAR(255),
        resume_url VARCHAR(500),
        profile_image VARCHAR(500),
        github_url VARCHAR(500),
        linkedin_url VARCHAR(500),
        twitter_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Skills
      `CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        level INT NOT NULL CHECK (level >= 0 AND level <= 100),
        category VARCHAR(100),
        icon VARCHAR(100),
        is_featured BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Projects
      `CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        long_description TEXT,
        technologies JSON,
        image_url VARCHAR(500),
        gallery_images JSON,
        github_url VARCHAR(500),
        demo_url VARCHAR(500),
        is_featured BOOLEAN DEFAULT FALSE,
        status ENUM('completed', 'in_progress', 'planned') DEFAULT 'completed',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Testimonials
      `CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        company VARCHAR(255),
        content TEXT NOT NULL,
        avatar_url VARCHAR(500),
        rating INT CHECK (rating >= 1 AND rating <= 5),
        is_featured BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Education
      `CREATE TABLE IF NOT EXISTS education (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution VARCHAR(255) NOT NULL,
        degree VARCHAR(255) NOT NULL,
        field_of_study VARCHAR(255),
        start_date DATE,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT,
        grade VARCHAR(50),
        activities TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Gallery
      `CREATE TABLE IF NOT EXISTS gallery (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        category VARCHAR(100),
        tags JSON,
        is_featured BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Contact messages
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    ];

    // Execute table creation
    for (const tableSQL of tables) {
      await connection.execute(tableSQL);
      console.log('Table created successfully');
    }

    // Insert default admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingUser.length === 0) {
      await connection.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [adminEmail, hashedPassword, 'admin']
      );
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log('Admin user already exists');
    }

    // Insert default profile
    const [existingProfile] = await connection.execute('SELECT id FROM profile LIMIT 1');
    
    if (existingProfile.length === 0) {
      await connection.execute(`
        INSERT INTO profile (name, title, bio, email, phone, location) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'Your Name',
        'Full Stack Developer & UI/UX Designer',
        'Passionate full-stack developer with 5+ years of experience creating innovative web applications.',
        'your@email.com',
        '+1 (234) 567-8900',
        'Your City, Country'
      ]);
      console.log('Default profile created');
    }

    // Insert sample data
    await insertSampleData(connection);

    console.log('✅ Database initialization completed successfully!');
    console.log(`📧 Admin login: ${adminEmail}`);
    console.log(`🔑 Admin password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const insertSampleData = async (connection) => {
  try {
    // Sample skills
    const skills = [
      ['React', 95, 'Frontend', 'Code', true, 1],
      ['Next.js', 90, 'Frontend', 'Globe', true, 2],
      ['TypeScript', 88, 'Language', 'Code', true, 3],
      ['Node.js', 85, 'Backend', 'Code', true, 4],
      ['MySQL', 80, 'Database', 'Database', false, 5],
      ['Tailwind CSS', 92, 'Frontend', 'Palette', true, 6]
    ];

    for (const skill of skills) {
      const [existing] = await connection.execute('SELECT id FROM skills WHERE name = ?', [skill[0]]);
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO skills (name, level, category, icon, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          skill
        );
      }
    }

    // Sample projects
    const projects = [
      [
        'E-Commerce Platform',
        'A full-stack e-commerce solution with payment integration',
        'Complete e-commerce platform built with Next.js and Node.js, featuring user authentication, payment processing with Stripe, inventory management, and admin dashboard.',
        JSON.stringify(['Next.js', 'TypeScript', 'Node.js', 'MySQL', 'Stripe']),
        '/api/placeholder/600/400',
        JSON.stringify([]),
        'https://github.com/example/ecommerce',
        'https://demo-ecommerce.com',
        true,
        'completed',
        1
      ],
      [
        'Task Management App',
        'Collaborative task management with real-time updates',
        'Real-time collaborative task management application with drag-and-drop functionality, team collaboration features, and progress tracking.',
        JSON.stringify(['React', 'Node.js', 'Socket.io', 'MongoDB']),
        '/api/placeholder/600/400',
        JSON.stringify([]),
        'https://github.com/example/taskmanager',
        'https://demo-tasks.com',
        true,
        'completed',
        2
      ]
    ];

    for (const project of projects) {
      const [existing] = await connection.execute('SELECT id FROM projects WHERE title = ?', [project[0]]);
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO projects (title, description, long_description, technologies, image_url, gallery_images, github_url, demo_url, is_featured, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          project
        );
      }
    }

    // Sample testimonials
    const testimonials = [
      [
        'John Smith',
        'Product Manager',
        'Tech Corp',
        'Amazing developer! Delivered high-quality work on time and exceeded expectations. Great communication throughout the project.',
        '/api/placeholder/100/100',
        5,
        true,
        1
      ],
      [
        'Sarah Johnson',
        'CEO',
        'StartupXYZ',
        'Professional, skilled, and reliable. Built our entire platform from scratch and it works flawlessly. Highly recommended!',
        '/api/placeholder/100/100',
        5,
        true,
        2
      ]
    ];

    for (const testimonial of testimonials) {
      const [existing] = await connection.execute('SELECT id FROM testimonials WHERE name = ? AND company = ?', [testimonial[0], testimonial[2]]);
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO testimonials (name, position, company, content, avatar_url, rating, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          testimonial
        );
      }
    }

    // Sample education
    const education = [
      [
        'University of Technology',
        'Bachelor of Science',
        'Computer Science',
        '2018-01-01',
        '2022-05-31',
        false,
        'Focused on software engineering, data structures, algorithms, and web development.',
        '3.8 GPA',
        'Dean\'s List, Programming Club President',
        1
      ]
    ];

    for (const edu of education) {
      const [existing] = await connection.execute('SELECT id FROM education WHERE institution = ? AND degree = ?', [edu[0], edu[1]]);
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO education (institution, degree, field_of_study, start_date, end_date, is_current, description, grade, activities, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          edu
        );
      }
    }

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

// Run initialization
initDatabase();