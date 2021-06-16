const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const MySQLStore = require('express-mysql-session')(session);
const multer = require('multer');
const jimp = require('jimp')
const dotenv = require('dotenv');


// Getting some values
dotenv.config();
const { HASH_SECRET, COOKIE_SECRET, COOKIE_PARSER_SECRET, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT, TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID, MAPBOX_API, GRAPHHOPPER_API } = process.env;


// Twilio setup
const twilio = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN);
// Creating a new service (done only once)
// twilio.verify.services.create({ friendlyName: 'PFE' }).then(service => console.log(service.sid));


// Setting some data
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

const upload = multer({ dest: './public/img' });

// Variables
var users = [];
var deliveries = [];
var partners = [];
var items = [];
var drivers = [];
var admins = [];
var we_are_working_now = true;
var partners_schedule = [];
var deliveriesBuffer = [];
var secretkeys = [];

// Database connection
const db = mysql.createConnection(dbOptions);
db.connect();

// Loading data to memory
db.query("SELECT * FROM users", (err, results) => {
	results.forEach(result => {
		result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
		result.confirmed = Boolean(result.confirmed.readIntBE(0, 1));
		users.push(Object.assign({}, result));
	});
	db.query("SELECT * FROM admins", (err, results) => {
		results.forEach(result => {
			result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
			admins.push(Object.assign({}, result));
		});

		db.query("SELECT * FROM drivers", (err, results) => {
			results.forEach(result => {
				result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
				result.status = Boolean(result.status.readIntBE(0, 1));
				drivers.push(Object.assign({}, result));
			});

			db.query("SELECT * FROM partners", (err, results) => {
				results.forEach(result => {
					result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
					result.pos = parsePosition(result.pos);
					result.confirmed = Boolean(result.confirmed.readIntBE(0, 1));
					partners.push(Object.assign({}, result));
				});
				makePartnersSchedules();

				db.query("SELECT * FROM items", (err, results) => {
					results.forEach(result => {
						result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
						result.inStock = Boolean(result.inStock.readIntBE(0, 1));
						items.push(Object.assign({}, result));
					});


					db.query("SELECT * FROM deliveries", (err, results) => {
						results.forEach(result => {
							result = Object.fromEntries(Object.entries(result).filter(([_, v]) => v != null));
							result.delivery_from = parsePosition(result.delivery_from);
							result.delivery_to = parsePosition(result.delivery_to);
							result.weight = Boolean(result.weight.readIntBE(0, 1));
							deliveries.push(Object.assign({}, result));
						});
						fillDeliveriesBuffer();

						db.query("SELECT * FROM secretkeys", (err, results) => {
							results.forEach(result => {
								secretkeys.push(Object.assign({}, result));
							});
						});

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
app.use(cookieParser(COOKIE_PARSER_SECRET))

// Session Cookie
const sessionOptions = {
	name: settings.sessionName,
	resave: false,
	saveUninitialized: false,
	secret: COOKIE_SECRET,
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

const checkConfirmed = (req, res, next) => {
	let user = getUser('id', req.session.uid);
	if (user && user.confirmed) {
		next();
	} else {
		res.redirect('/confirm');
	}
}

const checkNotConfirmed = (req, res, next) => {
	let user = getUser('id', req.session.uid);
	if (user && !user.confirmed && (user.type == 0 || user.type == 1)) {
		next();
	} else {
		res.redirect('/');
	}
}

let checkUser = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/login');
	} else {
		let user = getUser('id', req.session.uid);
		if (user && user.type == 0) {
			next();
		} else {
			res.redirect('/');
		}
	}
}

let checkPartner = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/login');
	} else {
		let user = getUser('id', req.session.uid);
		if (user && user.type == 1) {
			next();
		} else {
			res.redirect('/');
		}
	}
}

let checkAdmin = (req, res, next) => {
	if (!req.session.uid) { // user not authenticated
		res.redirect('/login');
	} else {
		let user = getUser('id', req.session.uid);
		if (user && user.type == 3) {
			next();
		} else {
			res.redirect('/');
		}
	}
}

let checkInWorkHours = (req, res, next) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	if (user) {
		if (inWorkHours()) next();
		else return res.render('pages/errors', {
			title: titles[lang].out_of_srvc + settings.titleSuffix[lang],
			error: titles[lang].crrntly_out_of_srvc + settings.titleSuffix[lang],
			body: '',
			name: user.name,
			type: user.type,
			lang: lang
		});
	} else {
		return res.redirect('/');
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

app.get('/home', checkAuth, checkConfirmed, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);

	if (user && (user.type == 0 || user.type == 1)) {
		let userDeliveries = getDeliveriesOfUser(user.id);
		let dataToSend = {
			title: titles[lang].home + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			total_spent: userDeliveries.reduce((acc, obj) => acc += obj.price, 0),
			total_deliveries: userDeliveries.length,
			userDeliveries: userDeliveries,
			working: we_are_working_now,
			work_hours: inWorkHours()
		}

		if (!inWorkHours()) dataToSend.schedule = our_schedule;

		let page = 'home';
		if (user.type == 1) {
			page = 'home_partner';
			dataToSend.client_deliveries_amount = deliveries.filter(e => e.partner == user.id).reduce((acc, b) => acc += b, 0);
			dataToSend.percentage = user.percentage;
			dataToSend.amount_to_pay_us = normalizePrice(((user.percentage / 100) * (dataToSend.client_deliveries_amount || 0)), 50);
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

app.get('/confirm', checkAuth, checkNotConfirmed, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/confirm', {
		title: titles[lang].confirm + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
	});
});

app.post('/login', checkNotAuth, (req, res) => {
	let { phone, password } = req.body;
	if (phone && password) {
		if (phoneValid(phone)) {
			let user = getUser('phone', phone);
			if (user) {
				if (user.password == generateHash(password, user.id)) {
					req.session.uid = user.id;
					return res.redirect('/home');
				}
				return res.redirect('/login?err=' + errors.wrongPasswordErr + '&phone=' + phone);
			} else {
				return res.redirect('/login?err=' + errors.phoneDoesntExistErr + '&phone=' + phone);
			}
		} else {
			res.redirect('/login?err=' + errors.invalidPhoneErr + '&phone=' + phone);
		}
	} else {
		res.redirect('/login?err=' + errors.missingInputErr);
	}
});

app.post('/register', checkNotAuth, (req, res) => {
	let { name, phone, password } = req.body;
	if (phone && password && name) {
		if (nameValid(name)) {
			if (phoneValid(phone)) {
				if (passwordValid(password)) {
					if (getUser('phone', phone)) {
						return res.redirect('/register?err=' + errors.phoneExistsErr + '&name=' + name + '&phone=' + phone);
					} else {
						let id = generateUserId(4); // 4 = number of bytes
						let newUser = {
							id: id,
							name: formatName(name),
							phone: phone,
							password: generateHash(password, id),
							pin_retries: 5,
							confirmed: false,
							last_delivery: 0,
							reg_date: new Date()
						}
						db.query("INSERT INTO users VALUES (?,?,?,?,?,?)", [newUser.id, newUser.name, newUser.phone, newUser.password, newUser.confirmed ? 1 : 0, newUser.reg_date], (err, results) => {
							if (err) return res.redirect('/register?err=' + errors.generalErr + '&name=' + name + '&phone=' + phone);
							users.push(newUser);
							sendPin(phone, getAndSetPageLanguage(req, res));
							req.session.uid = id;
							res.redirect('/confirm');
						});
					}
				} else {
					res.redirect('/register?err=' + errors.invalidPasswordErr + '&name=' + name + '&phone=' + phone);
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

app.post('/partners/register', checkNotAuth, async (req, res) => {
	let { phone, name, password, secret } = req.body;
	if (phone && name && password && secret) {
		if (phoneValid(phone)) {
			let user = getUser('phone', phone);
			if (user) {
				return res.redirect('/partners?err=' + errors.phoneExistsErr);
			} else {
				let secretkey = getSecretKey('secretKey', generateKey(secret, phone, 1));
				if (secretkey) {
					let partner = getPartner('secret', secretkey.id);
					if (partner) {
						partner.phone = phone;
						partner.name = name;
						partner.password = generateHash(password, partner.id);
						partner.percentage = secretkey.percentage || settings.partnerPercentage;
						partner.confirmed = true;

						db.query("UPDATE partners SET name=?, phone=?, password=?, percentage=?, secret=?, confirmed=?", [partner.name, partner.phone, partner.password, partner.percentage, null, 1], (err, results) => {
							if (err) {
								res.redirect('/partners?err=' + errors.generalErr + '&name=' + name + '&phone=' + phone + '&email=' + email);
							} else {
								req.session.uid = partner.id;
								destroySecretKey(secretkey.id);
								return res.redirect('/home');
							}
						});
					} else {
						return res.redirect('/partners?err=' + errors.generalErr);
					}
				} else {
					return res.redirect('/partners?err=' + errors.invalidSecret + '&name=' + name + '&phone=' + phone);
				}
			}
		} else {
			return res.redirect('/partners?err=' + errors.invalidPhoneErr + '&name=' + name + '&phone=' + phone);
		}
	} else {
		return res.redirect('/partners?err=' + errors.generalErr);
	}
});

app.get('/partner/items', checkPartner, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);

	res.render('pages/items', {
		title: titles[lang].your_items + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		items: getItems('owner', user.id)
	});
});

app.post('/partner/edit-item/:id', checkPartner, (req, res) => {
	let user = getUser('id', req.session.uid);
	let { name, price, inStock } = req.body;
	let item = getItem('id', req.params.id);

	if (item && item.owner == user.id) {
		item.name = name || item.name;
		item.price = (price || price == 0) && price > -1 ? price : item.price;
		item.inStock = inStock == 'true' ? true : false;

		db.query("UPDATE items SET name=?, price=?, inStock=? WHERE id=?", [item.name, item.price, item.inStock, item.id], (err, results) => {
			if (err) return res.redirect('/partner/items/?success=false');
			else return res.redirect('/partner/items/?success=edit');
		});
	} else {
		return res.redirect('/partner/items/?err=error');
	}
});

app.post('/partner/add-item', checkPartner, (req, res) => {
	let user = getUser('id', req.session.uid);
	let { name, price, inStock } = req.body;

	if (name && !isNaN(parseInt(price))) {
		let item = {
			id: randomHash(4),
			name: name,
			price: (price || price == 0) && price > -1 ? price : item.price,
			owner: user.id,
			inStock: inStock == 'true' ? true : false
		}

		db.query("INSERT INTO items VALUES (?,?,?,?,?)", [item.id, item.name, item.price, item.owner, item.inStock], (err, results) => {
			if (err) return res.redirect('/partner/items/?success=false');
			items.push(item);
			return res.redirect('/partner/items/?success=add');
		});
	} else {
		return res.redirect('/partner/items/?err=error');
	}
});

app.get('/deliver', checkAuth, checkUser, checkInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	if (typeof (user.last_delivery) == 'undefined' || (((Date.now() - user.last_delivery) / 1000) / 60 > settings.intervalBetweenDeliveries)) {
		res.render('pages/deliver', {
			title: titles[lang].new_delivery + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			at: MAPBOX_API,
			gh: GRAPHHOPPER_API
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

app.get('/buy', checkAuth, checkUser, checkInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	if (typeof (user.last_delivery) == 'undefined' || (((new Date().getTime() - new Date(user.last_delivery).getTime()) / 1000) / 60 > settings.intervalBetweenDeliveries)) {
		return res.render('pages/buy', {
			title: titles[lang].new_buy + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			places: getPartnersInfo()
		});
	}
	return res.render('pages/errors', {
		title: titles[lang].too_much + settings.titleSuffix[lang],
		error: titles[lang].too_many_requests,
		body: titles[lang].plz_wait_at_least,
		name: user.name,
		type: user.type,
		lang: lang
	});
});

app.get('/buy/:id', checkAuth, checkUser, checkInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let p, place, pid;
	if (req.params.id == 'other') {
		p = 'other';
	} else {
		p = getPartner('id', req.params.id);
		if (p) {
			place = p.place;
			p = p.name;
			pid = req.params.id;
		} else {
			return res.render('pages/404', {
				title: titles[lang].pg_dsnt_xst + settings.titleSuffix[lang],
				name: user.name,
				type: user.type,
				lang: lang,
			});
		}
	}

	if (typeof (user.last_delivery) == 'undefined' || (((new Date().getTime() - new Date(user.last_delivery).getTime()) / 1000) / 60 > settings.intervalBetweenDeliveries)) {
		return res.render('pages/buy_next', {
			title: titles[lang].new_buy + settings.titleSuffix[lang],
			name: user.name,
			type: user.type,
			lang: lang,
			at: MAPBOX_API,
			gh: GRAPHHOPPER_API,
			partner: p,
			place: place,
			pid: pid
		});
	}
	return res.render('pages/errors', {
		title: titles[lang].too_much + settings.titleSuffix[lang],
		error: titles[lang].too_many_requests,
		body: titles[lang].plz_wait_at_least,
		name: user.name,
		type: user.type,
		lang: lang
	});
});

app.post('/price-request', checkAuth, checkUser, checkInWorkHours, (req, res) => {
	let user = getUser('id', req.session.uid);
	if (!user) res.status(403).send();

	let data = req.body;
	let dataToSend = {};

	// STATUS 
	// 0 = accepted and found a driver
	// 1 = accepted and didn't find a driver
	// 2 = distance too far
	// 3 = not in work hours range

	if (data.distance > settings.maxDeliveryDistance || getDistance(data.from, settings.AlgiersPos) > settings.maxDeliveryDistance || getDistance(data.to, settings.AlgiersPos) > settings.maxDeliveryDistance) {
		dataToSend.status = 2;
	} else if (inWorkHours()) {
		if ((data.partner && !inPartnerWorkHours(data.partner)) && data.partner != 'other') {
			dataToSend.status = 4;
		} else {
			user.last_delivery_price = calculatePrice(data.distance, data.weight);
			if (data.thingsPrice) dataToSend.thingsPrice = parseInt(data.thingsPrice) || 0;
			let d = getLeastBusyDriver(data.from);
			if (d == 'no driver available right now') {
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
				}
			}
		}
	} else {
		dataToSend.status = 3;
	}
	res.send(dataToSend);
});

app.post('/delivery-request', checkAuth, checkUser, (req, res) => {
	let user = getUser('id', req.session.uid);
	if (user && user.hash) {
		let { type, fromPlace, from, to, distance, price, phone, thing, weight, partner } = req.body;
		if (typeof (type) && typeof (from) && typeof (to) && typeof (distance) && typeof (price) && typeof (thing) && typeof (weight) && generateHash(('' + distance).substring(0, 5), '' + price) == user.hash && price == user.last_delivery_price) {
			let did = randomHash(10);
			if (submitNewDelivery(req.session.uid, did, type, fromPlace, from, to, distance, price, thing, phone, weight, partner)) return res.redirect('/delivery/' + did);
			return res.redirect('/delivery-err');
		}
	}
	return res.redirect('/');
});

app.get('/delivery-err', checkAuth, checkUser, (req, res) => {
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

app.get('/delivery/:did', checkAuth, checkUser, (req, res) => {
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
		db.query("SELECT * FROM deliveries WHERE id=?", [req.params.did], (err, results) => {
			if (results && results[0]) {
				delivery = results[0];
				delivery.delivery_from = parsePosition(delivery.delivery_from);
				delivery.delivery_to = parsePosition(delivery.delivery_to);
				delivery.weight = Boolean(delivery.weight.readIntBE(0, 1));
				return res.render('pages/delivery', {
					...the_return, ...deliveryInfoPage(delivery)
				});
			}
		});
	}
	the_return.title = titles[lang].pg_dsnt_xst + settings.titleSuffix[lang];
	return res.render('pages/404', the_return);
});

app.get('/admin', checkAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let todaysDeliveries = getDeliveriesOfToday();
	res.render('pages/admin', {
		title: titles[lang].admin + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		deliveries_today: todaysDeliveries.length,
		profit_today: todaysDeliveries.reduce((acc, b) => acc += b.price, 0)
	});
});

app.get('/admin/new-key', checkAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/admin_add_key', {
		title: titles[lang].add_key + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang
	});
});

app.post('/admin/new-key', checkAdmin, (req, res) => {
	let { secret, phone, type, percentage } = req.body;
	db.query("INSERT INTO secretkeys VALUES (?,?,?,?)", [randomHash(8), generateKey(secret, phone, parseInt(type)), secret, parseInt(percentage) || null]);
	res.redirect('/admin');
});

app.get('/admin/new-partner', checkAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	res.render('pages/admin_add_place', {
		title: titles[lang].add_partner + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		at: MAPBOX_API,
		gh: GRAPHHOPPER_API
	});
});

app.post('/admin/new-partner', checkAdmin, (req, res) => {
	let { name, secret, place, schedule, startTime, endTime } = req.body;
	let secretKey = secretkeys.find(e => e.secretText == secret);
	if (secretKey) {
		let id = randomHash(4);
		let newPartner = {
			id,
			name,
			phone: null,
			password: null,
			pos: parsePosition(place),
			confirmed: false,
			secret: secretKey.id,
			description: null,
			schedule,
			startTime,
			endTime
		}
		partners.push(newPartner);
		db.query("INSERT INTO partners VALUES (?,?,?,?,?,?,?,?,?,?,?)", [newPartner.id, name, newPartner.phone, newPartner.password, stringifyPosition(newPartner.pos), newPartner.confirmed, newPartner.secret, newPartner.description, schedule, startTime, endTime]);
		return res.redirect('/partners/' + id);
	}
	return res.redirect('/admin/new-partner/?sec=' + secret + '&err=' + errors.invalidSecret);
});

app.get('/partners/info', checkAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let p = getPartnersInfo(true);
	res.render('pages/partners_info', {
		title: titles[lang].partners + settings.titleSuffix[lang],
		name: user.name,
		type: user.type,
		lang: lang,
		partners: p
	});
});

app.get('/partners/:id', checkAdmin, (req, res) => {
	let user = getUser('id', req.session.uid);
	let lang = getAndSetPageLanguage(req, res);
	let place = getPartner('id', req.params.id);
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
				desc: place.description,
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

app.post('/partners/img/:id', checkAdmin, upload.single('img'), (req, res) => {
	let tempPath = req.file.path;
	let ext = path.extname(req.file.originalname).toLowerCase()
	let targetPath = path.join(__dirname, `./public/img/partners/${req.params.id}.png`);

	if (settings.allowedImgExt.includes(ext.substr(1))) {
		fs.rename(tempPath, targetPath, err => {
			if (err) return false;

			jimp.read(targetPath, (err, img) => {
				if (err) throw err;
				img.resize(settings.partnerImgSize, jimp.AUTO).write(targetPath);
			});
		});
		return res.redirect('/partners/' + req.params.id);
	}
	fs.unlink(tempPath, err => {
		if (err) return false;
	});
	return res.redirect('/partner/' + req.params.id);
});

app.post('/partners/desc/:id', checkAdmin, (req, res) => {
	let { desc } = req.body;
	let p = getPartner('id', req.params.id);
	if (typeof (desc) && p) {
		p.description = desc;
		db.query("UPDATE partners SET description=?", [desc]);
	}
	return res.redirect('/partners/' + req.params.id);
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

app.get('/logout', checkAuth, (req, res) => {
	let user = getUser('id', req.session.uid);
	if (user) {
		req.session.destroy(err => {
			if (err) return res.redirect('/login');
			if (user.type == 2) user.status = 0;
			res.clearCookie(settings.sessionName);
			return res.redirect('/');
		});
	}
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



// Handling sockets
io.on('connection', (socket) => {
	let user = getUser('id', socket.request.session.uid) || {};
	if (user) user.socket = socket.id;


	// User Confirmation
	socket.on('confirm_page', (data) => {
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

			time_left = user.pin_requested_times ? calculateTimeLeft(settings.intervalBetweenSMS, date, coef) : 0;

			socket.emit('retry_time_left', {
				time_left: time_left,
				hash: user.hash,
			});
		}

		timeleft();
		setInterval(timeleft, 1000 * 60); // send how much time left for retry every minute

		socket.emit('confirm_page_data', user.phone);
	});
	socket.on('retry', (data) => {
		if (data.hash == user.hash) {
			if (user.pin_requested_times) user.pin_requested_times++;
			else user.pin_requested_times = 1;
			user.last_sent_pin = Date.now();
			sendPin(user.phone, user.lang || settings.defaultWebsiteLanguage);
		}
	});
	socket.on('confirm_pin', (data) => {
		handlePinConfirmation(socket, user, data);
	});

	// A user is viewing delivery info page
	socket.on('viewing_delivery', (data) => {
		socket.join(data);
	});


	// Disconnection
	socket.on('disconnect', function () {
		if (user && user.socket) {
			let s = user.socket;
			setTimeout(() => {
				if (users.socket == s) delete user.socket;
			}, settings.usersSocketTimeout);
		}
	});
});


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
	if (!user && admins) {
		user = admins.find(obj => obj[key] == value);
		type++;
	}
	if (user) user.type = type;
	return user;
}

function getDriver(key, value) {
	if (drivers) {
		let driver = drivers.find(obj => obj[key] == value);
		if (driver) return { name: driver.name, phone: driver.phone }
	}
	return false;
}

function getPartner(key, value) {
	return partners.find(obj => obj[key] == value);
}

function getItem(key, value) {
	return items.find(obj => obj[key] == value);
}

function getItems(key, value) {
	return items.filter(obj => obj[key] == value);
}

function getSecretKey(key, value) {
	return secretkeys.find(obj => obj[key] == value);
}

function getDelivery(key, value) {
	if (deliveries) return deliveries.find(obj => obj[key] == value);
	return false;
}

function getDeliveriesOfUser(id) {
	if (deliveries) {
		return deliveries.filter(obj => obj.uid == id && isToday(obj.date));
	}
	return [false];
}

function getDeliveriesOfToday() {
	if (deliveries) {
		return deliveries.filter(obj => isToday(obj.date));
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

function todaysDate() {
	let today = new Date();
	return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
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
	return 'no driver available right now';
}

function getPartnersInfo(forAdmin) {
	return partners.filter(e => e.confirmed || forAdmin).map(e => {
		return {
			id: e.id,
			name: e.name,
			desc: e.description || ''
		}
	});
}



// Some validations and stuff
function phoneValid(phone) {
	if (phone.length == 10 && phone.startsWith("05") || phone.startsWith("06") || phone.startsWith("07")) return true;
	return false;
}

function nameValid(name) {
	return name.length > 2 ? /^[\u0600-\u06FFa-zA-Z\- ]+$/.test(name) : false;
}

function passwordValid(password) {
	return password.length > 5 || password.length < 80;
}

function formatName(name) {
	return name.slice(0, settings.maxNameLength).replace(/\w+/g, (txt) => { return txt.charAt(0).toUpperCase() + txt.substr(1); }).replace(/\s+/g, ' ').trim();
}

function destroySecretKey(id) {
	db.query("DELETE FROM secretkeys WHERE id=?", [id], (err, results) => {
		secretkeys = secretkeys.filter(e => e.id != id)
	});
}

// Generating stuff
function generateHash(string, salt) {
	salt = crypto.createHash('sha256').update(HASH_SECRET + salt).digest('hex');
	return crypto.pbkdf2Sync(string, salt, 200, 32, 'sha512').toString('hex');
}

function randomHash(bytes) {
	return crypto.randomBytes(bytes).toString('hex');
}

function generateUserId(bytes) {
	let id = crypto.randomBytes(bytes).toString('hex');
	if (getUser('id', id)) return generateUserId(bytes);
	return id;
}

function generateKey(secretText, phone, type) {
	return `${type}${generateHash(secretText, phone)}`;
}


// Some calculations
function calculateTimeLeft(end, startDate, coef = 1) {
	return Math.max(Math.ceil((end * coef - (Date.now() - startDate) / 1000) / 60), 0);
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
	let position;
	try {
		position = string.split(',');
		position[0] = parseFloat(position[0]);
		position[1] = parseFloat(position[1]);
	} catch {
		position = null;
	}
	return position;
}

function stringifyPosition(pos) {
	try {
		return `${pos[0]},${pos[1]}`
	} catch {
		return '';
	}
}

function calculatePrice(distance, weight) {
	return normalizePrice(((20 + distance * 27) * (1 + (weight / 4))), 10);
}

function getTravelTime(pos, from) {
	return Math.ceil(((getDistance(pos, from) / settings.driverSpeed) * 60) * (1 + settings.percentageAddedToTime / 100));
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

function willDeliveryExceedOurWorkTime(driver, timeToFinish) {
	let now = Date.now() + (getDriverAvailableIn(driver) + timeToFinish) * 60 * 1000;
	return !inWorkHours(now);
}

function isToday(date) {
	let today = new Date();
	date = new Date(date);
	return date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear();
}



// PIN validation
function handlePinConfirmation(socket, user, data) {
	if (typeof (user.pin_retries) == 'undefined' || user.pin_retries > 1) {
		let status = 'pending';
		twilio.verify.services(TWILIO_SERVICE_SID).verificationChecks.create({ to: `+213${user.phone.substr(1)}`, code: '' + data }).then((verification_check) => {
			status = verification_check.status;
			if (status == 'approved') {
				user.confirmed = true;
				delete user.last_sent_pin;
				delete user.pin_requested_times;
				delete user.last_pin_submission;
				delete user.pin_retries;
				db.query("UPDATE users SET confirmed=? WHERE id=?", [1, user.id], (err, results) => {
					socket.emit('pin_confirmed');
				});
			} else {
				if (user.pin_retries) user.pin_retries -= 1;
				else user.pin_retries = settings.maxPinRetries;
				user.last_pin_submission = Date.now();
				socket.emit('pin_invalid', user.pin_retries);
			}
		}).catch((error) => {
			socket.emit('err_happened');
		});
	} else {
		let time_left = calculateTimeLeft(settings.intervalWhenTooManyPinSubmissions, user.last_pin_submission);
		if (time_left) {
			socket.emit('tried_too_much', time_left);
		} else {
			user.pin_retries = settings.maxPinRetries;
			delete user.last_pin_submission;
		}
	}
}

function sendPin(phone, lang) {
	console.log(phone, lang)
	// twilio.verify.services(TWILIO_SERVICE_SID).verifications.create({ locale: (lang || settings.defaultWebsiteLanguage), to: `+213${phone.substr(1)}`, channel: 'sms' });
}


// Some scheduling
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

function makePartnersSchedules() {
	if (partners) {
		partners.forEach(partner => {
			partners_schedule[partner.id] = {
				schedule: partner.schedule,
				time: [partner.startTime, partner.endTime]
			}
			createPartnerScheduleTimes(partner.id);
		});
	}
}

function createPartnerScheduleTimes(partnerid) {
	partners_schedule[partnerid].time = [
		new Date(`${todaysDate()} ${partners_schedule[partnerid].time[0]}`).getTime(),
		new Date(`${todaysDate()} ${partners_schedule[partnerid].time[1]}`).getTime()
	];
}



// Delivery stuff
function submitNewDelivery(uid, did, type, fromPlace, from, to, distance, price, thing, phone, weight, partner) {
	if (type == 1) {
		fromPlace = getPartner('id', fromPlace);
		if (fromPlace) fromPlace = fromPlace.name;
		else fromPlace = null;
	}

	let delivery = {
		id: did,
		uid: uid,
		type: parseInt(type),
		fromPlace: fromPlace,
		delivery_from: parsePosition(from),
		delivery_to: parsePosition(to),
		price: parseInt(price),
		thing: thing,
		weight: parseInt(weight),
		distance: parseFloat(distance),
		status: 0,
		driver: null,
		expected_finish_time: null,
		date: new Date(),
		waypoints: null,
		partner: null
	}

	if (type == 1) delivery.partner = partner;

	deliveries.push(delivery);

	db.query("INSERT INTO deliveries VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [delivery.id, uid, delivery.type, fromPlace, stringifyPosition(delivery.delivery_from), stringifyPosition(delivery.delivery_to), delivery.price, thing, delivery.weight, delivery.distance, delivery.status, delivery.driver, delivery.expected_finish_time, delivery.date, delivery.waypoints, delivery.partner], (err, results) => {
		if (err) {
			deliveries = deliveries.filter(obj => obj.id != delivery.id);
		} else {
			let user = getUser('id', uid)
			user.last_delivery = delivery.date;
			user.hash = '';
			handleNewDelivery(delivery);
		}
	});

	return true;
}

function handleNewDelivery(delivery, driverConnected) {
	if (delivery) {
		let result = getLeastBusyDriver(delivery.delivery_from);

		if (result == 'no driver available right now') {
			delivery.status = 6;
			deliveriesBuffer.push(delivery);
			db.query("UPDATE deliveries SET status=?", [delivery.status]);
		} else {
			let driver = result.driver;
			let time = result.time + settings.driverRestTime; // result.time = leastbusyrdriver.available_in

			delivery.status = 1;

			delivery.expected_finish_time = getExpectedFinishTime(time, delivery.delivery_to, delivery.delivery_from);

			delivery.driver = driver.id;

			if (driver.tasks) driver.tasks.push(delivery.id);
			else driver.tasks = [delivery.id];

			if (driver.available_in) driver.available_in.push(Math.ceil((time + delivery.takes_time) / settings.nearestMinute) * settings.nearestMinute);
			else driver.available_in = [Math.ceil((time + delivery.takes_time) / settings.nearestMinute) * settings.nearestMinute];

			db.query("INSERT INTO current_tasks VALUES (?,?)", [driver.id, delivery.id]);
			db.query("UPDATE deliveries SET driver=?, status=?, expected_finish_time=?", [delivery.driver, delivery.status, delivery.expected_finish_time]);

			if (deliveriesBuffer.includes(delivery)) {
				deliveriesBuffer = deliveriesBuffer.filter(obj => obj.id != delivery.id);
			}

			if (driver.socket && !driverConnected) {
				io.to(driver.socket).emit('got_a_new_delivery', getDetailsToSendToDriver(delivery));
			}
		}
		sendNewDeliveryStatus(delivery.id);
	}
}

function getExpectedFinishTime(time, delivery_to, delivery_from) {
	let coeff = 1000 * 60 * settings.nearestMinute;
	return new Date(Math.ceil((new Date().getTime() + ((time + getTravelTime(delivery_to, delivery_from)) * 1000 * 60)) / coeff) * coeff);
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
	if (deliveries) deliveriesBuffer = deliveries.filter(obj => obj.status == 6);
}

function deliveryInfoPage(delivery) {
	return {
		d_type: delivery.type,
		status: delivery.status,
		name: getUser('id', delivery.uid).name,
		fromPlace: delivery.fromPlace,
		thing: delivery.thing,
		distance: delivery.distance,
		price: delivery.price,
		date: new Date(delivery.date),
		driver: getDriver('id', delivery.driver),
		expected_finish_time: delivery.expected_finish_time
	}
}