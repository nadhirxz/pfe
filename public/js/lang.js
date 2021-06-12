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
var page = window.location.pathname.split('/')[1] == 'delivery' ? 'delivery' : false;

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