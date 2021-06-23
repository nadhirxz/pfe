if (typeof (Android) != 'undefined' && Android.getAppVersion().endsWith('(Driver)')) {
	$('.bg-info').each((i, e) => {
		$(e).addClass('bg-success').removeClass('bg-info');
	})
	$('#nav-reg-btn').attr('href', '/drivers')
	$('.btn .btn .btn-info .btn-block').each((i, e) => {
		$(e).addClass('btn-success').removeClass('btn-info');
	});
	$('#submit-btn').addClass('btn-success').removeClass('btn-info');
}