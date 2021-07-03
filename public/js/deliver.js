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
	$(loadingImg).remove();
	$(deliveryDiv).removeClass('d-none');
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

		var title = document.createElement('h4');
		title.innerHTML = l.from_text;

		var result = document.createElement('div');
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
		var nextButton = createButton(l.next_text, "next", "btn btn-info col-4");

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

					title.innerHTML = l.to_text;

					let prevButton = createButton(l.prev_text, "prev", "btn btn-info col-5 mx-2");
					let submitButton = createButton(l.submit_text, "submit", "btn btn-info col-5 mx-2");

					prevButton.addEventListener("click", (e) => {
						deliveryDiv.style.opacity = 0;
						setTimeout(() => {
							title.innerHTML = l.from_text;
							$(prevButton).remove();
							$(submitButton).remove();
							buttons.appendChild(nextButton);
							deliveryDiv.style.opacity = 1;
						}, 700);
					});

					submitButton.addEventListener("click", (e) => {
						if (marker) {
							map.removeLayer(marker);
							marker = false;
							invalidInput.innerHTML = '';

							$(deliveryDiv).fadeOut();
							$('#map').fadeOut();
							toPos = position;

							setTimeout(() => {
								$(title).html(l.clc_route_text);
								$(prevButton).remove();
								$(submitButton).remove();

								let routeControl = createRouter(gh, map, fromPos, toPos);
								map.off('click'); // disable adding markers after

								$('#result').html('<img src="/img/loader.svg" class="col-3 mt-4" id="#loading-img"></img>');

								document.getElementsByClassName("leaflet-control-container")[0].style.display = "none";
								routeControl.on('routesfound', function (e) {
									let routes = e.routes;
									let summary = routes[0].summary;
									distance = Math.round(((summary.totalDistance / 1000) + Number.EPSILON) * 1000) / 1000;
									
									$(title).html(l.clc_price_text);
									$('#result').html('<img src="/img/loader.svg" class="col-3 mt-4" id="#loading-img"></img>');

									$.post('price-request', { distance, weight, from: fromPos, to: toPos }, (data) => {
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
												: `<h4>${l.dstnc_too_far_text}</h4>
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
													type: parseInt($('#delivery-type').val()) || 0,
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
										}
										$('#cancel').on('click', () => window.location.href = '/');
									});
								});

								$('#delivery').fadeIn();
							}, 700);

						} else {
							invalidInput.innerHTML = l.choose_a_pos_text;
						}
					});

					$(nextButton).remove();
					buttons.appendChild(prevButton);
					buttons.appendChild(submitButton);
					deliveryDiv.style.opacity = 1;
				}, 700);
			} else {
				invalidInput.innerHTML = l.choose_a_pos_text;;
			}

		});
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
		firstNextButton.classList.add('btn-info');
	} else {
		firstNextButton.classList.add('disabled');
		firstNextButton.classList.add('btn-secondary');
		firstNextButton.classList.remove('btn-info');
	}
}

function onlyNumberKey(evt) {
	// Only ASCII charactar in that range allowed
	var ASCIICode = (evt.which) ? evt.which : evt.keyCode
	if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
		return false;
	return true;
}