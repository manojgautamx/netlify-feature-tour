function showTypingAnimation() {
    const typingAnimation = document.getElementById('typing-animation');
    const completionTick = document.getElementById('completion-tick');
    
    typingAnimation.style.display = 'inline';
    typingAnimation.classList.add('typing-dots'); // Add animation class

    completionTick.style.display = 'none'; // Hide tick during typing
}

function showCompletionTick() {
    const typingAnimation = document.getElementById('typing-animation');
    const completionTick = document.getElementById('completion-tick');
    
    typingAnimation.style.display = 'none'; // Hide dots when done
    completionTick.style.display = 'inline'; // Show completion tick
}

// Call these functions in your existing Quill on 'text-change' event

quill.on('text-change', () => {
    if (!isReceiving) {
        showTypingAnimation(); // Show typing animation

        // (Your existing debounce logic)
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const content = quill.getContents(); // Get content in Delta format
            socket.emit('text-update', content); // Send the text content to the server

            // Call completion tick after a short delay (e.g., 1 second)
            setTimeout(showCompletionTick, 1000); // Adjust the time as needed
        }, 300); // Send update after user stops typing for 300ms
    }
});



const btnSettings = document.getElementById('btn-settings');
const iconSettings = btnSettings.querySelector('ion-icon'); // Target the icon inside the button

btnSettings.addEventListener('click', function (e) {
  e.preventDefault(); // Prevent the default action

  // Add the rotation class to the icon only
  iconSettings.classList.add('rotate-animation');
  
  // Remove the rotation class after the animation ends
  setTimeout(() => {
    iconSettings.classList.remove('rotate-animation');
  }, 1500); // Match the duration of the animation in CSS (1 second)
});

const btnRotate = document.getElementById('btn-rotate');
const iconSettingsTwo = btnRotate.querySelector('ion-icon'); // Target the icon inside the button

btnRotate.addEventListener('click', function (e) {
  e.preventDefault(); // Prevent the default action

  // Add the rotation class to the icon only
  iconSettingsTwo.classList.add('rotate-animation');
  
  // Remove the rotation class after the animation ends
  setTimeout(() => {
    iconSettingsTwo.classList.remove('rotate-animation');
  }, 200); // Match the duration of the animation in CSS (1 second)
});


btnRotate.addEventListener('click', function (e) {
  e.preventDefault(); // Prevent the default action of the anchor

  // Refresh the page
  location.reload();
});


// dark mode

// Get references to the button and the stylesheets
const themeToggleButton = document.getElementById('theme-toggle');
const lightTheme = './css/main.css';
const darkTheme = './css/main-dark.css';
let currentTheme = lightTheme;

// Function to switch themes
function toggleTheme() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    
    // Remove the current theme
    if (currentTheme === lightTheme) {
        link.href = darkTheme;
        currentTheme = darkTheme;
    } else {
        link.href = lightTheme;
        currentTheme = lightTheme;
    }

    // Append the new theme
    document.head.appendChild(link);
    
    // Remove the previous theme link (if it exists)
    const existingThemeLink = document.querySelector(`link[href="${currentTheme === lightTheme ? darkTheme : lightTheme}"]`);
    if (existingThemeLink) {
        existingThemeLink.remove();
    }
}

// Event listener for the toggle button
themeToggleButton.addEventListener('click', toggleTheme);


function toggleTheme() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    
    // Switch themes based on current theme
    if (currentTheme === lightTheme) {
        link.href = darkTheme;
        currentTheme = darkTheme;
        localStorage.setItem('theme', 'dark'); // Save preference
    } else {
        link.href = lightTheme;
        currentTheme = lightTheme;
        localStorage.setItem('theme', 'light'); // Save preference
    }

    // Append the new theme
    document.head.appendChild(link);
    
    // Remove the previous theme link
    const existingThemeLink = document.querySelector(`link[href="${currentTheme === lightTheme ? darkTheme : lightTheme}"]`);
    if (existingThemeLink) {
        existingThemeLink.remove();
    }
}

// Toggle between themes on button click
toggleButton.addEventListener('click', () => {
    const currentTheme = quill.theme;

    // Change the theme
    if (currentTheme === 'snow') {
        quill.theme = 'bubble'; // Switch to dark mode (bubble theme)
        toggleButton.textContent = 'Switch to Light Theme'; // Update button text
    } else {
        quill.theme = 'snow'; // Switch to light mode
        toggleButton.textContent = 'Switch to Dark Theme'; // Update button text
    }
});

// Load the saved theme on page load
window.onload = function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleTheme(); // Activate dark mode on load if previously set
    }
}


