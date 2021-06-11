// USER TYPES
// 0 = normal user
// 1 = partner
// 2 = driver
// 3 = car driver
// 4 = admin
// 5 = superuser

// DELIVERY TYPES
// 0 = normal delivery (the old method in /deliver page)
// 1 = delivery from one of our partners (/buy)
// 2 = delivery from a shop (/buy)
// 3 = deliver from partner to place
// 4 = deliver from place to partner

// DELIVERY STATUS
// 0 = submitted by user, just that
// 1 = got a driver to do the task
// 2 = driver accepted the task
// 3 = driver refused the task
// 4 = driver delivered the things successfully
// 5 = something happened in the middle of the delivery and couldn't be completed // THIS IS THE MOST SERIOUS THING
// 6 = no drivers available now (waiting)

// CAR DELIVERY STATUS
// 0 = submitted by user, just that
// 1 = car driver accepted
// 2 = car driver refused
// 3 = car driver completed
// 4 = car driver failed

var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var crypto = require('crypto');
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var MongoStore = require('connect-mongo')(session);
var schedule = require('node-schedule');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const multer = require('multer');
const jimp = require('jimp')
const twilio = require('twilio')('AC2ba73f2b1ef07e69c147270a1c719908', 'f860a371ad6d18b8e0f7ae9cfad0adda');

// twilio.verify.services.create({friendlyName: 'WESSELLI'}).then(service => {
//     serviceSID = service.sid;
//     console.log(service.sid);
// });


// Variables used to keep track of the whole process
var dataFromFiles = require('./data');

var settings = dataFromFiles.settings;
var titles = dataFromFiles.titles;
var errors = dataFromFiles.errors;

// Variables
var daily_deliveries = 0;
var weekly_deliveries = 0;
var all_time_deliveries = 0;

var daily_profit = 0;
var weekly_profit = 0;
var all_time_profit = 0;

var weekly_winners = [];

var today = new Date();
var todays_date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
var todays_schedule = [];
var partners_schedule = {};


var we_are_working_now = false;
var our_schedule = [
	["08:00", "23:59"], // other days
	[["04:00", "04:00"], ["08:00", "23:59"]] // friday
];


var port = process.env.PORT || 3000;

var db;
var client = new MongoClient(settings.dbURL, { useUnifiedTopology: true });

var users = [];
var deliveries = [];
var car_deliveries = [];
var car_delivery_prices = [];
var deliveriesBuffer = [];
var places = [];
var drivers = [];
var blacklist = [];

var mapbox_apis = [];
var graphhopper_apis = [];


// Database Connection and loading users to memory

client.connect(err => {
	db = client.db(settings.dbName);

	db.collection("users").find({}).toArray(function (err, result) {
		if (err) console.log(err);
		users = result;
		drivers = getDrivers();
		console.log("Users loaded from database !");
	});

	db.collection("deliveries").find({}).toArray(function (err, result) {
		if (err) console.log(err);
		deliveries = result;
		fillDeliveriesBuffer();
		console.log("Deliveries loaded from database !");
	});
	db.collection("cardeliveries").find({}).toArray(function (err, result) {
		if (err) console.log(err);
		car_deliveries = result;
		console.log("Car deliveries loaded from database !");
	});

	db.collection("places").find({}).toArray(function (err, result) {
		if (err) console.log(err);
		places = result;
		makePlaceSchedules();
		console.log("Places loaded from database !");
	});

	db.collection("schedule").findOne({ id: "schedule" }, (err, result) => {
		if (err) console.log(err);
		if (result) {
			if (typeof (result.working) != 'undefined') we_are_working_now = result.working;
			if (typeof (result.schedule) != 'undefined') our_schedule = result.schedule;
		}
		loadSchedules();
		console.log("Schedules loaded from database !");
	});

	db.collection("admin").findOne({ id: "mapbox" }, (err, result) => {
		if (err) console.log(err);
		mapbox_apis = result.apis;
		console.log("MapBox apis loaded from database !");
	});

	db.collection("admin").findOne({ id: "graphhopper" }, (err, result) => {
		if (err) console.log(err);
		graphhopper_apis = result.apis;
		console.log("GraphHopper apis loaded from database !");
	});

	db.collection("admin").findOne({ id: "car_delivery_prices" }, (err, result) => {
		if (err) console.log(err);
		car_delivery_prices = result.prices;
		console.log("Car delivery prices loaded from database !");
	});

	db.collection("admin").findOne({ id: "blacklist" }, (err, result) => {
		if (err) console.log(err);
		if (result && result.numbers) blacklist = result.numbers;
		console.log("Blacklist loaded from database !");
	});

	db.collection("finance").findOne({ id: todays_date }, (err, result) => {
		if (err) console.log(err);
		if (result) {
			daily_deliveries = result.deliveries_today;
			daily_profit = result.profit_today;
		}
		console.log("Today's finance loaded from database !");
	});

	db.collection("finance").findOne({ id: "this_week" }, (err, result) => {
		if (err) console.log(err);
		if (result) {
			weekly_deliveries = result.deliveries_this_week;
			weekly_profit = result.profit_this_week;
		}
		console.log("This week's finance loaded from database !");
	});
	db.collection("finance").findOne({ id: "all_time" }, (err, result) => {
		if (err) console.log(err);
		if (result) {
			all_time_deliveries = result.all_time_deliveries;
			all_time_profit = result.all_time_profit;
		}
		console.log("All time finance loaded from database !");
	});
});

// set the view engine to ejs
app.set('view engine', 'ejs');

// Body parser
app.use(bodyParser.urlencoded({
	extended: true
}));

// Cookie parser
app.use(cookieParser(settings.cookieParserSecret))

// Session Store
let sessionStore = new MongoStore({
	client: client,
	dbName: settings.dbName,
	ttl: settings.sessionMaxAge / 1000, // in seconds not ms
	touchAfter: 60 * 60 * 12, // lazy update, time period in seconds, don't want to resave all the session on database every single time that the user refresh the page
	autoRemove: 'interval',
	autoRemoveInterval: 60 * 12, // in minutes
	secret: settings.sessionStoreSecret
});

// Session Cookie
app.use(session({
	name: settings.sessionName,
	resave: false,
	saveUninitialized: false,
	secret: settings.cookieSecret,
	store: sessionStore,
	cookie: {
		maxAge: settings.sessionMaxAge,
		sameSite: true,
		secure: settings.cookieSecure,
	}
}));

// Session Middleware so i can access sessions in sockets
var sessionMiddleware = session({
	name: settings.sessionName,
	store: sessionStore,
	secret: settings.cookieSecret,
	resave: false,
	saveUninitialized: false
});

io.use(function (socket, next) {
	sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);

var upload = multer({ dest: './public/img' });




// Give the server access to every file in the folder
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/html', express.static(path.join(__dirname, 'public/html')));
app.use('/lang', express.static(path.join(__dirname, 'public/lang')));




// Redirect functions
let mustBeLoggedIn = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/login');
	} else {
		next();
	}
}
let mustBeConfirmed = (req, res, next) => {
	let user = getUser("id", req.session.uid);
	if (user && (user.type == 0 || user.type == 1) && user.confirmed) {
		next();
	} else {
		res.redirect('/confirm');
	}
}
let mustBeNotConfirmed = (req, res, next) => {
	let user = getUser("id", req.session.uid);
	if (user && !user.confirmed && (user.type == 0 || user.type == 1)) {
		next();
	} else {
		res.redirect('/');
	}
}
let mustBeAgreedOnTerms = (req, res, next) => {
	let user = getUser("id", req.session.uid);
	if (user && (user.type != 0 || user.agreed_on_terms)) {
		next();
	} else {
		res.redirect('/userterms');
	}
}

let mustBeUser = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/login');
	} else {
		let user = getUser("id", req.session.uid);
		if (user && user.type == 0) {
			next();
		} else {
			res.redirect('/');
		}
	}
}
let mustBePartner = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/login');
	} else {
		let user = getUser("id", req.session.uid);
		if (user && user.type == 1) {
			next();
		} else {
			res.redirect('/');
		}
	}
}

let goHomeIfAuth = (req, res, next) => {
	if (req.session.uid) { // user authenticated
		res.redirect('/home');
	} else {
		next();
	}
}

let mustBeDriver = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/');
	} else {
		user = getUser("id", req.session.uid);
		if (user && user.type == 2) {
			next();
		} else {
			res.redirect('/home');
		}
	}
}
let mustBeCarDriver = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/');
	} else {
		user = getUser("id", req.session.uid);
		if (user && user.type == 2) {
			next();
		} else {
			res.redirect('/home');
		}
	}
}
let mustBeAdmin = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/');
	} else {
		user = getUser("id", req.session.uid);
		if (user && user.type == 4) {
			next();
		} else {
			res.redirect('/home');
		}
	}
}
let mustBeInWorkHours = (req, res, next) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	if (user) {
		if (inWorkHours()) next();
		else return res.render('pages/errors', {
			title: titles[lang].out_of_srvc + settings.titleSuffix[lang],
			error: titles[lang].crrntly_out_of_srvc + settings.titleSuffix[lang],
			body: "",
			name: user.name,
			type: user.type,
			lang: lang
		});
	} else {
		return res.redirect('/');
	}
}

let goHomeIfStaffAuth = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		next();
	} else {
		let user = getUser("id", req.session.uid)
		if (user) {
			switch (user.type) {
				case 2: res.redirect('/driver'); break;
				case 3: res.redirect('/cardriver'); break;
				case 4: res.redirect('/admin'); break;
				case 5: res.redirect('/su'); break;
				default: res.redirect('/home'); break;
			}
		}
		else res.redirect('/home');
	}
}


