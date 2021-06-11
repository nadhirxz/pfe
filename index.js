const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const MySQLStore = require('express-mysql-session')(session);
const dotenv = require('dotenv');

// Getting some values
dotenv.config();
const { HASH_SECRET, COOKIE_SECRET, COOKIE_PARSER_SECRET, SESSION_STORE_SECRET, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT } = process.env;

var dataFromFiles = require('./data');
var settings = dataFromFiles.settings;
var titles = dataFromFiles.titles;
var errors = dataFromFiles.errors;

const dbOptions = {
	host: DB_HOST,
	port: DB_PORT,
	user: DB_USER,
	password: DB_PASSWORD,
	database: DB_NAME,
}

// Variables
var users = [];
var deliveries = [];
var places = [];
var partners = [];
var drivers = [];

// Database connection
const db = mysql.createConnection(dbOptions);
db.connect();

// Loading data to memory
db.query("SELECT * FROM users", (err, results) => {
	results.forEach(result => {
		result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
		result.confirmed = Boolean(result.confirmed.readIntBE(0, 1));
		result.agreed_on_terms = Boolean(result.agreed_on_terms.readIntBE(0, 1));
		users.push(Object.assign({}, result));
	});

	db.query("SELECT * FROM drivers", (err, results) => {
		results.forEach(result => {
			result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
			result.status = Boolean(result.status.readIntBE(0, 1));
			drivers.push(Object.assign({}, result));
		});

		db.query("SELECT * FROM places", (err, results) => {
			results.forEach(result => {
				result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
				places.push(Object.assign({}, result));
			});

			db.query("SELECT * FROM partners", (err, results) => {
				results.forEach(result => {
					result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
					result.confirmed = Boolean(result.confirmed.readIntBE(0, 1));
					partners.push(Object.assign({}, result));
				});

				db.query("SELECT * FROM deliveries", (err, results) => {
					results.forEach(result => {
						result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
						result.weight = Boolean(result.weight.readIntBE(0, 1));
						deliveries.push(Object.assign({}, result));
					});
				});
			});
		});
	});
});


const sessionStore = new MySQLStore(dbOptions);

// set the view engine to ejs
app.set('view engine', 'ejs');

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser(settings.cookieParserSecret))

// Session Cookie
const sessionOptions = {
	name: settings.sessionName,
	resave: false,
	saveUninitialized: false,
	secret: settings.cookieSecret,
	store: sessionStore,
}

app.use(session({
	...sessionOptions,
	cookie: {
		maxAge: settings.sessionMaxAge,
		sameSite: true,
		secure: settings.cookieSecure,
	}
}));

// Session Middleware so we can access sessions in sockets
var sessionMiddleware = session(sessionOptions);

io.use((socket, next) => {
	sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);

// Give the server access to every file in the folder
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/html', express.static(path.join(__dirname, 'public/html')));
app.use('/lang', express.static(path.join(__dirname, 'public/lang')));

// Starting the server
const port = PORT || 3000;
http.listen(port, () => console.log('Server started on port ' + port));


// Authentication check
const checkAuth = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/login');
	} else {
		next();
	}
}

const checkNotAuth = (req, res, next) => {
	if (req.session.uid) { // user authenticated
		res.redirect('/home');
	} else {
		next();
	}
}


// Routes

app.get('/', (req, res) => {
	if (req.session.uid) { // user authenticated
		let user = getUser('id', req.session.uid);
		if (user) {
			switch (user.type) {
				case 0: return res.redirect('/home'); // normal user
				case 1: return res.redirect('/home'); // partner
				case 2: return res.redirect('/driver');
				case 3: return res.redirect('/admin');
			}
		}
	}
	req.session.uid = '';
	let lang = getAndSetPageLanguage(req, res);
	return res.render('pages/index', {
		title: titles[lang].welcome + settings.titleSuffix[lang],
		lang: lang
	});
});

app.get('/home', checkAuth, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);

	if (user && (user.type == 0 || user.type == 1)) {
		let dataToSend = {
			title: titles[lang].home + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			total_spent: user.total_spent || 0,
			total_deliveries: user.total_deliveries || 0,
			userDeliveries: getDeliveriesOfUser(user.id),
			working: we_are_working_now,
			work_hours: inWorkHours()
		}

		if (!inWorkHours()) dataToSend.schedule = our_schedule;

		let page = 'home';
		if (user.type == 1) {
			page = 'home_partner';
			dataToSend.client_deliveries_amount = user.client_deliveries_amount;
			dataToSend.percentage = user.percentage;
			dataToSend.amount_to_pay_us = normalizePrice(((user.percentage / 100) * (user.client_deliveries_amount || 0)), 50);
		}
		res.render('pages/' + page, dataToSend);
	} else {
		res.redirect('/');
	}
});

app.get('/login', checkNotAuth, (req, res) => {
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/login', {
		title: titles[lang].login + settings.titleSuffix[lang],
		lang: lang
	});
});

app.get('/register', checkNotAuth, (req, res) => {
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/register', {
		title: titles[lang].register + settings.titleSuffix[lang],
		lang: lang
	});
});

app.get('/partners', checkNotAuth, (req, res) => {
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/partners', {
		title: titles[lang].partners_reg + settings.titleSuffix[lang],
		lang: lang
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





// Getting stuff
function getUser(key, value) {
	let user;
	let type = 0;
	if (users) user = users.find(obj => obj[key] == value);
	if (!user && partners) {
		user = partners.find(obj => obj[key] == value);
		type++;
	}
	if (!user && drivers) {
		user = drivers.find(obj => obj[key] == value);
		type++;
	}
	return user ? false : { ...user, type };
}

function getDeliveriesOfUser(id) {
	if (deliveries) {
		return deliveries.filter(obj => obj.uid == id && isToday(obj.date));
	}
	return [false];
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

function inWorkHours() {
	return true;
}

function normalizePrice(price, to, floor) {
	if (floor) Math.floor(price / to) * to;
	return Math.ceil(price / to) * to;
}