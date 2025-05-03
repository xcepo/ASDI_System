document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    const userNameElement = document.getElementById('user-name');
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileCreated = document.getElementById('profile-created');
    
    // Check if user is logged in
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      // Redirect to login if not authenticated
      redirectToLogin();
      return;
    }
    
    // Display user information
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    if (user.username) {
      userNameElement.textContent = user.username;
      profileUsername.textContent = user.username;
      profileEmail.textContent = user.email || 'Not available';
      
      // Fetch additional user data from the server
      fetchUserProfile();
    }
    
    // Handle logout
    logoutBtn.addEventListener('click', function() {
      // Clear authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      
      // Redirect to login page
      redirectToLogin();
    });
    
    // Fetch user profile data from the server
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            redirectToLogin();
            return;
          }
          throw new Error('Failed to fetch profile data');
        }
        
        const userData = await response.json();
        
        // Update UI with user data
        profileUsername.textContent = userData.username;
        profileEmail.textContent = userData.email;
        
        // Format and display creation date
        if (userData.createdAt) {
          const createdDate = new Date(userData.createdAt);
          profileCreated.textContent = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          profileCreated.textContent = 'Not available';
        }
        
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Display generic profile data if fetch fails
        profileCreated.textContent = 'Not available';
      }
    }
    
    // Helper function to redirect to login page
    function redirectToLogin() {
      window.location.href = 'login.html';
    }
  });