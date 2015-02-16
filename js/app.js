(function ($) {

	'use strict';
	
	function loadMarsWeather() {
	
		var latestReportUrl = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp';
		
		
		function outputData(data) {
			
			var sol = data.report.sol;
			var minTemp = data.report.min_temp;
			var condition = data.report.atmo_opacity;
			
			$('body').append("It's currently sol " + sol + " in mars. There's a min of " + minTemp + " and the planet is " + condition);

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
	
	
	
	
	loadMarsWeather();

})(jQuery);