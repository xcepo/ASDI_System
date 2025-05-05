document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const alertContainer = document.getElementById('alert-container');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Check if user is already logged in
    if (localStorage.getItem('authToken')) {
      redirectToDashboard();
    }

    // Password validation
    
    const validationItems = {
        length: document.getElementById('length-validation'),
        lowercase: document.getElementById('lowercase-validation'),
        uppercase: document.getElementById('uppercase-validation'),
        digit: document.getElementById('digit-validation'),
        symbol: document.getElementById('symbol-validation')
    };
    
    passwordInput.addEventListener('input', validatePassword);
    
    function validatePassword() {
        const password = passwordInput.value;
        
        // Check length
        if (password.length >= 6) {
            validationItems.length.classList.add('valid');
        } else {
            validationItems.length.classList.remove('valid');
        }
        
        // Check lowercase
        if (/[a-z]/.test(password)) {
            validationItems.lowercase.classList.add('valid');
        } else {
            validationItems.lowercase.classList.remove('valid');
        }
        
        // Check uppercase
        if (/[A-Z]/.test(password)) {
            validationItems.uppercase.classList.add('valid');
        } else {
            validationItems.uppercase.classList.remove('valid');
        }
        
        // Check digit
        if (/[0-9]/.test(password)) {
            validationItems.digit.classList.add('valid');
        } else {
            validationItems.digit.classList.remove('valid');
        }
        
        // Check symbol
        if (/[^A-Za-z0-9]/.test(password)) {
            validationItems.symbol.classList.add('valid');
        } else {
            validationItems.symbol.classList.remove('valid');
        }
        
        // Enable signup button if all validations pass
        const allValid = [...document.querySelectorAll('.validation-list li')].every(li => li.classList.contains('valid'));
        signupBtn.disabled = !allValid;
    }

    // Password match validation
    confirmPasswordInput.addEventListener('input', function() {
      if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.classList.add('is-invalid');
      } else {
        confirmPasswordInput.classList.remove('is-invalid');
      }
    });
    
    // Handle form submission
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const name = document.getElementById('name').value.trim();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const termsAccepted = document.getElementById('terms').checked;
      
      // Validation
      if (!name || !username || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'danger');
        return;
      }
      
      if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        confirmPasswordInput.classList.add('is-invalid');
        return;
      }
      
      if (!termsAccepted) {
        showAlert('Please accept the terms and conditions', 'danger');
        return;
      }
      
      if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'danger');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'danger');
        return;
      }
      
      try {
        // Send registration request to API
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message and redirect
        showAlert('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
        
      } catch (error) {
        // Apply animation to show error
        registerForm.classList.add('form-shake');
        setTimeout(() => registerForm.classList.remove('form-shake'), 500);
        
        // Show error message
        showAlert(error.message || 'An error occurred during registration', 'danger');
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