// Routes
app.get('/', (req, res) => {
	if (req.session.uid) { // user authenticated
		let user = getUser("id", req.session.uid);
		if (user) {
			switch (user.type) {
				case 0: return res.redirect('/home');
				case 1: return res.redirect('/home');
				case 2: return res.redirect('/driver');
				case 3: return res.redirect('/cardriver');
				case 4: return res.redirect('/admin');
				case 5: return res.redirect('/su');
			}
		}
	}
	req.session.uid = "";
	let lang = getAndSetPageLanguage(req, res);
	return res.render('pages/index', {
		title: titles[lang].welcome + settings.titleSuffix[lang],
		lang: lang
	});
});
app.get('/home', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res)
	if (user && (user.type == 0 || user.type == 1)) {
		let dataToSend = {
			title: titles[lang].home + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			total_spent: user.total_spent || 0,
			total_deliveries: user.total_deliveries || 0,
			userDeliveries: getDeliveriesOfUser(user.id),
			ldd: Boolean(getUserCarDeliveries(req.session.uid).length),
			working: we_are_working_now,
			work_hours: inWorkHours()
		}

		if (!inWorkHours()) dataToSend.schedule = our_schedule;

		let page = "home";
		if (user.type == 1) {
			page = "home_partner";
			dataToSend.client_deliveries_amount = user.client_deliveries_amount;
			dataToSend.percentage = user.percentage;
			dataToSend.amount_to_pay_us = normalizePrice(((user.percentage / 100) * (user.client_deliveries_amount || 0)), 50);
		} else if (user.winner) {
			dataToSend.winner = true;
		}
		res.render('pages/' + page, dataToSend);
	} else {
		res.redirect('/');
	}
});
app.get('/deliver', mustBeLoggedIn, mustBeUser, mustBeAgreedOnTerms, mustBeInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let at = getLeastUsedMapBoxAPI();
	let gh = getLeastUsedGraphHopperAPI();
	at.use += 1;
	gh.use += 1;
	if (((Date.now() - user.last_delivery) / 1000) / 60 > settings.intervalBetweenDeliveries) {
		res.render('pages/deliver', {
			title: titles[lang].new_delivery + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			at: at.api,
			gh: gh.api
		});
	} else {
		res.render('pages/errors', {
			title: titles[lang].too_much + settings.titleSuffix[lang],
			error: titles[lang].too_many_requests,
			body: titles[lang].plz_wait_at_least,
			name: user.name,
			type: user.type,
			lang: lang
		});
	}
});
app.get('/buy', mustBeLoggedIn, mustBeUser, mustBeAgreedOnTerms, mustBeInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	if (((Date.now() - user.last_delivery) / 1000) / 60 > settings.intervalBetweenDeliveries) {
		res.render('pages/buy', {
			title: titles[lang].new_buy + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			places: getPlacesInfo()
		});
	} else {
		res.render('pages/errors', {
			title: titles[lang].too_much + settings.titleSuffix[lang],
			error: titles[lang].too_many_requests + settings.titleSuffix[lang],
			body: titles[lang].plz_wait_at_least + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang
		});
	}
});

app.get('/buy/:id', mustBeLoggedIn, mustBeUser, mustBeAgreedOnTerms, mustBeInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let at = getLeastUsedMapBoxAPI();
	let gh = getLeastUsedGraphHopperAPI();
	at.use += 1;
	gh.use += 1;
	let p, place, pid;
	if (req.params.id == 'other') {
		p = 'other';
	} else {
		p = getPlace('id', req.params.id);
		if (p) {
			place = p.place;
			p = p.name;
			pid = req.params.id;
		} else {
			return res.render('pages/404', {
				title: titles[lang].pg_dsnt_xst + settings.titleSuffix[lang],
				name: name,
				type: type,
				lang: lang,
			});
		}
	}

	if (((Date.now() - user.last_delivery) / 1000) / 60 > settings.intervalBetweenDeliveries) {
		return res.render('pages/buy_next', {
			title: titles[lang].new_buy + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			at: at.api,
			gh: gh.api,
			partner: p,
			place: place,
			pid: pid
		});
	}
	return res.render('pages/errors', {
		title: titles[lang].too_much + settings.titleSuffix[lang],
		error: titles[lang].too_many_requests + settings.titleSuffix[lang],
		body: titles[lang].plz_wait_at_least + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang
	});
});

app.get('/partnerdeliver', mustBeLoggedIn, mustBePartner, mustBeInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let at = getLeastUsedMapBoxAPI();
	let gh = getLeastUsedGraphHopperAPI();
	at.use += 1;
	gh.use += 1;
	res.render('pages/partner_deliver', {
		title: titles[lang].new_delivery + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		pos: user.pos,
		at: at.api,
		gh: gh.api
	});
});

app.get('/longdistance', mustBeLoggedIn, mustBeInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/ldd', {
		title: titles[lang].long_distance_delivery + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
	});
});

app.get('/login', goHomeIfAuth, (req, res) => {
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/login', {
		title: titles[lang].login + settings.titleSuffix[lang],
		lang: lang
	});
});

app.get('/register', goHomeIfAuth, (req, res) => {
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/register', {
		title: titles[lang].register + settings.titleSuffix[lang],
		lang: lang
	});
});

app.get('/partners', goHomeIfAuth, (req, res) => {
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/partners', {
		title: titles[lang].partners_reg + settings.titleSuffix[lang],
		lang: lang
	});
});

app.get('/confirm', mustBeLoggedIn, mustBeNotConfirmed, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/confirm', {
		title: titles[lang].confirm + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
	});
});

app.get('/userterms', mustBeLoggedIn, mustBeConfirmed, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/user_terms', {
		title: titles[lang].terms + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
	});
});

app.get('/driver', mustBeDriver, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/driver', {
		title: titles[lang].driver + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		daily_deliveries: user.daily_deliveries || 0,
		weekly_deliveries: user.weekly_deliveries || 0,
		all_time_deliveries: user.all_time_deliveries || 0,
		daily_profit: user.daily_profit || 0,
		weekly_profit: user.weekly_profit || 0,
		all_time_profit: user.all_time_profit || 0
	});
});

app.get('/cardriver', mustBeCarDriver, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/cardriver', {
		title: titles[lang].car_driver + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		deliveries: getCarDeliveries(req.session.uid),
		daily_deliveries: user.daily_deliveries || 0,
		all_time_deliveries: user.all_time_deliveries || 0,
		daily_profit: user.daily_profit || 0,
		all_time_profit: user.all_time_profit || 0,
	});
});

app.get('/staff', goHomeIfStaffAuth, (req, res) => {
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/staff', {
		title: titles[lang].staff + settings.titleSuffix[lang],
		lang: lang,
	});
});

app.get('/admin', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/admin', {
		title: titles[lang].admin + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		deliveries_today: daily_deliveries,
		profit_today: daily_profit,
		winners: getWinners()
	});
});

app.get('/new/place', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let at = getLeastUsedMapBoxAPI();
	let gh = getLeastUsedGraphHopperAPI();
	at.use += 1;
	gh.use += 1;
	res.render('pages/admin_add_place', {
		title: titles[lang].add_place + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		at: at.api,
		gh: gh.api
	});
});

app.get('/new/key', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/admin_add_key', {
		title: titles[lang].add_key + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang
	});
});

app.get('/schedule', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/admin_schedule', {
		title: titles[lang].schedule + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		we_are_working_now: we_are_working_now,
		schedule: our_schedule
	});
});

app.get('/details', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/details', {
		title: titles[lang].details + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		daily_deliveries: daily_deliveries || 0,
		weekly_deliveries: weekly_deliveries || 0,
		all_time_deliveries: all_time_deliveries || 0,
		daily_profit: daily_profit || 0,
		weekly_profit: weekly_profit || 0,
		all_time_profit: all_time_profit || 0
	});
});

app.get('/blacklist', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/blacklist', {
		title: titles[lang].blacklist + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang
	});
});

app.get('/partnersinfo', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let p = getPlacesInfo();
	res.render('pages/partners_info', {
		title: titles[lang].partners + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		partners: p
	});
});
app.get('/partner/:id', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let place = getPlace('id', req.params.id);
	if (place) {
		return res.render('pages/partner_settings', {
			title: titles[lang].partners + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			partner: {
				name: place.name,
				id: place.id,
				place: place.place,
				desc: place.desc,
				img: fs.existsSync(`./public/img/partners/${place.id}.png`) ? `/img/partners/${place.id}.png` : '/img/partners/default.png'
			}
		});
	}
	let name, type;
	if (user) {
		name = user.name;
		type = user.type;
	}
	return res.render('pages/404', {
		title: titles[lang].pg_dsnt_xst + settings.titleSuffix[lang],
		name: name,
		type: type,
		lang: lang,
	});
});

app.post('/partner_img/:id', mustBeAdmin, upload.single('img'), (req, res) => {
	let tempPath = req.file.path;
	let ext = path.extname(req.file.originalname).toLowerCase()
	let targetPath = path.join(__dirname, `./public/img/partners/${req.params.id}.png`);

	if (settings.allowedImgExt.includes(ext.substr(1))) {
		fs.rename(tempPath, targetPath, err => {
			if (err) return false; // TODO HANDLE ERRORS

			jimp.read(targetPath, (err, img) => {
				if (err) throw err; // TODO HANDLE ERRORS
				img.resize(settings.partnerImgSize, jimp.AUTO).write(targetPath);
			});
		});
		return res.redirect('/partner/' + req.params.id);
	}
	fs.unlink(tempPath, err => { // TODO HANDLE ERRORS
		if (err) return false; // TODO HANDLE ERRORS
	});
	return res.redirect('/partner/' + req.params.id); // TODO HANDLE ERRORS
});

app.post('/partner_desc/:id', mustBeAdmin, (req, res) => {
	let { desc } = req.body;
	let p = getPlace('id', req.params.id);
	if (typeof (desc) && p) {
		p.desc = desc;
	}
	return res.redirect('/partner/' + req.params.id);
});


