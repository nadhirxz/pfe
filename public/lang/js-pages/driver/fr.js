deliveryTypes = [
    "Client vers Place",
    "Partenaire vers Client",
    "Shop vers Client",
    "Partenaire vers Place",
    "Place vers Partenaire"
]

js_lang_text = {
    new_delivery_request_text: "Nouvelle demande de livraison",
    rcvr_phone_text: "Tél du destinataire :",
    route_text: "Route",
	cancel_text: "Annuler",
    failed_text: "Échoué",
    completed_text: "Terminé",
    refuse_text: "Refuser",
    accept_text: "Accepter",
    notification_text: (p, d, n) => { return `${p} DZD - ${d} km - ${n}` },
    text_1_text: (thng, pr, ty, d) => { return `Objet : <b>${thng}</b> - Prix : <b>${pr} DZD</b> - Type : <b>${deliveryTypes[ty]}</b> - Temps : <b>${pad(d.getHours())}:${pad(d.getMinutes())}</b>`; },
    from_partner_text: (p) => { return `Du partenaire : ${p}` },
    from_place_text: (p) => { return `Du place : ${p}` },
    no_deliveries: "Pas de Livraisons"
}

texts = [
    "Êtes-vous sûr de vouloir accepter ?",
    "Êtes-vous sûr de vouloir refuser ?",
    "Livraison terminé ?",
    "Livraison échoué ?"
];
buttonTexts = [
    "Accepter",
    "Refuser",
    "Terminé",
    "Échouer"
];

function pad(n, z) {
    z = z || '0';
    n = n + '';
    return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}