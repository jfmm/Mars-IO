// API DATA Global Variables
var jsonReportLatest,
		sol,
		solarLongitue,
		updatedOn, 
		sol, 
		minTemp, 
		maxTemp, 
		minTempF, 
		maxTempF,
		pressure,
		season,
		sunrise,
		sunset,
		condition; 

// D3.js arrays for archival datasets
var celsiusTemperatureArchive = []; 
var fahrenheitTemperatureArchive = [];

var archivePage;
var archivePageKey;

var storedCelsiusTemperatureArchive; 
var storedFahrenheitTemperatureArchive;


(function ($) {

	'use strict';
	
	// DOM NODE CACHING
	var maxTempContainer = $('.temp-max > span');
	var minTempContainer = $('.temp-min > span');
	var updateInfo = $('.update-info');
	
	


	// load latest data on load
	$('document').ready(getLatestMarsWeather);
	
	

	function getLatestMarsWeather() {
	
		var latestReportUrl = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp';
		
		
		function getData( data ) {
			
			jsonReportLatest = data.report;			
			updatedOn = data.report.terrestrial_date;
			sol = data.report.sol;
			minTemp = data.report.min_temp; // in celsius
			maxTemp = data.report.max_temp; // in celsius
			minTempF = data.report.min_temp_fahrenheit;
			maxTempF = data.report.max_temp_fahrenheit;
			condition = data.report.atmo_opacity; // always sunny, apparently...
			
			
			// cache latest report in local storage
			window.sessionStorage.setItem("latestReport", JSON.stringify(data));
			
			
		
		}
		
		
		
		function outputData() {
			
			//update information
			var today = new Date();
			var diff = Math.abs(today - new Date(updatedOn)); // compute last update time in miliseconds
			var days = Math.floor(diff / 86400000); // convert do days
			
			//Create "days since update" message
			switch(days) {
				
				case 0:
					updateInfo.text("Curiosity Sent its last Update today");
					break;
				
				case 1:
					updateInfo.text("Curiosity Sent its last Update " + days + " Earth day ago");
					break;
				
				default: 
					updateInfo.text("Curiosity Sent its last Update " + days + " Earth days ago");
			}
			
			// append temperature readings in fahrenheit by default
			maxTempContainer.text(maxTempF).append('<sup>&deg;</sup>');
			minTempContainer.text(minTempF).append('<sup>&deg;</sup>');

		}
	
		
		
		
		// Request Latest data from API only once per session
		if(sessionStorage.latestReport == null) {
			
	
			/* GET JSONP FROM API
			============================*/
			$.ajax({

				url: latestReportUrl,

				// The name of the callback parameter, as specified by the YQL service
				jsonp: "callback",

				// Tell jQuery we're expecting JSONP
				dataType: "jsonp",

				// Work with the response
				success: getData,

				//output the latest report
				complete: function () {
					outputData();	
				}
			});

		} else {
			
			
			var storedReport = JSON.parse(sessionStorage.latestReport);
			
			getData(storedReport);
			
			outputData();
		
		}
		

		
		
		
}
	
	
	
	/*================================
			Get Archive Mars data
	================================*/

	
	function loadArchive( pageNum ) {
		
		// get the data attribute that currently has the active btn state,
		// use swtich statement to pass it to the fn below
		var activeToggleButton = $('button.unit-toggle.unit-active');
		var activeToggleUnit = activeToggleButton.data("unit");
		var unitToChart;
		
		
		if(activeToggleUnit === "fahrenheit")
				unitToChart = "f";
		else
				unitToChart = "c";
		
				
		// if a page number is given, query that report's page
		if(pageNum) {
			archivePage = pageNum.toString();
			var archiveUrl = "http://marsweather.ingenology.com/v1/archive/?page=" + pageNum + "&format=jsonp";
		}// otherwise request the latest 10 reports
		else {
			archivePage = "1"; // first archive page is 1
			var archiveUrl = "http://marsweather.ingenology.com/v1/archive/?format=jsonp";
		}
		
		// create a key for session retrieval
		archivePageKey = archivePage + unitToChart; 
		
		
		
		// if the data is not in the session storage, fetch it
		if(window.sessionStorage.getItem(archivePageKey) == null) {
		
			console.log("loading archive " + archivePage + " from API..." );
			
			/* GET JSONP FROM API
			============================*/
			$.ajax({

				url: archiveUrl,

				// The name of the callback parameter, as specified by the YQL service
				jsonp: "callback",

				// Tell jQuery we're expecting JSONP
				dataType: "jsonp",

				// Work with the response
				success: getDataSet,

				// chart the response once we obtain the data
				complete: function () {

					drawChart(unitToChart); // draw chart in the right unit

					// show chart label and input control
					$('#graph-ui').show();

				},

				//if all fails
				error: function(obj, errorString, o) {
					$('#temp-graph').append('<h3 class="error">Oh no! Could not fetch the data</h3>');
				}
			}); // end AJAX
		
		} else {
		
				console.log("using stored data...");
				drawChart(unitToChart, true, archivePageKey);
				
				// show chart label and input control
				$('#graph-ui').show();
		}
		

		
		
		
		// on success fill the last 10 temperature data reports into arrays
		// that will be used for charting
		function getDataSet (data) {
			
			console.log("JSONP REQUEST COMPLETE");
			
			$.each(data.results, function(index, value) {
				
	
				var	celsiusTemps = {
							date: value.terrestrial_date,
							min_temp: value.min_temp,
							max_temp: value.max_temp
					};
					
				var	fahrenheitTemps = {
							date: value.terrestrial_date,
							min_temp: value.min_temp_fahrenheit,
							max_temp: value.max_temp_fahrenheit	
					};		
		
				
				//push objects to the appropiate array
				celsiusTemperatureArchive.push(celsiusTemps);
				fahrenheitTemperatureArchive.push(fahrenheitTemps);
				
			
			
			});
	
				// store each data set in session storage to avoid multiple API calls
				window.sessionStorage.setItem(archivePage + "c", JSON.stringify(celsiusTemperatureArchive));
				window.sessionStorage.setItem(archivePage + "f", JSON.stringify(fahrenheitTemperatureArchive));
		
	}// end getDataSet
		

		
	} // end load archive;
	


	// load the last ten reports on page load
	loadArchive();
	
	
	
	/* Temperature values TOGGLE
	===============================**/
	
	// Temp Unit Toggling
	$('.unit-toggle').on('click', function(e) {
		
		var unitSymbol = $('.unit-symbol');
		var unit = this.dataset.unit;
		var button = $(this);
	

		
			
			if(unit === 'celsius') {
				
				if(archivePageKey)
					drawChart("c", true, archivePage + "c");
				else
					drawChart("c");
				
				// load celsius data
				maxTempContainer.text(maxTemp).append('<sup>&deg;</sup>');
				minTempContainer.text(minTemp).append('<sup>&deg;</sup>');
				
				// change unit in heading
				unitSymbol.text('( C )').append('<sup>&deg;</sup>');
				
				// add active class and remove the other button's
				button.addClass('unit-active').siblings('button').removeClass('unit-active');
			
			} else {
				
				if(archivePageKey)
					drawChart("f", true, archivePage + "f");
				else
					drawChart("f");//chart temperatures in fahrenheit
				
				//load fahrenheit data
				maxTempContainer.text(maxTempF).append('<sup>&deg;</sup>');
				minTempContainer.text(minTempF).append('<sup>&deg;</sup>');	
				
				// change unit in heading
				unitSymbol.text('( F )').append('<sup>&deg;</sup>');
			
				// add active class and remove the other button's
				button.addClass('unit-active').siblings('button').removeClass('unit-active');
			
				
			}
			
				
	});
	
	
				/* Slider UI
				===================*/				
				
				$("#time-traveler").on("change", function() {
					
					var value = this.value;
					var page = value / 10;

					// clear the arrays before loading them with new archive data
					celsiusTemperatureArchive.length = 0; 
					fahrenheitTemperatureArchive.length = 0;
					
					loadArchive(page);
					
				});
		
		
		var activeLink = $("li[class='active']");
		var sidebarlink = $(".sidebar-nav-icons > li");
		
		sidebarlink.on('click', function() {
			var clickedButton = $(this);
				if(clickedButton.hasClass('active')) {
					return false;
				}
						
				else {
						clickedButton.siblings('li').removeClass('active');
						clickedButton.addClass('active');
						
				}
						
		});
	



})(jQuery); // end module






