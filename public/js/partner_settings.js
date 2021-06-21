$("#partner-image").change(() => {
	$('.custom-file-label').html($('#partner-image')[0].files[0].name);
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
		$.post('/partners/schedule/' + id, { schedule: $('#select').val(), from: $('#from').val(), to: $('#to').val() }, () => window.location.reload());
	}
});