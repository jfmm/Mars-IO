// API DATA Global Variables
var jsonReport, updatedOn, sol, minTemp, maxTemp, minTempF, maxTempF, condition; 




(function ($) {

	'use strict';
	
	// DOM NODE CACHING
	var maxTempContainer = $('.temp-max > span');
	var minTempContainer = $('.temp-min > span');
	var updateInfo = $('.update-info');
	
	

	
	
	
	// load latest data on load
	$('document').ready(loadMarsWeather);
	
	
	
	
	function loadMarsWeather() {
	
		var latestReportUrl = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp';
		
		
		function outputData(data) {
			
			jsonReport = data.report;
			updatedOn = data.report.terrestrial_date;
			sol = data.report.sol;
			minTemp = data.report.min_temp; // in celsius
			maxTemp = data.report.max_temp; // in celsius
			minTempF = data.report.min_temp_fahrenheit;
			maxTempF = data.report.max_temp_fahrenheit;
			condition = data.report.atmo_opacity; // always sunny, apparently...
			
		//	console.log(jsonReport);
			
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
	
	
	
	/* User Interface code
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
var dataset = [
	{"date":"2012-03-20","total":3},
	{"date":"2012-03-21","total":8},
	{"date":"2012-03-22","total":-42},
	{"date":"2012-03-23","total":-3},
	{"date":"2012-03-24","total":3},
	{"date":"2012-03-25","total":20},
	{"date":"2012-03-26","total":12}
];

// svg element dimensions
var w = 500,
		h = 300;

 //create svg element
var svg = d3.select("#temp-graph").append("svg").attr("width", w).attr("height", h);


var circles = svg.selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
		.style("fill", "#E95124");


 circles.attr("cx", function(d, i) {
            return (i * 50) + 25;
        })
       .attr("cy", h/2)
       .attr("r", function(d) {
            return d.total;
       });

