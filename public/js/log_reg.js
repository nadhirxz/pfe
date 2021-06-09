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
                $('#phone-field').addClass('is-invalid');
                $('#phone-feed').html(js_lang_text.nmbr_used_text);
                $('#phone-feed').addClass('d-block');
                break;
            case errors.phoneDoesntExistErr:
                $('#phone-field').addClass('is-invalid');
                $('#phone-feed').html(js_lang_text.nmbr_not_registered);
                $('#phone-feed').addClass('d-block');
                break;
            case errors.invalidPhoneErr:
                $('#phone-field').addClass('is-invalid');
                $('#phone-feed').html(js_lang_text.phone_invalid_text);
                $('#phone-feed').addClass('d-block');
                break;
            case errors.phoneBlacklistedErr:
                $('#phone-field').addClass('is-invalid');
                $('#phone-feed').html(js_lang_text.phone_blcklstd_text);
                $('#phone-feed').addClass('d-block');
                break;
            case errors.invalidNameErr:
                $('#name-field').addClass('is-invalid');
                $('#name-feed').html(js_lang_text.name_invalid_text);
                $('#name-feed').addClass('d-block');
                break;
            case errors.invalidPasswordErr:
                $('#password-field').addClass('is-invalid');
                $('#password-feed').html(js_lang_text.password_invalid_text);
                $('#password-feed').addClass('d-block');
                break;
            case errors.wrongPasswordErr:
                $('#password-field').addClass('is-invalid');
                $('#password-feed').html(js_lang_text.wrong_password_text);
                $('#password-feed').addClass('d-block');
                break;
            default:
                $('#err-msg').html(js_lang_text.smth_wrong_text);
        }
    }
    if ("name" in params) $('#name-field').val(params.name);
    if ("phone" in params) $('#phone-field').val(params.phone);
}

function onlyNumberKey(evt) {
    // Only ASCII charactar in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
        return false;
    return true;
}