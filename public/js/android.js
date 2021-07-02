if (typeof (Android) != 'undefined' && Android.getAppVersion().endsWith('(Driver)')) {
	$('.bg-c').each((i, e) => $(e).addClass('bg-dark').removeClass('bg-c'));
	$('.btn-info').each((i, e) => $(e).addClass('btn-dark').removeClass('btn-c'));
	$('#nav-reg-btn').attr('href', '/drivers')
	$('.btn .btn .btn-c .btn-block').each((i, e) => {
		$(e).addClass('btn-dark').removeClass('btn-c');
	});
	$('#submit-btn').addClass('btn-dark').removeClass('btn-c');
}