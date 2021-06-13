var marker;

function createMap(at) {
	let map = L.map('map').setView([36.68686093982163, 3.0768628983554978], 11);
	L.tileLayer(`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${at}`, {
		maxZoom: 18,
		minZoom: 10,
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1,
		accessToken: at
	}).addTo(map);


	let southWest = L.latLng(36.57206172934943, 2.7871860510120303);
	let northEast = L.latLng(36.81026139797445, 3.395462036132813);
	var bounds = L.latLngBounds(southWest, northEast);
	map.setMaxBounds(bounds);


	map.on('click', (e) => {
		if (marker) marker.setLatLng(e.latlng);
		else marker = L.marker(e.latlng, { draggable: 'true' }).addTo(map);
		position = [marker.getLatLng().lat, marker.getLatLng().lng];
	});

	(async () => {
		position = await getPosition();
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
				if (marker) marker.setLatLng(your_position);
				else marker = L.marker(your_position, { draggable: 'true' }).addTo(map);
				map.setView(marker.getLatLng(), 16);
				position = [marker.getLatLng().lat, marker.getLatLng().lng];
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