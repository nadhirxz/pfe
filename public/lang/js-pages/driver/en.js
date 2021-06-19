deliveryTypes = [
	"Client to Place",
	"Partner to Client",
	"Shop to Client",
	"Partner to Place",
	"Place to Partner"
]

js_lang_text = {
	new_delivery_request_text: "New Delivery Request",
	rcvr_phone_text: "Receiver's phone :",
	route_text: "Route",
	cancel_text: "Cancel",
	failed_text: "Failed",
	completed_text: "Completed",
	refuse_text: "Refuse",
	accept_text: "Accept",
	notification_text: (p, d, n) => { return `${p} DZD - ${d} km - ${n}` },
	text_1_text: (thng, pr, ty, d) => { return `Object : <b>${thng}</b> - Price : <b>${pr} DZD</b> - Type : <b>${deliveryTypes[ty]}</b>${d ? ` - Time : <b>${pad(d.getHours())}:${pad(d.getMinutes())}</b>` : ''}`; },
	from_partner_text: (p) => { return `From partner : ${p}` },
	from_place_text: (p) => { return `From place : ${p}` },
	no_deliveries: "No Deliveries"
}

texts = [
	"Are you sure you want to accept ?",
	"Are you sure you want to refuse ?",
	"Complete delivery ?",
	"Failed delivery ?",
	"Remove delivery ?"
];
buttonTexts = [
	"Accept",
	"Refuse",
	"Complete",
	"Fail",
	"Remove"
];

function pad(n, z) {
	z = z || '0';
	n = n + '';
	return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}