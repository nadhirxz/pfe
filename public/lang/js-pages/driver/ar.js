deliveryTypes = [
	"زبون إلى مكان",
	"شريك إلى زبون",
	"محل إلى زبون",
	"شريك إلى مكان",
	"مكان إلى شريك"
]

js_lang_text = {
	new_delivery_request_text: "طلب تسليم جديد",
	rcvr_phone_text: "رقم المستقبل :",
	route_text: "الطريق",
	cancel_text: "إلغاء",
	failed_text: "فشل",
	completed_text: "اكتمال",
	refuse_text: "رفض",
	accept_text: "قبول",
	notification_text: (p, d, n) => { return `${p} دج - ${d} كم - ${n}` },
	text_1_text: (thng, pr, ty, d) => { return `الغرض : <b>${thng}</b> - السعر : <b>${pr} دج</b> - نوع : <b>${deliveryTypes[ty]}</b>${d ? ` - الوقت : <b>${pad(d.getHours())}:${pad(d.getMinutes())}</b>` : ''}`; },
	from_partner_text: (p) => { return `من الشريك : ${p}` },
	from_place_text: (p) => { return `من المكان : ${p}` },
	no_deliveries: "لا توجد طلبات"
}

texts = [
	"هل أنت متأكد أنك تريد القبول ؟",
	"هل أنت متأكد أنك تريد الرفض ؟",
	"اكتمل التسليم ؟",
	"فشل التسليم ؟",
	"إلغاء الطلب ?"
];
buttonTexts = [
	"قبول",
	"رفض",
	"اكتمال",
	"فشل",
	"إلغاء"
];

function pad(n, z) {
	z = z || '0';
	n = n + '';
	return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}