if (typeof (Android) != 'undefined' && Android.getAppVersion().endsWith('(Driver)')) {
	$('.bg-success').each((i, e) => {
		$(e).addClass('bg-primary').removeClass('bg-primary');
	})
	$('#nav-reg-btn').attr('href', '/staff')
	$('.btn .btn .btn-success .btn-block').each((i, e) => {
		$(e).addClass('btn-primary').removeClass('btn-success');
	});
	$('#submit-btn').addClass('btn-primary').removeClass('btn-success');
}