var geocoder;
var map;
var currentLocation;
var markers = [];

// Creates infoWindow for a marker
// Launches infoWindow when marker is clicked
function addInfoWindow(marker, applicant) {
	var contentString = '<div id="info-window">' +
		'<div id="siteNotice">' +
		'</div>' +
		'<h1 id="firstHeading" class="firstHeading">' + applicant["applicant"] + '</h1>' +
		'<ul>' +
		'<li><b>Facility Type:</b> ' + applicant["facilitytype"] + '</li>' +		
		'<li><b>Location:</b> ' + applicant["locationdescription"] + '</li>' +
		'<li><b>Food Items:</b> ' + applicant["fooditems"] + '</li>' +
		'</ul>' +
		'<center><a href="' + applicant["schedule"] + '"><b>Schedule (pdf)</b></a><br><br>';
	
	var infoWindow = new google.maps.InfoWindow({
		content: contentString
	});		

	google.maps.event.addListener(marker, 'click', function () {
		infoWindow.open(map, marker);
	});
}

// Re-centers map
// Updates current location (for when directions are implemented later)
function changeCenter(position) {
	var center = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	map.panTo(center);
	map.setZoom(16);
	updateLocation(center);
}

// Geocodes the location in the search bar
// Updates the current location
// Listens for changes in bounds of map, to load markers dynamically
function codeAddress() {
	var address = document.getElementById('search-box').value;
	geocoder.geocode({ 'address': address }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			map.setZoom(16);

			updateLocation(results[0].geometry.location);

			currentBoundsListener = google.maps.event.addListener(map, 'bounds_changed', function () {updateMarkers();});

		} else {
			alert('Geocode was unsuccessful for the following reason: ' + status);
		}
	});
}

// Gets location of user from browser
function getBrowserLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(changeCenter);

		currentBoundsListener = google.maps.event.addListener(map, 'bounds_changed', function () {updateMarkers();});
	}
	else {
		alert("Geolocation not supported. Enter a location.");
	}
}

// Initializes geocoding with Google Maps API
function initializeGeocoder() { geocoder = new google.maps.Geocoder(); }

// Initializes Google Map
// Launches initializers for search and geocoding
function initializeMap() {
	var styles = [
	  {
	    "stylers": [
	      { "saturation": -100 },
	      { "gamma": 0.66 }
	    ]
	  }
	];

	var mapOptions = {
		center: new google.maps.LatLng(37.774932,-122.419413),
		zoom: 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		styles: styles
	};

	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

	initializeSearch();
	initializeGeocoder();
}

// Initializes search box and Google Maps API Autocomplete
function initializeSearch() {
	// Bias results to San Francisco
	var defaultBounds = new google.maps.LatLngBounds(
		new google.maps.LatLng(37.687896,-122.542588),
		new google.maps.LatLng(37.83609,-122.337967));

	var options = { bounds: defaultBounds };

	// Create the search box and link it to the UI element
	var input = document.getElementById('search-box');
	var autocomplete = new google.maps.places.Autocomplete(input, options);

	// Listen for the event fired when the user selects an item from the pick list
	// Retrieve the matching places for that item
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		var place = autocomplete.getPlace();
	});
}

// Wipes all markers from the display
function nullAllMarkers(map) {
	for (var i=0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
}

// Updates current location
function updateLocation(position) {
	if (! currentLocation) {
		var marker = new google.maps.Marker({
			position: position,
			map: map,
			title: "Current Location",
			icon: '/static/img/smile.png',
			draggable: true
		});

		google.maps.event.addListener(marker, 'dragend', function() {
			var newCenter = marker.getPosition();
			map.setCenter(newCenter);
		});

		currentLocation = marker;
	} else {
		currentLocation.setPosition(position);
	}
}

// Updates all markers on the display
function updateMarkers() {
	nullAllMarkers();

	var bounds = map.getBounds();

	$.get('/get_markers', { minLat: bounds.getSouthWest().lat(), maxLat: bounds.getNorthEast().lat(),
	 		minLng: bounds.getSouthWest().lng(), maxLng: bounds.getNorthEast().lng() }, function(data) {
		for (var i=0; i < data.length; i++) {			
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(data[i]["latitude"], data[i]["longitude"]),
				map: map,
				title: data[i]["applicant"],
				icon: '/static/img/foodtruck.png'
			});

			markers.push(marker);

			addInfoWindow(marker, data[i]);
		}
	});
}

window.onload = function () { initializeMap(); }

document.getElementById("here-button").onclick = function() { getBrowserLocation(); }
document.getElementById("submit-button").onclick = function() { codeAddress(); }

document.getElementById("search-box").addEventListener("keydown", function(e) {
	// Enter is pressed
	if (e.keyCode == 13) { codeAddress(); };
});