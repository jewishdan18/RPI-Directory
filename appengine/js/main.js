// Christian Johnson
// RCOS RPI Directory JavaScript

var delay = 60;
var keybind_delay = Math.floor(100 + Math.random() * 150);
var padding = '15%';
var last_token = 1;
var cached_results = {};
var local_storage_supported;
var request; request_in_progress = false;
var suffix_cache = ":v2";

//Chart data and charts
var class_chart_data, department_chart_data;
var major_chart, department_chart;

//Capitalize function
String.prototype.capitalize = function(){
   return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
  };


function resetCharts(){
  //Reset chart
  class_chart_data.removeRows(0, class_chart_data.getNumberOfRows());
  department_chart_data.removeRows(0, department_chart_data.getNumberOfRows());
}

function redrawCharts(class_chart_data, department_chart_data){
  // Set class chart options
  var class_chart_options = {
    'title':'Class/Positions in Results',
    'height': 300,
    'animation':{
      duration: 250,
      easing: 'out'
    }
  };
  
  var department_chart_options = {
    'title':'Departments in Results',
    'height': 300,
    'animation':{
      duration: 250,
      easing: 'out'
    }
  };
  
  //Update graphs
  major_chart.draw(class_chart_data, class_chart_options);
  department_chart.draw(department_chart_data, department_chart_options);
}

function parseServerData(data){
  request_in_progress = false;
  
  // Check if quota exceeded
  if (data.data !== [] && data.data == "Quota Exceeded"){
    _gaq.push(['_trackEvent', 'Error', 'Quota Exceeded']);
    jError(
    		'You have exceeded our rate limit!  Please wait 5 minutes and try again...',
    		{
    		  clickOverlay : false, // added in v2.0
    		  MinWidth : 250,
    		  TimeShown : 5000,
    		  LongTrip :20,
    		  HorizontalPosition : 'center',
    		  onClosed : function(){ // added in v2.0
            window.location = "http://goo.gl/QMET";
    		  }
    		});
    return;
  }
  
  // Check if database errored out
  if (data.data !== [] && data.data == "Error with request, please try again"){
    _gaq.push(['_trackEvent', 'Error', 'Server Error']);
    jError(
    		'Our database seems to be having some issues, we apologize.  Lets try refreshing the page to see if that helps.',
    		{
    		  clickOverlay : false, // added in v2.0
    		  MinWidth : 250,
    		  TimeShown : 5000,
    		  LongTrip :20,
    		  HorizontalPosition : 'center',
    		  onClosed : function(){ // added in v2.0
            location.reload(true);
    		  }
    		});
    return;
  }
  
  //Empty list
  if (data.data.length == 0){
    $("#results").css("opacity", "1");
  }
  
	if (data.data.length > 0 && Math.abs(last_token - data.token) < 3){
	  AddResultsToTable(data);
  }
  
  // Cache the results
  var keyword_cache = data.q + suffix_cache;
  cached_results[keyword_cache] = data;
  if (local_storage_supported){
    try {
      localStorage.setItem(keyword_cache, JSON.stringify(data));
    }catch (e){
      if (e == QUOTA_EXCEEDED_ERR) {
        // oh noes, out of 5 MB of localstorage...clear it out!
        localStorage.clear();
      }
    }
  }
}

function parseCachedData(keyword){
  var data = null;
  if (cached_results[keyword]){
    data = cached_results[keyword];
    console.log("Cached from JS");
  }else if (local_storage_supported && localStorage.getItem(keyword)){
    data = JSON.parse(localStorage.getItem(keyword));
    console.log("Cached from HTML5");
  }  
	if (data !== null && data.data !== []){
	  AddResultsToTable(data);
	}else{
	  callServer(keyword);
	}
}