/*=======================================
*	D3.js Visualitzation Code
*=======================================*/
function drawChart(tempUnit, loadCached, archiveKey) {
	
	// clean the node before appending SVG
	document.getElementById("temp-graph").innerHTML = "";


	// are we loading cached data. If so use it
	if(loadCached) 
	{
		var data = JSON.parse(sessionStorage.getItem(archiveKey));
	}
	
	else 
	{
		// else use the right array
		switch( tempUnit) {
			case "f":
				var data = fahrenheitTemperatureArchive;
				break;

			case "c":
				var data = celsiusTemperatureArchive;
		}
	}

	


	/*-----------------------------
	* DRAW LINE GRAPH
	*-------------------------------*/
	
	// svg element dimensions
	var margin = {top: 30, right: 20, bottom: 30, left: 50},
			width = 600 - margin.left - margin.right,
			height = 270 - margin.top - margin.bottom;



	// Set the ranges
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);



	// Define the axes
	var xAxis = d3.svg.axis().scale(x)
			.orient("bottom").ticks(4);

	var yAxis = d3.svg.axis().scale(y)
			.orient("left").ticks(5);


	// Define 'div' for tooltips
	var div = d3.select("#temp-graph")
	.append("div")  // declare the tooltip div 
	.attr("class", "tooltip")  // apply the 'tooltip' class
	.style("opacity", 0);                  

	// Adds the svg canvas
	var svg = d3.select("#temp-graph")
			.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
			.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	
	var years = [];
	// iterate over data and transform date strings to date objects	to enable computations			 
	data.forEach(function(d) {
		
		d.date = new Date(d.date); // ->> this works
		var year = d.date.getFullYear();
		
		years.push(year.toString());
	
	});


	var yearRange = [years[0], years[years.length - 1]];
	
	if(yearRange[0] === yearRange[1])
		d3.select("#year-range").text(yearRange[0]);
	else
		d3.select("#year-range").text(yearRange[0] + "-" + yearRange[1]);
	
	
	
	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([d3.min(data, function(d){ return d.min_temp;}), d3.max(data, function(d){ return d.max_temp;})]);

	
	
	// Define min temp line
	var minTempLine = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y(d.min_temp); });
	
	// define the max temp line
	var maxTempLine = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y(d.max_temp); });
	


	// Add the min temperature path.
	svg.append("path")
		 .attr("class", "minLine")
		 .attr("d", minTempLine(data));
	
	//add the max temperature line
	svg.append("path")
		 .attr("class", "maxLine")
		 .attr("d", maxTempLine(data));


	// draw the min-temp dots + tooltips
	svg.selectAll("dot")									
		.data(data)											
	.enter().append("circle")
		.attr("class", "min-temp-chart-circle")
		.attr("r", 5)	
		.attr("cx", function(d) { return x(d.date); })		 
		.attr("cy", function(d) { return y(d.min_temp); })
		.on("mouseover", function(d) {		
			div.transition()
				.duration(100)	
				.style("opacity", 0);
			div.transition()
				.duration(200)	
				.style("opacity", 1);	
			div.html(d.min_temp + "<sup>&deg;</sup>")	 
				.style("left", d3.select(this).attr("cx") + "px")			 
				.style("top", d3.select(this).attr("cy") + "px");
			})
		.on("mouseout", function(d){
			div.style("opacity", 0);
	});
	
	
	// draw the max temp dots	+ tooltips
	svg.selectAll("dot")									
		.data(data)											
	.enter().append("circle")
		.attr("class", "max-temp-chart-circle")
		.attr("r", 5)	
		.attr("cx", function(d) { return x(d.date); })		 
		.attr("cy", function(d) { return y(d.max_temp); })
		.on("mouseover", function(d) {
			div.transition()
				.duration(100)	
				.style("opacity", 0);
			div.transition()
				.duration(200)	
				.style("opacity", 1);	
			div.html(d.max_temp + "<sup>&deg;</sup>")	 
				.style("left", d3.select(this).attr("cx") + "px")			 
				.style("top", d3.select(this).attr("cy") + "px");
			})
		.on("mouseout", function(d){
			div.style("opacity", 0);
	});
	  
	
	// Add the X Axis
	svg.append("g")
		 .attr("class", "x axis")
		 .attr("transform", "translate(0," + height + ")")
		 .call(xAxis);

	// Add the Y Axis
	svg.append("g")
		 .attr("class", "y axis")
		 .call(yAxis);

}
