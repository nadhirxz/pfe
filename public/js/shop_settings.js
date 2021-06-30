createMap(at);

$("#shop-image").change(() => {
	$('.custom-file-label').html($('#shop-image')[0].files[0].name);
});

let r = /^([01]\d|2[0-3]):?([0-5]\d)$/;

$('#from').on('input', (e) => {
	if (r.test(e.target.value) && new Date('1/1/1 ' + e.target.value).getTime() < new Date('1/1/1 ' + $('#to').val()).getTime()) $(e.target).removeClass('is-invalid');
	else $(e.target).addClass('is-invalid');
});

$('#to').on('input', (e) => {
	if (r.test(e.target.value) && new Date('1/1/1 ' + $('#from').val()).getTime() < new Date('1/1/1 ' + e.target.value).getTime()) $(e.target).removeClass('is-invalid');
	else $(e.target).addClass('is-invalid');
});

$('#save-sc').on('click', () => {
	if (r.test($('#from').val()) && r.test($('#to').val())) {
		$.post('/shops/schedule/' + id, { schedule: $('#select').val(), from: $('#from').val(), to: $('#to').val() }, () => window.location.reload());
	}
});

let hash = document.location.hash;
if (hash) $(`#tablist a[href="${hash}"]`).tab('show');

// Change hash for page-reload
$('#tablist a').on('shown.bs.tab', e => window.location.hash = e.target.hash);

$('#save-pos').on('click', () => {
	let pos = [marker.getLatLng().lat, marker.getLatLng().lng];
	if (pos) post('/shops/pos/' + id, { pos });
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