var loadingImg = document.getElementById('loading-img');
var optionsFrom = document.getElementById('delivery-from');
var optionsTo = document.getElementById('delivery-to');
var price = document.getElementById('price');
var places = [];

socket.emit('request_prices_for_ldd');
socket.on('get_prices_for_ldd', (data) => {
    setTimeout(() => {
        places = data;
        loadingImg.parentElement.removeChild(loadingImg);
        document.getElementById('delivery').classList.remove('d-none');
        places.forEach(place => {
            let o = document.createElement('option');
            o.value = place.id;
            o.innerHTML = place.name;
            optionsFrom.appendChild(o);
        });
    }, 300);
});
optionsFrom.addEventListener('change', (e) => {
    optionsTo.innerHTML = '<option selected value="">-</option>';
    price.innerHTML = '-';
    places.forEach(place => {
        if (place.id != optionsFrom.value) {
            let o = document.createElement('option');
            o.value = place.id;
            o.innerHTML = place.name;
            optionsTo.appendChild(o);
        }
    });
});
optionsTo.addEventListener('change', () => {
    console.log(optionsTo.value)
    price.innerHTML = calculateCarDeliveryPrice(optionsFrom.value, optionsTo.value);
});

function getPlace(value) {
    return places.find(obj => obj.id == value);
}

function calculateCarDeliveryPrice(from, to) {
    from = getPlace(from);
    to = getPlace(to);
    let price = from.price + to.price;
    if (from.id != 0 && to.id != 0) price *= 0.92;
    return Math.floor(price / 50) * 50;
}

var deliveryType = document.getElementById('delivery-type');
var anotherShopDiv = document.getElementById('another-shop');

deliveryType.addEventListener('change', () => {
    if (deliveryType.value == "1") {
        anotherShopDiv.classList.remove('d-none');
        document.getElementById('shop-name').required = true;
    } else {
        anotherShopDiv.classList.add('d-none');
        document.getElementById('shop-name').required = false;
    }
});

function onlyNumberKey(evt) {
    // Only ASCII charactar in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
        return false;
    return true;
}