const mysql = require('mysql2/promise');
require('dotenv').config();

const addSampleData = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'leopard',
      password: process.env.DB_PASSWORD || 'leopard',
      database: process.env.DB_NAME || 'portfolio_db'
    });

    console.log('Connected to database');

    // Check if we already have data
    const [skillsRows] = await connection.execute('SELECT COUNT(*) as count FROM skills');
    const [projectsRows] = await connection.execute('SELECT COUNT(*) as count FROM projects');
    const [testimonialsRows] = await connection.execute('SELECT COUNT(*) as count FROM testimonials');

    console.log('Current data counts:');
    console.log('Skills:', skillsRows[0].count);
    console.log('Projects:', projectsRows[0].count);
    console.log('Testimonials:', testimonialsRows[0].count);

    // Add some sample skills if none exist
    if (skillsRows[0].count === 0) {
      const sampleSkills = [
        ['React', 90, 'Frontend', 'Code', 1, 1],
        ['Next.js', 85, 'Frontend', 'Globe', 1, 2],
        ['Node.js', 80, 'Backend', 'Code', 1, 3],
        ['TypeScript', 88, 'Language', 'Code', 1, 4],
        ['MySQL', 75, 'Database', 'Database', 0, 5]
      ];

      for (const skill of sampleSkills) {
        await connection.execute(
          'INSERT INTO skills (name, level, category, icon, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          skill
        );
      }
      console.log('Added sample skills');
    }

    // Add some sample projects if none exist
    if (projectsRows[0].count === 0) {
      const sampleProjects = [
        [
          'Portfolio Website',
          'A modern portfolio website built with Next.js',
          'A comprehensive portfolio website featuring dark theme, animations, and admin panel for content management.',
          JSON.stringify(['Next.js', 'TypeScript', 'Tailwind CSS', 'MySQL']),
          '/api/placeholder/600/400',
          JSON.stringify([]),
          'https://github.com/example/portfolio',
          'https://portfolio.example.com',
          1,
          'completed',
          1
        ],
        [
          'E-commerce Platform',
          'Full-stack e-commerce solution',
          'Complete e-commerce platform with user authentication, payment processing, and inventory management.',
          JSON.stringify(['React', 'Node.js', 'MongoDB', 'Stripe']),
          '/api/placeholder/600/400',
          JSON.stringify([]),
          'https://github.com/example/ecommerce',
          'https://shop.example.com',
          1,
          'completed',
          2
        ]
      ];

      for (const project of sampleProjects) {
        await connection.execute(
          'INSERT INTO projects (title, description, long_description, technologies, image_url, gallery_images, github_url, demo_url, is_featured, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          project
        );
      }
      console.log('Added sample projects');
    }

    // Add some sample testimonials if none exist
    if (testimonialsRows[0].count === 0) {
      const sampleTestimonials = [
        [
          'John Smith',
          'Product Manager',
          'Tech Corp',
          'Excellent work on our project. Professional, timely, and exceeded expectations.',
          '/api/placeholder/100/100',
          5,
          1,
          1
        ],
        [
          'Sarah Johnson',
          'CEO',
          'StartupXYZ',
          'Amazing developer! Built our entire platform and it works flawlessly.',
          '/api/placeholder/100/100',
          5,
          1,
          2
        ]
      ];

      for (const testimonial of sampleTestimonials) {
        await connection.execute(
          'INSERT INTO testimonials (name, position, company, content, avatar_url, rating, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          testimonial
        );
      }
      console.log('Added sample testimonials');
    }

    // Add some sample contact messages
    const [contactRows] = await connection.execute('SELECT COUNT(*) as count FROM contact_messages');
    if (contactRows[0].count === 0) {
      const sampleMessages = [
        ['Jane Doe', 'jane@example.com', 'Project Inquiry', 'Hi, I would like to discuss a potential project with you.'],
        ['Mike Wilson', 'mike@company.com', 'Website Development', 'We need a new website for our business. Can we schedule a call?'],
        ['Anna Brown', 'anna@startup.io', 'React Development', 'Looking for a React developer for a 3-month project.']
      ];

      for (const message of sampleMessages) {
        await connection.execute(
          'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
          message
        );
      }
      console.log('Added sample contact messages');
    }

    console.log('Sample data check completed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addSampleData();