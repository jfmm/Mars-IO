//TODO:
	//THE ARRAY OF OBJECTS IS ALL FUCKED
	// MUST DEBUG $.EACH
	// NEED A BETTER METHOD


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


var temperatureArchive = []; // graph uses this dataset


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
			*		DOM INJECTION
			*/
			
			//update
			updateInfo.text("Curiosity Sent Last Update on  " + updatedOn);
			
			// temp module
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
		
		
		console.log(archiveUrl);
		
		// on success fill the last 10 temperature data reports into an array
		function getDataSet (data) {
			
	
			
			$.each(data.results, function(index, value){
				
			

				var graphPointsMinTemp = {
					date: value.terrestrial_date,
					min_temp: value.min_temp,
					min_temp_fahrenheit: value.min_temp_fahrenheit
				};
				
//				var graphPointsMaxTemp = {
//					date: value.terrestrial_date,
//					max_temp: value.max_temp,
//					max_temp_fahrenheit: value.max_temp_fahrenheit
//				};
				
		
				//push objects to array
				//temperatureArchive.push(graphPointsMaxTemp);
				temperatureArchive.push(graphPointsMinTemp);
				
			
			});
	
		
		}// end fillDataSet
		
	
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
			complete: drawChart
		}); // end AJAX
		
		
		
	} // end load archive;
	


	loadArchive();	// execute for debugging
	
	
	
	/* Temperature UI TOGGLE
	===============================**/
	
	// Temp Unit Toggling
	$('.unit-toggle').on('click', function(e) {
		
		var unitSymbol = $('.unit-symbol');
		var unit = this.dataset.unit;
		var button = $(this);
	
			
			if(unit === 'celsius') {
				
				// load celsius data
				maxTempContainer.text(maxTemp).append('<sup>&deg;</sup>');
				minTempContainer.text(minTemp).append('<sup>&deg;</sup>');
				
				// change unit in heading
				unitSymbol.text('( C )').append('<sup>&deg;</sup>');
				
				// add active class and remove the other button's
				button.addClass('unit-active').siblings('button').removeClass('unit-active');
			
			} else {
				//load fahrenheit data
				maxTempContainer.text(maxTempF).append('<sup>&deg;</sup>');
				minTempContainer.text(minTempF).append('<sup>&deg;</sup>');	
				
				// change unit in heading
				unitSymbol.text('( F )').append('<sup>&deg;</sup>');
			
				// add active class and remove the other button's
				button.addClass('unit-active').siblings('button').removeClass('unit-active');
			
				
			}
			
				
	});
		

	


})(jQuery); // end module





/*=======================================
*	D3.js Visualitzation Code
*=======================================*/

function drawChart() {
	
	var data = temperatureArchive;
	


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
					.attr("transform", 
								"translate(" + margin.left + "," + margin.top + ")");



	// iterate over data						 
	data.forEach(function(d) {
					d.date = new Date(d.date);
					d.min_temp_fahrenheit = d.min_temp_fahrenheit;
					//console.log(d.date);
					console.log(d.min_temp_fahrenheit);
			});


	
	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([d3.min(data, function(d) { return d.min_temp_fahrenheit; }), d3.max(data, function(d) { return d.min_temp_fahrenheit; })]);

	// Define the line
	var valueline = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y(d.min_temp_fahrenheit); });


	// Add the valueline path.
	svg.append("path")
		 .attr("class", "line")
		 .attr("d", valueline(data));


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

	