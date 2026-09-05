const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

const seed = async () => {
    try {
        await db.query('TRUNCATE prj, wbs, act, evd, aud RESTART IDENTITY CASCADE;');

        await db.query(`
            INSERT INTO prj (id, tnt, nm, st) VALUES
            (1, 'tenant_1', 'Pipeline Expansion — Sector 7B', 'ACTIVE');
            
            ALTER SEQUENCE prj_id_seq RESTART WITH 2;

            INSERT INTO wbs (id, pid, prnt, cd, nm, lvl) VALUES
            (1, 1, NULL, 'L1.00', 'Project Management', 1),
            (2, 1, 1, 'L2.01', 'Sector 7B Construction Phase', 2),
            (3, 1, 2, 'L3.01', 'Main Station Area C3', 3);

            ALTER SEQUENCE wbs_id_seq RESTART WITH 4;

            INSERT INTO act (id, wbs_id, wid, nm, plan_qty, act_qty, unt, st) VALUES
            (1, 1, 1, 'Spool Line Fabrication & Routing', 100, 54, 'm', 'PENDING'),
            (2, 2, 2, 'Electrical Trays & Cable Pulling', 200, 160, 'm', 'APPROVED'),
            (3, 3, 3, 'Concrete Curing & Anchor Embedment', 50, 45, 'm3', 'PENDING');

            ALTER SEQUENCE act_id_seq RESTART WITH 4;

            INSERT INTO evd (id, pid, typ, uri, loc, ai_confidence, review_status) VALUES
            (1, 1, 'img', '/uploads/sample1.jpg', '27.4712, 95.021', 0.95, 'PENDING'),
            (2, 2, 'img', '/uploads/sample2.jpg', '27.4715, 95.022', 0.88, 'APPROVED');

            ALTER SEQUENCE evd_id_seq RESTART WITH 3;

            INSERT INTO aud (id, uid, act, bfr, aft) VALUES
            (1, 101, 'APPROVE_EVIDENCE', '{"status":"PENDING"}', '{"status":"APPROVED"}'),
            (2, 102, 'UPDATE_ACTIVITY', '{"qty":50}', '{"qty":54}');

            ALTER SEQUENCE aud_id_seq RESTART WITH 3;
        `);

        console.log('PostgreSQL: Real dynamic data seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();