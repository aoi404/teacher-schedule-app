// logbook/server.js
// Simple Express server to log registration and login events
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { logEvent, logSupport, logPasswordChange, logRegistration, logTeacherProfile } = require('./logger');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const SCHOOL_PASSWORD = process.env.SCHOOL_PASSWORD || 'help'; // Set via environment variable or fallback

// Ensure ProfileImages folder exists
const PROFILE_IMAGES_DIR = path.join(__dirname, '../ProfileImages');
if (!fs.existsSync(PROFILE_IMAGES_DIR)) {
    fs.mkdirSync(PROFILE_IMAGES_DIR);
}

// Ensure TeacherProfiles folder exists inside logbook
const TEACHER_PROFILES_DIR = path.join(__dirname, 'TeacherProfiles');
if (!fs.existsSync(TEACHER_PROFILES_DIR)) {
    fs.mkdirSync(TEACHER_PROFILES_DIR);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, PROFILE_IMAGES_DIR);
    },
    filename: function (req, file, cb) {
        // Use userId + timestamp + ext for uniqueness
        const ext = path.extname(file.originalname);
        const userId = req.body.userId || 'unknown';
        cb(null, userId + '_' + Date.now() + ext);
    }
});
const upload = multer({ storage });

// Path to accounts.json file for all users
const ACCOUNTS_JSON_PATH = path.join(__dirname, 'user accounts', 'accounts.json');

// Save or update user in accounts.json
function saveAccount({ userId, name, role, password }) {
    let accounts = {};
    if (fs.existsSync(ACCOUNTS_JSON_PATH)) {
        try {
            accounts = JSON.parse(fs.readFileSync(ACCOUNTS_JSON_PATH, 'utf8'));
        } catch (e) {
            accounts = {};
        }
    }
    accounts[userId] = { userId, name, role, password };
    fs.writeFileSync(ACCOUNTS_JSON_PATH, JSON.stringify(accounts, null, 2));
}

// Log registration event
app.post('/log/register', (req, res) => {
    const { userId, role, name, password } = req.body;
    logEvent('REGISTER', userId, role, name);
    logRegistration({ userId, role, name, password });
    saveAccount({ userId, name, role, password });
    res.json({ status: 'ok' });
});

// Log login event
app.post('/log/login', (req, res) => {
    const { userId, role, name } = req.body;
    logEvent('LOGIN', userId, role, name);
    res.json({ status: 'ok' });
});

// Log support event (account recovery info)
app.post('/log/support', (req, res) => {
    logSupport(req.body);
    res.json({ status: 'ok' });
});

// Serve the logbook file for download
app.get('/logbook', (req, res) => {
    res.sendFile(path.join(__dirname, 'logbook.txt'));
});

// Endpoint to verify school password
app.post('/verify-school-password', (req, res) => {
    const { password } = req.body;
    if (password === SCHOOL_PASSWORD) {
        res.json({ valid: true });
    } else {
        res.json({ valid: false });
    }
});

// Avatar upload endpoint (overwrite old avatar, use userId as filename)
app.post('/upload/avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const userId = req.body.userId || 'unknown';
    const ext = path.extname(req.file.originalname);
    const newFilename = userId + ext;
    const newPath = path.join(PROFILE_IMAGES_DIR, newFilename);
    // Delete old avatars for this user
    const files = fs.readdirSync(PROFILE_IMAGES_DIR);
    files.forEach(file => {
        if (file.startsWith(userId + '_') || file === newFilename) {
            fs.unlinkSync(path.join(PROFILE_IMAGES_DIR, file));
        }
    });
    // Move uploaded file to new filename
    fs.renameSync(req.file.path, newPath);
    // Return relative path for frontend to use
    res.json({ filename: '/ProfileImages/' + newFilename });
});

// Log password change event
app.post('/log/password-change', (req, res) => {
    logPasswordChange(req.body);
    res.json({ status: 'ok' });
});

// Log teacher profile event
app.post('/log/teacher-profile', (req, res) => {
    logTeacherProfile(req.body);
    res.json({ status: 'ok' });
});

// Path to single teachers.json file
const TEACHERS_JSON_PATH = path.join(TEACHER_PROFILES_DIR, 'teachers.json');

