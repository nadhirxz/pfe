deliveryTypes = [
	"Client to Person",
	"Person to Client",
	"Shop to Client",
]

l = {
	new: "New Delivery Request",
	min: "min",
	obj: "Object",
	rcvr: ["Receiver", "Sender"],
	from: "From",
	price: "Price",
	objp: "Object's Price",
	distance: "Distance",
	dzd: "DZD",
	km: "km",
	shop: "Shop",
	fnsh_t: "Estimated Finish Time",
	route: "Route",
	cancel: "Cancel",
	fail: "Failed",
	comp: "Completed",
	ref: "Refuse",
	acc: "Accept",
	notification_text: (n, m, p, d) => `${n} - ${m} min - ${p} DZD - ${d} km`,
	no_deliveries: "No Deliveries",
	no_pos: "Cannot get your current position"
}

texts = [
	"Are you sure you want to accept ?",
	"Are you sure you want to refuse ?",
	"Complete delivery ?",
	"Failed delivery ?",
	"Cancel delivery ?"
];
buttonTexts = [
	"Accept",
	"Refuse",
	"Complete",
	"Fail",
	"Cancel"
];

function pad(n, z) {
	z = z || '0';
	n = n + '';
	return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}