var js_lang_text = {
    confirm_page_data: (data) => { return "Nous avons envoyé un sms à " + data + "<br>contenant un code de vérification à 6 chiffres."},
    didnt_receive_any_msg: "Vous n'avez reçu aucun message ?",
    retry: "Réessayez",
    you_can_retry_in: (m) => { return `<br>Vous pouvez réessayer dans ${m} ${m > 1 ? 'minutes' : 'minute'}.` },
    tried_too_much: "Vous avez trop essayé.",
    try_again_in : (m) => { return `<br> réessayer dans ${m} ${m > 1 ? 'minutes' : 'minute'}.` },
    err_happened: "Une erreur s'est produite. Veuillez réessayer.",
	invld: (n) => `Code invalide. ${n} tentatives restantes.`,
}