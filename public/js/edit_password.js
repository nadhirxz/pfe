let errors = {
    wrongPasswordErr: "wrong_pass",
    invalidPasswordErr: "invalid_pass"
};

let texts = {
    en: ["Wrong password", "You can't use this password, please use another one", "Your password has been changed successfully"],
    fr: ["Mot de passe incorrect", "Vous ne pouvez pas utiliser ce mot de passe, veuillez en utiliser un autre", "Votre mot de passe a été changé avec succès"],
    ar: ["كلمة مرور خاطئة", "لا يمكنك استخدام كلمة السر هذه ، يرجى استخدام كلمة أخرى", "لقد تم تغيير كلمة السر الخاصة بك بنجاح"]
}

let url = location.search.substring(1)
if (url) {
    let params = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'); // url params parser
    if ("err" in params) {
        switch (params.err) {
            case errors.wrongPasswordErr:
                $('#password-field1').addClass('is-invalid');
                $('#o-password-feed').html(texts[lng][0]);
                $('#o-password-feed').addClass('d-block');
                break;
            case errors.invalidPasswordErr:
                $('#password-field2').addClass('is-invalid');
                $('#n-password-feed').html(texts[lng][1]);
                $('#n-password-feed').addClass('d-block');
                break;
        }
    }
    if ('success' in params) {
        console.log("fdf")
        $('.alert-success').removeClass('d-none');
        $('.pwd_chngd_txt').html(texts[lng][2]);
    }
}

var passwordField1 = $('#password-field1');
var passwordField2 = $('#password-field2');

$('#otoggle').css('cursor', 'pointer');
$('#otoggle').click(() => {
    if (passwordField1.attr('type') == 'password') {
        $('#toggle-icon1').attr('class', 'fa fa-eye text-primary');
        passwordField1.attr('type', 'text');
    } else {
        $('#toggle-icon1').attr('class', 'fa fa-eye-slash');
        passwordField1.attr('type', 'password');
    }
});

$('#ntoggle').css('cursor', 'pointer');
$('#ntoggle').click(() => {
    if (passwordField2.attr('type') == 'password') {
        $('#toggle-icon2').attr('class', 'fa fa-eye text-primary');
        passwordField2.attr('type', 'text');
    } else {
        $('#toggle-icon2').attr('class', 'fa fa-eye-slash');
        passwordField2.attr('type', 'password');
    }
});