app.get('/details/:something', mustBeAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	if (req.params.something == 'drivers') {
		let d = [];
		drivers.forEach(driver => {
			d.push({
				name: driver.name,
				phone: driver.phone,
				daily_deliveries: driver.daily_deliveries || 0,
				weekly_deliveries: driver.weekly_deliveries || 0,
				all_time_deliveries: driver.all_time_deliveries || 0,
				daily_profit: driver.daily_profit || 0,
				weekly_profit: driver.weekly_profit || 0,
				all_time_profit: driver.all_time_profit || 0
			})
		});
		return res.render('pages/details', {
			title: titles[lang].details + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			drivers: d
		});
	}
	if (req.params.something == 'partners') {
		let partners = [];
		getPartners().forEach(partner => {
			partners.push({
				name: partner.name,
				phone: partner.phone,
				deliveries_amount: partner.client_deliveries_amount,
				percentage: partner.percentage,
				payment_amount: normalizePrice(((partner.client_deliveries_amount || 0) * (partner.percentage / 100)), 50)
			})
		});
		return res.render('pages/details', {
			title: titles[lang].details + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			partners: partners
		});
	}
	db.collection('finance').findOne({ id: req.params.something }, (error, result) => {
		if (result) {
			res.render('pages/details', {
				title: titles[lang].details + settings.titleSuffix[lang],
				name: user.name,
				type: user.type,
				lang: lang,
				day: req.params.something,
				deliveries: result.deliveries,
				profit: result.profit
			});
		} else {
			res.render('pages/404', {
				title: titles[lang].pg_dsnt_xst + settings.titleSuffix[lang],
				name: user.name,
				type: user.type,
				lang: lang
			});
		}
	});
});

app.get('/delivery_err', mustBeLoggedIn, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/errors', {
		title: titles[lang].error + settings.titleSuffix[lang],
		error: titles[lang].error + settings.titleSuffix[lang],
		body: titles[lang].a_dlvr_err_hppnd + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang
	})
});

app.get('/your_ldd', mustBeLoggedIn, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/your_ldd', {
		title: titles[lang].ur_ldds + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		ldd: getUserCarDeliveries(req.session.uid)
	})
});

app.get('/d/:did', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let delivery = getDelivery('id', req.params.did);
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	var the_return = {
		title: titles[lang].delivery + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang
	}
	if (delivery) {
		return res.render('pages/delivery', {
			...the_return, ...deliveryInfoPage(delivery)
		});
	} else {
		db.collection('deliveries').findOne({ id: req.params.did }, (err, result) => {
			if (err) console.log(err);
			if (result && result[0]) {
				delivery = result[0];
				return res.render('pages/delivery', {
					...the_return, ...deliveryInfoPage(delivery)
				});
			}
		});
	}
	the_return.title = titles[lang].pg_dsnt_xst + settings.titleSuffix[lang];
	return res.render('pages/404', the_return);
});

app.get('/ldd/:did', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let delivery = getCarDelivery('id', req.params.did);
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	var the_return = {
		title: titles[lang].delivery + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		car_delivery: true
	}
	if (delivery) {
		return res.render('pages/delivery', {
			...the_return, ...carDeliveryInfoPage(delivery)
		});
	} else {
		db.collection('cardeliveries').findOne({ id: req.params.did }, (err, result) => {
			if (err) console.log(err);
			if (result && result[0]) {
				delivery = result[0];
				return res.render('pages/delivery', {
					...the_return, ...carDeliveryInfoPage(delivery)
				});
			}
		});
	}
	the_return.title = titles[lang].pg_dsnt_xst + settings.titleSuffix[lang];
	return res.render('pages/404', the_return);
});

app.post('/addnewkey', mustBeAdmin, (req, res) => {
	let { secret, phone, type, percentage } = req.body;
	percentage = percentage || 0;
	saveStaffKey(secret, phone, parseInt(type), parseInt(percentage));
	res.redirect('/admin');
});

app.post('/addnewplace', mustBeAdmin, (req, res) => {
	let { name, secret, place, schedule, startTime, endTime } = req.body;
	let id = randomHash(8);
	addNewPlace(id, name, secret, place, schedule, startTime, endTime);
	res.redirect('/partner/' + id);
});

app.post('/login', goHomeIfAuth, (req, res) => {
	let { phone, password } = req.body;
	if (phone && password) {
		if (phoneValid(phone)) {
			let user = getUser("phone", phone);
			if (user) {
				if (user.password == generateHash(password, user.id)) {
					req.session.uid = user.id;
					return res.redirect('/home');
				}
				return res.redirect("/login?err=" + errors.wrongPasswordErr + '&phone=' + phone);
			} else {
				return res.redirect("/login?err=" + errors.phoneDoesntExistErr + '&phone=' + phone);
			}
		} else {
			res.redirect('/login?err=' + errors.invalidPhoneErr + '&phone=' + phone);
		}
	} else {
		res.redirect('/login?err=' + errors.missingInputErr);
	}
});

app.post('/register', goHomeIfAuth, (req, res) => {
	let { name, phone, password } = req.body;
	if (phone && password && name) {
		if (nameValid(name)) {
			if (phoneValid(phone)) {
				if (!phoneBlacklisted(phone)) {
					if (passwordValid(password)) {
						if (getUser("phone", phone)) {
							return res.redirect("/register?err=" + errors.phoneExistsErr + '&name=' + name + '&phone=' + phone);
						} else {
							let id = generateUserId(4); // 4 = number of bytes
							let newUser = {
								id: id,
								name: formatName(name),
								phone: phone,
								password: generateHash(password, id),
								type: 0,
								pin_retries: 5,
								confirmed: false,
								agreed_on_terms: false,
								last_delivery: 0,
								reg_date: Date.now()
							}
							db.collection("users").insertOne(newUser, (err, result) => {
								if (err) {
									console.log(err);
									return res.redirect("/register?err=" + errors.generalErr + '&name=' + name + '&phone=' + phone);
								}
								users.push(newUser);
								sendPin(phone, getAndSetPageLanguage(req, res));
								req.session.uid = id;
								return res.redirect('/confirm');
							});
						}
					} else {
						res.redirect('/register?err=' + errors.invalidPasswordErr + '&name=' + name + '&phone=' + phone);
					}
				} else {
					res.redirect('/register?err=' + errors.phoneBlacklistedErr + '&name=' + name + '&phone=' + phone);
				}
			} else {
				res.redirect('/register?err=' + errors.invalidPhoneErr + '&name=' + name + '&phone=' + phone);
			}
		} else {
			res.redirect('/register?err=' + errors.invalidNameErr + '&name=' + name + '&phone=' + phone);
		}
	} else {
		res.redirect('/register?err=' + errors.missingInputErr);
	}
});

app.post('/staffregister', goHomeIfAuth, async (req, res) => {
	let { phone, name, password, secret, type } = req.body;
	if (phone && name && password && secret && type) {
		let check = await checkStaffSecret(secret, phone, type).catch((error) => { console.log(error) });
		if (check) {
			let user = getUser("phone", phone);
			secret = generateStaffKey(secret, phone, type);
			if (user) {
				return res.redirect("/staff");
			} else {
				let id = generateUserId(4);
				let type = parseInt(secret[0]);
				let user = {
					id: id,
					name: formatName(name),
					phone: phone,
					type: type,
					password: generateHash(password, id),
					status: 0
				}
				db.collection("users").insertOne(user, (err, result) => {
					if (err) {
						console.log(err);
						return res.redirect("/staff");
					}
					users.push(user);
					if (type == 2) drivers.push(user);
					req.session.uid = id;
					destroyStaffSecret(secret);
					if (type == 2) {
						return res.redirect('/driver');
					} else {
						return res.redirect('/cardriver');
					}
				});
			}
		} else {
			res.redirect('/staff');
		}
	} else {
		res.redirect('/staff');
	}
});

app.post('/partnerregister', goHomeIfAuth, async (req, res) => {
	let { phone, name, email, password, secret } = req.body;
	if (phone && email && name && password && secret) {
		if (phoneValid(phone)) {
			if (emailValid(email)) {
				let check = await checkStaffSecret(secret, phone, 1).catch((error) => { console.log(error) });
				if (check) {
					let user = getUser("phone", phone);
					let plainTextSecret = secret;
					secret = generateStaffKey(secret, phone, 1);
					let percentage = await getPercentage(secret, phone, 1).catch((error) => { console.log(error) });
					if (user) {
						return res.redirect("/partners?err=" + settings.phoneExistsErr);
					} else {
						let id = generateUserId(4);
						let pos = await getPartnerPos(generateStaffKey(secret, phone, 1)).catch((error) => { console.log(error) });
						let user = {
							id: id,
							name: formatName(name),
							phone: phone,
							email: email,
							password: generateHash(password, id),
							type: 1,
							percentage: percentage,
							pos: pos,
							confirmed: true,
							last_delivery: 0,
							reg_date: Date.now()
						}
						let p = getPlace('secret', plainTextSecret);
						p.uid = id;
						db.collection('places').updateOne({ secret: plainTextSecret }, { $set: { uid: id } });

						db.collection("users").insertOne(user, (err, result) => {
							if (err) {
								console.log(err);
								res.redirect('/partners?err=' + errors.generalErr + '&name=' + name + '&phone=' + phone + '&email=' + email);
							}
							users.push(user);
							req.session.uid = id;
							destroyStaffSecret(secret);
							return res.redirect('/home');
						});
					}
				} else {
					return res.redirect('/partners?err=' + errors.invalidSecret + '&name=' + name + '&phone=' + phone + '&email=' + email);
				}
			} else {
				return res.redirect('/partners?err=' + errors.invalidEmail + '&name=' + name + '&phone=' + phone + '&email=' + email);
			}
		} else {
			res.redirect('/partners?err=' + errors.invalidPhoneErr + '&name=' + name + '&phone=' + phone + '&email=' + email);
		}
	} else {
		res.redirect('/partners?err=' + errors.generalErr);
	}
});

