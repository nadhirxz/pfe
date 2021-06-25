deliveryTypes = [
	"Client vers Place",
	"Partenaire vers Client",
	"Shop vers Client"
]

l = {
	new: "Nouvelle demande de livraison",
	min: "min",
	obj: "Objet",
	rcvr: "Destinataire",
	from_partner: "Du partenaire",
	from_place: "Du",
	price: "Prix",
	objp: "Prix d'objet",
	distance: "Distance",
	dzd: "DZD",
	km: "km",
	partner: "Partenaire",
	fnsh_t: "Heure de finition estimée",
	route: "Route",
	cancel: "Annuler",
	fail: "Échoué",
	comp: "Terminé",
	ref: "Refuser",
	acc: "Accepter",
	notification_text: (p, d, n) => { return `${p} DZD - ${d} km - ${n}` },
	no_deliveries: "Pas de livraisons"
}

texts = [
	"Êtes-vous sûr de vouloir accepter ?",
	"Êtes-vous sûr de vouloir refuser ?",
	"Livraison terminé ?",
	"Livraison échoué ?",
	"Annuler la livraison ?"
];
buttonTexts = [
	"Accepter",
	"Refuser",
	"Terminé",
	"Échouer",
	"Annuler"
];

function pad(n, z) {
	z = z || '0';
	n = n + '';
	return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}