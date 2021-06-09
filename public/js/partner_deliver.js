var formGroupDiv = document.getElementById('delivery');

var options = document.getElementById('delivery-state');
setTimeout(() => {
    document.getElementById('delivery-from').removeChild(document.getElementById('loading-img'));
    formGroupDiv.classList.remove('d-none');
}, getDelay(3));

var position;

var state = 0;

var thingInput = document.getElementById('thing');
var phoneInput = document.getElementById('phone-field');
var thing = "";
var phone = "";
var weight = 0;

let from;
let to;

var cancelButton = document.getElementById('cancel-button');
cancelButton.addEventListener('click', () => {
    window.location.href = '/home';
});

var nextButton = document.getElementById('next-button');
nextButton.addEventListener('click', () => {
    if (!nextButton.classList.contains('disabled') && thingInput.value && phoneInput.value) {
        formGroupDiv.innerHTML = '';
        formGroupDiv.style.opacity = 0;
        setTimeout(() => {
            thing = thingInput.value;
            phone = thingInput.value;
            state = parseInt(options.value);
            var title = document.createElement('h2');
            if (state == 0) {
                title.innerHTML = js_lang_text.to_text;
            } else {
                title.innerHTML = js_lang_text.from_text;
            }

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

            let submitButton = createButton(js_lang_text.submit_text, "submit", "btn btn-success col-4");
            formGroupDiv.appendChild(submitButton);
            submitButton.addEventListener('click', () => {
                if (marker) {
                    map.removeLayer(marker);
                    marker = false;
                    invalidInput.innerHTML = '';
            
                    formGroupDiv.style.opacity = 0;
            
                    setTimeout(() => {
                        title.innerHTML = js_lang_text.your_delivery_text;
                        submitButton.parentNode.removeChild(submitButton);
                        from = pos;
                        to = position;
                        if (state == 1) {
                            from = to;
                            to = position;
                        }

                        let routeControl = createRouter(gh, map, from, to);
                        map.off('click'); // disable adding markers after
            
            
                        document.getElementById("result").innerHTML = `<img src="/img/loading.gif"></img><br><h4>${js_lang_text.clc_route_text}</h4>`;
            
                        document.getElementsByClassName("leaflet-control-container")[0].style.display = "none";
                        routeControl.on('routesfound', function (e) {
                            let routes = e.routes;
                            let summary = routes[0].summary;
                            distance = Math.round(((summary.totalDistance / 1000) + Number.EPSILON) * 1000) / 1000;
                            document.getElementById("result").innerHTML = `</img src="img/loading.gif"></img><br><h4>${js_lang_text.clc_price_text}</h4>`;
                            socket.emit("new_price_request", {
                                distance: distance,
                                weight: weight,
                                from: from,
                                to: to
                            });
                        });
            
                        formGroupDiv.style.opacity = 1;
                    }, 700);
            
                } else {
                    invalidInput.innerHTML = js_lang_text.choose_a_pos_text;
                }
            });
        
            formGroupDiv.style.opacity = 1;
        }, 700);
    }
});


socket.on("price", (data) => {
    setTimeout(() => {
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
            case 5:
                resultText = js_lang_text.cant_fnsh_in_wrk_time_txt;
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
                let type = 3 + state;

                post('/d/request/', {
                    type: type,
                    fromPlace: name,
                    from: from,
                    to: to,
                    distance: Math.round((distance + Number.EPSILON) * 1000) / 1000,
                    price: data.price,
                    thing: thing,
                    phone: phone,
                    thingsPrice: 0,
                    weight: weight
                });
            });
            
            document.getElementById('confirmDeliveryButtonDiv').appendChild(submit);
            }
    }, getDelay(4));
});



function getDelay(sec) {
    return Math.floor(Math.random() * (sec*1000 - 300 + 1)) + 300;
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

function trackInput() {
    console.log(thingInput.value && phoneInput.value)
    if (thingInput.value && phoneInput.value) {
        toggleButton(true);
    } else {
        toggleButton(false);
    }
}
function toggleButton(value) {
    if (value) {
        nextButton.classList.remove('disabled');
        nextButton.classList.remove('btn-secondary');
        nextButton.classList.add('btn-success');
    } else {
        nextButton.classList.add('disabled');
        nextButton.classList.add('btn-secondary');
        nextButton.classList.remove('btn-success');
    }
}

function onlyNumberKey(evt) {
    // Only ASCII charactar in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
        return false;
    return true;
}