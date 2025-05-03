document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const alertContainer = document.getElementById('alert-container');
    
    // Check if user is already logged in
    if (localStorage.getItem('authToken')) {
      redirectToDashboard();
    }
    
    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember-me').checked;
      
      // Simple validation
      if (!username || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
      }
      
      try {
        // Send login request to API
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        // Store token in localStorage or sessionStorage based on "remember me"
        if (rememberMe) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('authToken', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Show success message and redirect
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(redirectToDashboard, 1500);
        
      } catch (error) {
        // Apply animation to show error
        loginForm.classList.add('form-shake');
        setTimeout(() => loginForm.classList.remove('form-shake'), 500);
        
        // Show error message
        showAlert(error.message || 'An error occurred during login', 'danger');
      }
    });
    
    // Helper function to display alerts
    function showAlert(message, type) {
      alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    }
    
    // Helper function to redirect to dashboard
    function redirectToDashboard() {
      window.location.href = 'dashboard.html';
    }
  });