// Save or update teacher profile in teachers.json
app.post('/teacher-profile', (req, res) => {
    const { userId, ...profile } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    let teachers = {};
    if (fs.existsSync(TEACHERS_JSON_PATH)) {
        try {
            teachers = JSON.parse(fs.readFileSync(TEACHERS_JSON_PATH, 'utf8'));
        } catch (e) {
            // If file is corrupted, start fresh
            teachers = {};
        }
    }
    teachers[userId] = { userId, ...profile };
    fs.writeFileSync(TEACHERS_JSON_PATH, JSON.stringify(teachers, null, 2));
    res.json({ status: 'ok' });
});

// Get all teacher profiles from teachers.json
app.get('/teacher-profiles', (req, res) => {
    if (!fs.existsSync(TEACHERS_JSON_PATH)) return res.json([]);
    try {
        const teachers = JSON.parse(fs.readFileSync(TEACHERS_JSON_PATH, 'utf8'));
        res.json(Object.values(teachers));
    } catch (e) {
        res.status(500).json({ error: 'Failed to read profiles' });
    }
});

// Get a single teacher profile by ID
app.get('/teacher-profile/:id', (req, res) => {
    const id = req.params.id;
    if (!fs.existsSync(TEACHERS_JSON_PATH)) return res.status(404).json({ error: 'Not found' });
    try {
        const teachers = JSON.parse(fs.readFileSync(TEACHERS_JSON_PATH, 'utf8'));
        if (!teachers[id]) return res.status(404).json({ error: 'Not found' });
        res.json(teachers[id]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to read profile' });
    }
});

// Login endpoint for cross-device login
app.post('/login', (req, res) => {
    const { userId, password } = req.body;
    console.log('LOGIN ATTEMPT:', userId, password, 'ACCOUNTS_JSON_PATH:', ACCOUNTS_JSON_PATH);
    if (!userId || !password) return res.status(400).json({ error: 'Missing userId or password' });
    let accounts = {};
    if (fs.existsSync(ACCOUNTS_JSON_PATH)) {
        try {
            accounts = JSON.parse(fs.readFileSync(ACCOUNTS_JSON_PATH, 'utf8'));
        } catch (e) {
            return res.status(500).json({ error: 'Failed to read accounts' });
        }
    }
    const user = accounts[userId];
    if (!user) {
        console.log('User not found in accounts.json:', userId);
        return res.status(404).json({ error: 'User not found' });
    }
    if (user.password !== password) {
        console.log('Incorrect password for user:', userId);
        return res.status(401).json({ error: 'Incorrect password' });
    }
    res.json({ status: 'ok', user });
});

// Update password in accounts.json
app.post('/update-password', (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
        return res.status(400).json({ error: 'Missing userId or newPassword' });
    }
    let accounts = {};
    if (fs.existsSync(ACCOUNTS_JSON_PATH)) {
        try {
            accounts = JSON.parse(fs.readFileSync(ACCOUNTS_JSON_PATH, 'utf8'));
        } catch (e) {
            return res.status(500).json({ error: 'Failed to read accounts' });
        }
    }
    if (!accounts[userId]) {
        return res.status(404).json({ error: 'User not found' });
    }
    accounts[userId].password = newPassword;
    fs.writeFileSync(ACCOUNTS_JSON_PATH, JSON.stringify(accounts, null, 2));
    res.json({ status: 'ok' });
});

// --- SCHEDULE API ---
const SCHEDULE_JSON_PATH = path.join(__dirname, 'schedule', 'schedule.json');

// Get all schedules
app.get('/schedule', (req, res) => {
    if (!fs.existsSync(SCHEDULE_JSON_PATH)) return res.json({});
    try {
        const schedules = JSON.parse(fs.readFileSync(SCHEDULE_JSON_PATH, 'utf8'));
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ error: 'Failed to read schedules' });
    }
});

// Save or update a user's schedule
app.post('/schedule', (req, res) => {
    const { userId, time, content } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    let schedules = {};
    if (fs.existsSync(SCHEDULE_JSON_PATH)) {
        try {
            schedules = JSON.parse(fs.readFileSync(SCHEDULE_JSON_PATH, 'utf8'));
        } catch (e) {
            schedules = {};
        }
    }
    schedules[userId] = { time, content };
    fs.writeFileSync(SCHEDULE_JSON_PATH, JSON.stringify(schedules, null, 2));
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Logbook server running on http://localhost:${PORT}`);
});
