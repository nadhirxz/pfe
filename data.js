let settings = {
	sessionName: "sid",
	sessionMaxAge: 1000 * 60 * 60 * 24 * 30 * 12, // 12 months
	cookieSecure: false, // TRUE ONLY WITH HTTPS

	titleSuffix: { en: " | DELIVERY", fr: " | DELIVERY", ar: " | DELIVERY" },
	defaultWebsiteLanguage: 'fr',

	intervalBetweenSMS: 60 * 2, // two minutes
	intervalWhenTooManyPinSubmissions: 60 * 45, // 45 minutes
	maxPinRetries: 5,

	maxNameLength: 40, // 40 characters
	maxHoursWithoutConfirmation: 48, // hours

	partnerPercentage: 10,
	driverPercentage: 25,

	maxDeliveryDistance: 60, // km
	driverSpeed: 35, // km/h
	driverRestTime: 5, // minutes
	usersSocketTimeout: 20000, // ms
	timeoutForDriverToComeBackToDelivery: 20, // minutes

	intervalBetweenDeliveries: 5, // minutes

	AlgiersPos: [36.68686093982163, 3.0768628983554978],

	nearestMinute: 5,

	allowedImgExt: ['png', 'jpg', 'jpeg', 'gif'],
	partnerImgSize: 500
}

let titles = {
	en: {
		out_of_srvc: "Out of service",
		crrntly_out_of_srvc: "We are currently out of service",
		welcome: "Welcome",
		home: "Home",
		new_delivery: "New Delivery",
		too_much: "Too much",
		too_many_requests: "Too many requests",
		plz_wait_at_least: `Please wait at least ${settings.defaultMinIntervalBetweenDeliveries} minutes before submitting a new delivery.`,
		new_buy: "New Buy",
		login: "Login",
		register: "Register",
		partners_reg: "Partners Registration",
		confirm: "Confirm",
		terms: "Terms of Service",
		driver: "Driver",
		drivers: "Drivers",
		admin: "Admin",
		add_partner: "Add Partner",
		add_key: "Add Key",
		schedule: "Schedule",
		details: "Details",
		pg_dsnt_xst: "Page doesn't exist",
		error: "Error",
		a_dlvr_err_hppnd: "An error happened. Please try submitting your delivery later.",
		delivery: "Delivery",
		about: "About",
		profile: "Profile",
		privacy: "Privacy Policy",
		edit_password: "Edit Password",
		partners: "Partners",
		your_items: "Your Items",
		deliveries: "Deliveries",
		disabled: "Deactivated Account"
	},
	fr: {
		out_of_srvc: "Hors service",
		crrntly_out_of_srvc: "Nous sommes actuellement hors service",
		welcome: "Bienvenue",
		home: "Accueil",
		new_delivery: "Nouvelle livraison",
		too_much: "Trop",
		too_many_requests: "Trop de demandes",
		plz_wait_at_least: `Veuillez attendre au moins ${settings.defaultMinIntervalBetweenDeliveries} minutes avant de soumettre une nouvelle livraison.`,
		new_buy: "Nouvel achat",
		login: "S'identifier",
		register: "S'inscrire",
		partners_reg: "Inscription des partenaires",
		confirm: "Confirmer",
		terms: "Conditions d'utilisation",
		driver: "Livreur",
		drivers: "Livreurs",
		admin: "Administrateur",
		add_partner: "Ajouter un partenaire",
		add_key: "Ajouter une clé",
		schedule: "Programme",
		details: "Détails",
		pg_dsnt_xst: "La page n'existe pas",
		error: "Erreur",
		a_dlvr_err_hppnd: "Une erreur s'est produite. Veuillez essayer de soumettre votre livraison plus tard.",
		delivery: "Livraison",
		about: "À propos",
		profile: "Profil",
		privacy: "Politique de confidentialité",
		edit_password: "Modifier le Mot de Passe",
		partners: "Partenaires",
		your_items: "Votre Objets",
		deliveries: "Livraisons",
		disabled: "Compte Désactivé"
	},
	ar: {
		out_of_srvc: "خارج الخدمة",
		crrntly_out_of_srvc: "نحن حاليا خارج الخدمة",
		welcome: "مرحبا",
		home: "الصفحة الرئيسية",
		new_delivery: "طلب توصيل جديد",
		too_much: "كثير جدا",
		too_many_requests: "طلباتك كثيرة ",
		plz_wait_at_least: `الرجاء انتظار ${settings.defaultMinIntervalBetweenDeliveries} دقائق على الأقل قبل تقديم طلب توصيل جديد.`,
		new_buy: "طلب شراء",
		login: "تسجيل الدخول",
		register: "تسجيل",
		partners_reg: "تسجيل الشركاء",
		confirm: "تأكيد",
		terms: "شروط الخدمة",
		driver: "سائق",
		drivers: "السائقون",
		admin: "مشرف",
		add_partner: "إضافة شريك",
		add_key: "إضافة مفتاح",
		schedule: "الجدول",
		details: "تفاصيل",
		pg_dsnt_xst: "الصفحة غير موجودة",
		error: "خطأ",
		a_dlvr_err_hppnd: "حدث خطأ. يرجى محاولة تقديم طلب التوصيل الخاص بك في وقت لاحق.",
		delivery: "طلب التوصيل",
		about: "حول",
		profile: "الملف الشخصي",
		privacy: "سياسة الخصوصية",
		edit_password: "تغيير كلمة السر",
		partners: "الشركاء",
		your_items: "السلعة الخاصة بك",
		deliveries: "طلبات التوصيل",
		disabled: "تم تعطيل الحساب"
	}
}

let errors = {
	generalErr: "error",
	phoneExistsErr: "phone_exists",
	phoneDoesntExistErr: "phone_not_exist",
	wrongPasswordErr: "wrong_pass",
	missingInputErr: "missing_input",
	invalidPhoneErr: "invalid_phone",
	invalidNameErr: "invalid_name",
	invalidPasswordErr: "invalid_pass",
	invalidSecret: "invalid_secret",
}

module.exports = { settings, titles, errors };