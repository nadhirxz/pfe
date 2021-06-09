var current_delivery = "";
var current_function = "";
var modalButton = document.getElementById('modal-button');

function set(did, func) {
    current_delivery = did;
    current_function = func;
    switch (func) {
        case 'a': modalButton.innerHTML = js_lang_text.accept_text; modalButton.className = "btn btn-success"; break;
        case 'r': modalButton.innerHTML = js_lang_text.refuse_text; modalButton.className = "btn btn-danger"; break;
        case 'c': modalButton.innerHTML = js_lang_text.complete_text; modalButton.className = "btn btn-success"; break;
        case 'f': modalButton.innerHTML = js_lang_text.fail_text; modalButton.className = "btn btn-danger"; break;
    }
}

function doStuff() {
    post('/long_distance_delivery_status', {
        did: current_delivery,
        func: current_function
    });
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