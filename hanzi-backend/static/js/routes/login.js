const html = `
<style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        ::selection {
            background-color: rgb(255, 66, 28);
        }

        body {
            font-family: "Nunito Sans", sans-serif;
            font-family: "Crimson Pro", serif;
            font-family: "Noto Sans Mono", monospace;
            font-weight: 500;
            font-style: normal;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: white;
        }
        .login-container {
            border: 2px dashed black;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 80%;
            max-height: 90%;
            overflow-y: auto;
            width: 400px;
            overflow-x: hidden;
        }
        h1 {
            font-size: 36px;
            margin-bottom: 20px;
            color: black;
            text-align: center;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 3em;
            width: 300px;
        }
        form {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        }
        input[type="email"],
        input[type="text"],
        input[type="password"] {
            width: 100%;
            min-width: 100%;
            padding: 10px;
            margin-bottom: 20px;
            border: 2px solid black;
            font-size: 16px;
            font-family: inherit;
            font-weight: 500;
            box-sizing: border-box;
        }
        input[type="submit"] {
            width: 100px;
            padding: 10px;
            background-color: white;
            color: black;
            border: 2px solid black;
            cursor: pointer;
            font-size: 16px;
            font-family: inherit;
            font-weight: 500;
        }
        input[type="submit"]:hover {
            background-color: black;
            color: white;
        }
        input[type="email"]:focus {
            outline: none;
            border: 2px solid #7100bd; 
            border-radius: 0px;
            outline: none;
        }
        input[type="text"]:focus {
            outline: none;
            border: 2px solid #7100bd; 
            border-radius: 0px;
            outline: none;
        }
        input[type="password"]:focus {
            outline: none;
            border: 2px solid #7100bd; 
            border-radius: 0px;
            outline: none;
        }
        ::selection {
            background-color: black;
            color: white;
        }

        h1 {
        }

        @media screen and (max-width: 768px) {
            
            .login-container {
                border: 2px dashed black;
                padding: 40px;
                display: flex;
                margin: 0;
                border: none;
                flex-direction: column;
                align-items: center;
                max-width: 100%;
                max-height: 100%;
                overflow-y: auto;
                width: 100%;
                overflow-x: hidden;
                overflow-y: hidden;
            }
        }

        .password-container {
            position: relative;
            width: 100%;
            margin-bottom: 20px;
        }

        .password-container input {
            width: 100%;
            margin-bottom: 0;
        }

        .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #555;
        }

        .toggle-password:hover {
            color: #000;
        }

        .google-login {
            text-align: center;
        }

        .google-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: white;
            color: #555;
            text-decoration: none;
            margin: 10px auto;
            width: 80%;
            max-width: 250px;
            transition: background-color 0.3s;
        }

        .google-button:hover {
            background-color: #f5f5f5;
        }

        .google-button img {
            width: 20px;
            height: 20px;
            margin-right: 10px;
        }

        .register-link {
            margin-top: 15px;
            text-align: center;
        }

        .register-link a {
            color: #7100bd;
            text-decoration: none;
        }

        .register-link a:hover {
            text-decoration: underline;
        }

    </style>


 <div class="login-container">
        <h1>Login</h1>
        <form method="POST">
            <input type="text" name="username" placeholder="username" required>
            <div class="password-container">
                <input type="password" name="password" id="password" placeholder="password" required>
                <i class="toggle-password fas fa-eye-slash" onclick="togglePasswordVisibility()"></i>
            </div>
            <div class="button-group">
                <input type="submit" name="action" value="Login">
            </div>
        </form>
        <div class="register-link" style="margin-top: 15px; text-align: center;">
            <p>Don't have an account? <a href="/register" data-link>Register</a></p>
        </div>
        
        <div class="google-login">
            <p>or</p>
            <a href="/google_auth/login" data-link class="google-button">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo">
                <span>Sign in with Google</span>
            </a>
        </div>

    </div>

`

// routes/login.js
export function renderLogin() {
    return html;
}
