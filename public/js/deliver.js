var position;
var fromPos;
var toPos;
var distance = 0;
var thing = "";
var phone = "";
var weight = 0;

var deliveryDiv = document.getElementById("delivery");

var loadingImg = document.getElementById('loading-img');
setTimeout(() => {
	loadingImg.parentElement.removeChild(loadingImg);
	deliveryDiv.classList.remove('d-none')
}, getDelay(2));

var cancelButton = document.getElementById('cancel-button');
cancelButton.addEventListener('click', () => {
	window.location.href = '/home';
});

var thingInput = document.getElementById('delivery-thing');
var phoneInput = document.getElementById('phone-field');

var firstNextButton = document.getElementById("first-next");
firstNextButton.addEventListener('click', () => {
	if (!firstNextButton.classList.contains('disabled') && thingInput.value && phoneInput.value) {
		thing = thingInput.value;
		phone = phoneInput.value;
		weight = parseInt(document.getElementById('delivery-weight').value) || 0;
		deliveryDiv.innerHTML = '';

		var title = document.createElement('h2');
		title.innerHTML = js_lang_text.from_text;

		var result = document.createElement('h4');
		result.setAttribute('id', 'result');

		var confirmDeliveryButtonDiv = document.createElement('div');
		confirmDeliveryButtonDiv.setAttribute('id', 'confirmDeliveryButtonDiv');
		confirmDeliveryButtonDiv.classList.add('mb-3');

		var mapDiv = document.createElement('div');
		mapDiv.setAttribute('id', 'map');
		mapDiv.classList.add('delivery-map');

		var invalidInput = document.createElement('p');
		invalidInput.classList.add('text-danger');

		deliveryDiv.appendChild(title);
		deliveryDiv.appendChild(result);
		deliveryDiv.appendChild(confirmDeliveryButtonDiv);
		deliveryDiv.appendChild(mapDiv);
		deliveryDiv.appendChild(invalidInput);

		var map = createMap(at);

		var buttons = document.createElement('div');
		var nextButton = createButton(js_lang_text.next_text, "next", "btn btn-success col-4");

		buttons.appendChild(nextButton);

		deliveryDiv.appendChild(buttons);
		deliveryDiv.appendChild(document.createElement('br'))

		nextButton.addEventListener("click", (e) => {
			if (marker) {
				map.removeLayer(marker);
				marker = false;
				invalidInput.innerHTML = '';

				deliveryDiv.style.opacity = 0;
				setTimeout(() => {
					fromPos = position;

					title.innerHTML = js_lang_text.to_text;

					let prevButton = createButton(js_lang_text.prev_text, "prev", "btn btn-success col-5 mx-2");
					let submitButton = createButton(js_lang_text.submit_text, "submit", "btn btn-success col-5 mx-2");

					prevButton.addEventListener("click", (e) => {
						deliveryDiv.style.opacity = 0;
						setTimeout(() => {
							title.innerHTML = js_lang_text.from_text;
							buttons.removeChild(prevButton);
							buttons.removeChild(submitButton);
							buttons.appendChild(nextButton);
							deliveryDiv.style.opacity = 1;
						}, 700);
					});

					submitButton.addEventListener("click", (e) => {
						if (marker) {
							map.removeLayer(marker);
							marker = false;
							invalidInput.innerHTML = '';

							deliveryDiv.style.opacity = 0;
							toPos = position;

							setTimeout(() => {
								title.innerHTML = js_lang_text.your_delivery_text;
								buttons.removeChild(prevButton);
								buttons.removeChild(submitButton);

								let routeControl = createRouter(gh, map, fromPos, toPos);
								map.off('click'); // disable adding markers after

								document.getElementById("result").innerHTML = `<img src="/img/loading.gif"></img><br><h4>${js_lang_text.clc_route_text}</h4>`;

								document.getElementsByClassName("leaflet-control-container")[0].style.display = "none";
								routeControl.on('routesfound', function (e) {
									let routes = e.routes;
									let summary = routes[0].summary;
									distance = Math.round(((summary.totalDistance / 1000) + Number.EPSILON) * 1000) / 1000;
									document.getElementById("result").innerHTML = `</img src="img/loading.gif"></img><br><h4>${js_lang_text.clc_price_text}</h4>`;
									$.post('price-request', { distance, weight, from: fromPos, to: toPos }, (data) => {
										let resultText = "";
										switch (data.status) {
											case 0:
												resultText = js_lang_text.dlvr_info_txt(distance, data.price, data.time);
												break;
											case 1:
												resultText = js_lang_text.dlvr_info_txt(distance, data.price);
												break;
											case 2:
												resultText = js_lang_text.dstnc_too_far_text;
												break;
											case 3:
												resultText = js_lang_text.we_dont_wrk_now_text;
												break;
										}
										document.getElementById("result").innerHTML = resultText;
										let cancel = createButton(js_lang_text.cancel_text, "cancel", "btn btn-danger col-4 mx-2 my-2");
										cancel.addEventListener('click', () => {
											window.location.reload()
										});
										document.getElementById('confirmDeliveryButtonDiv').appendChild(cancel);
										if (data.status == 0 || data.status == 1) {
											let submit = createButton(js_lang_text.submit_text, "submit", "btn btn-success col-4 mx-2 my-2");
											submit.addEventListener("click", (e) => {
												post('/delivery-request/', {
													type: 0,
													fromPlace: "",
													from: fromPos,
													to: toPos,
													distance: Math.round((distance + Number.EPSILON) * 1000) / 1000,
													price: data.price,
													thing: thing,
													thingsPrice: 0,
													weight: weight,
													phone: phone
												});
											});
											document.getElementById('confirmDeliveryButtonDiv').appendChild(submit);
										}
									});
								});

								deliveryDiv.style.opacity = 1;
							}, 700);

						} else {
							invalidInput.innerHTML = js_lang_text.choose_a_pos_text;
						}
					});

					buttons.removeChild(nextButton);
					buttons.appendChild(prevButton);
					buttons.appendChild(submitButton);
					deliveryDiv.style.opacity = 1;
				}, 700);
			} else {
				invalidInput.innerHTML = js_lang_text.choose_a_pos_text;;
			}

		});
	} else {

	}
});


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

function trackInput() {
	if (thingInput.value && phoneInput.value) {
		toggleButton(true);
	} else {
		toggleButton(false);
	}
}
function toggleButton(value) {
	if (value) {
		firstNextButton.classList.remove('disabled');
		firstNextButton.classList.remove('btn-secondary');
		firstNextButton.classList.add('btn-success');
	} else {
		firstNextButton.classList.add('disabled');
		firstNextButton.classList.add('btn-secondary');
		firstNextButton.classList.remove('btn-success');
	}
}

function onlyNumberKey(evt) {
	// Only ASCII charactar in that range allowed
	var ASCIICode = (evt.which) ? evt.which : evt.keyCode
	if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
		return false;
	return true;
}