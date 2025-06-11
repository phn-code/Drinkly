// function toggleDarkMode() {
//     document.body.classList.toggle('dark');
//     localStorage.setItem('darkMode', document.body.classList.contains('dark'));
//   }

//   // on a new page load, restores dark mode if it was turned on
//   document.addEventListener('DOMContentLoaded', () => {
//     if (localStorage.getItem('darkMode') === 'true') {
//       document.body.classList.add('dark');
//     }
//   });


window.toggleDarkMode = function() {
    const htmlElement = document.documentElement; // Target the <html> element

    // Toggle the .dark class
    htmlElement.classList.toggle('dark');

    // Update localStorage with the new state (true if .dark is present, false otherwise)
    if (htmlElement.classList.contains('dark')) {
        localStorage.setItem('darkMode', 'true');
    } else {
        localStorage.setItem('darkMode', 'false');
    }

    // Optional: Update the button's icon or title if you want it to change
    // e.g., show a sun icon when dark mode is active, and a moon when light mode is active.
    // updateToggleButtonAppearance(); // You would need to create this function
};
