
document.addEventListener("DOMContentLoaded", function() {
    fetch('/checkLogin').then((response) => {
        if (!response.ok) {
            throw new Error('Not LOGGED IN');
        }
        return response.json();
    })
    .then((data) => {
        console.log('Logged in as:', data.username);
        const welcome = document.getElementById('welcome-txt');
        if (welcome) {
            welcome.textContent = `Welcome, ${data.username}!`;
        }

        const logoutBtn = document.getElementById('logout');

        logoutBtn.addEventListener('click', () => {
            fetch('/loginUser/logout', { method: 'POST' }).then((res, err) => {

                alert("Logged out");
                window.location.href = '/login';
            });
        });


    })
    .catch((error) => {
        console.error(error);
        window.location.href = '/login';
    });
});
