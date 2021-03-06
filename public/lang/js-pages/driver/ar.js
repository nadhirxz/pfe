deliveryTypes = [
	"من زبون لشخص",
	"من شحص لزبون",
	"من متجر لشخص"
]

l = {
	new: "طلب توصيل جديد",
	min: "د",
	obj: "الغرض",
	rcvr: ["المستلم", "المرسل"],
	from: "من",
	price: "السعر",
	objp: "سعر الغرض",
	distance: "المسافة",
	dzd: "دج",
	km: "كم",
	shop: "المتجر",
	fnsh_t: "الوقت المقدر للإنهاء",
	route: "الطريق",
	cancel: "إلغاء",
	fail: "فشل",
	comp: "اكتمال",
	ref: "رفض",
	acc: "قبول",
	notification_text: (n, m, p, d) => `${n} - د ${m} - ${d} دج - ${p} كم`,
	no_deliveries: "لا يوجد أي طلب توصيل",
	no_pos: "لا يمكن الحصول على مكانك الحالي"
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