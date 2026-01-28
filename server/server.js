// ... imports ...
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files in production/electron
if (process.env.NODE_ENV === 'production' || process.env.IS_ELECTRON) {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// Get all reports
app.get('/api/reports', (req, res) => {
    db.all('SELECT id, reporterName, startDate, updatedAt FROM reports ORDER BY startDate DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get single report by ID or startDate
app.get('/api/reports/:idOrDate', (req, res) => {
    const param = req.params.idOrDate;
    const query = param.includes('-')
        ? 'SELECT * FROM reports WHERE startDate = ?'
        : 'SELECT * FROM reports WHERE id = ?';

    db.get(query, [param], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }
        // Parse entries and other JSON fields if stored as text
        res.json({
            ...row,
            entries: JSON.parse(row.entries || '{}')
        });
    });
});

// Create or Update report
app.post('/api/reports', (req, res) => {
    const { reporterName, startDate, entries, nextWeekPlan } = req.body;
    const entriesJson = JSON.stringify(entries || {});

    const query = `
    INSERT INTO reports (reporterName, startDate, entries, nextWeekPlan, updatedAt)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(startDate) DO UPDATE SET
      reporterName = excluded.reporterName,
      entries = excluded.entries,
      nextWeekPlan = excluded.nextWeekPlan,
      updatedAt = CURRENT_TIMESTAMP
  `;

    db.run(query, [reporterName, startDate, entriesJson, nextWeekPlan], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, startDate });
    });
});

// Delete report
app.delete('/api/reports/:id', (req, res) => {
    db.run('DELETE FROM reports WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deleted: this.changes });
    });
});

const startServer = (portToUse) => {
    return new Promise((resolve) => {
        const server = app.listen(portToUse || port, () => {
            console.log(`Server running at http://localhost:${portToUse || port}`);
            resolve(server);
        });
    });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    startServer(port);
}

export { app, startServer };
