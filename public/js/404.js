texts = {
    en: ["An error happened<br>Please try again", "Error<br>This page doesn't exist", "Go Back"],
    fr: ["Une erreur s'est produite<br>Veuillez réessayer", "Erreur<br>Cette page n'existe pas", "Revenir"],
    ar: ["حدث خطأ<br>يرجى إعادة المحاولة", "خطأ<br>هذه الصفحة غير موجودة", "رجوع"]
}
if (typeof (Android) !== 'undefined') $('#err-msg').html(texts[lng][0]);
else $('#err-msg').html(texts[lng][1]);
$('#btn').html(texts[lng][2])