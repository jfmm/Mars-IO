// API DATA Global Variables
var jsonReportLatest,
    sol,
    solarLongitue,
    updatedOn,
    sol, // a sol is a martian day
    minTemp,
    maxTemp,
    minTempF,
    maxTempF,
    pressure,
    monthNumber,
    sunrise,
    sunset,
    condition;


// D3.js data set global vars
var celsiusTemperatureArchive = [];
var fahrenheitTemperatureArchive = [];
var archivePage;
var archivePageKey;


// Orbit and time calculation global variables AND CONSTANTS
var SOL_CURIOSITY_LANDED = 319; // this is a constant value
var MARS_YEAR_LENGTH = 668.6 // this is also a constant
var solsSinceCuriosityLanded;
var currentSol; //current day number out of the 668.6 days




(function($) {

    'use strict';

    // DOM NODE CACHING
    var maxTempContainer = $('.temp-max > span');
    var minTempContainer = $('.temp-min > span');
    var updateInfo = $('.update-info');


    // load latest data on load
    $('document').ready(getLatestMarsWeather);



    function getLatestMarsWeather() {

        var latestReportUrl = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp';


        function getData(data) {

            jsonReportLatest = data.report;
            updatedOn = data.report.terrestrial_date;
            sol = data.report.sol;
            solarLongitue = data.report.ls;
            minTemp = data.report.min_temp; // in celsius
            maxTemp = data.report.max_temp; // in celsius
            minTempF = data.report.min_temp_fahrenheit;
            maxTempF = data.report.max_temp_fahrenheit; // Set non-null value if API returns null
            condition = data.report.atmo_opacity; // always sunny, apparently...



            // cache latest report in local storage
            window.sessionStorage.setItem("latestReport", JSON.stringify(data));



        }



        function outputData() {

            //update information
            var today = new Date();
            var diff = Math.abs(today - new Date(updatedOn)); // compute last update time in miliseconds
            var days = Math.floor(diff / 86400000); // convert to days

            //these computations are for sol module
            solsSinceCuriosityLanded = sol + days; // this offsets the latency of data received by adding the days since we last got data
            currentSol = solsSinceCuriosityLanded + SOL_CURIOSITY_LANDED - MARS_YEAR_LENGTH; // get the current day of mars
            var earthYears = ((solsSinceCuriosityLanded + (solsSinceCuriosityLanded * 0.040)) / 365).toFixed(1); // computes how many Earth years since rover landed
            var marsYears = (solsSinceCuriosityLanded / MARS_YEAR_LENGTH).toFixed(1); // computes how many Martian years since rover landed


            //Create "days since update" message
            switch (days) {

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

            // append orbital data to orbit module
            $('.sol-total').text(solsSinceCuriosityLanded);
            $('.year-count').text(earthYears + " Earth Years - " + marsYears + " Mars Years");
            $('.ls-num').text(solarLongitue).append('<sup>&deg;</sup>');
            $('.sol-num').text(Math.round(currentSol)); // round it for simplicity
            $('.mars-month').text(computeMonthNumber(currentSol));
            $('.earth-month').text(computeEarthMonth(daysSinceJanFirst));

            // output season data
            $('.mars-season').text(computeSeason(currentSol));
            $('#orbit-traveler').val(currentSol); // sets value of slider to current sol number

        }




        // Request Latest data from API only once per session
        if (sessionStorage.latestReport == null) {


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
                complete: function() {
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


    function loadArchive(pageNum) {

            // get the data attribute that currently has the active btn state,
            // use swtich statement to pass it to the fn below
            var activeToggleButton = $('button.unit-toggle.unit-active');
            var activeToggleUnit = activeToggleButton.data("unit");
            var unitToChart;


            if (activeToggleUnit === "fahrenheit")
                unitToChart = "f";
            else
                unitToChart = "c";


            // if a page number is given, query that report's page
            if (pageNum) {
                archivePage = pageNum.toString();
                var archiveUrl = "http://marsweather.ingenology.com/v1/archive/?page=" + pageNum + "&format=jsonp";
            } // otherwise request the latest 10 reports
            else {
                archivePage = "1"; // first archive page is 1
                var archiveUrl = "http://marsweather.ingenology.com/v1/archive/?format=jsonp";
            }

            // create a key for session retrieval
            archivePageKey = archivePage + unitToChart;



            // if the data is not in the session storage, fetch it
            if (window.sessionStorage.getItem(archivePageKey) == null) {

                console.log("loading archive " + archivePage + " from API...");

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
                    complete: function() {

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
            function getDataSet(data) {

                    console.log("JSONP REQUEST COMPLETE");

                    $.each(data.results, function(index, value) {


                        var celsiusTemps = {
                            date: value.terrestrial_date,
                            min_temp: value.min_temp,
                            max_temp: value.max_temp
                        };

                        var fahrenheitTemps = {
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

                } // end getDataSet



        } // end load archive;



    // load the last ten reports on page load
    loadArchive();



    /*==================================== 
		jQuery UI Code
	================================**/




    /* Temperature values TOGGLE
	===============================**/

    // Temp Unit Toggling
    $('.unit-toggle').on('click', function(e) {

        var unitSymbol = $('.unit-symbol');
        var button = $(this);
				var unit = button.data("unit");


        if (unit === 'celsius') {


            // check if the archive page key is defined. 
            // If it is draw that chart from session storage data
            if (archivePageKey)
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

            if (archivePageKey)
                drawChart("f", true, archivePage + "f");
            else
                drawChart("f"); //chart temperatures in fahrenheit

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


        var page = this.value / 10;

        // clear the arrays before loading them with new archive data
        celsiusTemperatureArchive.length = 0;
        fahrenheitTemperatureArchive.length = 0;

        loadArchive(page);

    });







})(jQuery); // end JQUERY module






/*=======================================
 *	D3.js Visualitzation Code
 *=======================================*/
function drawChart(tempUnit, loadCached, archiveKey) {

    // clean the node before appending SVG
    document.getElementById("temp-graph").innerHTML = "";


    // are we loading cached data. If so use it
    if (loadCached) {
        var data = JSON.parse(sessionStorage.getItem(archiveKey));
    } else {
        // else use the right array
        switch (tempUnit) {
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
    var margin = {
            top: 30,
            right: 20,
            bottom: 30,
            left: 50
        },
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
        .append("div") // declare the tooltip div 
        .attr("class", "tooltip") // apply the 'tooltip' class
        .style("opacity", 0);

    // Adds the svg canvas
    var svg = d3.select("#temp-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
				.attr("viewBox", "0,0,600,270")
				.attr("preserveAspectRatio", "xMidYMid")
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

    if (yearRange[0] === yearRange[1])
        d3.select("#year-range").text(yearRange[0]);
    else
        d3.select("#year-range").text(yearRange[0] + "-" + yearRange[1]);



    // Scale the range of the data
    x.domain(d3.extent(data, function(d) {
        return d.date;
    }));
    y.domain([d3.min(data, function(d) {
        return d.min_temp;
    }), d3.max(data, function(d) {
        return d.max_temp;
    })]);



    // Define min temp line
    var minTempLine = d3.svg.line()
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.min_temp);
        });

    // define the max temp line
    var maxTempLine = d3.svg.line()
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.max_temp);
        });



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
        .attr("cx", function(d) {
            return x(d.date);
        })
        .attr("cy", function(d) {
            return y(d.min_temp);
        })
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
        .on("mouseout", function(d) {
            div.style("opacity", 0);
        });


    // draw the max temp dots	+ tooltips
    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "max-temp-chart-circle")
        .attr("r", 5)
        .attr("cx", function(d) {
            return x(d.date);
        })
        .attr("cy", function(d) {
            return y(d.max_temp);
        })
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
        .on("mouseout", function(d) {
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




/*------------------------------------------
 *	ORBIT VIZUALIZATION CODE
 *-------------------------------------------*/



var earthOrbitPosition,
    marsOrbitPosition,
    day,
    radii,
    now,
    currentEarthYear = new Date().getFullYear(),

		daysSinceJanFirst = d3.time.days(new Date(currentEarthYear + "-01-01T00:00:00.000Z"), new Date()).length;



console.log(daysSinceJanFirst);
function drawSpaceTime() {

    now = new Date(d3.time.year.floor(new Date()));

    var spacetime = d3.select('#spacetime-wrap');
    var width = 500,
        height = 500,
        radius = Math.min(width, height);

    radii = {
        "sun": radius / 8,
        "earthOrbit": radius / 3.3,
        "earth": radius / 32,
        "marsOrbit": radius / 2.2,
        "mars": radius / 48
    };

    // Space
    var svg = spacetime.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "spacetime")
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Sun
    svg.append("circle")
        .attr("class", "sun")
        .attr("r", radii.sun)
        .style("fill", "rgba(255, 204, 0, 1.0)");

    // Earth's orbit
    svg.append("circle")
        .attr("class", "earthOrbit")
        .attr("r", radii.earthOrbit)
        .style("fill", "none")
        .style("stroke", "rgba(195, 212, 237, 0.22)");

    // Current position of Earth in its orbit
    earthOrbitPosition = d3.svg.arc()
        .outerRadius(radii.earthOrbit + 1)
        .innerRadius(radii.earthOrbit - 1)
        .startAngle(0)
        .endAngle(0);
    svg.append("path")
        .attr("class", "earthOrbitPosition")
        .attr("d", earthOrbitPosition)
        .style("fill", "rgb(30, 151, 239)");

    // Earth
    svg.append("circle")
        .attr("class", "earth")
        .attr("r", radii.earth)
        .attr("transform", "translate(0," + -radii.earthOrbit + ")")
        .style("fill", "rgba(113, 170, 255, 1.0)");

    // Time of day
    day = d3.svg.arc()
        .outerRadius(radii.earth)
        .innerRadius(0)
        .startAngle(0)
        .endAngle(0);
    svg.append("path")
        .attr("class", "day")
        .attr("d", day)
        .attr("transform", "translate(0," + -radii.earthOrbit + ")")
        .style("fill", "rgba(53, 110, 195, 1.0)");



    // Mar's orbit
    svg.append("circle")
        .attr("class", "marsOrbit")
        .attr("r", radii.marsOrbit)
        .style("fill", "none")
        .style("stroke", "rgba(237, 108, 39, 0.25)");

    // Current position of the Mars in its orbit
    marsOrbitPosition = d3.svg.arc()
        .outerRadius(radii.marsOrbit + 1)
        .innerRadius(radii.marsOrbit - 1)
        .startAngle(0)
        .endAngle(0);
    svg.append("path")
        .attr("class", "marsOrbitPosition")
        .attr("d", marsOrbitPosition)
        .style("fill", "rgba(255, 37, 37, 0.75)");

    // Mars
    svg.append("circle")
        .attr("class", "mars")
        .attr("r", radii.mars)
        .attr("transform", "translate(0," + -radii.marsOrbit + ")")
        .style("fill", "#E95124");



}


/* Calculate Position and Animate Planet and Orbits
====================================================*/
function movePlanets(sol) {

    // if a particular sol is passed in by the slider
    if (sol) {

        var duration = 0; // animate without delays


        // use output value of slider to adjust the position of the planets
        var interpolateEarthOrbitPosition = d3.interpolate(earthOrbitPosition.endAngle()(), (2 * Math.PI * (sol / 365)));
        var interpolateMarsOrbitPosition = d3.interpolate(marsOrbitPosition.endAngle()(), (2 * Math.PI * (sol / MARS_YEAR_LENGTH)));

    } else { // else we use the position of the planets in current time

        var duration = 800; // ease-in to position

        var interpolateEarthOrbitPosition = d3.interpolate(earthOrbitPosition.endAngle()(), (2 * Math.PI * (daysSinceJanFirst / 365)));

        var interpolateMarsOrbitPosition = d3.interpolate(marsOrbitPosition.endAngle()(), (2 * Math.PI * (currentSol / MARS_YEAR_LENGTH))); // find the ratio between current day and year
    }




    /* Animate the planets to their current poisition in space time*/
    d3.transition().duration(duration).tween("orbit", function() {
        return function(t) {

            // Animate Earth orbit position
            d3.select(".earthOrbitPosition").attr("d", earthOrbitPosition.endAngle(interpolateEarthOrbitPosition(t)));

            // Transition Earth
            d3.select(".earth").attr("transform", "translate(" + radii.earthOrbit * Math.sin(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + "," + -radii.earthOrbit * Math.cos(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + ")");



            // Animate Mars Orbit Position
            d3.select(".marsOrbitPosition").attr("d", marsOrbitPosition.endAngle(interpolateMarsOrbitPosition(t)));

            // transition Mars
            d3.select('.mars').attr("transform", "translate(" + radii.marsOrbit * Math.sin(interpolateMarsOrbitPosition(t) - marsOrbitPosition.startAngle()()) + "," + -radii.marsOrbit * Math.cos(interpolateMarsOrbitPosition(t) - marsOrbitPosition.startAngle()()) + ")");



        };
    });


}

drawSpaceTime();






/* =============================================
 * Mars-IO: User Interface Event handler Code
 * jQuery Module
 * =============================================*/


(function($) {

    var orbitLegend = $('.orbit-legend'),
        orbitSlider = $('#orbit-traveler'),
        solNum = $('.sol-num'),
        marsSeason = $('.mars-season'),
        marsMonth = $('.mars-month'),
        solTotal = $('.sol-total'),
        earthMonth = $('.earth-month'),
        day;


    /* Event Handlers for Orbit Module Slider
    ============================================*/
    orbitSlider.on("input", function() {

        var sol = this.value;


        // reset month count after first earth complete year
        if (sol <= 365)
            day = sol;
        else
            day = sol - 365;




        // move the planets to the specified sol position
        movePlanets(sol);

        // change sol# as input slides
        orbitLegend.text("Sol# " + sol);
        solNum.text(sol);

        //change season as input slides
        marsSeason.text(computeSeason(sol));
        marsMonth.text(computeMonthNumber(sol));

        // change earth month as input slides
        earthMonth.text(computeEarthMonth(day));



    });



    /* Event Handlers for Orbit Module Buttons
	============================================*/

    $('#reset').on('click', function() {
        movePlanets(1);
        orbitLegend.text("Planets at position 0");
        orbitSlider.val(0);
        solNum.text(0);
        marsMonth.text(computeMonthNumber(0));
        marsSeason.text(computeSeason(1));
        earthMonth.text(computeEarthMonth(1));

    });

    $('#current').on('click', rightNow);

    function rightNow() {
        movePlanets(); // move planet to current time
        orbitLegend.text("Current Orbit Position in Time"); // change legend
        orbitSlider.val(Math.round(currentSol)); // set slider back to current time
        solNum.text(Math.round(currentSol)); // change sol num
        marsMonth.text(computeMonthNumber(currentSol)); //update month
        marsSeason.text(computeSeason(currentSol));
        earthMonth.text(computeEarthMonth(daysSinceJanFirst));
    }



    /* Event Handlers for sidebar Navigation
	============================================*/

    var activeLink = $("li[class='active']");
    var sidebarlink = $(".sidebar-nav-icons > li");


    sidebarlink.on('click', function() {
        var clickedButton = $(this);
        var mod = clickedButton.data("module");

        switch (mod) {
            case "sol":
                // show orbit module
                $('#sol-module').addClass("selected").siblings().removeClass("selected");
                // animate planets to current time
                setTimeout(rightNow, 900);
                break;

            case "temp":
                // show temp module
                $('#temp-module').addClass("selected").siblings().removeClass("selected");
                break;
            case "about":
                // show about module
                $('#about-module').addClass("selected").siblings().removeClass("selected");
                break;
        }


        // toggle button styles
        if (clickedButton.hasClass('active')) {
            return false;
        } else {
            clickedButton.siblings('li').removeClass('active');
            clickedButton.addClass('active');
        }

    });
    

})(jQuery);








/* ===================================================================================================
 * Mars-IO: Utility Functions for Dynamic Computations
 * Martian Month Range values provided by http://www-mars.lmd.jussieu.fr/mars/time/solar_longitude.html
 * ==================================================================================================*/


function computeSeason(currentSol) {

    var season;

    if (currentSol >= 0 && currentSol <= 193.3)
        season = "Spring in N. Hemisphere - Dust Storm Season Ends";

    else if (currentSol > 193.3 && currentSol <= 371.9)
        season = "Summer in N. Hemisphere";

    else if (currentSol > 371.9 && currentSol <= 514.6)
        season = "Autumn in N. Hemisphere - Dust Storm Season";

    else if (currentSol > 514.6 && currentSol <= MARS_YEAR_LENGTH)
        season = "Winter in N. Hemisphere - Dust Storm Season";


    return season;

}


function computeMonthNumber(currentSol) {

    var month;

    if (currentSol >= 1 && currentSol <= 61.2)
        month = "1";

    else if (currentSol > 61.2 && currentSol <= 126.6)
        month = "2";

    else if (currentSol > 126.6 && currentSol <= 193.3)
        month = "3";

    else if (currentSol > 193.3 && currentSol <= 257.8)
        month = "4";

    else if (currentSol > 257.8 && currentSol <= 317.5)
        month = "5";

    else if (currentSol > 317.5 && currentSol <= 371.9)
        month = "6";

    else if (currentSol > 371.9 && currentSol <= 421.6)
        month = "7";

    else if (currentSol > 421.6 && currentSol <= 468.5)
        month = "8";

    else if (currentSol > 468.5 && currentSol <= 514.6)
        month = "9";

    else if (currentSol > 514.6 && currentSol <= 562.0)
        month = "10";

    else if (currentSol > 562.0 && currentSol <= 612.9)
        month = "11";

    else if (currentSol > 612.9 && currentSol <= MARS_YEAR_LENGTH)
        month = "12";


    return month;

}




// return the amount of days a particular month has in a particular year
function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}


//populate an array of number of days elapsed with each month
// to be used as the ranges when computing the Earth Months dynamically
var dayRange = [];
var prevMonthLenth = 0;

for (var i = 1; i <= 12; i++) {

    // get the number of days for the month number passed in
    var monthLen = daysInMonth(i, currentEarthYear);

    // add the previouse month num of days to the current month in the lop
    dayRange.push(monthLen + prevMonthLenth);

    // update variable with the sum of the last sum
    prevMonthLenth += monthLen;

}



// Compute earth month days dynamically

function computeEarthMonth(day) {

    var month;

    if (day >= 1 && day <= dayRange[0])
        month = "1";

    else if (day > dayRange[0] && day <= dayRange[1])
        month = "2";

    else if (day > dayRange[1] && day <= dayRange[2])
        month = "3";

    else if (day > dayRange[2] && day <= dayRange[3])
        month = "4";

    else if (day > dayRange[3] && day <= dayRange[4])
        month = "5";

    else if (day > dayRange[4] && day <= dayRange[5])
        month = "6";

    else if (day > dayRange[5] && day <= dayRange[6])
        month = "7";

    else if (day > dayRange[6] && day <= dayRange[7])
        month = "8";

    else if (day > dayRange[7] && day <= dayRange[8])
        month = "9";

    else if (day > dayRange[8] && day <= dayRange[9])
        month = "10";

    else if (day > dayRange[9] && day <= dayRange[10])
        month = "11";

    else if (day > dayRange[10] && day <= dayRange[11])
        month = "12";

    return month;

}



