// server.js - Hamsika Infinity Node.js Express Backend
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Database Connection Pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hamsika_infinity',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
});

// GET /api/posts - Fetch all posts from SQL
app.get('/api/posts', async (req, res) => {
    try {
        const query = `
            SELECT p.post_id AS id, p.title, p.organization AS org, p.post_type AS type,
                   c.category_name AS category, p.total_vacancies AS vacancies,
                   p.qualification, p.application_fee AS fee,
                   p.apply_start_date AS "startDate", p.apply_last_date AS "lastDate",
                   p.apply_online_url AS "applyUrl", p.detailed_content AS details
            FROM job_posts p
            JOIN job_categories c ON p.category_id = c.category_id
            ORDER BY p.created_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database fetch error' });
    }
});

// POST /api/posts/sync - Sync admin posts into SQL Storage
app.post('/api/posts/sync', async (req, res) => {
    const posts = req.body;
    try {
        for (const post of posts) {
            await pool.query(`
                INSERT INTO job_posts (title, organization, post_type, category_id, total_vacancies, qualification, application_fee, apply_start_date, apply_last_date, apply_online_url, detailed_content)
                VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (post_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    organization = EXCLUDED.organization,
                    total_vacancies = EXCLUDED.total_vacancies,
                    qualification = EXCLUDED.qualification,
                    apply_last_date = EXCLUDED.apply_last_date;
            `, [post.title, post.org, post.type, post.vacancies, post.qualification, post.fee, post.startDate, post.lastDate, post.applyUrl, post.details]);
        }
        res.json({ success: true, message: "Database synchronized successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to write to database' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Hamsika Infinity Backend running on port ${PORT}`);
});
