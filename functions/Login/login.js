// Login JS for Login Page
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || {};
}
function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}
function logLoginToServer(userId, role, name) {
    fetch('http://localhost:3001/log/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, name })
    });
}
// Determine API base URL for backend (works for localhost and LAN)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

window.addEventListener('DOMContentLoaded', function() {
    // Autofill ID if coming from registration
    const autofillID = localStorage.getItem('autofillLoginID');
    if (autofillID) {
        if (document.getElementById('teacherID')) document.getElementById('teacherID').value = autofillID;
        if (document.getElementById('studentID')) document.getElementById('studentID').value = autofillID;
        localStorage.removeItem('autofillLoginID');
    }
    // Show correct login form based on ?role= param
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role === 'teacher') {
        document.getElementById('teacherLoginForm').classList.remove('hidden');
        document.getElementById('studentLoginForm').classList.add('hidden');
    } else {
        document.getElementById('teacherLoginForm').classList.add('hidden');
        document.getElementById('studentLoginForm').classList.remove('hidden');
    }
    // Toggle password visibility (teacher)
    const passwordInput = document.getElementById('teacherPassword');
    if (passwordInput) {
        const togglePassword = document.createElement('span');
        togglePassword.textContent = '👁️';
        togglePassword.className = 'toggle-password';
        passwordInput.parentNode.insertBefore(togglePassword, passwordInput.nextSibling);
        togglePassword.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePassword.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                togglePassword.textContent = '👁️';
            }
        });
    }
    // Toggle password visibility (student)
    const studentPasswordInput = document.getElementById('studentPassword');
    if (studentPasswordInput) {
        const studentTogglePassword = document.createElement('span');
        studentTogglePassword.textContent = '👁️';
        studentTogglePassword.className = 'toggle-password';
        studentPasswordInput.parentNode.insertBefore(studentTogglePassword, studentPasswordInput.nextSibling);
        studentTogglePassword.addEventListener('click', () => {
            if (studentPasswordInput.type === 'password') {
                studentPasswordInput.type = 'text';
                studentTogglePassword.textContent = '🙈';
            } else {
                studentPasswordInput.type = 'password';
                studentTogglePassword.textContent = '👁️';
            }
        });
    }
    // Add error message container if not present
    let errorDiv = document.getElementById('loginErrorMsg');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'loginErrorMsg';
        errorDiv.style.color = '#d32f2f';
        errorDiv.style.fontWeight = '600';
        errorDiv.style.margin = '0.5em 0 1em 0';
        const container = document.querySelector('.container');
        if (container) container.insertBefore(errorDiv, container.firstChild);
    }
    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
        setTimeout(() => { errorDiv.textContent = ''; }, 5000);
    }
    // Teacher login
    document.getElementById('teacherSubmitButton').onclick = async function() {
        const id = document.getElementById('teacherID').value.trim();
        const password = document.getElementById('teacherPassword').value;
        if (!id || !password) {
            showError('Please enter your ID and password.');
            return;
        }
        try {
            const resp = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, password })
            });
            const data = await resp.json();
            if (!resp.ok) {
                showError(data.error || 'Login failed.');
                return;
            }
            if (data.user.role !== 'teacher') {
                showError('Invalid teacher ID.');
                return;
            }
            // Set login status
            localStorage.setItem('currentUserId', id);
            // Update users object in localStorage for settings/profile compatibility
            let users = JSON.parse(localStorage.getItem('users') || '{}');
            users[id] = data.user;
            localStorage.setItem('users', JSON.stringify(users));
            // Log login to backend
            logLoginToServer(id, data.user.role, data.user.name);
            // Redirect
            window.location.replace('/index/index.html');
        } catch (err) {
            showError('Network error. Please try again.');
        }
    };
    // Student login
    document.getElementById('studentSubmitButton').onclick = async function() {
        const id = document.getElementById('studentID').value.trim();
        const password = document.getElementById('studentPassword').value;
        if (!id || !password) {
            showError('Please enter your ID and password.');
            return;
        }
        try {
            const resp = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, password })
            });
            const data = await resp.json();
            if (!resp.ok) {
                showError(data.error || 'Login failed.');
                return;
            }
            if (data.user.role !== 'student') {
                showError('Invalid student ID.');
                return;
            }
            // Set login status
            localStorage.setItem('currentUserId', id);
            // Update users object in localStorage for settings/profile compatibility
            let users = JSON.parse(localStorage.getItem('users') || '{}');
            users[id] = data.user;
            localStorage.setItem('users', JSON.stringify(users));
            // Log login to backend
            logLoginToServer(id, data.user.role, data.user.name);
            // Redirect
            window.location.replace('/index/index.html');
        } catch (err) {
            showError('Network error. Please try again.');
        }
    };
});
