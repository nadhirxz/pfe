var delivery = {};
var position;
var fromPos;
var toPos;
var distance = 0;
var weight;
var thingsPrice;

$('#object-select').on('change', (e) => {
	if (e.target.value == 'other') {
		$('#delivery-thing-div').removeClass('d-none');
		$('#delivery-price-div').removeClass('d-none');
	} else {
		$('#delivery-thing-div').addClass('d-none');
		$('#delivery-price-div').addClass('d-none');
	}
	trackInput();
});

var formGroupDiv = document.getElementById('delivery');

var nameInput = document.getElementById('name');
var thingInput = document.getElementById('thing');
var thingsPriceInput = document.getElementById('delivery-thing-price');

var cancelButton = document.getElementById('cancel-button');
cancelButton.addEventListener('click', () => {
	window.location.href = '/home';
});

var nextButton = document.getElementById('next-button');
nextButton.addEventListener('click', () => {
	if (!nextButton.classList.contains('disabled')) {
		weight = parseInt(document.getElementById('delivery-weight').value) || 0;
		if (!$('#object-select').val() || $('#object-select').val() == 'other') delivery.thing = thingInput.value;
		else delivery.thing = $('#object-select').val();

		delivery.fromPlace = selectedPlace;
		if ($('#object-select').val() == 'other') thingsPrice = parseInt(thingsPriceInput.value) || 0;
		else thingsPrice = parseInt($('#object-select').html().split('">')[2].split('(')[1].split(' DZD'));

		getNextDiv(delivery.fromPlace);
	}
});



function trackInput() {
	if ((thingInput.value && thingsPriceInput.value || $('#object-select').val() != 'other')) {
		toggleButton(true);
	} else {
		toggleButton(false);
	}
}

function toggleButton(value) {
	if (value) {
		nextButton.classList.remove('disabled');
		nextButton.classList.remove('btn-secondary');
		nextButton.classList.add('btn-info');
	} else {
		nextButton.classList.add('disabled');
		nextButton.classList.add('btn-secondary');
		nextButton.classList.remove('btn-info');
	}
}

function createButton(text, id, classes) {
	let button = document.createElement("button");
	classes = classes.split(" ");
	button.innerHTML = text;
	button.setAttribute("id", id);
	classes.forEach(c => {
		button.classList.add(c);
	});
	return button;
}

function getNextDiv(fromPlace) {
	formGroupDiv.innerHTML = '';

	var buttons = document.createElement('div');
	var nextButton = createButton(l.next_text, "next", "btn btn-info col-4");

	buttons.appendChild(nextButton);

	var title = document.createElement('h4');

	var result = document.createElement('div');
	result.setAttribute('id', 'result');

	var confirmDeliveryButtonDiv = document.createElement('div');
	confirmDeliveryButtonDiv.setAttribute('id', 'confirmDeliveryButtonDiv');
	confirmDeliveryButtonDiv.classList.add('mb-3');

	var mapDiv = document.createElement('div');
	mapDiv.setAttribute('id', 'map');
	mapDiv.classList.add('delivery-map');

	formGroupDiv.appendChild(title);
	formGroupDiv.appendChild(result);
	formGroupDiv.appendChild(confirmDeliveryButtonDiv);
	formGroupDiv.appendChild(mapDiv);

	var map = createMap(at);

	var invalidInput = document.createElement('p');
	invalidInput.classList.add('text-danger');
	formGroupDiv.appendChild(invalidInput);

	title.innerHTML = l.to_text;
	nextButton.innerHTML = l.submit_text;
	nextButton.addEventListener("click", (e) => {
		submitButtonClick(map, invalidInput, title, buttons, nextButton);
	});


	formGroupDiv.appendChild(buttons);
	formGroupDiv.appendChild(document.createElement('br'));
}


