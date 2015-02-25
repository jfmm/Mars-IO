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
		
		
		function outputData(data) {
					
			jsonReportLatest = data.report;			
			updatedOn = data.report.terrestrial_date;
			sol = data.report.sol;
			minTemp = data.report.min_temp; // in celsius
			maxTemp = data.report.max_temp; // in celsius
			minTempF = data.report.min_temp_fahrenheit;
			maxTempF = data.report.max_temp_fahrenheit;
			condition = data.report.atmo_opacity; // always sunny, apparently...
			

			
			/* 
			*		DOM Manipulation
			*/
			
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
	
		

		
		/* GET JSONP FROM API
		============================*/
		$.ajax({
			
    	url: latestReportUrl,
 
    	// The name of the callback parameter, as specified by the YQL service
    	jsonp: "callback",
 
    	// Tell jQuery we're expecting JSONP
    	dataType: "jsonp",

    	// Work with the response
    	success: outputData
});

		
}
	
	
	
	/*================================
			Get Archive Mars data
	================================*/

	
	function loadArchive( pageNum ) {
	
		
		// if a page number is given, query that report
		if(pageNum) 
			var archiveUrl = "http://marsweather.ingenology.com/v1/archive/?page=" + pageNum + "&format=jsonp";
		// otherwise request the latest 10 reports
		else 
			var archiveUrl = "http://marsweather.ingenology.com/v1/archive/?format=jsonp";
		
		
		
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
				
				// get the data attribute that currently has the active btn state,
				// use swtich statement to pass it to the fn below
				var activeToggleButton = $('button.unit-toggle.unit-active');
				var activeToggleUnit = activeToggleButton.data("unit");
				var unitToChart;
				
				if(activeToggleUnit === "fahrenheit")
					unitToChart = "f";
				else
					unitToChart = "c";
				
				drawChart(unitToChart); // draw chart in the right unit
				
				// add chart label and input control
				$('#graph-ui').show();
				
			}
		}); // end AJAX
		
		
		
		
		
		// on success fill the last 10 temperature data reports into arrays
		// that will be used for charting
		function getDataSet (data) {
			
	
			
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
				
				//change chart to celsius values
				drawChart("c");
				
				// load celsius data
				maxTempContainer.text(maxTemp).append('<sup>&deg;</sup>');
				minTempContainer.text(minTemp).append('<sup>&deg;</sup>');
				
				// change unit in heading
				unitSymbol.text('( C )').append('<sup>&deg;</sup>');
				
				// add active class and remove the other button's
				button.addClass('unit-active').siblings('button').removeClass('unit-active');
			
			} else {
				
				//chart temperatures in fahrenheit
				drawChart("f");
				
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
				
				$("#time-traveler").on("input", function() {
					
					var value = this.value;
					var page = value / 10;

					// clear the arrays before loading them with new archive data
					celsiusTemperatureArchive.length = 0; 
					fahrenheitTemperatureArchive.length = 0;
					
					loadArchive(page);
					
				});



})(jQuery); // end module






/*=======================================
*	D3.js Visualitzation Code
*=======================================*/
// TODO: CHART 2 GRAPHS
// 1 FOR MIN TEMPS
// 1 FOR MAX TEMPS


function drawChart(tempUnit) {
	
	// clean the node before appending SVG
	document.getElementById("temp-graph").innerHTML = "";
	
	
	// choose data set according to temperature Unit passed
	switch( tempUnit) {
		case "f":
			var data = fahrenheitTemperatureArchive;
			break;
		
		case "c":
			var data = celsiusTemperatureArchive;
	
	}
	

	
	// svg element dimensions
	var margin = {top: 30, right: 20, bottom: 30, left: 50},
			width = 600 - margin.left - margin.right,
			height = 270 - margin.top - margin.bottom;


	// Parse the date / time
	var parseDate = d3.time.format("%d-%b-%y").parse;

	// Set the ranges
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);



	// Define the axes
	var xAxis = d3.svg.axis().scale(x)
			.orient("bottom").ticks(5);

	var yAxis = d3.svg.axis().scale(y)
			.orient("left").ticks(5);



	// Adds the svg canvas
	var svg = d3.select("#temp-graph")
			.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
			.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	


	// iterate over data and transform date strings to date objects	to enable computations			 
	data.forEach(function(d) {
	
			d.date = new Date(d.date);
		 	//d.date = parseDate(d.date);

	});


	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([d3.min(data, function(d){ return d.min_temp;}), d3.max(data, function(d){ return d.max_temp;})]);

	
	
	// Define min tempthe line
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



	
	
