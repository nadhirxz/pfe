var deliveries = [];

var acceptedDelivery = false;

sendPosition("driver_connected");

setInterval(() => {
	sendPosition("driver_position")
}, 1000 * 60 * 3); // 3 minutes

socket.on("deliveries", (data) => {
	if (data && data.length) {
		deliveries = [...data.filter(e => e.status == 2).sort((a, b) => (a.date > b.date) ? 1 : -1), ...data.filter(e => e.status != 2).sort((a, b) => (a.date > b.date) ? 1 : -1)];
		deliveries.forEach(delivery => createDiv(delivery, delivery.status == 2));
	} else {
		$('#requests').html(`<h4 id="no-dlv" class="my-5"> ${l.no_deliveries}</h4 >`);
	}
	$('#loading-img').remove();
});

socket.on('new_delivery', (data) => {
	let delivery = getDelivery(data.id);
	if (typeof (delivery) == 'undefined') deliveries.push(data);
	createDiv(data, 'new');
	$('#no-dlv').remove();
});

socket.on('remove_delivery', (delivery) => {
	if (getDelivery(delivery.id)) {
		deliveries = deliveries.filter(e => e.id != delivery.id);
		$('#' + delivery.id).remove()
		checkEmpty();
	}
});

socket.on('canceled_delivery', (data) => {
	$('#' + data).remove();
	checkEmpty();
});

socket.on('update_delivery', (data) => {
	if (getDelivery(data.id)) $(`#${data.id}-time`).html(getTime(data.time));
});

function sendPosition(socketmsg) {
	getPosition()
		.then(pos => socket.emit(socketmsg, [pos.coords.latitude, pos.coords.longitude]))
		.catch(err => $('#requests').html(`<h4 id="no-dlv" class="my-5"> ${l.no_pos}</h4 >`));
}


function getPosition() {
	return new Promise((res, rej) => {
		navigator.geolocation.getCurrentPosition(res, rej);
	});
}

async function createDiv(delivery, status, r) {
	if (delivery.estimated_finish_time) delivery.estimated_finish_time = new Date(delivery.estimated_finish_time)

	let div = `
	<div id="${delivery.id}" class="my-2">
		<div class="jumbotron border${status === 'new' ? ' border-info' : status === true ? ' border-danger' : ''}">
			<h4${lng == 'ar' ? ' class="h1"' : ''}>${delivery.name}</h4>
			<h4><a href="tel:${delivery.phone}">${delivery.phone}</a></h4>
			<div class="hr-sect">${deliveryTypes[delivery.type]}${delivery.status == 2 ? '' : ` (${delivery.minutes} ${l.min})`}</div>
			<div class="row mx-4">
				<div class="col-md-7 p-0 text-${lng == 'ar' ? 'right' : 'left'}">
					<p class="my-0">${l.obj} : <b>${delivery.thing}</b></p>
					${delivery.type > 0 && typeof (delivery.thingsPrice) != 'undefined' ? `<p class="my-0">${l.objp} : <b>${delivery.thingsPrice} ${l.dzd}</b></p>` : ''}
					${delivery.type == 2 ? `<p class="my-0">${l.from} : <b>${delivery.fromPlace}</b></p>` : ''}
					${delivery.type < 2 && delivery.recipients_phone ? `${l.rcvr[delivery.type]} : <a href="tel:${delivery.recipients_phone}"><b>${delivery.recipients_phone}</b></a>` : ''}
				</div>
				<div class="text-${lng == 'ar' ? 'right' : 'left'}">
					<p class="my-0">${l.price} : <b>${delivery.price} ${l.dzd}</b></p>
					<p class="my-0">${l.distance} : <b>${delivery.distance} ${l.km}</b></p>
					${delivery.type == 2 ? `<p class="my-0">${l.shop} : <b><a href="tel:${delivery.shop_phone}">${delivery.shop_phone}</a></b></p>` : ''}
				</div>
			</div>
			${status === true ? `<div class="hr-sect text-dark"><p class="my-1">${l.fnsh_t} : <b id="${delivery.id}-time">${getTime(delivery.estimated_finish_time)}</b></div>` : '<hr class="mt-2" style="background-color: #aaa;">'}

			${status === true
			? `
				<div class="row mx-2 mt-4">
					<button class="btn col btn-primary mx-1" id="${delivery.id}-r">${l.route}</button>
					<button class="btn col btn-warning mx-1" data-toggle="modal" data-target="#modal" id="${delivery.id}-c">${l.cancel}</button>
				</div>
				<div class="row mx-2 mt-2">
					<button class="btn col btn-success mx-1" data-toggle="modal" data-target="#modal" id="${delivery.id}-comp">${l.comp}</button>
					<button class="btn col btn-danger mx-1" data-toggle="modal" data-target="#modal" id="${delivery.id}-fail">${l.fail}</button>
				</div>
				`
			: `
				<div class="row mx-2 mt-4">
					<button class="btn col btn-danger mx-1" data-toggle="modal" data-target="#modal" id="${delivery.id}-ref">${l.ref}</button>
					<button class="btn col btn-info mx-1" data-toggle="modal" data-target="#modal" id="${delivery.id}-acc"${acceptedDelivery ? ' disabled' : ''}>${l.acc}</button>
				</div>
				`
		}
		</div>
	</div>
	`;
	if (r) $('#requests').prepend($(div));
	else $('#requests').append($(div));

	if (status === true) {

		acceptedDelivery = true;

		let pos = await getPosition();
		delivery.link = `https://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${delivery.to[0]},${delivery.to[1]}&waypoints=${delivery.from[0]},${delivery.from[1]}`;

		$(`#${delivery.id}-r`).on('click', () => window.open(delivery.link));

		$(`#${delivery.id}-c`).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => cancelDelivery(delivery.id));
			$('#modal-button').html(buttonTexts[4]);
			$('#modal-title').html(texts[4]);
			$('#modal-button').attr('class', 'btn btn-warning');
		});

		$(`#${delivery.id}-fail`).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => failedDelivery(delivery.id));
			$('#modal-button').html(buttonTexts[3]);
			$('#modal-title').html(texts[3]);
			$('#modal-button').attr('class', 'btn btn-danger');
		});

		$(`#${delivery.id}-comp`).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => completedDelivery(delivery.id));
			$('#modal-button').html(buttonTexts[2]);
			$('#modal-title').html(texts[2]);
			$('#modal-button').attr('class', 'btn btn-success');
		});

	} else {

		$(`#${delivery.id}-acc`).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => acceptDelivery(delivery.id));
			$('#modal-button').html(buttonTexts[0]);
			$('#modal-title').html(texts[0]);
			$('#modal-button').attr('class', 'btn btn-info');
		});

		$(`#${delivery.id}-ref`).on('click', () => {
			$('#modal-button').off();
			$('#modal-button').on('click', () => refuseDelivery(delivery.id));
			$('#modal-button').html(buttonTexts[1]);
			$('#modal-title').html(texts[1]);
			$('#modal-button').attr('class', 'btn btn-danger');
		});
	}

	if (status === 'new' && typeof (Android) !== 'undefined') {
		let notification_text = l.notification_text(delivery.name, delivery.minutes, delivery.price, delivery.distance);
		if (typeof (delivery.shop) != 'undefined') notification_text += ` - ${delivery.shop}`;
		Android.showNotification(l.new, notification_text);
	}
}

