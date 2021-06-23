var toggle = document.getElementById('toggle');
var toggleIcon = document.getElementById('toggle-icon');
var passwordField = document.getElementById('password-field');

toggle.style.cursor = "pointer";
toggle.addEventListener('click', () => {
    if (passwordField.type == 'password') {
        toggleIcon.className = "fa fa-eye text-info";
        passwordField.type = "text";
    } else {
        toggleIcon.className = "fa fa-eye-slash";
        passwordField.type = "password";
    }
});