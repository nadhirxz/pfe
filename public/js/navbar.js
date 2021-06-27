$(document).ready(() => $('[data-toggle="offcanvas"], #navToggle').on('click', () => $('.offcanvas-collapse').toggleClass('open')));

if ($('.navbar').hasClass('bg-dark')) {
	$('.btn-c').each((i, e) => $(e).addClass('btn-dark').removeClass('btn-c'));
}