if (typeof (Android) != 'undefined') {
    file = "/html/app.html";
    $('#header').removeClass('d-none');
    if (Android.getAppVersion().endsWith('(Driver)')) {
        $('#loading-img').attr('src', '/img/loader.svg');
        $('#navbar-home-btn').remove();
        $('#reg-btn').attr('href', '/staff');
    }
} else {
    file = "/html/index.html";
    $('body').attr('class', 'shards-app-promo-page--1 pb-0');
}

fetch(file).then(response => response.text()).then((data) => {
    $('body').css('display', 'none');
    if (typeof (Android) != 'undefined') {
        $('#loading-img').remove();
        $('#app').html(data);
    } else {
        $('body').html(data);
        $('#credits').html(`Wesselli © ${new Date().getFullYear()}`);
        if ($('html').attr('lang') == 'ar') {
            $('.mr-lg-5').addClass('ml-lg-5').removeClass('mr-lg-5');
            $('.ml-auto').addClass('mr-auto').removeClass('ml-auto');
            $('.mr-5').addClass('ml-5').removeClass('mr-5');
            $('html').attr('dir', 'rtl')
        }
        $('link[href^="/css/main.css"]').attr("href", '/css/index.css');
        $('#gplay-img').attr('src', `/img/google-play-badge-${$('html').attr('lang')}.png`);
        $('#app-img').attr('src', `/img/phone-app-${$('html').attr('lang')}.png`);
    }
    $.getScript('./js/lang.js');
    $('body').fadeIn(1000);
});