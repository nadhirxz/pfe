let url = location.search.substring(1); // url parameters
if (url) {
	let params = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'); // url params parser
	if ('err' in params) {
		document.getElementById('secret-key').classList.add('is-invalid');
		document.getElementById('secret-key').value = params.sec;
	}
}


var position;
var marker;

var placeName;
var secretKey;
var schedule = 0;
var startTime;
var endTime;

const l = {
	en: {
		working_days: "Working Days",
		from: "From",
		to: "To",
		evrdy_excpt_fri: "Everyday except Friday",
		evrdy_excpt_fri_sat: "Everyday except Friday and Saturday",
		evrdy: "Everyday",
		eg9: "eg. 09:00",
		eg5: "eg. 18:00",
		save: "Save"
	},
	fr: {
		working_days: "Jours de travail",
		from: "De",
		to: "À",
		evrdy_excpt_fri: "Tous les jours sauf vendredi",
		evrdy_excpt_fri_sat: "Tous les jours sauf vendredi et samedi",
		evrdy: "Tous les jours",
		eg9: "ex. 09:00",
		eg5: "ex. 18:00",
		save: "Sauvegarder"
	},
	ar: {
		working_days: "أيام العمل",
		from: "من عند",
		to: "ل",
		evrdy_excpt_fri: "كل يوم ما عدا الجمعة",
		evrdy_excpt_fri_sat: "كل يوم ما عدا الجمعة والسبت",
		evrdy: "كل يوم",
		eg9: "مثال: 09:00",
		eg5: "مثال: 18:00",
		save: "حفظ"
	}
}


var map = createMap(at);

var container = document.getElementById('container');

let nextButton = document.getElementById('next-btn');
nextButton.addEventListener('click', () => {
	placeName = document.getElementById('place-name').value;
	secretKey = document.getElementById('secret-key').value;
	if (placeName && secretKey && position) {
		container.innerHTML = `<div class="form-group"> <label>${l[lng].working_days}</label> <select class="custom-select" id="select"> <option value="0" selected="">${l[lng].evrdy_excpt_fri}</option> <option value="1">${l[lng].evrdy_excpt_fri_sat}</option> <option value="2">${l[lng].evrdy}</option> </select> </div> <div class="row"> <div class="form-group col-sm"> <label for="from">${l[lng].from}</label> <input type="text" maxlength="5" class="form-control" id="from" placeholder="${l[lng].eg9}" required> </div> <div class="form-group col-sm"> <label for="to">${l[lng].to}</label> <input type="text" maxlength="5" class="form-control" id="to" placeholder="${l[lng].eg5}" required> </div> </div> <button class="btn btn-info col-lg-4 mt-4" id="save-btn">${l[lng].save}</button>`;
		let saveButton = document.getElementById('save-btn');
		saveButton.addEventListener('click', () => {
			schedule = parseInt(document.getElementById('select').value) || 0;
			startTime = document.getElementById('from').value;
			endTime = document.getElementById('to').value;
			if (position && placeName && secretKey && startTime && endTime) {

				let r = /^([01]\d|2[0-3]):?([0-5]\d)$/;
				let save = true;

				if (r.test(startTime)) {
					document.getElementById('from').classList.remove('is-invalid');
				} else {
					document.getElementById('from').classList.add('is-invalid');
					save = false;
				}

				if (r.test(endTime)) {
					document.getElementById('to').classList.remove('is-invalid');
				} else {
					document.getElementById('to').classList.add('is-invalid');
					save = false;
				}

				if (save) {
					post("/admin/new-partner", {
						name: placeName,
						place: position,
						secret: secretKey,
						schedule: schedule,
						startTime: startTime,
						endTime: endTime
					});
				}
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