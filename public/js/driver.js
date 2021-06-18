var deliveries = [];

var requests = document.getElementById('requests');

var modalTitle = document.getElementById('modal-title');
var modalButton = document.getElementById('modal-button');

sendPosition("driver_connected");

setInterval(() => {
	sendPosition("driver_position")
}, 1000 * 60 * 3); // 3 minutes

socket.on("deliveries", async (data) => {
	if (data && data.length) {
		deliveries = [...data.filter(e => e.accepted).sort((a, b) => (a.date > b.date) ? 1 : -1), ...data.filter(e => !e.accepted).sort((a, b) => (a.date > b.date) ? 1 : -1)];
		for (const delivery of deliveries) {
			let d = await createNewRequestDiv(delivery, delivery.accepted);
			requests.appendChild(d);
			if (document.getElementById('loading-img')) requests.removeChild(document.getElementById('loading-img'));
		}
	} else {
		requests.innerHTML = `<hr class="my-5"><h5>${js_lang_text.no_deliveries}</h5>`;
	}
	if (document.getElementById('loading-img')) requests.removeChild(document.getElementById('loading-img'));
});

socket.on('new_delivery', (data) => {
	createNewRequestDiv(data, 'new').then(d => requests.appendChild(d));
});

socket.on('canceled_delivery', (data) => {
	let the_div = document.getElementById(data);
	requests.removeChild(the_div);
});

async function sendPosition(socketmsg) {
	let pos = await getPosition();
	socket.emit(socketmsg, [pos.coords.latitude, pos.coords.longitude]);
}


function getPosition() {
	return new Promise((res, rej) => {
		navigator.geolocation.getCurrentPosition(res);
	});
}