function AddResultsToTable(data){
  // Get rid of current results		
  $("#results").find("tbody").empty();
  
  resetCharts();
  
  //If no data, display notification
  if (data.data.length < 1){
    jNotify(
    		'No results...try broadening your search?',
    		{
    		  clickOverlay : true, // added in v2.0
    		  MinWidth : 250,
    		  TimeShown : 1250,
    		  LongTrip :20,
    		  ShowOverlay : true,
    		  HorizontalPosition : 'center',
    		  VerticalPosition : 'center'
    		});
    return;
  }
  
  //Track data
  var classes = {};
  var departments = {};
  
  // Loop through JSON
  $.each(data.data, function(i, person){
    var table_row = "<tr id='" + person.rcsid + "'>";

    //Professor Check
    if (person.major == undefined && person.department == undefined){
      person.major = "N/A";
    }else if (person.department != undefined){
      person.major = person.department;
    }

    //Faculty Check
    if (person.year == undefined && person.title != undefined){
      person.year = person.title;
    }else if (person.year == undefined && person.department != undefined){
      person.year = "Faculty";
    }

    var email = "";

    //EMail check
    if (person.email != undefined){
      email = person.email.replace("@", " [at] ");
      while (email.indexOf(".") > -1){
        email = email.replace(".", " [dot] ");
      }
    }else{
      email = "N/A";
    }

    table_row += ("<td>" + person.name + "</td><td>" + person.major + "</td><td>" + (person.year == undefined ? 'N/A' : person.year) + "</td><td>" +  email + "</td></tr>");
    
    $("#results").find("tbody").append(table_row);
    
    if (person.year == undefined){
      person.year = "N/A";
    }
    
    //Add to classes chart
    if (classes[person.year] == undefined){
      classes[person.year] = 1;
    }else{
      classes[person.year] += 1;
    }
    
    //Add to departments chart
    if (departments[person.major] == undefined){
      departments[person.major] = 1;
    }else{
      departments[person.major] += 1;
    }
  });
  
  $("#results").css("opacity", "1");

  for (key in classes){
    class_chart_data.addRow([key, classes[key]]);
  }
  
  for (key in departments){
    department_chart_data.addRow([key, departments[key]]);
  }
  
  redrawCharts(class_chart_data, department_chart_data);
}

/*
Function to animate text box.
send true to animate it up, false to animate it down
*/
function animate(flag){
  if (flag){    
    $("#qr").hide();
    $("#sidebar").show();
    $("#container").animate({
      marginTop: '0%'
    }, delay, function(){ $("#container").css("margin-top","0%"); });
  }else{
    $("#container").animate({
      marginTop: padding
    }, delay * 1.3);
    $("#sidebar").hide();
    $("#qr").show();
  }
}

//Detect HTML5 Local Storage
function DetectLocalStorage(){
  try{
    if (window['localStorage'] !== null){
      _gaq.push(['_trackEvent', 'Local Storage', 'True']);
      return true;
    }
  }catch(e){
    _gaq.push(['_trackEvent', 'Local Storage', 'False']);
    return false;
  }
}

function callServer(keyword){
  if(request_in_progress){
    request.abort();
  }
  request_in_progress = true;
  url = "/api?q=" + keyword + "&token=" + last_token + "&source=website";
  request = $.getJSON(url, parseServerData);
}

$(document).ready(function() {
  //Focus on textbox
	$("#keyword").focus();
	
  $(document).ajaxError(function(event, request, settings, exception){
    console.log("Error: "  + exception);
    _gaq.push(['_trackEvent', 'Error', 'Parsing Error: ' + exception]);
  });
	
	//Detect LocalStorage (HTML5 Cache)
	local_storage_supported = DetectLocalStorage();
	
	//Class Chart
	class_chart_data = new google.visualization.DataTable();
  class_chart_data.addColumn('string', 'Major');
  class_chart_data.addColumn('number', 'Amount');
  
  //Department Chart
  department_chart_data = new google.visualization.DataTable();
  department_chart_data.addColumn('string', 'Department');
  department_chart_data.addColumn('number', 'Amount');
  
  // Instantiate and draw our chart, passing in some options.
  major_chart = new google.visualization.PieChart(document.getElementById('major_stats'));
  department_chart = new google.visualization.PieChart(document.getElementById('department_stats'));
  
  $("#keyword").bindWithDelay("keyup", function(event) {
	  var keyword = $("#keyword").val().toLowerCase();
	  var margin = $("#container").css("margin-top");
    
    // If a non-blank entry
	  if (keyword != ''){ 	   
 	    last_token += 1;
 	    
 	    //Animate text box up
   	  if ( margin != "0%" || margin != "0px" ){
   	    animate(true);
   	    _gaq.push(['_trackEvent', 'Interaction', 'Moved Box Up']);
   	  }
 	    
 	    $("#results").show();
 	    
 	    //Omnibox Search
 	    var keyword_cache = keyword + suffix_cache;
 	    
 	    // Check cache
 	    if (cached_results[keyword_cache] || (local_storage_supported && localStorage.getItem(keyword_cache))){
 	      console.log("Pulling from cache");
 	      parseCachedData(keyword_cache);
 	    }else{  // Dim results and call the API
 	      $("#results").css("opacity", ".25");
 	      callServer(keyword);
 	    }
	  }else if (keyword == ''){ // Entry is blank
	    $("#results").hide();
	    // Animate box back down
	    if ( margin == "0%" || margin == "0px"){
	      _gaq.push(['_trackEvent', 'Interaction', 'Moved Box Down']);
  		  animate(false);
	    }
    }
  }, keybind_delay);
});

$(document).on('click', 'tr', function(e) {
  var id = $(this).attr('id');
  console.log('Clicked on: ' + id);
  if(id) {
    window.location = '/detail/' + id;
  }
});