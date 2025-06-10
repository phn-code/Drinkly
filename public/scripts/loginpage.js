function Login() {
    const usernameIn = document.getElementById('username');
    const passwordIn = document.getElementById('password');


    const username = usernameIn.value;
    const password = passwordIn.value;


    const alertText = document.getElementById('alert-txt');

    console.log("Logging in");

    fetch('/loginUser', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    }).then((response) => {
        if (!response.ok) {
            alertText.style.display = 'block';
            usernameIn.value = "";
            passwordIn.value = "";
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // else {
        //     document.location.href='/';
        // }

        // alertText.style.display = 'none';

        return response.text();
    })
    .then(() => {
        setTimeout(() => {
            document.location.href='/';
        },50);
    })
    .catch((error) => {
        console.error('Error: ', error);
    });

}




function SignUp() {
    const usernameIn = document.getElementById('usernameS');
    const passwordIn = document.getElementById('passwordS');
    const emailIn = document.getElementById('email');


    const imageIn = document.getElementById('profileImage');


    const username = usernameIn.value;
    const password = passwordIn.value;
    const email = emailIn.value;


    const formVals = new FormData();

    formVals.append("username", username);
    formVals.append("password", password);
    formVals.append("email", email);

    if(imageIn.files) {
        formVals.append("p_image", imageIn.files[0]);
    } else {
        formVals.append("p_image", null);
    }



    console.log(`INPUTS: Username: ${username}, password: ${password}, email: ${email}`);

    const alertText = document.getElementById('alert-txt');

    console.log("Logging in");

    fetch('/loginUser/new', {
        method: 'POST',
        headers: {
        },
        body: formVals
    }).then((response) => {
        if (!response.ok) {
            alertText.style.display = 'block';
            usernameIn.value = "";
            passwordIn.value = "";
            // throw new Error(`HTTP error! Status: ${response.status}`);
        } else {
            alert("New User Created");
            document.location.href='/';
        }

        // alertText.style.display = 'none';

        return response.text();
    })
    .then((data) => {
        if(!data) {
            console.log("Not a user!");
        } else {
            console.log('Works + ' + data);

        }

        // alert("Logged In: " + data);
    }).catch((error) => {
        // console.error('Error: ', error);
    });

}











document.addEventListener("DOMContentLoaded", function() {
    // console.log("Working");

    const SubmitLoginBtn = document.getElementById("submit");
    const SubmitSignUpBtn = document.getElementById("submitS");
    const switchToSignUp = document.getElementById("gotosignup");
    const switchToLogin = document.getElementById("gotologin");

    const signUpForm = document.getElementById("signup");
    const loginForm = document.getElementById("login");


    SubmitLoginBtn.addEventListener("click", Login);
    SubmitSignUpBtn.addEventListener("click", SignUp);

    switchToLogin.addEventListener("click", () => {
        signUpForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    switchToSignUp.addEventListener("click", () => {
        signUpForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    signUpForm.style.display = 'none';
    loginForm.style.display = 'block';

});