app.post('/d/request', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let user = getUser("id", req.session.uid);
	if (user && user.hash) {
		let { type, fromPlace, from, to, distance, price, phone, thing, weight, partner } = req.body;
		if (typeof (type) && typeof (from) && typeof (to) && typeof (distance) && typeof (price) && typeof (thing) && typeof (weight) && generateHash(('' + distance).substring(0, 5), '' + price) == user.hash && price == user.last_delivery_price) {
			let did = randomHash(10);
			if (user.winner) {
				price = 0;
				delete user.winner;
				user.winner_delivery = did;
			}
			if (submitNewDelivery(req.session.uid, did, type, fromPlace, from, to, distance, price, thing, phone, weight, partner)) return res.redirect('/d/' + did);
			return res.redirect('/delivery_err');
		}
	}
	return res.redirect('/');
});

app.post('/new_long_distance_delivery', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let user = getUser("id", req.session.uid);
	if (user) {
		let { from, to, type, thing, phone, shop } = req.body;
		if (typeof (from) && typeof (to) && typeof (type) && typeof (thing) && typeof (phone)) {
			let did = randomHash(14);
			let ldd = {
				id: did,
				uid: user.id,
				from: getLongDistanceDeliveryPlace(from).name,
				to: getLongDistanceDeliveryPlace(to).name,
				type: type,
				thing: thing,
				phone: phone,
				status: 0,
				date: new Date()
			}
			ldd.price = calculateCarDeliveryPrice(from, to);
			if (typeof (shop)) ldd.shop = shop;

			db.collection('cardeliveries').insertOne(ldd, (err, result) => {
				if (err) {
					res.redirect('/delivery_err');
					return false;
				}
				car_deliveries.push(ldd);
			});
			return res.redirect('/ldd/' + did);
		}
	}
	return res.redirect('/');
});

app.post('/long_distance_delivery_status', mustBeLoggedIn, mustBeCarDriver, (req, res) => {
	let user = getUser("id", req.session.uid);
	if (user && user.hash) {
		let { did, func } = req.body;
		if (typeof (did) && typeof (func)) {
			let delivery = getCarDeliveries('id', did);
			switch (func) {
				case 'a': delivery.status = 1; delivery.driver = user.id; break;
				case 'r': delivery.status = 2; break;
				case 'c': delivery.status = 3;
					delete delivery.driver;
					if (user.daily_deliveries) user.daily_deliveries += 1;
					else user.daily_deliveries = 1;

					if (user.all_time_deliveries) user.all_time_deliveries += 1;
					else user.all_time_deliveries = 1;

					if (user.daily_profit) user.daily_profit += delivery.price;
					else user.daily_profit = delivery.price;

					if (user.all_time_profit) user.all_time_profit += delivery.price;
					else user.all_time_profit = delivery.price;

					break;
				case 'f': delivery.status = 4; delete delivery.driver; break;
			}
			db.collection('users').updateOne({ id: user.id }, {
				$set: {
					daily_deliveries: user.daily_deliveries,
					all_time_deliveries: user.all_time_deliveries,
					daily_profit: user.daily_profit,
					all_time_profit: user.all_time_profit
				}
			});
			db.collection('cardeliveries').updateOne({ id: did }, { $set: { status: delivery.status } });
		}
	}
	return res.redirect('/');
});

app.post('/d/cancel', mustBeLoggedIn, (req, res) => {
	let user = getUser("id", req.session.uid);
	if (user) {
		let { did } = req.body;
		if (typeof (did)) {
			if (did.startsWith('cardelivery')) {
				did = did.substr(11);
				let delivery = getCarDelivery('id', did);
				if (delivery && delivery.uid == user.id && delivery.status == 0) {
					car_deliveries = car_deliveries.filter(obj => obj.id != delivery.id);
					db.collection("cardeliveries").deleteOne({ id: did });
					return res.redirect('/home');
				}
				return res.redirect('/ldd/' + did);
			} else {
				let delivery = getDelivery('id', did);
				if (delivery && delivery.uid == user.id && (delivery.status < 2 || delivery.status > 5)) {
					if (delivery.driver) {
						let driver = getUser('id', delivery.driver);
						removeDriverTask(driver, did);
						db.collection('users').updateOne({ id: driver.id }, {
							$set: {
								available_in: driver.available_in,
								current_task: driver.current_task,
								tasks: driver.tasks
							}
						});
						io.to(driver.socket).emit('canceled_delivery', did);
					}
					deliveries = deliveries.filter(obj => obj.id != delivery.id);
					db.collection("deliveries").deleteOne({ id: delivery.id });
					return res.redirect('/home');
				}
				return res.redirect('/d/' + did);
			}
		}
	}
	return res.redirect('/');
});

app.post('/agree_on_terms', mustBeLoggedIn, mustBeConfirmed, (req, res) => {
	let user = getUser("id", req.session.uid);
	if (user) {
		user.agreed_on_terms = true;
		db.collection('users').updateOne({ id: user.id }, { $set: { agreed_on_terms: true } });
	}
	return res.redirect('/');
});

app.post('/toggle_working_status', mustBeAdmin, (req, res) => {
	we_are_working_now = !we_are_working_now;
	db.collection('schedule').updateOne({ id: "schedule" }, { $set: { working: we_are_working_now } })
	return res.redirect('/schedule');
});

app.post('/new_schedule', mustBeAdmin, (req, res) => {
	let { from, to, ffo, fto, fft, ftt } = req.body;
	our_schedule = [
		[from, to], // other days
		[[ffo, fto], [fft, ftt]], // friday
	];
	db.collection('schedule').updateOne({ id: "schedule" }, { $set: { schedule: our_schedule } });
	return res.redirect('/schedule');
});

app.post('/add_to_blacklist', mustBeAdmin, (req, res) => {
	let { phone } = req.body;
	if (phone && phoneValid(phone) && !blacklist.includes(phone)) {
		blacklist.push(phone);
		db.collection('admin').updateOne({ id: "blacklist" }, { $push: { numbers: phone } });
	}
	return res.redirect('/blacklist' + msg);
});

app.post('/add_to_blacklist', mustBeAdmin, (req, res) => {
	let { phone } = req.body;
	if (phone && phoneValid(phone) && blacklist.includes(phone)) {
		blacklist = blacklist.filter(e => e != phone);
		db.collection('admin').updateOne({ id: "blacklist" }, { $pull: { numbers: phone } });
	}
	return res.redirect('/blacklist');
});

app.get('/logout', mustBeLoggedIn, (req, res) => {
	let user = getUser('id', req.session.uid);
	if (user) {
		req.session.destroy(err => {
			if (err) {
				return res.redirect('/login');
			}
			res.clearCookie(settings.sessionName);
			if (user.type == 2) {
				user.status = 0;
				return res.redirect('/login');
			};
			return res.redirect('/');
		});
	}
});



app.get('/about', (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let name, type;
	if (typeof (user) != 'undefined') {
		name = user.name;
		type = user.type;
	}
	res.render('pages/about', {
		title: titles[lang].about + settings.titleSuffix[lang],
		name: name,
		type: type,
		lang: lang
	});
});
app.get('/profile', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/profile', {
		title: titles[lang].profile + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		phone: user.phone
	});
});
app.get('/editpassword', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	return res.render('pages/edit_password', {
		title: titles[lang].edit_password + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang
	});
});
app.post('/new_password', mustBeLoggedIn, mustBeAgreedOnTerms, (req, res) => {
	let user = getUser('id', req.session.uid);
	if (user) {
		let { old_password, new_password } = req.body;
		if (generateHash(old_password, user.id) == user.password) {
			console.log('here 1')
			if (passwordValid(new_password)) {
				console.log('here 2')
				user.password = generateHash(new_password, user.id);
				db.collection('users').updateOne({ id: user.id }, { $set: { password: user._password } });
				return res.redirect('/editpassword?success=1');
			}
			return res.redirect('/editpassword?err=' + errors.invalidPasswordErr);
		}
		return res.redirect('/editpassword?err=' + errors.wrongPasswordErr);
	}
	return res.redirect('/');
});
app.get('/terms', (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let name, type;
	if (typeof (user) != 'undefined') {
		name = user.name;
		type = user.type;
	}
	res.render('pages/terms', {
		title: titles[lang].terms + settings.titleSuffix[lang],
		name: name,
		type: type,
		lang: lang,
	});
});
app.get('/privacy', (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let name, type;
	if (typeof (user) != 'undefined') {
		name = user.name;
		type = user.type;
	}
	res.render('pages/privacy', {
		title: titles[lang].privacy + settings.titleSuffix[lang],
		name: name,
		type: type,
		lang: lang,
	});
});

app.get('/en', (req, res) => {
	getAndSetPageLanguage(req, res, 'en');
	return res.redirect('/')
});
app.get('/fr', (req, res) => {
	getAndSetPageLanguage(req, res, 'fr');
	return res.redirect('/')
});
app.get('/ar', (req, res) => {
	getAndSetPageLanguage(req, res, 'ar');
	return res.redirect('/')
});

app.get('/en/:url', (req, res) => {
	getAndSetPageLanguage(req, res, 'en');
	return res.redirect('/' + req.params.url);
});
app.get('/en/:url/:u', (req, res) => {
	getAndSetPageLanguage(req, res, 'en');
	return res.redirect('/' + req.params.url + '/' + req.params.u);
});
app.get('/fr/:url', (req, res) => {
	getAndSetPageLanguage(req, res, 'fr');
	return res.redirect('/' + req.params.url);
});
app.get('/fr/:url/:u', (req, res) => {
	getAndSetPageLanguage(req, res, 'fr');
	return res.redirect('/' + req.params.url + '/' + req.params.u);
});
app.get('/ar/:url', (req, res) => {
	getAndSetPageLanguage(req, res, 'ar');
	return res.redirect('/' + req.params.url);
});
app.get('/ar/:url/:u', (req, res) => {
	getAndSetPageLanguage(req, res, 'ar');
	return res.redirect('/' + req.params.url + '/' + req.params.u);
});

