const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

const init = async () => {
    try {
        await db.query(`
            DROP TABLE IF EXISTS entries, delay_alerts, reports, documents, wbs_nodes CASCADE;

            CREATE TABLE wbs_nodes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                level INT NOT NULL,
                parent_id INT REFERENCES wbs_nodes(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                discipline VARCHAR(100) NOT NULL,
                weight FLOAT NOT NULL DEFAULT 1.0,
                planned_progress FLOAT NOT NULL DEFAULT 0.0,
                progress FLOAT NOT NULL DEFAULT 0.0,
                status VARCHAR(50) DEFAULT 'ON_TRACK',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE entries (
                id SERIAL PRIMARY KEY,
                wbs_id INT REFERENCES wbs_nodes(id) ON DELETE CASCADE,
                progress FLOAT NOT NULL,
                quantity FLOAT NOT NULL,
                unit VARCHAR(50),
                lat FLOAT,
                lng FLOAT,
                image_path VARCHAR(255),
                audio_path VARCHAR(255),
                transcript TEXT,
                ai_tags JSONB DEFAULT '[]',
                status VARCHAR(50) DEFAULT 'SYNCED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE delay_alerts (
                id SERIAL PRIMARY KEY,
                wbs_id INT REFERENCES wbs_nodes(id) ON DELETE CASCADE,
                discipline VARCHAR(100),
                title VARCHAR(255) NOT NULL,
                details VARCHAR(255),
                severity VARCHAR(20) DEFAULT 'MEDIUM',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE reports (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                report_type VARCHAR(50) NOT NULL,
                file_size VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE documents (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sync_conflicts (
                id SERIAL PRIMARY KEY,
                task_code VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                conflict_type VARCHAR(50) NOT NULL, -- e.g. 'FAILED_UPLOAD', 'PROGRESS_CONFLICT', 'LOCATION_MISMATCH'
                mobile_value VARCHAR(100),
                manual_value VARCHAR(100),
                details TEXT,
                status VARCHAR(50) DEFAULT 'UNRESOLVED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('PostgreSQL: Schema setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Database setup error:', err);
        process.exit(1);
    }
};

init();