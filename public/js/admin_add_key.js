$('#type-field').on('change', (e) => {
	if (e.target.value == 2) $('#percentage-div').hide();
	else $('#percentage-div').show();
});