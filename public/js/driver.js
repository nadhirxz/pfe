var deliveries = [];

var requests = document.getElementById('requests');

var modalTitle = document.getElementById('modal-title');
var modalButton = document.getElementById('modal-button');

var current_delivery = false;
var current_function = false;

sendPosition("driver_connected");

setInterval(() => {
    sendPosition("driver_position")
}, 1000 * 60 * 3); // 3 minutes

socket.on("driver_tasks_info", (data) => {
    requests.removeChild(document.getElementById('loading-img'));
    if (data && data.tasks && data.tasks.length) {
        let c_task = data.tasks.find(obj => obj['_id'] == data.current_task);
        if (c_task) {
            createNewRequestDiv(c_task, 1);
        }
        data.tasks.forEach(task => {
            if (!c_task || task._id != c_task._id) createNewRequestDiv(task);
        });
        deliveries = data.tasks;
    } else {
        requests.innerHTML = `<hr class="my-5"><h5>${js_lang_text.no_deliveries}</h5>`;
    }
});

socket.on('got_a_new_delivery', (data) => {
    createNewRequestDiv(data,'new');
});
socket.on('canceled_delivery', (data) => {
    let the_div = document.getElementById(data);
    the_div.parentElement.removeChild(the_div);
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


async function createNewRequestDiv(delivery, c) {
    let request_div = document.createElement("div");
    request_div.setAttribute('id', delivery._id);
    request_div.classList.add('d-flex');
    request_div.classList.add('justify-content-center');
    request_div.classList.add('py-2');

    let inner_div = document.createElement("div");
    inner_div.classList.add('jumbotron');
    if (c == 1) inner_div.classList.add('bg-warning');
    if (c == 'new') {
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
    if (typeof (delivery.client_phone) != 'undefined') {
        let text = document.createElement("p");
        text.innerHTML = `${js_lang_text.rcvr_phone_text} <a href="tel:${delivery.client_phone}">${delivery.client_phone}</a>`;
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

    if (c==1) {
        let route_button = document.createElement("button");
        route_button.innerHTML = js_lang_text.route_text;
        route_button.classList.add('btn');
        route_button.classList.add('btn-info');
        route_button.classList.add('mx-2');
        inner_div.appendChild(route_button);
        route_button.addEventListener('click', () => {
            window.open(delivery.link);
        });

        let failed_button = document.createElement("button");
        failed_button.innerHTML = js_lang_text.failed_text;
        failed_button.classList.add('btn');
        failed_button.classList.add('btn-danger');
        failed_button.classList.add('mx-2');
        failed_button.setAttribute('data-toggle', 'modal');
        failed_button.setAttribute('data-target', '#modal');
        failed_button.setAttribute('id', 'failed-button');
        inner_div.appendChild(failed_button);

        let completed_button = document.createElement("button");
        completed_button.innerHTML = js_lang_text.completed_text;
        completed_button.classList.add('btn');
        completed_button.classList.add('btn-success');
        completed_button.classList.add('mx-2');
        completed_button.setAttribute('data-toggle', 'modal');
        completed_button.setAttribute('data-target', '#modal');
        completed_button.setAttribute('id', 'completed-button');
        inner_div.appendChild(completed_button);

        completed_button.addEventListener('click', () => {
            current_delivery = delivery._id;
            current_function = completedDelivery;
            modalTitle.innerHTML = texts[2];
            modalButton.innerHTML = buttonTexts[2];
            modalButton.className = "";
            modalButton.classList.add('btn');
            modalButton.classList.add('btn-success');
        });
        failed_button.addEventListener('click', () => {
            current_delivery = delivery._id;
            current_function = failedDelivery;
            modalTitle.innerHTML = texts[3];
            modalButton.innerHTML = buttonTexts[3];
            modalButton.className = "";
            modalButton.classList.add('btn');
            modalButton.classList.add('btn-danger');
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

        accept_button.addEventListener('click', () => {
            current_delivery = delivery._id;
            current_function = acceptDelivery;
            modalTitle.innerHTML = texts[0];
            modalButton.innerHTML = buttonTexts[0];
            modalButton.className = "";
            modalButton.classList.add('btn');
            modalButton.classList.add('btn-success');
        });
        refuse_button.addEventListener('click', () => {
            current_delivery = delivery._id;
            current_function = refuseDelivery;
            modalTitle.innerHTML = texts[1];
            modalButton.innerHTML = buttonTexts[1];
            modalButton.className = "";
            modalButton.classList.add('btn');
            modalButton.classList.add('btn-danger');
        });
    }

    request_div.appendChild(document.createElement('hr'));
    requests.appendChild(request_div);
    requests.appendChild(request_div);
}

function setCurrentDelivery(did) {
    current_delivery = did;
}

function acceptDelivery() {
    let delivery = getDelivery(current_delivery);

    let inner_div = document.getElementById(current_delivery).getElementsByClassName('jumbotron')[0];
    inner_div.style.backgroundColor = '#FECDA0';
    
    let accept_button = inner_div.querySelector('#accept-button');
    let refuse_button = inner_div.querySelector('#refuse-button');

    window.open(delivery.link);
    socket.emit("accepted_delivery", delivery._id);

    accept_button.parentElement.removeChild(accept_button);
    refuse_button.parentElement.removeChild(refuse_button);

    let route_button = document.createElement("button");
    route_button.innerHTML = js_lang_text.route_text;
    route_button.classList.add('btn');
    route_button.classList.add('btn-info');
    route_button.classList.add('mx-2');
    inner_div.appendChild(route_button);

    let failed_button = document.createElement("button");
    failed_button.innerHTML = js_lang_text.failed_text;
    failed_button.classList.add('btn');
    failed_button.classList.add('btn-danger');
    failed_button.classList.add('mx-2');
    failed_button.setAttribute('data-toggle', 'modal');
    failed_button.setAttribute('data-target', '#modal');
    failed_button.setAttribute('id', 'failed-button');
    inner_div.appendChild(failed_button);

    let completed_button = document.createElement("button");
    completed_button.innerHTML = js_lang_text.completed_text;
    completed_button.classList.add('btn');
    completed_button.classList.add('btn-success');
    completed_button.classList.add('mx-2');
    completed_button.setAttribute('data-toggle', 'modal');
    completed_button.setAttribute('data-target', '#modal');
    completed_button.setAttribute('id', 'completed-button');
    inner_div.appendChild(completed_button);

    route_button.addEventListener('click', () => {
        window.open(delivery.link);
    });
    completed_button.addEventListener('click', () => {
        current_delivery = delivery._id;
        current_function = completedDelivery;
        modalTitle.innerHTML = texts[2];
        modalButton.innerHTML = buttonTexts[2];
        modalButton.className = "";
        modalButton.classList.add('btn');
        modalButton.classList.add('btn-success');
    });
    failed_button.addEventListener('click', () => {
        current_delivery = delivery._id;
        current_function = failedDelivery;
        modalTitle.innerHTML = texts[3];
        modalButton.innerHTML = buttonTexts[3];
        modalButton.className = "";
        modalButton.classList.add('btn');
        modalButton.classList.add('btn-danger');
    });
}

function refuseDelivery() {
    let delivery = getDelivery(current_delivery);
    socket.emit("refused_delivery", current_delivery);
    let div = document.getElementById(current_delivery);
    div.parentElement.removeChild(div);
    current_delivery = false;
}

function completedDelivery() {
    let delivery = getDelivery(current_delivery);
    socket.emit("completed_delivery", delivery._id);
    let div = document.getElementById(current_delivery);
    div.parentElement.removeChild(div);
    current_delivery = false;
}

function failedDelivery() {
    let delivery = getDelivery(current_delivery);
    socket.emit("failed_delivery", delivery._id);
    let div = document.getElementById(current_delivery);
    div.parentElement.removeChild(div);
    current_delivery = false;
}

function getDelivery(id) {
    return deliveries.find(obj => obj._id == id);
}