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
	var nextButton = createButton(js_lang_text.next_text, "next", "btn btn-info col-4");

	buttons.appendChild(nextButton);

	var title = document.createElement('h2');

	var result = document.createElement('h4');
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

	title.innerHTML = js_lang_text.to_text;
	nextButton.innerHTML = js_lang_text.submit_text;
	nextButton.addEventListener("click", (e) => {
		submitButtonClick(map, invalidInput, formGroupDiv, title, buttons, nextButton);
	});


	formGroupDiv.appendChild(buttons);
	formGroupDiv.appendChild(document.createElement('br'));
}


function submitButtonClick(map, invalidInput, deliveryDiv, title, buttons, submitButton) {
	if (marker) {
		map.removeLayer(marker);
		marker = false;
		invalidInput.innerHTML = '';

		deliveryDiv.style.opacity = 0;
		toPos = position;

		setTimeout(() => {
			title.innerHTML = js_lang_text.your_delivery_text;
			buttons.removeChild(submitButton);

			let routeControl = createRouter(gh, map, fromPos, toPos);
			map.off('click');


			document.getElementById("result").innerHTML = `<img src="/img/loader.svg" id="#loading-img"></img><br><h4>${js_lang_text.clc_route_text}</h4>`;

			document.getElementsByClassName("leaflet-control-container")[0].style.display = "none";
			routeControl.on('routesfound', function (e) {
				let routes = e.routes;
				let summary = routes[0].summary;
				distance = Math.round(((summary.totalDistance / 1000) + Number.EPSILON) * 1000) / 1000;
				document.getElementById("result").innerHTML = `<img src="/img/loader.svg" id="#loading-img"></img><br><h4>${js_lang_text.clc_price_text}</h4>`;
				$.post('/price-request', { distance: distance, weight: weight, from: toPos, to: fromPos, shop: selectedPlace, thing: delivery.thing, thingsPrice: thingsPrice }, (data) => {
					setTimeout(() => {
						let resultText = "";
						switch (data.status) {
							case 0:
								resultText = js_lang_text.dlvr_info_txt(distance, data.price, data.time, data.thingsPrice);
								break;
							case 1:
								resultText = js_lang_text.dlvr_info_txt(distance, data.price, false, data.thingsPrice);
								break;
							case 2:
								resultText = js_lang_text.dstnc_too_far_text;
								break;
							case 3:
								resultText = js_lang_text.we_dont_wrk_now_text;
								break;
							case 4:
								resultText = js_lang_text.shop_not_wrkn(fromPlace);
								break;
						}
						document.getElementById("result").innerHTML = resultText;

						let cancel = createButton(js_lang_text.cancel_text, "cancel", "btn btn-danger col-4 mx-2 my-2");
						cancel.addEventListener('click', () => {
							window.location.reload()
						});
						document.getElementById('confirmDeliveryButtonDiv').appendChild(cancel);

						if (data.status == 0 || data.status == 1) {
							let submit = createButton(js_lang_text.submit_text, "submit", "btn btn-info col-4 mx-2 my-2");
							submit.addEventListener("click", (e) => {

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
							document.getElementById('confirmDeliveryButtonDiv').appendChild(submit);
						}
					}, getDelay(3));
				});
			});

			deliveryDiv.style.opacity = 1;
		}, 700);

	} else {
		invalidInput.innerHTML = js_lang_text.choose_a_pos_text;
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