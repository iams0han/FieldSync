const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

const init = async () => {
    try {
        await db.query(`
            DROP TABLE IF EXISTS evd, act, wbs, prj CASCADE;

            CREATE TABLE prj (
                id SERIAL PRIMARY KEY,
                tnt VARCHAR(50) DEFAULT 'tenant_1',
                nm VARCHAR(255) NOT NULL,
                st VARCHAR(50) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE wbs (
                id SERIAL PRIMARY KEY,
                pid INT REFERENCES prj(id) ON DELETE CASCADE,
                prnt INT REFERENCES wbs(id) ON DELETE CASCADE,
                cd VARCHAR(50) NOT NULL,
                nm VARCHAR(255) NOT NULL,
                lvl INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE act (
                id SERIAL PRIMARY KEY,
                wbs_id INT REFERENCES wbs(id) ON DELETE CASCADE,
                wid INT REFERENCES wbs(id) ON DELETE CASCADE,
                nm VARCHAR(255) NOT NULL,
                plan_qty FLOAT NOT NULL DEFAULT 0,
                act_qty FLOAT NOT NULL DEFAULT 0,
                unt VARCHAR(50),
                st VARCHAR(50) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE evd (
                id SERIAL PRIMARY KEY,
                pid INT REFERENCES act(id) ON DELETE CASCADE,
                typ VARCHAR(20),
                uri VARCHAR(255),
                loc VARCHAR(255),
                ai_result JSONB,
                ai_confidence FLOAT,
                review_status VARCHAR(50) DEFAULT 'PENDING',
                review_reason TEXT,
                reviewed_by VARCHAR(100),
                reviewed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE aud (
                id SERIAL PRIMARY KEY,
                uid INT,
                act VARCHAR(255),
                bfr JSONB,
                aft JSONB,
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