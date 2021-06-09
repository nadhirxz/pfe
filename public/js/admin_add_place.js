var position;
var marker;

var placeName;
var secretKey;
var schedule;
var startTime;
var endTime;

var map = createMap(at);

var container = document.getElementById('container');

let nextButton = document.getElementById('next-btn');
nextButton.addEventListener('click', () => {
    placeName = document.getElementById('place-name').value;
    secretKey = document.getElementById('secret-key').value;
    if (placeName && secretKey && position) {
        container.innerHTML = `<div class="form-group"> <label>Working days</label> <select class="custom-select" id="select"> <option value="0" selected="">Everyday except Friday</option> <option value="1">Everyday except Friday and Saturday</option> <option value="2">Everyday</option> </select> </div> <div class="row"> <div class="form-group col-sm"> <label for="from">From</label> <input type="text" maxlength="5" class="form-control" id="from" placeholder="eg. 09:00" required> </div> <div class="form-group col-sm"> <label for="to">To</label> <input type="text" maxlength="5" class="form-control" id="to" placeholder="eg. 17:00" required> </div> </div> <button class="btn btn-success col-lg-4 mt-4" id="save-btn">Save</button>`;
        let saveButton = document.getElementById('save-btn');
        saveButton.addEventListener('click', () => {
            schedule = parseInt(document.getElementById('select').value) || 0;
            startTime = document.getElementById('from').value;
            endTime = document.getElementById('to').value;
            if (position && placeName && secretKey && schedule && startTime && endTime) {
                post("/addnewplace", {
                    name: placeName,
                    place: position,
                    secret: secretKey,
                    schedule: schedule,
                    startTime: startTime,
                    endTime: endTime
                });
            }
        });
    }
});


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
function getPosition() {
    return new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res);
    });
}