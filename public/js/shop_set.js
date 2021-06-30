var map = createMap(at);

$('#save-btn').on('click', () => {
	let pos = [marker.getLatLng().lat, marker.getLatLng().lng];
	let schedule = $('#select').val() || 0;
	let startTime = $('#from').val();
	let endTime = $('#to').val();
	if (pos) {
		let r = /^([01]\d|2[0-3]):?([0-5]\d)$/;
		let save = true;

		if (r.test(startTime)) {
			$('#from').removeClass('is-invalid');
		} else {
			$('#from').addClass('is-invalid');
			save = false;
		}

		if (r.test(endTime)) {
			$('#to').removeClass('is-invalid');
		} else {
			$('#to').addClass('is-invalid');
			save = false;
		}

		if (save) {
			post("/shop", { pos, schedule, startTime, endTime });
		}
	}
});

function post(path, params, method = 'post') {
	// The rest of this code assumes you are not using a library.
	// It can be made less wordy if you use one.
	const form = document.createElement('form');
	form.method = method;
	form.action = path;

	for (const key in params) {
		if (params.hasOwnProperty(key)) {
			const hiddenField = document.createElement('input');
			hiddenField.type = 'hidden';
			hiddenField.name = key;
			hiddenField.value = params[key];

			form.appendChild(hiddenField);
		}
	}

	document.body.appendChild(form);
	form.submit();
}