async function createNewRequestDiv(delivery, deliveryStatus) {
	let request_div = document.createElement("div");
	request_div.setAttribute('id', delivery.id);
	request_div.classList.add('d-flex');
	request_div.classList.add('justify-content-center');
	request_div.classList.add('py-2');

	let inner_div = document.createElement("div");
	inner_div.classList.add('jumbotron');
	if (deliveryStatus === 'new') {
		inner_div.style.backgroundColor = '#FF7373';
		let notification_text = js_lang_text.notification_text(delivery.price, delivery.distance, delivery.name);
		if (typeof (delivery.partner) != 'undefined') notification_text += ` - ${delivery.name}`;
		if (typeof (Android) !== 'undefined') Android.showNotification(js_lang_text.new_delivery_request_text, notification_text);
	}

	request_div.appendChild(inner_div);

	let title = document.createElement("h4");
	title.innerHTML = `<a href="tel:${delivery.phone}">${delivery.phone}</a> - ${delivery.name}`;
	inner_div.appendChild(title);

	let text1 = document.createElement("p");
	let date = new Date(delivery.expected_finish_time);
	text1.innerHTML = js_lang_text.text_1_text(delivery.thing, delivery.price, delivery.type, date);
	inner_div.appendChild(text1);
	if (typeof (delivery.recipients_phone) != 'undefined') {
		let text = document.createElement("p");
		text.innerHTML = `${js_lang_text.rcvr_phone_text} <a href="tel:${delivery.recipients_phone}">${delivery.recipients_phone}</a>`;
		inner_div.appendChild(text);
	}
	if (delivery.type == 1 && typeof (delivery.partner) != 'undefined') {
		let text = document.createElement("p");
		text.innerHTML = js_lang_text.from_partner_text(delivery.partner);
		if (typeof (delivery.partner_phone) != 'undefined') text.innerHTML += ` - <a href="tel:${delivery.partner_phone}">${delivery.partner_phone}</a>`
		inner_div.appendChild(text);
	}
	if (delivery.type == 2 && typeof (delivery.fromPlace) != 'undefined') {
		let text = document.createElement("p");
		text.innerHTML = js_lang_text.from_place_text(delivery.fromPlace);
		inner_div.appendChild(text);
	}

	let pos = await getPosition();
	let link = `https://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${delivery.to[0]},${delivery.to[1]}`;

	if (delivery.type == 2) {
		delivery.link = link + `&waypoints=${delivery.to[0]},${delivery.to[1]}|${delivery.from[0]},${delivery.from[1]}`;
	} else {
		delivery.link = link + `&waypoints=${delivery.from[0]},${delivery.from[1]}`;
	}

	if (deliveryStatus === true) {
		let route_button = document.createElement("button");
		inner_div.style.backgroundColor = '#FECDA0';
		route_button.innerHTML = js_lang_text.route_text;
		route_button.classList.add('btn');
		route_button.classList.add('btn-info');
		route_button.classList.add('mx-2');
		inner_div.appendChild(route_button);
		$(route_button).off();
		$(route_button).on('click', () => {
			window.open(delivery.link);
		});

		let cancel_button = document.createElement("button");
		cancel_button.innerHTML = js_lang_text.cancel_text;
		cancel_button.classList.add('btn');
		cancel_button.classList.add('btn-warning');
		cancel_button.classList.add('m-2');
		cancel_button.setAttribute('data-toggle', 'modal');
		cancel_button.setAttribute('data-target', '#modal');
		cancel_button.setAttribute('id', 'failed-button');
		inner_div.appendChild(cancel_button);


		let failed_button = document.createElement("button");
		failed_button.innerHTML = js_lang_text.failed_text;
		failed_button.classList.add('btn');
		failed_button.classList.add('btn-danger');
		failed_button.classList.add('m-2');
		failed_button.setAttribute('data-toggle', 'modal');
		failed_button.setAttribute('data-target', '#modal');
		failed_button.setAttribute('id', 'failed-button');
		inner_div.appendChild(failed_button);

		let completed_button = document.createElement("button");
		completed_button.innerHTML = js_lang_text.completed_text;
		completed_button.classList.add('btn');
		completed_button.classList.add('btn-success');
		completed_button.classList.add('m-2');
		completed_button.setAttribute('data-toggle', 'modal');
		completed_button.setAttribute('data-target', '#modal');
		completed_button.setAttribute('id', 'completed-button');
		inner_div.appendChild(completed_button);

		$(completed_button).off();
		$(completed_button).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => completedDelivery(delivery.id));
			modalTitle.innerHTML = texts[2];
			modalButton.innerHTML = buttonTexts[2];
			modalButton.className = "";
			modalButton.classList.add('btn');
			modalButton.classList.add('btn-success');
		});
		$(failed_button).off();
		$(failed_button).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => failedDelivery(delivery.id));
			modalTitle.innerHTML = texts[3];
			modalButton.innerHTML = buttonTexts[3];
			modalButton.className = "";
			modalButton.classList.add('btn');
			modalButton.classList.add('btn-danger');
		});
		$(cancel_button).off();
		$(cancel_button).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => cancelDelivery(delivery.id));
			modalTitle.innerHTML = texts[4];
			modalButton.innerHTML = buttonTexts[4];
			modalButton.className = "";
			modalButton.classList.add('btn');
			modalButton.classList.add('btn-warning');
		});
	} else {
		let refuse_button = document.createElement("button");
		refuse_button.innerHTML = js_lang_text.refuse_text;
		refuse_button.classList.add('btn');
		refuse_button.classList.add('btn-danger');
		refuse_button.classList.add('mx-2');
		refuse_button.setAttribute('data-toggle', 'modal');
		refuse_button.setAttribute('data-target', '#modal');
		refuse_button.setAttribute('id', 'refuse-button');
		inner_div.appendChild(refuse_button);

		let accept_button = document.createElement("button");
		accept_button.innerHTML = js_lang_text.accept_text;
		accept_button.classList.add('btn');
		accept_button.classList.add('btn-success');
		accept_button.classList.add('mx-2');
		accept_button.setAttribute('data-toggle', 'modal');
		accept_button.setAttribute('data-target', '#modal');
		accept_button.setAttribute('id', 'accept-button');
		inner_div.appendChild(accept_button);

		$(accept_button).off();
		$(accept_button).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => acceptDelivery(delivery.id));
			modalTitle.innerHTML = texts[0];
			modalButton.innerHTML = buttonTexts[0];
			modalButton.className = "";
			modalButton.classList.add('btn');
			modalButton.classList.add('btn-success');
		});
		$(refuse_button).off();
		$(refuse_button).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => refuseDelivery(delivery.id));
			modalTitle.innerHTML = texts[1];
			modalButton.innerHTML = buttonTexts[1];
			modalButton.className = "";
			modalButton.classList.add('btn');
			modalButton.classList.add('btn-danger');
		});
	}

	request_div.appendChild(document.createElement('hr'));
	return request_div;
}

