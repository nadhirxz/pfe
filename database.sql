CREATE TABLE users (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	phone VARCHAR(10) NOT NULL,
	password VARCHAR(64) NOT NULL,
	confirmed BIT NOT NULL,
	reg_date TIMESTAMP,
	lang VARCHAR(2),
	disabled BIT
);

CREATE TABLE admins (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	phone VARCHAR(10) NOT NULL,
	password VARCHAR(64) NOT NULL,
	lang VARCHAR(2)
);

CREATE TABLE drivers (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	phone VARCHAR(10) NOT NULL,
	password VARCHAR(64) NOT NULL,
	status BIT NOT NULL,
	pos VARCHAR(50),
	percentage INT(2),
	paid INT(10),
	lang VARCHAR(2),
	last_seen TIMESTAMP NULL,
	disabled BIT
);

CREATE TABLE secretkeys (
	id VARCHAR(8) PRIMARY KEY,
	secretKey VARCHAR(65) NOT NULL,
	secretText VARCHAR(40) NOT NULL,
	percentage INT(2)
);

CREATE TABLE shops (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	phone VARCHAR(10),
	password VARCHAR(64),
	pos VARCHAR(50),
	confirmed BIT NOT NULL,
	description VARCHAR(100),
	schedule INT(2),
	startTime VARCHAR(5),
	endTime VARCHAR(5),
	percentage INT(2),
	paid INT(10),
	lang VARCHAR(2),
	disabled BIT
);

CREATE TABLE items (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	price INT(10) NOT NULL,
	owner VARCHAR(8) NOT NULL,
	inStock BIT NOT NULL,
	FOREIGN KEY (owner) REFERENCES shops(id)
);

CREATE TABLE deliveries (
	id VARCHAR(20) PRIMARY KEY,
	uid VARCHAR(8) NOT NULL,
	type INT(2) NOT NULL,
	fromPlace VARCHAR(40),
	delivery_from VARCHAR(50),
	delivery_to VARCHAR(50),
	price INT(8),
	thing VARCHAR(40),
	recipients_phone VARCHAR(10),
	weight BIT,
	distance FLOAT,
	status INT(1),
	driver VARCHAR(8),
	estimated_finish_time TIMESTAMP NULL,
	date TIMESTAMP,
	shop VARCHAR(8),
	item VARCHAR(8),
	finish_time TIMESTAMP NULL,
	thingsPrice INT(10),
	FOREIGN KEY (uid) REFERENCES users(id),
	FOREIGN KEY (driver) REFERENCES drivers(id),
	FOREIGN KEY (shop) REFERENCES shops(id),
	FOREIGN KEY (item) REFERENCES items(id)
);

CREATE TABLE schedule (
	id VARCHAR(8) PRIMARY KEY,
	s_from VARCHAR(5) NOT NULL,
	s_to VARCHAR(5) NOT NULL,
	working BIT NOT NULL
);

INSERT INTO schedule VALUES ('schedule', '08:00', '18:00', 1);