function createRouter(at, themap, from, to) {
    let router = L.Routing.control({
        waypoints: [L.latLng(from), L.latLng(to)],
        router: L.Routing.graphHopper(at),
        draggableWaypoints: false,
        routeWhileDragging: false,
        lineOptions: {
            addWaypoints: false,
            styles: [{color: '#222222', opacity: .8, weight: 7}, {color: '#17C671', opacity: 1, weight: 4}]
        }
    }).addTo(themap);
    return router
}