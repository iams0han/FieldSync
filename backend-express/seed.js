const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

const seed = async () => {
    try {
        await db.query('TRUNCATE delay_alerts, entries, reports, documents, wbs_nodes RESTART IDENTITY CASCADE;');

        await db.query(`
            INSERT INTO wbs_nodes (id, code, level, parent_id, name, discipline, weight, planned_progress, progress, status) VALUES
            (1, 'L1.00', 1, NULL, 'Pipeline Expansion — Sector 7B', 'Project Management', 1.0, 74.0, 68.4, 'BEHIND'),
            (2, 'L2.01', 2, 1, 'Sector 7B Construction Phase', 'Construction', 0.8, 75.0, 68.4, 'BEHIND'),
            (3, 'L3.01', 3, 2, 'Main Station Area C3', 'Piping', 0.4, 78.0, 62.0, 'BEHIND'),
            (4, 'L3.02', 3, 2, 'Substation Area B1', 'Electrical', 0.3, 72.0, 64.0, 'ON_TRACK'),
            (5, 'L4.01', 4, 3, 'Spool Line Fabrication & Routing', 'Piping', 0.5, 80.0, 54.0, 'BEHIND'),
            (6, 'L4.02', 4, 4, 'Electrical Trays & Cable Pulling', 'Electrical', 0.5, 70.0, 61.0, 'ON_TRACK'),
            (7, 'L5.14', 5, 5, 'Spool Fabrication & Hydrotest Prep', 'Piping', 0.6, 75.0, 54.0, 'BEHIND'),
            (8, 'L5.09', 5, 5, 'Concrete Curing & Anchor Embedment', 'Civil', 0.4, 85.0, 82.0, 'ON_TRACK'),
            (9, 'L6.03', 6, 6, 'Cable Tray Support Welding', 'Electrical', 0.5, 65.0, 61.0, 'ON_TRACK'),
            (10, 'L6.11', 6, 6, 'Insulation Wrap & Tie-ins', 'Piping', 0.5, 45.0, 28.0, 'BEHIND');
            
            ALTER SEQUENCE wbs_nodes_id_seq RESTART WITH 11;

            INSERT INTO delay_alerts (wbs_id, discipline, title, details, severity) VALUES
            (7, 'Piping', 'Piping — Spool fabrication L5.14 behind by 9 days', 'Sector 7B • Area C3 • Critical Path', 'HIGH'),
            (9, 'Electrical', 'Electrical — Cable tray install stalled 5 days, no entries', 'Sector 7B • Area B1 • Supply Shortage', 'HIGH'),
            (8, 'Civil', 'Civil — Foundation inspection signed off', 'Sector 7B • Area A2 • Structural Check', 'LOW');

            INSERT INTO reports (title, report_type, file_size) VALUES
            ('Weekly Executive Summary — Oil India EPC', 'PDF', '2.4 MB'),
            ('WBS Schedule Variance Audit Log', 'XLSX', '1.1 MB'),
            ('AI Vision & YOLO11 Verification Metrics', 'PDF', '4.8 MB');

            INSERT INTO documents (name, category) VALUES
            ('Sector 7B Pipeline CAD Schematic v4.2.dwg', 'Blueprints'),
            ('HSE Compliance & Site Safety Guidelines.pdf', 'Safety'),
            ('Oil India Master Service Agreement 2026.pdf', 'Legal');

            INSERT INTO sync_conflicts (task_code, title, conflict_type, mobile_value, manual_value, details, status) VALUES
            ('PIP-05-001', 'Photo 2 upload failed - Retry upload', 'FAILED_UPLOAD', 'Pending', 'N/A', 'Network dropped during multipart sync payload handoff.', 'UNRESOLVED'),
            ('PIP-05-003', 'Progress conflict - 45% vs 60% - 4m old', 'PROGRESS_CONFLICT', '45%', '60%', 'Mobile report by field unit conflicts with control room manual log.', 'UNRESOLVED'),
            ('ELE-05-012', 'Location mismatch - 12m offset - 18m old', 'LOCATION_MISMATCH', '27.4712, 95.021', '27.4700, 95.019', 'GPS coordinates diverge outside acceptable engineering tolerance radius.', 'UNRESOLVED');
        `);

        console.log('PostgreSQL: Real dynamic data seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();