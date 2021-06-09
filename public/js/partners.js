let errors = {
    generalErr: "error",
    phoneExistsErr: "phone_exists",
    phoneDoesntExistErr: "phone_not_exist",
    wrongPasswordErr: "wrong_pass",
    missingInputErr: "missing_input",
    invalidPhoneErr: "invalid_phone",
    invalidNameErr: "invalid_name",
    invalidPasswordErr: "invalid_pass",
    phoneBlacklistedErr: "blacklisted",
    invalidEmail: "invalid_email",
    invalidSecret: "invalid_secret"
};

let url = location.search.substring(1); // url parameters
if (url) {
    let params = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'); // url params parser
    if ("err" in params) {
        switch (params.err) {
            case errors.phoneExistsErr:
                document.getElementById('phone-field').classList.add('is-invalid');
                document.getElementById('phone-feed').innerHTML = "Sorry, this number is already used.";
                break;
            case errors.invalidPhoneErr:
                document.getElementById('phone-field').classList.add('is-invalid');
                document.getElementById('phone-feed').innerHTML = "This phone number is invalid.";
                break;
            case errors.invalidPasswordErr:
                document.getElementById('password-field').classList.add('is-invalid');
                document.getElementById('password-feed').innerHTML = "Please use a password longer than 6 characters.";
                break;
            case errors.invalidSecret:
                document.getElementById('secret-field').classList.add('is-invalid');
                document.getElementById('secret-feed').innerHTML = "Invalid secret key.";
                break;

            default:
                document.getElementById('err-msg').innerHTML = "Sorry something went wrong. Please try again later.";
        }
    }
    if ("name" in params) {
        document.getElementById('name-field').value = params.name;
    }
    if ("phone" in params) {
        document.getElementById('phone-field').value = params.phone;
    }
    if ("email" in params) {
        document.getElementById('email-field').value = params.email;
    }
}