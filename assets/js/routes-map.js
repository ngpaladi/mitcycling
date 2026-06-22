// Routes page — overview map driven by per-route GPX files

(function () {
  var mapEl = document.getElementById('routes-map');
  var dataEl = document.getElementById('routes-data');
  if (!mapEl || !dataEl || typeof L === 'undefined') return;

  var routes = JSON.parse(dataEl.textContent);
  var routesById = {};
  routes.forEach(function (r) { routesById[r.id] = r; });

  var map = L.map(mapEl, {
    center: [42.360034, -71.094847],
    zoom: 11,
    scrollWheelZoom: false
  });

  L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors. Tiles by <a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a>',
    maxZoom: 20
  }).addTo(map);

  var meetingPoints = [
    { name: 'MIT Student Center', lat: 42.358892, lng: -71.094093 },
    { name: 'Porter Square Dunkin’ Donuts', lat: 42.389162, lng: -71.119562 }
  ];
  var meetingIcon = L.divIcon({
    className: 'meeting-point-icon',
    html:
      '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="11" fill="#150508" stroke="#fff" stroke-width="2"/>' +
        '<path fill="#fff" d="M10,4 L14,4 L12,8 Z M10,20 L14,20 L12,16 Z M4,10 L4,14 L8,12 Z M20,10 L20,14 L16,12 Z"/>' +
      '</svg>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
  meetingPoints.forEach(function (p) {
    L.marker([p.lat, p.lng], { icon: meetingIcon })
      .addTo(map)
      .bindTooltip(p.name, { direction: 'top', offset: [0, -14], className: 'meeting-point-label' });
  });

  var layers = {};

  function showRoute(route) {
    if (layers[route.id]) {
      var layer = layers[route.id];
      layer.addTo(map);
      if (layer._routeLoaded) map.fitBounds(layer.getBounds(), { maxZoom: 14, padding: [24, 24] });
      return;
    }

    var gpx = new L.GPX(route.gpx, {
      async: true,
      polyline_options: { color: '#A31F34', weight: 4, opacity: 0.85 },
      marker_options: { startIconUrl: '', endIconUrl: '', shadowUrl: '', wptIconUrls: {} }
    });
    gpx.on('loaded', function (e) {
      gpx._routeLoaded = true;
      map.fitBounds(e.target.getBounds(), { maxZoom: 14, padding: [24, 24] });
    });
    gpx.addTo(map);
    layers[route.id] = gpx;
  }

  function hideRoute(route) {
    var layer = layers[route.id];
    if (layer) map.removeLayer(layer);
  }

  document.querySelectorAll('[data-route-id]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var route = routesById[btn.dataset.routeId];
      if (!route) return;

      var row = btn.closest('.route-row');
      var desc = row.querySelector('.route-desc');
      var isActive = row.classList.toggle('active');
      if (desc) desc.hidden = !isActive;

      if (isActive) {
        showRoute(route);
      } else {
        hideRoute(route);
      }
    });
  });
})();