function submitButtonClick(map, invalidInput, title, buttons, submitButton) {
	if (marker) {
		map.removeLayer(marker);
		marker = false;
		invalidInput.innerHTML = '';

		$('#delivery').fadeOut();
		$('#map').fadeOut();
		toPos = position;

		setTimeout(() => {
			$(title).text(l.clc_route_text);
			$(submitButton).remove();

			let routeControl = createRouter(gh, map, fromPos, toPos);
			map.off('click');


			$('#result').html(`<img src="/img/loader.svg" class="col-3 mt-4" id="#loading-img"></img>`);

			document.getElementsByClassName("leaflet-control-container")[0].style.display = "none";

			routeControl.on('routesfound', (e) => {
				let routes = e.routes;
				let summary = routes[0].summary;
				distance = Math.round(((summary.totalDistance / 1000) + Number.EPSILON) * 1000) / 1000;

				$(title).text(l.clc_price_text);
				$('#result').html(`<img src="/img/loader.svg" class="col-3 mt-4" id="#loading-img"></img>`);

				$.post('/price-request', { distance: distance, weight: weight, from: toPos, to: fromPos, shop: selectedPlace, thing: delivery.thing, thingsPrice: thingsPrice }, (data) => {
					setTimeout(() => {
						$(title).remove();
						$('#result').html(
							data.status == 0
								? `
								<div class="jumbotron border">
									<h2 class="my-3">${l.dlv}</h2>
									<hr>
									<div class="text-${lng == 'ar' ? 'right' : 'left'} mx-4">
										<h5 class="m-2"><b>${l.dst}:</b> ${distance} ${l.km}</h5>
										<h5 class="m-2"><b>${l.pr}:</b> ${data.price} ${l.dzd}</h5>
										${data.thingsPrice
										?
										`<h5 class="m-2"><b>${l.thp}:</b> ${data.thingsPrice} ${l.dzd}</h5>
										<h5 class="m-2"><b>${l.ttp}:</b> ${data.price + data.thingsPrice} ${l.dzd}</h5>`
										: ''
										}
									</div>
									<h6><a data-toggle="collapse" href="#collapse" role="button" aria-expanded="false" aria-controls="collapse" id="view">${l.vm}</a></h6>
									<div class="collapse multi-collapse mt-2" id="collapse"></div>
									<hr>
									<div class="my-3">
										<button class="btn btn-info col-4 mx-2" id="submit">${l.submit_text}</button>
										<button class="btn btn-danger col-4 mx-2" id="cancel">${l.cancel_text}</button>
									</div>
									${data.onlineDrivers ? '' : `<h6>${l.no_onln}</h6>`}
								</div>
								`
								: `<h4>${data.status == 1
									? l.dstnc_too_far_text
									: shop_not_wrkn(fromPlace)}</h4>
								<button class="btn btn-danger col-4 mx-2" id="cancel">${l.cancel_text}</button>`
						);

						if (data.status == 0) {
							$('#map').appendTo('#collapse');
							$('#map').addClass('border');
							$('#map').fadeIn();
							let view = false;
							$('#view').on('click', () => {
								view = !view;
								if (view) $('#view').text(l.cm);
								else $('#view').text(l.vm);
							});
							$('#submit').on('click', () => {
								post('/delivery-request/', {
									type: 2,
									fromPlace: delivery.fromPlace,
									from: fromPos,
									to: toPos,
									distance: Math.round((distance + Number.EPSILON) * 1000) / 1000,
									price: data.price,
									thing: delivery.thing,
									weight: weight,
									shop: selectedPlace
								});
							});
						}
						$('#cancel').on('click', () => window.location.href = '/');
					}, getDelay(1));
				});
			});

			$('#delivery').fadeIn();
		}, 700);

	} else {
		invalidInput.innerHTML = l.choose_a_pos_text;
	}
}

function post(path, params, method = 'post') {

	// The rest of this code assumes you are not using a library.
	// It can be made less wordy if you use one.
	const form = document.createElement('form');
	form.method = method;
	form.action = path;

	for (const key in params) {
		if (params.hasOwnProperty(key)) {
			const hiddenField = document.createElement('input');
			hiddenField.type = 'hidden';
			hiddenField.name = key;
			hiddenField.value = params[key];

			form.appendChild(hiddenField);
		}
	}

	document.body.appendChild(form);
	form.submit();
}

function getDelay(sec) {
	return Math.floor(Math.random() * (sec * 1000 - 300 + 1)) + 300;
}

function onlyNumberKey(evt) {
	// Only ASCII charactar in that range allowed
	var ASCIICode = (evt.which) ? evt.which : evt.keyCode
	if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
		return false;
	return true;
}