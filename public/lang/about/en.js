lang_text = {
	conatct_text: "Contact",
	terms_text: "Terms of Service",
	privacy_text: "Privacy Policy",
}
if (typeof (Android) != 'undefined' && typeof (Android.getAppVersion()) != 'undefined' && typeof (Android.getAppReleaseDate()) != 'undefined') {
	lang_text.attribution_text = "About the app";
}