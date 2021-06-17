let l = {
	en: {
		phone_exists: "Sorry, this number is already used.",
		invalid_phone: "This phone number is invalid.",
		invalid_pass: "Please use a password longer than 6 characters.",
		invalid_secret: "Invalid secret key.",
		err: "Sorry something went wrong. Please try again later."
	},
	fr: {
		phone_exists: "Désolé, ce numéro est déjà utilisé.",
		invalid_phone: "Ce numéro de téléphone est invalide.",
		invalid_pass: "Veuillez utiliser un mot de passe contenant plus de 6 caractères.",
		invalid_secret: "Clé secrète invalide.",
		err: "Désolé, une erreur s'est produite. Veuillez réessayer plus tard."
	},
	ar: {
		phone_exists: "عذرا ، هذا الرقم مستخدم بالفعل.",
		invalid_phone: "رقم الهاتف غير صالح.",
		invalid_pass: "الرجاء استخدام كلمة مرور تحتوي على أكثر من 6 أحرف.",
		invalid_secret: "المفتاح السري غير صالح.",
		err: "عذرا، حدث خطأ ما. الرجاء إعادة المحاولة لاحقًا."
	}
}

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
}

let url = location.search.substring(1); // url parameters
if (url) {
	let params = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'); // url params parser
	if ("err" in params) {
		switch (params.err) {
			case errors.phoneExistsErr:
				document.getElementById('phone-field').classList.add('is-invalid');
				document.getElementById('phone-feed').innerHTML = l[lng].phone_exists;
				break;
			case errors.invalidPhoneErr:
				document.getElementById('phone-field').classList.add('is-invalid');
				document.getElementById('phone-feed').innerHTML = l[lng].invalid_phone;
				break;
			case errors.invalidPasswordErr:
				document.getElementById('password-field').classList.add('is-invalid');
				document.getElementById('password-feed').innerHTML = l[lng].invalid_pass;
				break;
			case errors.invalidSecret:
				document.getElementById('secret-field').classList.add('is-invalid');
				document.getElementById('secret-feed').innerHTML = l[lng].invalid_secret;
				break;

			default:
				document.getElementById('err-msg').innerHTML = l[lng].err;
		}
	}
	if ("name" in params) {
		document.getElementById('name-field').value = params.name;
	}
	if ("phone" in params) {
		document.getElementById('phone-field').value = params.phone;
	}
}