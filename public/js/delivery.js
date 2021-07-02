var deliveryInfoDiv = document.getElementById('delivery-info');
var loadingImg = document.getElementById('loading-img')

var statusText = document.getElementById('delivery-status-info-text');
var statusBtn = document.getElementById('delivery-status-info-btn');
var statusDiv = document.getElementById('delivery-status');
var driverInfo = document.getElementById('driver-info');

var classes = [
	"btn-light",
	"btn-info",
	"btn-primary",
	"btn-warning",
	"btn-success",
	"btn-danger",
	"btn-dark"
];

$('#delivery-status-info-btn').replaceWith(createTheButton(buttonTexts[status], classes[status]))
statusBtn.style.display = "block";

statusText.innerHTML = texts[status];
statusText.style.display = "block";


let time_to_wait = Date.now() - finish_time;
let finishTime = document.getElementById('finish-time');

socket.emit('viewing_delivery', window.location.href.substring(window.location.href.lastIndexOf('/') + 1));

socket.on('new_delivery_status', () => window.location.reload());

function createTheButton(text, theClass) {
	let button = document.createElement("button");
	c_classes = ['ml-sm-6', 'col-11', 'col-sm-6', 'btn', 'btn-pill'];
	button.innerHTML = text;
	button.setAttribute('id', 'delivery-status-info-btn');
	c_classes.forEach(c => {
		button.classList.add(c);
	});
	button.classList.add(theClass);
	if (theClass == 'btn-light') button.classList.add('border-secondary')
	return button;
}

function pad(n, z) {
	z = z || '0';
	n = n + '';
	return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}

if ($('#cancel-btn').length) {
	$('#cancel-btn').on('click', () => {
		$.post('/cancel-delivery', { id: window.location.pathname.split('/')[2] }, (data) => {
			if (data) window.location.href = '/';
			else window.location.reload()
		});
	});
}