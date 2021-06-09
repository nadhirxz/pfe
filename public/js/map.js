var marker;

function createMap(at) {
    let map = L.map('map').setView([36.1619007, 1.3294696], 14);
    L.tileLayer(`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${at}`, {
        maxZoom: 18,
        minZoom: 9.5,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: at
    }).addTo(map);


    let southWest = L.latLng(36.73448194195683, 2.2197100582749263);
    let northEast = L.latLng(35.50987173838399, 0.4720116474817538);
    var bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);


    map.on('click', (e) => {
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng, { draggable: 'true' }).addTo(map);
        position = [marker.getLatLng().lat, marker.getLatLng().lng];
    });

    (async () => {
        position = await getPosition(); // TODO handle error (user deactivated location)
        position = [position.coords.latitude, position.coords.longitude]
        let your_position = position.slice();
        if (position) {
            marker = L.marker(position, { draggable: 'true' }).addTo(map);
            marker.on('dragend', (e) => {
                position = [marker.getLatLng().lat, marker.getLatLng().lng];
            });

            L.circle(position, {
                color: '#0080C0',
                fillColor: '#0080C0',
                fillOpacity: 0.25,
                radius: 150
            }).addTo(map);
            L.circle(position, {
                color: '#0080C0',
                fillColor: '#0080C0',
                fillOpacity: 1,
                radius: 10
            }).addTo(map);
            map.setView(marker.getLatLng(), 16);

            L.easyButton('fa-crosshairs fa-lg', (btn, map) => {
                if(marker) marker.setLatLng(your_position);
                else marker = L.marker(your_position, { draggable: 'true' }).addTo(map);
                map.setView(marker.getLatLng(), 16);
            }).addTo(map);
        }
    })();

    return map;
}

function getPosition() {
    return new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res);
    });
}