function acceptDelivery(id) {
	socket.emit("accepted_delivery", id);
}

socket.on('accepted_delivery_approve', (id) => {
	let delivery = getDelivery(id)
	let inner_div = document.getElementById(id).getElementsByClassName('jumbotron')[0];
	inner_div.style.backgroundColor = '#FECDA0';

	let accept_button = inner_div.querySelector('#accept-button');
	let refuse_button = inner_div.querySelector('#refuse-button');

	if (accept_button && refuse_button) {
		inner_div.removeChild(accept_button);
		inner_div.removeChild(refuse_button);
	}

	let route_button = document.createElement("button");
	route_button.innerHTML = js_lang_text.route_text;
	route_button.classList.add('btn');
	route_button.classList.add('btn-info');
	route_button.classList.add('m-2');
	inner_div.appendChild(route_button);

	let cancel_button = document.createElement("button");
	cancel_button.innerHTML = js_lang_text.cancel_text;
	cancel_button.classList.add('btn');
	cancel_button.classList.add('btn-warning');
	cancel_button.classList.add('m-2');
	cancel_button.setAttribute('data-toggle', 'modal');
	cancel_button.setAttribute('data-target', '#modal');
	cancel_button.setAttribute('id', 'failed-button');
	inner_div.appendChild(cancel_button);

	let failed_button = document.createElement("button");
	failed_button.innerHTML = js_lang_text.failed_text;
	failed_button.classList.add('btn');
	failed_button.classList.add('btn-danger');
	failed_button.classList.add('m-2');
	failed_button.setAttribute('data-toggle', 'modal');
	failed_button.setAttribute('data-target', '#modal');
	failed_button.setAttribute('id', 'failed-button');
	inner_div.appendChild(failed_button);

	let completed_button = document.createElement("button");
	completed_button.innerHTML = js_lang_text.completed_text;
	completed_button.classList.add('btn');
	completed_button.classList.add('btn-success');
	completed_button.classList.add('m-2');
	completed_button.setAttribute('data-toggle', 'modal');
	completed_button.setAttribute('data-target', '#modal');
	completed_button.setAttribute('id', 'completed-button');
	inner_div.appendChild(completed_button);

	$(route_button).off();
	$(route_button).on('click', () => {
		window.open(delivery.link);
	});
	$(completed_button).off();
	$(completed_button).on('click', () => {
		$('#modal-button').off();
		$('#modal-button').on('click', () => completedDelivery(delivery.id));
		modalTitle.innerHTML = texts[2];
		modalButton.innerHTML = buttonTexts[2];
		modalButton.className = "";
		modalButton.classList.add('btn');
		modalButton.classList.add('btn-success');
	});
	$(failed_button).off();
	$(failed_button).on('click', () => {
		$('#modal-button').off();
		$('#modal-button').on('click', () => failedDelivery(delivery.id));
		modalTitle.innerHTML = texts[3];
		modalButton.innerHTML = buttonTexts[3];
		modalButton.className = "";
		modalButton.classList.add('btn');
		modalButton.classList.add('btn-danger');
	});
	$(cancel_button).off();
	$(cancel_button).on('click', () => {
		$('#modal-button').off();
		$('#modal-button').on('click', () => cancelDelivery(delivery.id));
		modalTitle.innerHTML = texts[4];
		modalButton.innerHTML = buttonTexts[4];
		modalButton.className = "";
		modalButton.classList.add('btn');
		modalButton.classList.add('btn-warning');
	});
});


function refuseDelivery(id) {
	let delivery = getDelivery(id);
	socket.emit("refused_delivery", delivery.id);
	let div = document.getElementById(id);
	requests.removeChild(div);
}

function completedDelivery(id) {
	let delivery = getDelivery(id);
	socket.emit("completed_delivery", delivery.id);
	let div = document.getElementById(id);
	requests.removeChild(div);
}

function failedDelivery(id) {
	let delivery = getDelivery(id);
	socket.emit("failed_delivery", delivery.id);
	let div = document.getElementById(id);
	requests.removeChild(div);
}

function cancelDelivery(id) {
	let delivery = getDelivery(id);
	socket.emit("cancel_delivery", delivery.id);
	let div = document.getElementById(id);
	requests.removeChild(div);
	createNewRequestDiv(delivery).then(d => requests.appendChild(d));
}

function getDelivery(id) {
	return deliveries.find(obj => obj.id == id);
}