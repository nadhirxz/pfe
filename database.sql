CREATE TABLE users (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	phone VARCHAR(10) NOT NULL,
	password VARCHAR(64) NOT NULL,
	confirmed BIT NOT NULL,
	reg_date TIMESTAMP
);

CREATE TABLE drivers (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	phone VARCHAR(10) NOT NULL,
	password VARCHAR(64) NOT NULL,
	status BIT NOT NULL
);

CREATE TABLE places (
	id INT(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	secret VARCHAR(40) NOT NULL,
	place VARCHAR(50) UNIQUE,
	schedule INT(2),
	startTime VARCHAR(5),
	endTime VARCHAR(5)
);

CREATE TABLE partners (
	id VARCHAR(8) PRIMARY KEY,
	name VARCHAR(40) NOT NULL,
	phone VARCHAR(10) NOT NULL,
	password VARCHAR(64) NOT NULL,
	confirmed BIT NOT NULL,
	percentage INT(2),
	pos VARCHAR(50),
	reg_date TIMESTAMP,
	FOREIGN KEY (pos) REFERENCES places(place)
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
	weight BIT,
	distance FLOAT,
	status INT(1),
	driver VARCHAR(8),
	expected_finish_time TIMESTAMP,
	date TIMESTAMP,
	waypoints VARCHAR(100),
	partner VARCHAR(8),
	FOREIGN KEY (uid) REFERENCES users(id),
	FOREIGN KEY (driver) REFERENCES drivers(id),
	FOREIGN KEY (partner) REFERENCES partners(id)
);

CREATE TABLE current_tasks (
	driver VARCHAR(8),
	delivery VARCHAR(20),
	PRIMARY KEY (driver, delivery),
	FOREIGN KEY (driver) REFERENCES drivers(id),
	FOREIGN KEY (delivery) REFERENCES deliveries(id)
);

CREATE TABLE secretkeys (
	id VARCHAR(8) PRIMARY KEY,
	sercertKey VARCHAR(65) NOT NULL,
	secretText VARCHAR(40) NOT NULL,
	percentage INT(2)
);

CREATE TABLE finance (
	id VARCHAR(10) NOT NULL,
	deliveires INT(4) NOT NULL,
	profit INT(10) NOT NULL
);

CREATE TABLE finance_drivers (
	driver VARCHAR(8),
	deliveries INT(4) NOT NULL,
	profit INT(10) NOT NULL,
	FOREIGN KEY (driver) REFERENCES drivers(id)
);

CREATE TABLE schedule (
	id VARCHAR(8) PRIMARY KEY,
	schedule TEXT NOT NULL,
	working BIT NOT NULL
);