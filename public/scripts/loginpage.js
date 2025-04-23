function Login() {
    const username = document.getElementById('username').value;
    const password = "test";

    console.log("Logging in");

    fetch('/loginUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    }).then((response) => response.text())
    .then((data) => {
        console.log('Works');
        alert("Logged In: " + data);
    }).catch((error) => {
        console.error('Error: ', error);
    });

}

document.addEventListener("DOMContentLoaded", function() {
    // console.log("Working");

    const SubmitBtn = document.getElementById("submit");

    SubmitBtn.addEventListener("click", Login);

});

