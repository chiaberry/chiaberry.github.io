var placesData = [ //an array of objects
    {
      name: 'La Parroquia', 
      location: {lat:20.913299,
        lng:-100.743733}
    },
    { 
      name: 'Bellas Artes', 
      location: {lat:20.915003, 
        lng: -100.745316}
    },
    { 
      name: 'El Instituto Allende', 
      location: {lat:20.909435, 
        lng: -100.746890}
    },
    { 
      name: 'San Francisco', 
      location: {lat: 20.915010,  
        lng: -100.742128}
    },
    { 
      name: 'El Parque Juarez', 
      location: {lat:20.908970, 
        lng: -100.742980}
    },
    {
      name: 'Cafe Monet',
      location: {lat: 20.911035, 
        lng: -100.746584}
    }, 
    {
      name: 'El Cafe de la Mancha', 
      location: {lat: 20.912616, 
        lng: -100.742078}
    }, 
    {
      name: 'La Azotea Bar', 
      location: {lat: 20.913963, 
        lng:-100.744319}
    }, 
    {
      name: 'Biblioteca Publica',
      location: {lat: 20.916715, 
        lng:-100.743686}
    },
    {
      name: 'Farmacia Guadalajara', 
      location: {lat:20.910247,
        lng: -100.746749}
    }
]

var sanmiguel_coord = {lat: 20.914, lng: -100.744};

var foursquare_creds = {
  ID: '2VVFDWVHS21VPEA2DWRQA1TZLIYT43RG3JRGGIJRMEDW24XE', 
  SECRET: 'OGLCVQBB1B1CXPXE1OGDSE10Y0DPG4EMV3FNBLF103BNLRNJ'
};

var wu_key = '08a65962d9394874';
var w_url = "https://api.wunderground.com/api/"+ wu_key +"/conditions/q/" +
              sanmiguel_coord.lat +","+sanmiguel_coord.lng + ".json";


function ViewModel() {

  var self=this;

  // Create a new Google Map
  self.googleMap = new google.maps.Map(document.getElementById('map'), {
    center: sanmiguel_coord,
    zoom: 15
  });

  var bounds = new google.maps.LatLngBounds();
  self.pickedPlace = ko.observable();
  self.userInput = ko.observable('');

  self.weatherTemp = ko.observable('');
  self.weatherFaren = ko.observable(true);
  
  // infowindow
  var infoWindow = new google.maps.InfoWindow();
  infoWindow.addListener('closeclick', function() {  
    self.pickedPlace('');
  });  


  self.allPlaces = [];

  placesData.forEach(function(placeObj) {
    self.allPlaces.push(new Place(placeObj));
  });

  // Create a marker for each of the places in the allPlaces array
  self.allPlaces.forEach(function(place) {
    var markerOptions = {
      map: self.googleMap,
      position: place.location,
      animation: null
    };
    
    bounds.extend(place.location);
    self.googleMap.fitBounds(bounds);
    place.marker = new google.maps.Marker(markerOptions);

    place.marker.addListener('click', function(){
      self.loadWindow(place)});
  });


  // LIST FILTER 

  self.visiblePlaces = ko.observableArray();
  self.allPlaces.forEach(function(place) {
    self.visiblePlaces.push(place);
  });


  self.filterLocations = function() {
    var searchInput = self.userInput().toLowerCase();
    
    self.visiblePlaces.removeAll();
    self.pickedPlace('');
    infoWindow.close();
    bounds = new google.maps.LatLngBounds();

    // This looks at the name of each places and then determines if the user
    // input can be found within the place name.
    self.allPlaces.forEach(function(place) {
      place.marker.setVisible(false);
      
      if (place.name.toLowerCase().indexOf(searchInput) !== -1) {
        self.visiblePlaces.push(place);
      }
    });
    
    self.visiblePlaces().forEach(function(place) {
      place.marker.setVisible(true);
      bounds.extend(place.location);
    });

    self.reZoomMap(bounds);
  };


  self.showAllPlaces = function(){
    self.visiblePlaces.removeAll();
    self.allPlaces.forEach(function(place) {
      place.marker.setVisible(true);
      bounds.extend(place.location);
      self.visiblePlaces.push(place);
    });
    self.reZoomMap(bounds);
    self.pickedPlace('');  
    self.userInput('');
    infoWindow.close();
  };

  
  self.reZoomMap = function(bounds) {
    self.googleMap.fitBounds(bounds);
    if (self.googleMap.getZoom() > 17){
      self.googleMap.setZoom(17);
    }
    if (self.visiblePlaces.length === 0){
      self.googleMap.setCenter({lat: 20.914, lng: -100.744});
      self.googleMap.setZoom(16);
    }
    else{
    self.googleMap.panToBounds(bounds); }
  };


  self.isSelected = function(place) {
        return self.pickedPlace() === place;
  };


  // INFOWINDOWS

  self.loadWindow = function(place) {
    toggleBounce(place.marker);
    self.pickedPlace(place);
    //infoWindow.setContent(windowContent(place));
    windowContent(place);
  };

  function windowContent(place){
    var url = 'https://api.foursquare.com/v2/venues/search?ll='+ place.location.lat +',' + place.location.lng + '&client_id=' + foursquare_creds.ID + '&client_secret=' + foursquare_creds.SECRET + '&v=20170101';
    var contentString = '<div>' + '<b>' + place.name + '</b>' + '</div>';
    var fsIcon = ''

    //and url

    $.getJSON(url, function(data){
      console.log(data.response.venues[0].name);
      //foursqID = data.response.venues[0].id;
      if (data.response.venues[0].categories[0].name !== undefined){
        fsIconUrl = data.response.venues[0].categories[0].icon.prefix + 'bg_32' + 
                    data.response.venues[0].categories[0].icon.suffix;
        contentString += '<div class="category">'+ 
                          '<img class ="fsIcon" src='+ fsIconUrl +'>' +
                          data.response.venues[0].categories[0].name + 
                          '</div>'
      }
      if(data.response.venues[0].contact.phone !==undefined){
        contentString += '<div> Phone number: '+ data.response.venues[0].contact.formattedPhone + '</div>';
      }

      contentString += '<div class="credit">Information provided by Foursquare</div>'
      infoWindow.setContent(contentString);
      infoWindow.open(map, place.marker);
    }).fail(function(err){
      infoWindow.setContent(contentString + '<div class="error"> Failed to access Foursquare</div>');

    });
  };


  function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);
      }, 2100);
    }
  };



  // PLACE OBJECT

  function Place(dataObj) {
    this.name = dataObj.name;
    this.location = dataObj.location;
    this.marker = null;
  };


  self.changeUnits = function(){
    if (self.weatherFaren() === true) {
      $.getJSON(w_url, function(data){
        self.weatherTemp(data.current_observation.temp_c + "C");
        self.weatherFaren(false);
      });
    }else {
      $.getJSON(w_url, function(data){
        self.weatherTemp(data.current_observation.temp_f + "F");
        self.weatherFaren(true);
      });
    }
  }


  $.getJSON(w_url, function(data){
    console.log(data);
    self.weatherTemp(data.current_observation.temp_f +"F");
    self.weatherFaren(true);
  }).fail(function(err){
    $(".temp").append("Cannot access Weather Underground. ")
  });

}

// callback function from google maps
function ready(){
  ko.applyBindings(new ViewModel());
}

// if googlemaps fails
function googleError(){
  console.log("error");
  document.getElementById('map').innerHTML="Google Maps not loading.";
}