// 404 route
app.get('*', (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let name, type;
	if (typeof (user) != 'undefined') {
		name = user.name;
		type = user.type;
	}
	res.render('pages/404', {
		title: titles[lang].pg_dsnt_xst + settings.titleSuffix[lang],
		name: name,
		type: type,
		lang: lang,
	});
}); // this should be always at the end





setTimeout(() => {
	http.listen(port, function () {
		console.log('Server started on port ' + port);
	});
}, 5000);



// Handling sockets

io.on("connection", (socket) => {
	let user = getUser("id", socket.request.session.uid) || {};
	if (user) user.socket = socket.id;



	// USER CONFIRMATION
	socket.on("confirm_page", (data) => {
		function timeleft() {
			user.hash = randomHash(12);
			let time_left = 0;
			let coef = 1;
			let date = user.reg_date; // last sent confirmation pin
			if (user.last_sent_pin) date = user.last_sent_pin;
			if (user.pin_requested_times) {
				switch (user.pin_requested_times) { // for the user not to spam RETRY and cost us too much sms fees
					case 1: coef = 2.5; break;
					case 2: coef = 5; break;
					case 3: coef = 30; break;
				}
			}
			time_left = calculateTimeLeft(settings.intervalBetweenSMS, date, coef);

			socket.emit("retry_time_left", {
				time_left: time_left,
				hash: user.hash,
			});
		}

		timeleft();
		setInterval(timeleft, 1000 * 60); // send how much time left for retry every minute

		socket.emit("confirm_page_data", user.phone);
	});
	socket.on("retry", (data) => {
		if (data.hash == user.hash) {
			if (user.pin_requested_times) user.pin_requested_times++;
			else user.pin_requested_times = 1;
			user.last_sent_pin = Date.now();
			sendPin(user.phone, user.lang || settings.defaultWebsiteLanguage);
		}
	});
	socket.on("confirm_pin", (data) => {
		handlePinConfirmation(socket, user, data);
	});




	// SEND PARTNER INFORMATION TO THE USER
	socket.on('request_places_for_user', (data) => {
		socket.emit('get_places_info_for_user', getPlacesForUser());
	});


	// PLACES AND PRICES FOR LONG DISTANCE DELIVERY
	socket.on('request_prices_for_ldd', (data) => {
		socket.emit('get_prices_for_ldd', car_delivery_prices);
	});



	// DELIVERY THINGS
	socket.on("new_price_request", (data) => {
		let dataToSend = {};

		// STATUS 
		// 0 = accepted and found a driver
		// 1 = accepted and didn't find a driver
		// 2 = distance too far
		// 3 = not in work hours range

		if (data.distance > settings.maxDeliveryDistance || getDistance(data.from, settings.ChlefPos) > settings.maxDeliveryDistance || getDistance(data.to, settings.ChlefPos) > settings.maxDeliveryDistance) {
			dataToSend.status = 2;
		} else if (inWorkHours()) {
			if ((data.partner && !inPartnerWorkHours(data.partner)) && data.partner != 'other') {
				dataToSend.status = 4;
			} else {
				if (data.thingsPrice == 2) user.last_delivery_price = calculatePrice((data.distance * (2 / 3)), data.weight);
				else user.last_delivery_price = calculatePrice(data.distance, data.weight);
				let d = getLeastBusyDriver(data.from);
				if (d == "no driver available right now") {
					user.hash = generateHash(('' + data.distance).substring(0, 5), '' + user.last_delivery_price);
					dataToSend.status = 1;
					dataToSend.price = user.last_delivery_price;
				} else {
					let timeToFinish = Math.ceil((d.time + ((data.distance / settings.driverSpeed) * 60)) / settings.nearestMinute) * settings.nearestMinute;

					if (willDeliveryExceedOurWorkTime(d.driver, timeToFinish)) {
						dataToSend.status = 5;
					} else {
						user.hash = generateHash('' + data.distance, '' + user.last_delivery_price);
						dataToSend.status = 0;
						dataToSend.time = timeToFinish;
						dataToSend.price = user.last_delivery_price;
						if (user.winner) dataToSend.winner = true;
					}
				}
			}
		} else {
			dataToSend.status = 3;
		}
		socket.emit("price", dataToSend);
	});


	// A USER CONNECTED TO DELIVERY INFO PAGE
	socket.on('viewing_delivery', (data) => {
		socket.join(data);
	});


	// DRIVER STUFF
	socket.on("driver_connected", (data) => {
		user.pos = data;
		user.socket = socket.id;
		user.status = 1;
		newDriverConnected(user);
		socket.emit("driver_tasks_info", {
			tasks: getDriverTasks(user),
			current_task: user.current_task,
		});
	});
	socket.on("driver_position", (data) => {
		user.pos = data;
		user.socket = socket.id;
		user.status = 1;
	});

	// DELIVERY HANDLING BY DRIVER STUFF
	socket.on("accepted_delivery", (data) => {
		var delivery = getDelivery('id', data);
		if (delivery) {
			delivery.status = 2;
			sendNewDeliveryStatus(data);
			user.current_task = data;
			db.collection('users').updateOne({ id: user.id }, { $set: { current_task: user.current_task } });
			db.collection('deliveries').updateOne({ id: data }, { $set: { status: delivery.status } });
		}
	});
	socket.on("refused_delivery", (data) => {
		var delivery = getDelivery('id', data);
		if (delivery) {
			delivery.status = 3;
			delete delivery.expected_finish_time;
			sendNewDeliveryStatus(data);
			removeDriverTask(user, data);

			if (user.winner_delivery == delivery.id) user.winner = true;

			db.collection('users').updateOne({ id: user.id }, {
				$set: {
					available_in: user.available_in,
					current_task: user.current_task,
					tasks: user.tasks
				}
			});
			db.collection('deliveries').updateOne({ id: data }, { $set: { status: delivery.status } });
			newDriverConnected(user);
		}
	});
	socket.on("completed_delivery", (data) => {
		var delivery = getDelivery('id', data);
		if (delivery) {
			user = getUser('id', delivery.driver);
			delivery.status = 4;
			delete delivery.expected_finish_time;
			sendNewDeliveryStatus(data);
			removeDriverTask(user, data);

			if (user.winner_delivery == delivery.id) delete user.winner_delivery;

			if (user.daily_deliveries) user.daily_deliveries += 1;
			else user.daily_deliveries = 1;

			if (user.weekly_deliveries) user.weekly_deliveries += 1;
			else user.weekly_deliveries = 1;

			if (user.all_time_deliveries) user.all_time_deliveries += 1;
			else user.all_time_deliveries = 1;

			if (user.daily_profit) user.daily_profit += delivery.price;
			else user.daily_profit = delivery.price;

			if (user.weekly_profit) user.weekly_profit += delivery.price;
			else user.weekly_profit = delivery.price;

			if (user.all_time_profit) user.all_time_profit += delivery.price;
			else user.all_time_profit = delivery.price;

			let u = getUser('id', delivery.uid);

			if (u) {
				if (u.weekly_deliveries) u.weekly_deliveries += 1;
				else u.weekly_deliveries = 1;

				if (u.weekly_spending) u.weekly_spending += delivery.price;
				else u.weekly_spending = delivery.price;

				if (u.all_time_deliveries) u.all_time_deliveries += 1;
				else u.all_time_deliveries = 1;

				if (u.all_time_spending) u.all_time_spending += delivery.price;
				else u.all_time_spending = delivery.price;

				db.collection('users').updateOne({ id: u.id }, {
					$set: {
						weekly_deliveries: u.weekly_deliveries,
						weekly_spending: u.weekly_spending,
						all_time_deliveries: u.all_time_deliveries,
						all_time_spending: u.all_time_spending
					}
				});
			}

			if (typeof (delivery.partner) != 'undefined') {
				let p = getUser('id', getPlace('id', delivery.partner).uid);
				if (p) {
					if (p.client_deliveries_amount) p.client_deliveries_amount += delivery.price;
					else p.client_deliveries_amount = delivery.price;
					db.collection('users').updateOne({ id: p.id }, { $set: { client_deliveries_amount: p.client_deliveries_amount } });
				}
			}

			db.collection('users').updateOne({ id: user.id }, {
				$set: {
					available_in: user.available_in,
					daily_deliveries: user.daily_deliveries,
					weekly_deliveries: user.weekly_deliveries,
					all_time_deliveries: user.all_time_deliveries,
					daily_profit: user.daily_profit,
					weekly_profit: user.weekly_profit,
					all_time_profit: user.all_time_profit,
					current_task: user.current_task,
					tasks: user.tasks
				}
			});

			daily_deliveries += 1;
			weekly_deliveries += 1;
			all_time_deliveries += 1;

			daily_profit += delivery.price;
			weekly_profit += delivery.price;
			all_time_profit += delivery.price;

			db.collection('finance').updateOne({ id: "today" }, { $set: { deliveries: daily_deliveries, profit: daily_profit } });
			db.collection('finance').updateOne({ id: "this_week" }, { $set: { deliveries: weekly_deliveries, profit: weekly_profit } });
			db.collection('finance').updateOne({ id: "all_time" }, { $set: { deliveries: all_time_profit, profit: all_time_deliveries } });

			db.collection('deliveries').updateOne({ id: data }, { $set: { status: delivery.status } });

			newDriverConnected(user);
		}
	});
	socket.on("failed_delivery", (data) => {
		var delivery = getDelivery('id', data);
		if (delivery) {
			delivery.status = 5;
			delete delivery.expected_finish_time;
			sendNewDeliveryStatus(data);
			removeDriverTask(user, data);

			if (user.winner_delivery == delivery.id) user.winner = true;

			db.collection('users').updateOne({ id: user.id }, {
				$set: {
					available_in: user.available_in,
					current_task: user.current_task,
					tasks: user.tasks
				}
			});
			db.collection('deliveries').updateOne({ id: data }, { $set: { status: delivery.status } });

			newDriverConnected(user);
		}
	});


	// DISCONNECTION
	socket.on("disconnect", function () {
		if (user && user.socket) {
			let s = user.socket;
			setTimeout(() => {
				if (users.socket == s) delete user.socket;
			}, settings.usersSocketTimeout);
		}
	});
});





