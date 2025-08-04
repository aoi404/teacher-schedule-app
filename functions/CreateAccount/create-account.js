// Create Account JS
// Determine API base URL for backend (works for localhost and LAN)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : window.location.origin;

// Remove localStorage and logRegistrationToServer, use backend registration only
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
        // Prepare registration payload
        let payload = { name, role, password };
        if (role === 'teacher') {
            payload.schoolPassword = document.getElementById('schoolPassword').value.trim();
        }
        try {
            const resp = await fetch(`${API_BASE}/log/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (!resp.ok || data.error) {
                showError(data.error || 'Registration failed.');
                return;
            }
            // Registration successful, redirect to login
            if (role === 'teacher') {
                window.location.href = '../Login/login.html?role=teacher';
            } else {
                window.location.href = '../Login/login.html?role=student';
            }
        } catch (err) {
            showError('Network or server error. Please try again.');
        }
    });
    document.getElementById('backToLogin').onclick = function(e) {
        e.preventDefault();
        window.location.href = '../Login/login.html';
    };
});
