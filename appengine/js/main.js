// Christian Johnson
// RCOS RPI Directory JavaScript

var delay = 60;
var keybind_delay = Math.floor(100 + Math.random() * 100);
var padding = '15%';
var last_token = 1;
var cached_results = {};
var local_storage_supported;
var query = '';

//Chart data
var chart_data;
var major_chart;

// Set chart options
var chart_options = {
  'title':'Search Statistics',
  'animation':{
    duration: 1000,
    easing: 'out',
  }
};


function drawSidebarChart() {
  chart_data.removeRows(0, chart_data.getNumberOfRows());
  chart_data.addRows([
    ['Hits', Math.floor(Math.random()*100)],
    ['Misses', 7],
  ]);
  major_chart.draw(chart_data, chart_options);
}

function parseServerData(data){
  // Check if quota exceeded
  if (data.data !== [] && data.data == "Quota Exceeded"){
    alert("Quota Exceeded.  Please try again in 5 minutes...");
    return;
  }
  
  //Empty list
  if (data.data.length == 0){
    $("#results").css("opacity", "1");
  }
  
	if (data.data.length > 0 && Math.abs(last_token - data.token) < 2){
	  AddResultsToTable(data);
  }
  
  
  
  // Cache the results
  cached_results[data.q] = data;
  if (local_storage_supported){
    try {
      localStorage.setItem(data.q, JSON.stringify(data));
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
    //$("#output").text("JS Cached Keyword: " + keyword);
  }else if (local_storage_supported && localStorage.getItem(keyword)){
    data = JSON.parse(localStorage.getItem(keyword));
    //$("#output").text("HTML5 Cached Keyword: " + keyword);
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
  
  // Loop through JSON
  $.each(data.data, function(i, person){
    var table_row = "<tr>";
    
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
    
    table_row += ("<td>" + person.name + "</td><td>" + person.major + "</td><td>" + (person.year == undefined ? 'N/A' : person.year) + "</td><td>" +  email + "</td>");
    table_row += "</tr>";
    $("#results").find("tbody").append(table_row);
  });
  
  $("#results").trigger("update");
  $("#results").css("opacity", "1");
  
  //Update graph
  drawSidebarChart();
}

//Function to animate text box:
// Send true to animate it up, false to animate it down
function animate(flag){
  if (flag){    
    $("#qr").hide();
    $("#container").animate({
      marginTop: '0%'
    }, delay, function(){ $("#container").css("margin-top","0%"); });
  }else{
    $("#container").animate({
      marginTop: padding,
    }, delay * 1.3);
    $("#qr").show();
  }
}

//Detect HTML5 Local Storage
function DetectLocalStorage(){
  try{
    if (window['localStorage'] !== null){
      return true;
    }
  }catch(e){
    return false;
  }
}

function callServer(keyword){
  $.ajax({
    type: "GET",
    url: "/api?q=" + encodeURI(keyword) + "&token=" + last_token + "&delay=" + keybind_delay,
    async: true,
    dataType: "json",
    success: parseServerData
  });
}

$(document).ready(function() {
	$("#keyword").bindWithDelay("keyup", function(event) {
	  var keyword = $("#keyword").val().toLowerCase();
	  var margin = $("#container").css("margin-top");
    
    // If a non-blank entry
	  if (keyword != ''){ 	   
 	    last_token += 1;
 	    
 	    //Animate text box up
   	  if ( margin != "0%" || margin != "0px" ){
   	    animate(true);
   	  }
 	    
 	    $("#results").show();
 	    
 	    // Check cache
 	    if (cached_results[keyword] || (local_storage_supported && localStorage.getItem(keyword))){
 	      parseCachedData(keyword);
 	    }else{  // Dim results and call the API
 	      $("#results").css("opacity", ".25");
 	      callServer(keyword);
 	    }
	  }else if (keyword == ''){ // Entry is blank
	    $("#results").hide();
	    // Animate box back down
	    if ( margin == "0%" || margin == "0px"){
  		  animate(false);
	    }
    }
  }, keybind_delay);
  
  //Make table sortable
  $("#results").tablesorter();
  
	//Focus on textbox
	$("#keyword").focus();
	
	//Detect LocalStorage (HTML5 Cache)
	local_storage_supported = DetectLocalStorage();
	
	//Chart
	chart_data = new google.visualization.DataTable();
  chart_data.addColumn('string', 'Major');
  chart_data.addColumn('number', 'Amount');
  
  // Instantiate and draw our chart, passing in some options.
  major_chart = new google.visualization.PieChart(document.getElementById('major_stats'));
  
});