function acceptDelivery(id) {
	socket.emit("accepted_delivery", id);
}

socket.on('accepted_delivery_approve', (data) => {
	let id = data.id;
	let delivery = getDelivery(id);
	delivery = data;
	$('#' + delivery.id).remove();
	$('.jumbotron .btn-info').each((i, e) => $(e).attr('disabled', true));
	createDiv(delivery, true, true);
	window.scrollTo({ top: 0, behavior: 'smooth' });
});


function refuseDelivery(id) {
	let delivery = getDelivery(id);
	socket.emit("refused_delivery", delivery.id);
	$('#' + id).fadeOut(400, () => {
		$('#' + id).remove();
		acceptedDelivery = false;
		$('.jumbotron .btn-info').each((i, e) => $(e).attr('disabled', false));
		checkEmpty();
	});
}

function completedDelivery(id) {
	let delivery = getDelivery(id);
	socket.emit("completed_delivery", delivery.id);
	$('#' + id).fadeOut(400, () => {
		$('#' + id).remove();
		acceptedDelivery = false;
		$('.jumbotron .btn-info').each((i, e) => $(e).attr('disabled', false));
		checkEmpty();
	});;
}

function failedDelivery(id) {
	let delivery = getDelivery(id);
	socket.emit("failed_delivery", delivery.id);
	$('#' + id).fadeOut(400, () => {
		$('#' + id).remove();
		acceptedDelivery = false;
		$('.jumbotron .btn-info').each((i, e) => $(e).attr('disabled', false));
		checkEmpty();
	});
}

function cancelDelivery(id) {
	let delivery = getDelivery(id);
	delete delivery.estimated_finish_time;
	delivery.status = 1;
	socket.emit("cancel_delivery", delivery.id);
	$('#' + id).fadeOut(400, () => {
		$('#' + id).remove();
		acceptedDelivery = false;
		$('.jumbotron .btn-info').each((i, e) => $(e).attr('disabled', false));
		createDiv(delivery);
	});
	$('#no-dlv').remove();
}

function getDelivery(id) {
	return deliveries.find(obj => obj.id == id);
}

function checkEmpty() {
	if (!$.trim($('#requests').html()).length) {
		$('#requests').html(`<h4 id="no-dlv" class="my-5">${l.no_deliveries}</h4>`);
	}
}

function pad(n, z) {
	z = z || '0';
	n = n + '';
	return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}

function getTime(t) {
	t = new Date(t);
	return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
}