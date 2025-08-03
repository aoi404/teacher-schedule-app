// logbook/logger.js
// Simple logger for registration and login events
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname);
const LOG_FILE = path.join(LOG_DIR, 'logbook.txt');
const SUPPORT_FILE = path.join(LOG_DIR, 'support.txt');
const PASSWORD_CHANGE_FILE = path.join(LOG_DIR, 'password_changes.txt');
const REGISTER_FILE = path.join(LOG_DIR, 'register.txt');
const TEACHER_PROFILE_FILE = path.join(LOG_DIR, 'teacherprofile.txt');

function logEvent(eventType, userId, role, name) {
    const timestamp = new Date().toISOString();
    if (eventType === 'REGISTER') {
        const logLine = `[${timestamp}] REGISTER | ID: ${userId} | Role: ${role} | Name: ${name}\n`;
        fs.appendFile(REGISTER_FILE, logLine, err => {
            if (err) console.error('Failed to write register log:', err);
        });
    } else {
        const logLine = `[${timestamp}] ${eventType} | ID: ${userId} | Role: ${role} | Name: ${name}\n`;
        fs.appendFile(LOG_FILE, logLine, err => {
            if (err) console.error('Failed to write log:', err);
        });
    }
}

function logPasswordChange({ userId, oldPassword, newPassword }) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] PASSWORD_CHANGE | ID: ${userId} | OldPassword: ${oldPassword} | NewPassword: ${newPassword}\n`;
    fs.appendFile(PASSWORD_CHANGE_FILE, logLine, err => {
        if (err) console.error('Failed to write password change log:', err);
    });
}

function logSupport({ userId, password, email, note }) {
    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] SUPPORT_REQUEST | ID: ${userId} | Password: ${password}`;
    if (email) logLine += ` | Email: ${email}`;
    if (note) logLine += ` | Note: ${note}`;
    logLine += '\n';
    fs.appendFile(SUPPORT_FILE, logLine, err => {
        if (err) console.error('Failed to write support log:', err);
    });
}

function logRegistration({ userId, role, name, password }) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] REGISTER | ID: ${userId} | Role: ${role} | Name: ${name} | Password: ${password}\n`;
    fs.appendFile(PASSWORD_CHANGE_FILE, logLine, err => {
        if (err) console.error('Failed to write registration log:', err);
    });
}

function logTeacherProfile(profile) {
    const timestamp = new Date().toISOString();
    const { id, fullName, status, note, gradeLevel } = profile;
    const logLine = `[${timestamp}] TEACHER_PROFILE | ID: ${id} | FullName: ${fullName} | Status: ${status} | GradeLevel: ${gradeLevel || ''} | Note: ${note || ''}\n`;
    fs.appendFile(TEACHER_PROFILE_FILE, logLine, err => {
        if (err) console.error('Failed to write teacher profile log:', err);
    });
}

module.exports = { logEvent, logSupport, logPasswordChange, logRegistration, logTeacherProfile };
