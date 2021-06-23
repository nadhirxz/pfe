$('#lang-link-en').attr("href", '/en' + window.location.pathname);
$('#lang-link-fr').attr("href", '/fr' + window.location.pathname);
$('#lang-link-ar').attr("href", '/ar' + window.location.pathname);

lng = $('html').attr('lang');

if (lng == 'ar') $('#content').attr('dir', 'rtl');

if ($('#navbar')) {
	$.getScript(`/lang/navbar/${lng}.js`, () => {
		Object.keys(navbar_lang_text).forEach(c => {
			$('.' + c).each((i, e) => {
				$(e).html(navbar_lang_text[c]);
			})
		});
	});
}
var page = false;
if (window.location.pathname.split('/')[1] == 'delivery') page = 'delivery';
else if (window.location.pathname.split('/')[1] == 'buy') page = 'buy';
else if (window.location.pathname.split('/')[2] == 'deliveries') page = 'home';
else if (window.location.pathname.split('/')[1] == 'details') page = 'details';
else if (window.location.pathname.split('/')[2] == 'password') page = 'password';
else if (window.location.pathname.split('/')[2]) page = window.location.pathname.split('/')[2]

$.getScript(`/lang${page ? '/' + page : window.location.pathname.length > 1 ? window.location.pathname : '/index'}/${lng}.js`, () => {
	if (typeof (lang_text) != 'undefined') {
		Object.keys(lang_text).forEach(c => {
			if (c != 'placeholders') {
				$('.' + c).each((i, e) => {
					$(e).html(lang_text[c]);
					if (lng == 'ar') $(e).css("font-family", 'Markazi Text');
				})
			} else if (lang_text.placeholders) {
				Object.keys(lang_text.placeholders).forEach(i => {
					$('#' + i).attr("placeholder", lang_text.placeholders[i]);
				});
			}
		});
	}
});