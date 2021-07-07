var deliveryInfoDiv = document.getElementById('delivery-info');
var loadingImg = document.getElementById('loading-img')

var classes = [
	"btn-light",
	"btn-info",
	"btn-primary",
	"btn-warning",
	"btn-success",
	"btn-danger",
	"btn-dark"
];

$('#status-btn').replaceWith(createTheButton(buttonTexts[status], classes[status]))
$('#status-btn').removeClass('d-none');
$('#status-btn').css('pointer-events', 'none');

$('#status-text').html(texts[status]);
$('#status-text').removeClass('d-none');


let time_to_wait = Date.now() - finish_time;
let finishTime = document.getElementById('finish-time');

socket.emit('viewing_delivery', window.location.href.substring(window.location.href.lastIndexOf('/') + 1));

socket.on('new_delivery_status', () => window.location.reload());

function createTheButton(text, theClass) {
	let button = document.createElement("button");
	c_classes = ['ml-sm-6', 'col-11', 'col-sm-6', 'btn', 'btn-pill'];
	button.innerHTML = text;
	button.setAttribute('id', 'status-btn');
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

let lastStar = false;
$('#success').hide();

$('#stars li').on('mouseover', function () {
	var onStar = parseInt($(this).val());
	$(this).parent().children('li.star').each(function (e) {
		if (e < onStar) $(this).addClass('hover');
		else $(this).removeClass('hover');
	});
});

$('#stars ul').on('mouseleave', function () {
	$(this).children('li.star').each(function (e) {
		$(this).removeClass('hover');
	});
});

$('#stars li').on('click', function () {
	var onStar = parseInt($(this).val()); // The star currently selected
	var stars = $(this).parent().children('li.star');

	for (i = 0; i < stars.length; i++) $(stars[i]).removeClass('selected');

	for (i = 0; i < onStar; i++) $(stars[i]).addClass('selected');

	var rating = parseInt($('#stars li.selected').last().val());
	if (lastStar != rating) {
		lastStar = rating;
		$.post('/rate-driver/' + window.location.pathname.split('/')[2], { rating }, (data) => {
			if (data.success) {
				$('#success').fadeIn();
				setTimeout(() => $('#success').fadeOut(500, () => $('#rate').trigger('click')), 1000);
			}
		});
	}
});
