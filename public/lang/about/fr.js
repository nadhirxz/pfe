lang_text = {
	conatct_text: "Contact",
	terms_text: "Conditions d'utilisation",
	privacy_text: "Politique de confidentialité",
}
if (typeof (Android) != 'undefined' && typeof (Android.getAppVersion()) != 'undefined' && typeof (Android.getAppReleaseDate()) != 'undefined') {
	lang_text.attribution_text = "À propos de l'application";
}