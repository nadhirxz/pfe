let texts = {
	en: ["Invalid Name", "Your name has been changed successfully"],
	fr: ["Nom invalide", "Votre nom a été changé avec succès"],
	ar: ["الإسم غير صالح", "لقد تم تغيير الإسم الخاص بك بنجاح"]
}

let url = location.search.substring(1)
if (url) {
	let params = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'); // url params parser
	if ("err" in params) {
		$('#name-field').addClass('is-invalid');
		$('#name-feed').html(texts[lng][0]);
		$('#name-feed').addClass('d-block');
	}
	if ('success' in params) {
		$('.alert-success').removeClass('d-none');
		$('.name_chngd_txt').html(texts[lng][1]);
	}
	if ("name" in params) {
		$('#name-field').val(params.name);
	}
}

$('#disable-btn').on('click', () => {
	$('#err-feed').removeClass('d-block');
	$('#password-feed').removeClass('d-block');

	if ($('#password-field').val()) {
		$('#disable-btn').attr('disabled', true);
		$('#password-field').removeClass('is-invalid');

		$.post('disable', { password: $('#password-field').val() }, (data) => {
			setTimeout(() => {
				if (data.password) {
					$('#password-field').addClass('is-invalid');
					$('#password-feed').addClass('d-block');
				} else if (data.success) {
					$('#password-field').removeClass('is-invalid');
					$('#password-feed').removeClass('d-block');
					setTimeout(() => window.location.href = '/', 500);
				} else {
					$('#err-feed').addClass('d-block');
				}
				$('#disable-btn').attr('disabled', false);
			}, 500);
		})
	} else {
		$('#password-field').addClass('is-invalid');
		$('#password-feed').removeClass('d-block');
	}
});