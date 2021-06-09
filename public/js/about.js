if (typeof (Android) != 'undefined' && typeof (Android.getAppVersion()) != 'undefined' && typeof (Android.getAppReleaseDate()) != 'undefined') {
    $('#last-container-text').html(`<h6 class="my-0 about-text">${js_lang_text.app_ver_text}${Android.getAppVersion()}</h6><h6 class="about-text">${js_lang_text.app_ver_date_text}${Android.getAppReleaseDate()}</h6>`);
}
$('#last-container').removeClass('d-none');