// Functions

// Generating hashes/random stuff
function generateHash(string, salt) {
	salt = crypto.createHash('sha256').update(settings.hashingSecret + salt).digest('hex');
	return crypto.pbkdf2Sync(string, salt, 200, 32, 'sha512').toString('hex');
}

function randomHash(bytes) {
	return crypto.randomBytes(bytes).toString('hex');
}

function generateUserId(bytes) {
	let id = crypto.randomBytes(bytes).toString('hex');
	if (getUser("id", id)) { // this is so sooooooo unlikely to happen even with millions of users, but i like to be 100% sure not only 99.9999999999999999999999999999999999999999999999%
		return generateUserId(bytes);
	}
	return id;
}



// Some validations and stuff
function phoneValid(phone) {
	if (phone.length == 10 && phone.startsWith("05") || phone.startsWith("06") || phone.startsWith("07")) return true;
	return false;
}

function phoneBlacklisted(phone) {
	return blacklist.includes(phone);
}

function nameValid(name) {
	if (name.length > 2) {
		let reg = /^[\u0600-\u06FFa-zA-Z\- ]+$/;
		return reg.test(name);
	}
	return false;
}

function passwordValid(password) {
	if (password.length < 6 && password.length > 84) return false;
	return true;
}

function emailValid(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

function formatName(name) {
	return name.slice(0, settings.maxNameLength).replace(/\w+/g, (txt) => { return txt.charAt(0).toUpperCase() + txt.substr(1); }).replace(/\s+/g, ' ').trim();
}



// PIN validation
function handlePinConfirmation(socket, user, data) {
	if (user.pin_retries || user.pin_retries > 1) {
		let status = "pending";
		twilio.verify.services(settings.twilioServiceSID).verificationChecks.create({ to: `+213${user.phone.substr(1)}`, code: "" + data }).then((verification_check) => {
			status = verification_check.status;
			if (status == "approved") {
				user.confirmed = true;
				delete user.last_sent_pin;
				delete user.pin_requested_times;
				delete user.last_pin_submission;
				delete user.pin_retries;
				db.collection("users").updateOne({ id: user.id }, { $set: { confirmed: true } });
				socket.emit("pin_confirmed");
			} else {
				if (user.pin_retries) user.pin_retries -= 1;
				else user.pin_retries = settings.maxPinRetries;
				user.last_pin_submission = Date.now();
				socket.emit("pin_invalid", user.pin_retries);
			}
		}).catch((error) => {
			socket.emit("err_happened");
		});
	} else {
		let time_left = calculateTimeLeft(settings.intervalWhenTooManyPinSubmissions, user.last_pin_submission);
		if (time_left) {
			socket.emit("tried_too_much", time_left);
		} else {
			user.pin_retries = settings.maxPinRetries;
			delete user.last_pin_submission;
		}
	}
}


function sendPin(phone, lang) {
	twilio.verify.services(settings.twilioServiceSID).verifications.create({ locale: (lang || settings.defaultWebsiteLanguage), to: `+213${phone.substr(1)}`, channel: 'sms' });
}



// Getting some stuff
function getUser(key, value) {
	if (users) return users.find(obj => obj[key] == value);
	return false;
}

function getDelivery(key, value) {
	if (deliveries) return deliveries.find(obj => obj[key] == value);
	return false;
}

function getCarDelivery(key, value) {
	if (car_deliveries) return car_deliveries.find(obj => obj[key] == value);
	return false;
}

function getDrivers() {
	if (users) return users.filter(obj => obj.type == 2);
	return [];
}

function getPartners() {
	if (users) return users.filter(obj => obj.type == 1);
	return [];
}

function getDriver(key, value) {
	if (drivers) {
		let driver = drivers.find(obj => obj[key] == value);
		if (driver) return { name: driver.name, phone: driver.phone }
	}
	return false;
}

function getPlace(key, value) {
	return places.find(obj => obj[key] == value);
}

function getDeliveriesOfUser(id) {
	if (deliveries) {
		return deliveries.filter(obj => obj.uid == id && isToday(obj.date));
	}
	return [false];
}

function isToday(date) {
	date = new Date(date);
	return date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear();
}

function getDriverTasks(driver) {
	let tasks = [];
	if (typeof (driver.tasks) == 'undefined') driver.tasks = [];
	if (driver.tasks) {
		driver.tasks.forEach(task => {
			tasks.push(getDetailsToSendToDriver(getDelivery('id', task)));
		});
	}
	return tasks;
}

function getDetailsToSendToDriver(delivery) {
	if (delivery) {
		let user = getUser('id', delivery.uid);
		if (user) {
			let data = {
				id: delivery.id,
				phone: user.phone,
				name: user.name,
				thing: delivery.thing,
				client_phone: delivery.client_phone,
				type: delivery.type,
				price: delivery.price,
				distance: delivery.distance,
				from: delivery.from,
				to: delivery.to,
				expected_finish_time: delivery.expected_finish_time
			}
			if (delivery.type == 1) {
				let partner = getPlace('id', delivery.partner);
				if (typeof (partner) != 'undefined') {
					data.partner = partner.name;
					let p = getUser('id', partner.uid);
					if (typeof (p) != 'undefined') data.partner_phone = p.phone;
				}
			}
			if (delivery.type == 2 && delivery.fromPlace) {
				data.fromPlace = delivery.fromPlace;
			}
			return data;
		}
	}
}

function getDriverAvailableIn(driver) {
	if (driver.available_in) {
		let time = 0;
		driver.available_in.forEach(t => {
			time += t;
		});
		return time;
	}
	return 0;
}

async function getPercentage(secretText, phone, type) {
	let key = generateStaffKey(secretText, phone, type);
	let result = await db.collection("secretkeys").findOne({ "key": key, "secretText": secretText });
	if (result && result.secretText == secretText) {
		return result.percentage || settings.partnerPercentage;
	}
	return false;
}

function getLeastUsedMapBoxAPI() {
	let api = mapbox_apis[0];
	let i = 0;
	while (api.use > 20000 && i < mapbox_apis.length) {
		i++
		api = mapbox_apis[i];
	}
	return api;
}

function getLeastUsedGraphHopperAPI() {
	let api = graphhopper_apis[0];
	let i = 0;
	while (api.use > 500 && i < graphhopper_apis.length) {
		i++
		api = mapbox_apis[i];
	}
	return api;
}

function getPlacesForUser() {
	if (places) return places.filter(obj => typeof (obj.uid) != 'undefined');
	return [];
}

function getLongDistanceDeliveryPlace(value) {
	if (car_delivery_prices) return car_delivery_prices.find(obj => obj.id == value);
	return [];
}

function getAndSetPageLanguage(req, res, lang) {
	let language, user;

	if (req.session.uid) user = getUser('id', req.session.uid);

	if (lang) {
		if (user) user.lang = lang;
		language = lang;
	} else if (user && user.lang && ['en', 'fr', 'ar'].includes(user.lang)) {
		language = user.lang;
	} else if (req.signedCookies.lang && ['en', 'fr', 'ar'].includes(req.signedCookies.lang)) {
		language = req.signedCookies.lang;
	} else {
		let l = req.acceptsLanguages()[0].substr(0, 2);
		let user_lang;
		if (l && ['en', 'fr', 'ar'].includes(l)) user_lang = req.acceptsLanguages()[0].substr(0, 2)
		language = user_lang || settings.defaultWebsiteLanguage;
		if (user) user.lang = language;
	}

	res.cookie('lang', language, { signed: true, maxAge: settings.sessionMaxAge });
	return language;
}

function getWinners() {
	let w = [];
	if (weekly_winners) {
		weekly_winners.forEach(winner => {
			let user = getUser('id', winner);
			if (user) w.push({ name: user.name, phone: user.phone });
		})
	}
	return w;
}

function getPlacesInfo() {
	let p = [];
	places.forEach(place => {
		p.push({
			id: place.id,
			name: place.name,
			desc: place.desc || ''
		});
	})
	return p;
}



// Staff validation and stuff
async function checkStaffSecret(secretText, phone, type) {
	let key = generateStaffKey(secretText, phone, type);
	let result = await db.collection("secretkeys").findOne({ "key": key, "secretText": secretText });
	if (result && result.secretText == secretText) {
		return true;
	}
	return false;
}

async function getPartnerPos(secret) {
	let result = await db.collection("places").findOne({ "secret": secret });
	if (result && result.secret) {
		return result.place;
	}
	return false;
}

function destroyStaffSecret(secret) {
	db.collection("secretkeys").deleteOne({ "key": secret }, (err, result) => {
		if (err) return false;
	});
}
function generateStaffKey(secretText, phone, type) {
	let key = `${type}${generateHash(secretText, phone)}`;
	return key;
}
function saveStaffKey(secretText, phone, type, percentage) {
	let key = generateStaffKey(secretText, phone, type);
	let insertion = { key: key, secretText: secretText }
	if (percentage) insertion.percentage = percentage;
	db.collection("secretkeys").insertOne(insertion, (err, res) => {
		if (err) return false;
	});
}



// Some calculations
function calculateTimeLeft(end, startDate, coef = 1) {
	return Math.max(Math.ceil((end * coef - (Date.now() - startDate) / 1000) / 60), 0)
}

function calculatePrice(distance, weight) {
	return normalizePrice(((20 * (1 + Math.max((1 / distance), 1)) + distance * 27) * (1 + (weight / 4))), 10);
}

function calculateCarDeliveryPrice(from, to) {
	from = getLongDistanceDeliveryPlace(from);
	to = getLongDistanceDeliveryPlace(to);
	let price = from.price + to.price;
	if (from.id != 0 && to.id != 0) price *= 0.92; // minus 8%
	return normalizePrice(price, 50, true);
}

function normalizePrice(price, to, floor) {
	if (floor) Math.floor(price / to) * to;
	return Math.ceil(price / to) * to;
}

function getTravelTime(pos, from) {
	return Math.ceil(((getDistance(pos, from) / settings.driverSpeed) * 60) * (1 + settings.percentageAddedToTime / 100));
}

function getDistance(pos1, pos2) {
	let R = 6371; // Radius of the earth in km
	let dLat = deg2rad(pos2[0] - pos1[0]);  // deg2rad below
	let dLon = deg2rad(pos2[1] - pos1[1]);
	let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(pos1[0])) * Math.cos(deg2rad(pos2[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	let d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180)
}

function parsePosition(string) {
	let position = string.split(',');
	position[0] = parseFloat(position[0]);
	position[1] = parseFloat(position[1]);
	return position;
}

function willDeliveryExceedOurWorkTime(driver, timeToFinish) {
	let now = Date.now() + (getDriverAvailableIn(driver) + timeToFinish) * 60 * 1000;
	return !inWorkHours(now);
}

function getExpectedFinishTime(time, delivery_to, delivery_from) {
	let coeff = 1000 * 60 * settings.nearestMinute;
	return new Date(Math.ceil((new Date().getTime() + ((time + getTravelTime(delivery_to, delivery_from)) * 1000 * 60)) / coeff) * coeff);
}

function calculateHowManyHoursAgo(date) {
	return Math.abs(Math.ceil((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60)));
}



// Delivery stuff
function submitNewDelivery(uid, did, type, fromPlace, from, to, distance, price, thing, phone, weight, partner) {
	if (type == 1) {
		fromPlace = getPlace('id', fromPlace);
		if (fromPlace) {
			fromPlace = fromPlace.name;
		}
	}

	let delivery = {
		id: did,
		uid: uid,
		type: parseInt(type),
		fromPlace: fromPlace,
		from: parsePosition(from),
		to: parsePosition(to),
		price: parseInt(price),
		thing: thing,
		weight: parseInt(weight),
		distance: parseFloat(distance),
		status: 0,
		driver: false,
		expected_finish_time: false,
		date: Date.now()
	}

	if (typeof (phone) != 'undefined') delivery.client_phone = phone;
	if (type == 1) delivery.partner = partner;

	deliveries.push(delivery);
	db.collection("deliveries").insertOne(delivery, (err, res) => {
		if (err) {
			deliveries = deliveries.filter(obj => obj.id != delivery.id);
			console.log(err)
			return false
		};
		let user = getUser('id', uid)
		user.last_delivery = Date.now();
		user.hash = "";
		handleNewDelivery(delivery);
	});
	return true;
}

function deliveryInfoPage(delivery) {
	return {
		d_type: delivery.type,
		status: delivery.status,
		name: getUser("id", delivery.uid).name,
		fromPlace: delivery.fromPlace,
		thing: delivery.thing,
		distance: delivery.distance,
		price: delivery.price,
		date: new Date(delivery.date),
		driver: getDriver('id', delivery.driver),
		expected_finish_time: delivery.expected_finish_time,
	}
}
function carDeliveryInfoPage(delivery) {
	return {
		d_type: delivery.type,
		status: delivery.status,
		name: getUser("id", delivery.uid).name,
		from: delivery.from,
		to: delivery.to,
		fromPlace: delivery.shop,
		thing: delivery.thing,
		price: delivery.price,
		driver: getDriver('id', delivery.driver)
	}
}

function handleNewDelivery(delivery, driverConnected) {
	if (delivery) {
		let result = getLeastBusyDriver(delivery.from);

		if (result == "no driver available right now") {
			delivery.status = 6;
			deliveriesBuffer.push(delivery);
			db.collection('deliveries').updateOne({ id: delivery.id }, { $set: { status: delivery.status } });
		} else {
			let driver = result.driver;
			let time = result.time + settings.driverRestTime; // result.time = leastbusyrdriver.available_in

			delivery.status = 1;

			delivery.expected_finish_time = getExpectedFinishTime(time, delivery.to, delivery.from);

			delivery.driver = driver.id;

			if (driver.tasks) driver.tasks.push(delivery.id);
			else driver.tasks = [delivery.id];

			if (driver.available_in) driver.available_in.push(Math.ceil((time + delivery.takes_time) / settings.nearestMinute) * settings.nearestMinute);
			else driver.available_in = [Math.ceil((time + delivery.takes_time) / settings.nearestMinute) * settings.nearestMinute];

			db.collection('users').updateOne({ id: driver.id }, { $set: { available_in: driver.available_in, tasks: driver.tasks, } });
			db.collection('deliveries').updateOne({ id: delivery.id }, {
				$set: {
					driver: delivery.driver,
					status: delivery.status,
					expected_finish_time: delivery.expected_finish_time
				}
			});

			if (deliveriesBuffer.includes(delivery)) {
				deliveriesBuffer = deliveriesBuffer.filter(obj => obj.id != delivery.id);
			}

			if (driver.socket && !driverConnected) {
				io.to(driver.socket).emit("got_a_new_delivery", getDetailsToSendToDriver(delivery));
			}
		}
		sendNewDeliveryStatus(delivery.id);
	}
}

function getLeastBusyDriver(from) {
	if (drivers) {
		let times = [];
		let d = [];
		let onlineDrivers = drivers.filter(obj => obj.status == 1);
		if (onlineDrivers) {
			onlineDrivers.forEach(driver => {
				let travel_time = getTravelTime(driver.pos, from);
				let t = getDriverAvailableIn(driver);
				t += travel_time + 1;
				times.push(t);
				d.push(driver);
			});
			if (times.length) {
				return {
					driver: d[times.indexOf(Math.min(...times))],
					time: Math.min(...times)
				} // least busy driver
			}
		}
	}
	return "no driver available right now";
}

function sendNewDeliveryStatus(delivery) {
	delivery = getDelivery('id', delivery);
	if (delivery) {
		io.to(delivery.id).emit('new_delivery_status', {
			status: delivery.status,
			driver: getDriver('id', delivery.driver),
			expected_finish_time: delivery.expected_finish_time
		});
	}
}

function fillDeliveriesBuffer() {
	if (deliveries) {
		deliveriesBuffer = deliveries.filter(obj => obj.status == 6);
	}
}

function getCarDeliveries(userid) {
	let d = [];
	car_deliveries.forEach(delivery => {
		let user = getUser('id', delivery.uid);
		if (delivery.status < 3) {
			let dd = {
				id: delivery.id,
				user: user.name,
				phone: user.phone,
				from: delivery.from,
				to: delivery.to,
				type: delivery.type,
				thing: delivery.thing,
				receiver_phone: delivery.phone,
				status: delivery.status
			}
			if (typeof (delivery.driver) == 'undefined' || delivery.driver == userid) d.push(dd);
		}
	});
	return d;
}

function getUserCarDeliveries(userid) {
	if (car_deliveries) return car_deliveries.filter(obj => obj.uid == userid);
	return [];
}


// Driver stuff
function newDriverConnected(driver) {
	let i = 0;
	while (deliveriesBuffer && deliveriesBuffer.length) {
		if (driver.tasks && driver.tasks.length > settings.maxDriverDeliveriesAtOnce) break;
		handleNewDelivery(deliveriesBuffer[i], true);
		i++;
	}
}

function removeDriverTask(driver, taskid) {
	let index = driver.tasks.indexOf(taskid);
	driver.tasks.splice(index, 1);
	driver.available_in.splice(index, 1);
	driver.current_task = "";
	if (driver.tasks && driver.tasks.length) {
		driver.tasks.forEach(task => {
			let delivery = getDelivery('id', task);
			if (delivery && delivery.driver) {
				let driver = getUser('id', delivery.driver);
				if (driver) {
					delivery.expected_finish_time = getExpectedFinishTime((getDriverAvailableIn(driver) + settings.driverRestTime), delivery.to, delivery.from);
					sendNewDeliveryStatus(delivery);
				}
			}
		});
	}
}



// Admin stuff
function addNewPlace(id, name, secret, place, schedule, startTime, endTime) {
	let newPlace = {
		id: id,
		name: name,
		secret: secret,
		place: parsePosition(place),
		schedule: schedule,
		startTime: startTime,
		endTime: endTime
	}
	places.push(newPlace);
	db.collection('places').insertOne(newPlace);
}



// Schedules stuff

function inWorkHours(now) {
	if (!we_are_working_now) return false;
	if (typeof (now) == 'undefined') now = new Date();
	if (today.getDay() == 5 && (now >= (new Date(todays_schedule[0][0])) && now <= (new Date(todays_schedule[0][1]))) || (now >= (new Date(todays_schedule[1][0])) && now <= (new Date(todays_schedule[1][1])))) return true;
	else if ((now >= (new Date(todays_schedule[0])) && now <= (new Date(todays_schedule[1])))) return true;
	return false;
}

function inPartnerWorkHours(partnerid) {
	let p = partners_schedule[partnerid];
	let now = new Date();
	if (p) {
		if (p.schedule == 0 && today.getDay() == 5) return false;
		if (p.schedule == 1 && (today.getDay() == 5 || today.getDay() == 6)) return false;
		if (now >= (new Date(p.time[0])) && now <= (new Date(p.time[1]))) return true;
	}
	return false;
}

function makePlaceSchedules() {
	if (places) {
		places.forEach(place => {
			partners_schedule[place.id] = {
				schedule: place.schedule,
				time: [place.startTime, place.endTime]
			}
			createPartnerScheduleTimes(place.id);
		});
	}
}

function createPartnerScheduleTimes(partnerid) {
	partners_schedule[partnerid].time = [
		new Date(`${todays_date} ${partners_schedule[partnerid].time[0]}`).getTime(),
		new Date(`${todays_date} ${partners_schedule[partnerid].time[1]}`).getTime()
	];
}

function loadSchedules() {
	if (today.getDay() == 5) { // Friday
		todays_date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
		todays_schedule = [[new Date(`${todays_date} ${our_schedule[1][0][0]}`).getTime(), new Date(`${todays_date} ${our_schedule[1][0][1]}`).getTime()], [new Date(`${today} ${our_schedule[1][1][0]}`).getTime(), new Date(`${today} ${our_schedule[1][1][1]}`).getTime()]];
	} else {
		todays_date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
		todays_schedule = [new Date(`${todays_date} ${our_schedule[0][0]}`).getTime(), new Date(`${todays_date} ${our_schedule[0][1]}`).getTime()];
	}
}


// SCHEDULES

// Daily saving
schedule.scheduleJob("0 30 18,22 * * *", () => { // 18:30 and 22:30 everyday
	let insertion = {
		id: todays_date,
		deliveries: daily_deliveries,
		profit: daily_profit,
		drivers: []
	}
	if (drivers) {
		drivers.forEach(driver => {
			insertion.drivers.push({
				driver: driver.id,
				deliveries: driver.daily_deliveries || 0,
				profit: driver.daily_profit || 0
			});
		});
	}

	db.collection('finance').findOne({ id: todays_date }, (err, result) => {
		if (result) {
			db.collection('finance').updateOne({ id: todays_date }, {
				$set: {
					deliveries: insertion.deliveries,
					profit: insertion.profit,
					drivers: insertion.drivers
				}
			},
				{ upsert: true }
			).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
		} else {
			insertion.id = todays_date;
			db.collection('finance').insertOne(insertion).catch((err) => console.log("Error : " + Date.now() + "  " + err));
		}
	});
	db.collection('finance').updateOne({ id: "this_week" }, { $set: { deliveries: weekly_deliveries, profit: weekly_profit } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
	db.collection('finance').updateOne({ id: "all_time" }, { $set: { deliveries: all_time_deliveries, profit: all_time_profit } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
});

// Daily saving right before midnight
schedule.scheduleJob({ hour: 23, minute: 59, second: 0 }, () => { // 23:59 every day
	let insertion = {
		id: todays_date,
		deliveries: daily_deliveries,
		profit: daily_profit,
		drivers: []
	}
	if (drivers) {
		drivers.forEach(driver => {
			insertion.drivers.push({
				driver: driver.id,
				deliveries: driver.daily_deliveries || 0,
				profit: driver.daily_profit || 0
			});
			driver.daily_deliveries = 0;
			driver.daily_profit = 0;
			driver.tasks = [];
			driver.available_in = [];
		});
	}

	daily_deliveries = 0;
	daily_profit = 0;
	deliveries = []; // deleting all deliveries from ram

	db.collection('deliveries').deleteMany({ status: { $ne: 4 } }); // keeping only finished deliveries in db

	db.collection('finance').findOne({ id: todays_date }, (err, result) => {
		if (result) {
			db.collection('finance').updateOne({ id: todays_date }, {
				$set: {
					deliveries: insertion.deliveries,
					profit: insertion.profit,
					drivers: insertion.drivers
				}
			},
				{ upsert: true }
			).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
		} else {
			insertion.id = todays_date;
			db.collection('finance').insertOne(insertion).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
		}
	});
});

// Refreshing date and schedules
schedule.scheduleJob("0 0 0,4 * * *", () => { // 00:00 and 04:00 everyday
	today = new Date();
	if (today.getDay() == 5) { // Friday
		todays_schedule = [
			[
				new Date(`${todays_date} ${our_schedule[1][0][0]}`).getTime(),
				new Date(`${todays_date} ${our_schedule[1][0][1]}`).getTime()
			],
			[
				new Date(`${today} ${our_schedule[1][1][0]}`).getTime(),
				new Date(`${today} ${our_schedule[1][1][1]}`).getTime()
			]
		];
	} else {
		todays_schedule = [
			new Date(`${todays_date} ${our_schedule[0][0]}`).getTime(),
			new Date(`${todays_date} ${our_schedule[0][1]}`).getTime()
		];
	}
	Object.keys(partners_schedule).forEach(p => {
		createPartnerScheduleTimes(p);
	});
});

// Weekly car deliveries deletion
schedule.scheduleJob("0 7 4 * * 0", () => { // 04:07 every Sunday
	car_deliveries = []; // removing car deliveries from ram
	db.collection('cardeliveries').deleteMany({ status: { $ne: 3 } }); // keeping only finished car deliveries in db
});

// Weekly drivers refreshion
schedule.scheduleJob("0 7 0,4 * * 5", () => { // 00:07 and 04:07 every Friday
	if (drivers) {
		drivers.forEach(driver => {
			driver.weekly_deliveries = 0;
			driver.weekly_profit = 0;
			db.collection('finance').updateOne({ id: driver.id }, { $set: { weekly_deliveries: 0, weekly_profit: 0 } });
		});
	}

	db.collection('finance').findOne({ id: "this_week" }, (err, result) => {
		if (result) {
			db.collection('finance').updateOne({ id: "this_week" }, { $set: { deliveries: 0, profit: 0 } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
		} else {
			db.collection('finance').insertOne({ id: "this_week", deliveries: 0, profit: 0 }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
		}
	});
});


// Partners weekly data
schedule.scheduleJob("0 13 1 * * 5", () => { // 01:13 every Friday
	let partners = [];
	let allPartners = getPartners();
	if (allPartners) {
		allPartners.forEach(partner => {
			partners.push({
				name: partner.name,
				phone: partner.phone,
				percentage: partner.percentage,
				deliveries_amount: partner.client_deliveries_amount,
				payment_amount: normalizePrice(((partner.client_deliveries_amount || 0) * (partner.percentage / 100)), 50)
			});
			partner.client_deliveries_amount = 0;
		});
	}
	db.collection('finance').findOne({ id: "this_week" }, (err, result) => {
		if (result) {
			db.collection('finance').updateOne({ id: "this_week" }, { $set: { partners: partners } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
		} else {
			db.collection('finance').insertOne({ id: "this_week", deliveries: 0, profit: 0, partners: partners }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
		}
	});
});


// Saving user spending
schedule.scheduleJob("0 42 0 * * 0", () => { // 00:42 every Sunday
	weekly_winners = [];
	if (users) {
		let normal_users = users.filter(obj => obj.type == 0);
		if (normal_users) {
			let lastWeeksWinners = normal_users.filter(obj => obj.winner == true || obj.winner_delivery);
			if (lastWeeksWinners) {
				lastWeeksWinners.forEach(user => {
					delete user.winner;
					if (user.winner_delivery) delete user.winner_delivery;
				});
			}
			let qualifiedUsers = normal_users.filter(obj => obj.weekly_deliveries >= settings.deliveriesToBeQualified);
			if (qualifiedUsers) {
				let userThatSpentTheMost = qualifiedUsers.sort((a, b) => (a.weekly_spending < b.weekly_spending) ? 1 : -1)[0];
				userThatSpentTheMost.winner = true;
				weekly_winners.push(userThatSpentTheMost.id);

				qualifiedUsers = qualifiedUsers.sort((a, b) => (a.weekly_deliveries < b.weekly_deliveries) ? 1 : -1); // Descending
				let winners = 0;
				let i = 0;
				while (winners < 2 && i < qualifiedUsers.length) {
					if (qualifiedUsers[i] != userThatSpentTheMost) {
						qualifiedUsers[i].winner = true;
						weekly_winners.push(qualifiedUsers[i].id);
						winners++;
					}
					i++;
				}
			}
			normal_users.forEach(user => {
				db.collection('users').updateOne({ id: user.id }, { $set: { weekly_spending: user.weekly_spending || 0, weekly_deliveries: user.weekly_deliveries || 0 } }, { upsert: true })
					.then(() => {
						user.weekly_spending = 0;
						user.weekly_deliveries = 0;
					})
					.catch((err) => { console.log("Error in 'Saving user spending' : ", err) });
			});
		}
	}
});

// Deleting unconfirmed users
schedule.scheduleJob("0 14 3 * * 0,3", () => { // 03:14 every Sunday and Wednesday
	let unconfirmed_users = users.filter(obj => obj.confirmed == false);
	unconfirmed_users.forEach(u => {
		if (calculateHowManyHoursAgo(u.reg_date) > settings.maxHoursWithoutConfirmation) {
			users = users.filter(obj => obj.id != u.id);
			db.collection('users').deleteOne({ id: u.id });
		}
	});
});


// Saving api use
schedule.scheduleJob({ hour: 13, minute: 38, second: 0 }, () => {
	db.collection('admin').updateOne({ id: "graphopper" }, { $set: { apis: graphhopper_apis } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
});
schedule.scheduleJob({ hour: 23, minute: 38, second: 0 }, () => {
	db.collection('admin').updateOne({ id: "mapbox" }, { $set: { apis: mapbox_apis } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
});
schedule.scheduleJob("0 15 2 * * *", () => { // 02:15 everyday
	graphhopper_apis.forEach(api => { api.use = 0; });
	db.collection('admin').updateOne({ id: "graphopper" }, { $set: { apis: graphhopper_apis } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
});
schedule.scheduleJob("0 22 2 1 * *", () => { // 02:22 at the first day of the month
	mapbox_apis.forEach(api => { api.use = 0; });
	db.collection('admin').updateOne({ id: "mapbox" }, { $set: { apis: mapbox_apis } }, { upsert: true }).catch((err) => console.log("Error : " + Date.now() + "  " + err));;
});