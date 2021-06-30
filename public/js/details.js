function pay(type, id, name, amount) {
	$('#modal-label').html(name);
	$('#amount').attr('max', amount);
	if (amount > 0) $('#amount').attr('maxlength', ('' + amount).length);
	$('#pay-btn').off();
	$('#pay-btn').on('click', () => {
		if ($('#amount').val() && $('#amount').val() != 0) {
			$.post(`/${type == 'd' ? 'drivers' : 'shops'}/pay/${id}`, { amount: parseInt($('#amount').val()) }, () => window.location.reload())
		}
	});
}

function onlyNumberKey(evt) {
	// Only ASCII charactar in that range allowed
	var ASCIICode = (evt.which) ? evt.which : evt.keyCode
	if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
		return false;
	return true;
}