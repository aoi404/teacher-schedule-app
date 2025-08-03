// Create Account JS
// Determine API base URL for backend (works for localhost and LAN)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || {};
}
function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}
function logRegistrationToServer(userId, role, name, password) {
    fetch(`${API_BASE}/log/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, name, password })
    });
}
window.addEventListener('DOMContentLoaded', function() {
    // Add error message container if not present
    let errorDiv = document.getElementById('registerErrorMsg');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'registerErrorMsg';
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
    // Show/hide school password for teacher registration
    const registerRole = document.getElementById('registerRole');
    const schoolPasswordField = document.getElementById('schoolPasswordField');
    if (registerRole && schoolPasswordField) {
        registerRole.addEventListener('change', () => {
            schoolPasswordField.style.display = registerRole.value === 'teacher' ? 'block' : 'none';
        });
    }
    // Registration
    document.getElementById('registerSubmitButton').addEventListener('click', async function(e) {
        e.preventDefault();
        errorDiv.textContent = '';
        const name = document.getElementById('registerName').value.trim();
        const role = document.getElementById('registerRole').value;
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerPasswordConfirm').value.trim();
        if (!name || !password || !confirmPassword) {
            showError('Please fill out all fields.');
            return;
        }
        if (!role) {
            showError('Please select a role.');
            return;
        }
        if (password !== confirmPassword) {
            showError('Passwords do not match! Please try again.');
            return;
        }
        if (role === 'teacher') {
            const schoolPassword = document.getElementById('schoolPassword').value.trim();
            // Securely verify school password with backend
            const resp = await fetch(`${API_BASE}/verify-school-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: schoolPassword })
            });
            const data = await resp.json();
            if (!data.valid) {
                showError('Incorrect school password for teachers.');
                return;
            }
        }
        const users = getUsers();
        const id = Math.floor(100000 + Math.random() * 900000).toString();
        users[id] = { name, role, password, status: 'Not Available', note: '' };
        saveUsers(users);
        // Log registration to backend
        logRegistrationToServer(id, role, name, password);
        // Autofill the login form with the new ID and redirect to the correct login form
        localStorage.setItem('autofillLoginID', id);
        // Remove alert and redirect immediately for mobile compatibility
        if (role === 'teacher') {
            window.location.href = '../Login/login.html?role=teacher';
        } else {
            window.location.href = '../Login/login.html?role=student';
        }
    });
    document.getElementById('backToLogin').onclick = function(e) {
        e.preventDefault();
        window.location.href = '../Login/login.html';
    };
});
