// **************************************************
// Global variables
// **************************************************
var world;

// **************************************************
// Loading functions
// **************************************************

// --------------------------------------------------
// Universal things we'll always want loaded

var svg = d3.select("#canvas"),
	globe = svg.selectAll(".country"),
	sens = .25,
	circle, 
	zoomed = false,
	timer_on = false;
	
// Get width and height of container	
width = window.innerWidth;													
height = window.innerHeight;

var startScale = width;

svg
.attr("width", width)
.attr("height", height)

// Set up globe projection
var projection = d3.geo.orthographic()
    .scale(startScale)
    .translate([width / 2, height / 2])
	.rotate([0,30])
    .clipAngle(90)
    .precision(.1);
	
// Make path object to generate paths using the projection
var path = d3.geo.path()
    .projection(projection);

	
d3.json("world.json", function(error, result) {													
	world = result;
	
	// add background circle for aesthetics
	circle = svg.append("circle")
		.attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale())
		.attr("fill", "lightblue")
		.attr("filter", "url(#glow)")
		.attr("fill", "url(#gradBlue)");
	
	// Generate globe	
	countries = topojson.feature(world, world.objects.countries).features;						
	globe = globe.data(countries)
		.enter()
			.append("path")
			.attr("d", path)
			.attr("class", "country")
			.attr("id", function(d){ return d.properties.id })
			.on("click", panTo)
			.on("mouseover", function(){
				d3.select(this).moveToFront();
			});

	// Now bind events to the globe
	
	// On drag (currently attached to SVG, might want to change this)
	svg.call(d3.behavior.drag()
		// Set the origin to the current rotation point, divided by sensitivity
		.origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
		.on("drag", function() {
			timer_on = true;
			var rotate = projection.rotate();
			coord = [d3.event.x, d3.event.y];
			// This keeps map from being turned upside down.
			if (coord[1] > projection.scale() / 2) coord[1] = projection.scale() / 2; else if(coord[1] < -projection.scale() / 2 ) coord[1] = -projection.scale() / 2;
			projection.rotate([coord[0] * sens, -coord[1] * sens, rotate[2]]);
			globe.attr("d", path);
		})
	);
	
	//loadStory(); //** use this for development so don't have to wait for other things to happen - can just get to story
	//loadComments(); //** use this for development so don't have to wait for other things to happen - can just get to comments
	
	// Start the intro ** use this for final **
	loadIntro(function(){
		d3.select("body")
			.transition().duration(2000)
			.style("opacity",1);
	});
	
});

// End universal loading section
// --------------------------------------------------

	
// --------------------------------------------------
// Load intro 

function loadIntro(callback){
	moveAndZoom(width * 7 / 8, 2 * height + height * .6, 2 * height, 1);		
	// Start the globe's auto-rotate
	var rotate = projection.rotate();
    velocity = [.01, 0],
    time = Date.now();

	
	d3.timer(function(){
		var dt = Date.now() - time;
		projection.rotate([rotate[0] + velocity[0] * dt, rotate[1]]);
		globe.attr("d", path);
		return timer_on;
	});

	$("#begin").click(function(){ 
		loadBrowse(function(){
			
		});
	});
	
	if(typeof callback === 'function') callback();
	
}

// End load intro
// --------------------------------------------------


// --------------------------------------------------
// Load browse

function loadBrowse(callback) {
	// turn off rotation (if it's even activated to begin with)
	timer_on = true;																			
	newZoom = 100;																				
	sens = 1;	// makes it easier to rotate smaller globe																		

	moveAndZoom(width / 2, height / 2, height / 2 * .8, 1000, function(){
		panTo(d3.select("#USA").datum(), 500);
	});
	
	$(".intro").fadeOut(1000); 
	
	d3.select("h1#title")
		.transition().duration(1000)
		.style({"margin-top":"25px", "font-size":"65px", "padding-left":"10px"});
	
	var navBar = d3.select(".navbar")
	
	navBar.selectAll("div")
		.data(world.objects.countries.geometries).enter()
	.append("div")
		.attr("class","nav")
		.attr("country", function(d){ return d.properties.id })
		.attr("id", function(d){ return "nav_" + d.properties.id })
		.html(function(d){ return d.properties.name })
		.on("mouseover", function(){
			target = d3.select( "#" + d3.select(this).attr("country") );
			panTo( target.datum() , 1000);
			target.classed("hover", true);
			target.moveToFront();
		})
		.on("mouseout", function(){
			d3.select( "#" + d3.select(this).attr("country") ).classed("hover", false);
		});
	
	navBar.on("mousewheel", function(){
		navBar.node().scrollTop += event.deltaY;
		//navBar.selectAll(".nav").style("top", parseInt(navBar.selectAll(".nav").style("top")) + event.deltaY + "px");
	});
	
	d3.selectAll(".navbarWrapper .fa")
		.on("mousedown", function(){
			navBar.node().scrollTop += parseInt(d3.select(this).attr("deltaY"));
		});
		
	d3.select(".navbarWrapper")
		.transition().duration(1000)
		.style("opacity", 1)
		.each("end", function(){
			d3.select(this).classed("out", true);
		});
	
	d3.select(".commentsWrapper")
		.transition().duration(1000)
		.style("opacity", 1);
	
	d3.selectAll(".handle")
		.on("mouseup", function(){
			d3.select(this.parentNode).classed("out",!d3.select(this.parentNode).classed("out")); 
			
		});
	
	// Scroll country list to display hovered nation. 
	d3.selectAll(".country")
		.on("mouseover", function(){
			d3.select(this).moveToFront();
			endpoint = d3.select( "#nav_" + d3.select(this).attr("id") ).node().offsetTop;
			d3.select( "#nav_" + d3.select(this).attr("id") ).classed("hover", true)
			navBar.transition()
				.duration(1000)
				.tween("scrollTop", function() {
					var r = d3.interpolate(navBar.node().scrollTop, endpoint - (height / 2) );			
					return function(t) {																
						navBar.node().scrollTop = r(t);														
					};
				});
		})
		.on("mouseout", function(){
			d3.select( "#nav_" + d3.select(this).attr("id") ).classed("hover", false);
		})
		.on("mouseup", function(){
			loadStory(this);
		})
		
		
	
	if(typeof callback === 'function') callback();
}

// End load browse
// --------------------------------------------------

// --------------------------------------------------
// Load video

function loadVideo(callback) {

	var image = d3.select(".preview");
	w1 = image.style("width");
	h1 = image.style("height");
	l1 = image.style("left");
	
	// Slide away globe and text widget
	moveAndZoom(width + newZoom, height - newZoom / 2 - 100, 100, 500);
	countryTextBox.transition()
		.duration(500)
		.attr("tranform", "translate(-500, 0)");
	
	var video = d3.select(".browse")
		.append("div")
			.attr("class", "videoHolder")
		.append("video")
			.attr("class", "fullscreen")
			.attr("src", "video/Germany_DoritBrauer.mp4")
			.style("width", w1)
			.style("height", h1)
			.style("left", l1)
			.style("opacity", 0);
	
	d3.select(".preview")
		.transition().duration(2000)
		.style("opacity",0);
			
			
	d3.select("body")
		.transition().duration(2000)
		.style("background-color", "white")
	
	video.on("ended", function(){
		if(typeof callback === 'function') callback();
	});
	
	video.transition().duration(2000)
		.style("opacity", "1")
		.each("end", function(){
			video[0][0].play();
			
		});
	
}

// End load video
// --------------------------------------------------


// --------------------------------------------------
// Load story

function loadStory(country) {
	var clickedCountry = country.id;
	// Insert content below
	$.post("php/getNations.php", function(data){ //grab data from database via php
		//console.log(data);
		var json = $.parseJSON(data); //parse the json so we can use it
		$.each(json, function(key, data) { //iterate through the json object, grabbin the index key and the data that goes with it
			//if (data.Country == 'Sweden') {//find clicked country's name in the json data pulled from the database
										   //I'll use Sweden for now until the clicking part is working
											//fill in the data from json into the html
			if (data.CountryCode == clickedCountry) {
				$('#name').html(data.Name);
				$('#country').text(data.Country);
				$('#age .personStat').text(data.Age);
				$('#origin .personStat').html(data.Origin);
				$('#pghHome .personStat').html(data.Neighborhood);
				$('#occupation .personStat').html(data.Occupation);
				if (data.Factoid.length > 0) {
					$('#factoid #factoidtext').html(data.Factoid);
					$('#factoid').show();
				} else {
					$('#factoid').hide();
				}
				$('.countryMap').attr('src','./countries/' + data.Country.toLowerCase() + '/img/' + data.Country.toLowerCase()+ '_locator.jpg');
				$('.countryMap').attr('title', 'Map of ' + data.Country);
				$('.portrait').attr('src','./countries/' + data.Country.toLowerCase() + '/img/' + data.Country.toLowerCase()+ '_portrait.jpg');
				$('.portrait').attr('title', data.Name);
				$('.text #bio').html(data.Notes);
				if (data.Heading.length > 0) {
					$('.text h1').html(data.Heading);
					$('.text h1').show();
				} else {
					$('.text h1').hide();
					$("#bio").css('margin-top', '0');
					$("#bio p:nth-child(1)").css('margin-top', '0');//close up space above top paragraph if there's no heading
				}
				if (data.Quote.length > 0) {
					$('.quote').html('"' + data.Quote + '"');
					$('.quote').show();
				} else {
					$('.quote').hide();
				}
				$("#bio p:nth-child(3)").append($('.quote'));
				//end filling data into html
				
				//put image wrappers around each image and style images and captions
				$.each($('#bio img'), function( index, value ) {
				  //console.log( index + ": " + value );
				  $(this).load(function() {
					  //alert('I loaded!');
					  var imgW = $(this).width();
					    var imgH = $(this).height();
					    var imgSrc = $(this).attr('src');
						var caption = $(this).attr('caption');
					    if (imgW > imgH) { //if it's a horizontal image
						  $( this ).wrap( "<div class='imgWrap_horizontal'></div>" );
						  //$('.imgWrap_horizontal').css('height', imgH + 'px');
						  $('.imgWrap_horizontal').append('<div class="caption">' + caption + '</div>');
						  $('.imgWrap_horizontal .caption').css('left', imgW + 20 + 'px');
					    } else { //if it's a vertical image
						  $( this ).wrap( "<div class='imgWrap_vertical'></div>" );
						 $('.imgWrap_vertical').css('width', imgW + 'px');
						 //$('.imgWrap_vertical').css('height', imgH + 'px');
						 $('.imgWrap_vertical').append('<div class="caption">' + caption + '</div>');
						 
					    }
					});
				});
				
				d3.select(".story").style("display", "block");	
				/*d3.select("body").style({
					'background-color': '#fff'
				});*/
				//center the story - margin-left = half of screen width minus half of story width
				var w = $('.story').width();
				w = w/2;
				var mL = width /2;
				var newW = mL - w;
				$('.story').css('margin-left', newW + "px"); 
				
				//position the stats in a fixed col on the left
				var storyPosition = $('.story').offset();
				var storyLeft = storyPosition.left;
				$('.story #personStats').css('left', storyLeft + 30 + "px");
				var textPosition = $('.text').position(); //note where the text div is positioned
				$('#personStats').css('top', textPosition + 'px'); //make the top of the stats align with the top of the text
				$('#personStats').fadeIn();
						
				// Slide up
				d3.select(".browse").transition().duration(2500)
					.style("margin-top", -height-15 + "px");
					//.each("end", handleStats);
				$('body').animate({'background-color': "#fff"}, 2000);
				//$('html').animate({'background-color': "#fff"}, 2000);
				
				
				$('body').css('overflow-y', 'scroll'); //put the scroll on the body, not the story
			} //end if sweden
		}); //end each
	});//end post
}
/*function handleStats() { //when the transition is done pulling up the story div and getting the browse div out of the way, then show the person's stats
						//$('#personStats').css('top', textPosition.top+ 10 + "px"); //make the top of the stats align with the top of the text
						$('body').animate({'background-color': "#fff"}, 2000);
						$('html').animate({'background-color': "#fff"}, 2000);
						var textPosition = $('.text').position(); //note where the text div is positioned
						$('#personStats').css('top', textPosition + 'px'); //make the top of the stats align with the top of the text
						$('#personStats').fadeIn();
}	*/

// End load story
// --------------------------------------------------

//if click arrow up, scroll back to browse
$('.fa-arrow-circle-up, #title').click(function(){
	$(".story").fadeOut('slow');
	// Slide up
	d3.select(".browse").transition().duration(2500)
		.style("margin-top", "0px");
		//.each("end", handleStats);
	$('body').animate({'background-color': "#000"}, 2000);
});
// --------------------------------------------------
// Load comments
function loadComments(callback) {

}

// End load comments
// --------------------------------------------------

// **************************************************
// Helper functions that get stuff done
// **************************************************

function panTo(d, duration){	
	
	duration = duration || 2000;
	
	centroid = d3.geo.centroid(d);																

	// Start transition
	d3.transition()
		.duration(duration)
		.tween("rotate", function() {																
			var r = d3.interpolate(projection.rotate(), [-centroid[0], -centroid[1]]);			
			return function(t) {																
				projection.rotate(r(t));														
				globe.attr("d", path);															
			};
		})
		.each("end", function(){ if(!zoomed) zoomed = true; });									
	
	if(typeof callback === 'function') callback();
}

function moveAndZoom(newX, newY, endZoom, duration, callback) {
	// Remove glow temporarily; it slows down transitions.
	circle.attr("filter", "");
	
	var startZoom = projection.scale();
	var oldX = projection.translate()[0];
	var oldY = projection.translate()[1];
	
	d3.transition()
		.duration(duration)
		.tween("projection", function(){ 
			var go = d3.interpolate([oldX, oldY], [newX, newY]);
			return function(t) {
				projection.translate(go(t));
				globe.attr("d", path);
				circle.attr('cx', go(t)[0])
					.attr('cy', go(t)[1])
			}
		})
		.tween("scale", function(){
			var s = d3.interpolate(startZoom, endZoom);
			return function(t) {
				projection.scale(s(t));
				globe.attr("d", path);
				circle.attr('r', projection.scale())
			}
		})
		.each("end", function(){
			circle.attr("filter", "url(#glow)");
			if(typeof callback === 'function') callback();
		});
	
} 

// Add prototype to d3 selection moving an svg to the top of the heap
// so glows will work properly
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


/*
function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}

var scale = 300; //the current scale
var w; //width of person panel
var mL; //measurement left of person panel
var countryID = new Array();
var personName = new Array();
var countryName = new Array();
var countryAbbrev = new Array();
var pop = new Array();
var gdp = new Array();
var income = new Array();
var age = new Array();
var occupation = new Array();
var neighborhood = new Array();
var fromHome = new Array();
var origin = new Array();
var video = new Array();
var personimage = new Array();
var countryimage = new Array();
var worldimage = new Array();
var image2 = new Array();
var image3 = new Array();
var image4 = new Array();
var image5 = new Array();
var image6 = new Array();
var notes = new Array();
var unrepresented = new Array();
var represented = new Array();

$(function() {
    $( document ).tooltip();
 });

$(document).ready(function(){
//center enlarge/reduce symbols
	var w = $('#bigsmall').width();
	w = w - w/2;
	$('#bigsmall').css('margin-left', '-' + w + 'px');
	
//get data
$.get("../odyssey/php/getNations.php", function(data){
		eval(data);		
		var str = "";
		var dropdownstr = "<option value=''>We are seeking people from these countries...</option>";
		for (var j=0; j< countryName.length; j++ ) {
				if (personName[j] != ' ') {
				//if we have a person in the database for that country, show the country as being clickable, else not clickable
					str += "<div id='" + countryAbbrev[j] + "' class='represented'>" + countryName[j]+ "</div>";
					represented.push(countryAbbrev[j]);
				} else {
					str += "<div id='" + countryAbbrev[j] + "' class='unrepresented'>" + countryName[j]+ "</div>";
					dropdownstr += "<option value='personIsFrom_" + countryName[j] + "'>" + countryName[j] + "</option>";
					unrepresented.push(countryAbbrev[j]);
				}
			}
			//console.log(unrepresented.length);
			//fill countries into right panel
			$('#panel').html(str);
			var h = $(window).height();
			h = .75 * h;
			if ($(window).width() > 600) {
				$('#panel').css('height', h + 'px');
			} else {
				
			}
			//fill unrepresented countries into contact us country dropdown 
			$('#tellCountry').append(dropdownstr);
			handleGlobe();
});
function handleGlobe() {
	var svg = d3.select("#canvas"),
		globe = svg.selectAll(".country"),
		sens = .25, //sensitivity
		circle, 
		zoomed = false;
		
	width = window.innerWidth;															// Get width and height of container	
	height = window.innerHeight;

	svg
		.attr("width", width)
		.attr("height", height)

	var projection = d3.geo.orthographic()															// Set up globe projection
		.scale(300)
		//.translate([width / 2, height / 2 ])
		.translate([width / 2, height /2 ])
		.rotate([0,0])
		.clipAngle(90) //throws errors in Chrome, but not fatal
		.precision(.1);
		

	var path = d3.geo.path()																		// Make path object to generate paths using the projection
		.projection(projection);

		
	d3.json("../odyssey/world.json", function(error, world) {	//world.json is already a topojson file - converted // add background circle for aesthetics
			
		circle = svg.append("circle")																// add background circle for aesthetics
			.attr('cx', width / 2)
			.attr('cy', height / 2)
			//.attr('cy', '420px')
			.attr('r', projection.scale())
			//.attr("stroke", "black")
			.attr("stroke", "#aaaaaa")
			.attr("stroke-width", "1")
			//.attr("fill", "lightblue");
			.attr("fill", "white");
		
			
		countries = topojson.feature(world, world.objects.countries).features;						// Make globe
		
		globe = globe.data(countries)
			.enter()
				.append("path")
				.attr("d", path)
				.attr("class", "country")
				.attr("id", function(d){return d.properties.id})
				.on("mouseover", pathOver)
			    .on("mouseout", pathOut)
			    .on("dblclick", zoomIn)
				.on("click", panTo);
				//.append('title').text(function(d){return d.properties.name});
		
		//panTo(svg.selectAll("#USA").datum());														// Have globe zoom to USA (this is just a test)
		
		svg.call(d3.behavior.drag()																	// On drag
			.origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })	// Set the origin to the current rotation point, divided by sensitivity
			.on("drag", function() {
				var rotate = projection.rotate();
				coord = [d3.event.x, d3.event.y];
				if (coord[1] > 300) coord[1] = 300; else if(coord[1] < -300) coord[1] = -300;		// This keeps map from being turned upside down.
				projection.rotate([coord[0] * sens, -coord[1] * sens, rotate[2]]);
				globe.attr("d", path);
			})
		)
		
		d3.select("body").on("keydown", function(e){ 												// On escape button pressed
			d3.event.preventDefault();
			//if(event.which == 27) { 
			if (d3.event.keyCode == 27) {
				zoomOut(); 
			} 
		});		
		
		//go to particular country if it's in the URL
		if(window.location.hash) {
			var thisHash = window.location.hash;
			thisHash = thisHash.substring(1, thisHash.length); //get rid of '#'
			var thisCountryonGlobe = d3.select('path#' + thisHash);
			panTo(thisCountryonGlobe.datum());
		}
		
		//make all the countries that don't have people be colored something else
		for (var a=0; a<represented.length; a++) {
			d3.select('path#' + represented[a]).style("fill", "#aaaaaa");
			//d3.select('path#' + unrepresented[a]).attr("class", "country unrepresented");
		}
		
		
	});
	
	function pathOver(d) {
		var thisID = d.properties.id;
		if (d3.select('path#' + thisID).selectAll('title').empty()) {
			d3.select('path#' +thisID).append('title').text(function(d){return d.properties.name}); //add a mouseover title showing country name
		}
		for (var a=0; a<represented.length; a++) { //if this is one of the countries with a person
			if (thisID == represented[a]) {
				d3.select('path#' +thisID).style('fill', '#777777'); //darken this country
				d3.select('path#' +thisID).style('cursor', 'pointer');//change cursor to hand
			}
		}
		
	}
	function pathOut(d) {
		d3.selectAll('path').style('fill', '#e8e8e8'); //change all colors back to default
		for (var a=0; a<represented.length; a++) {
			d3.select('path#' + represented[a]).style("fill", "#aaaaaa"); //but make sure that countries with people are a darker color
			//d3.select('path#' + unrepresented[a]).attr("class", "country unrepresented");
		}
	}
	function panTo(d){	
		//only do this whole thing IF the country has a person that goes with it 
		var thisID = d.properties.id;
		for (var a=0; a<represented.length; a++) {
		   if (represented[a] == thisID) { //only take action if the country has a person to go with it
			centroid = d3.geo.centroid(d);
			d3.select('path#' + thisID).style("fill", "#777");
			//Find center of selected country
			// Start transition
			d3.transition()
				.duration(2000)
				.tween("rotate", function() {															// Let it know we'll be transition a rotate animation
					var r = d3.interpolate(projection.rotate(), [-centroid[0], -centroid[1]]);			// Have computer calculate all rotation values from starting rotation position to finished position - both lat/lng pairs
					return function(t) {																// This tells computer what to do at every frame of tween
						projection.rotate(r(t));														// Rotate globe projection to tweened position t= timed step
						globe.attr("d", path);															// Update globe's path (actually draws new rotation to screen)
					};
				})
				setTimeout(function(){
					showPerson(d.properties.id);
				}, 2000);
		   }
		}
	}
	
	function zoomIn() {
		
		//if(!zoomed) {
				
			d3.transition()
				.duration(2000)
				.tween("scale", function(){
					//var s = d3.interpolate(0, Math.PI / 2);
					scale = scale *2;
					return function(t) {
						//projection.scale( 300 + Math.cos(s(t)) * 300 );//projection.scale s(t)
						projection.scale(scale);
						globe.attr("d", path);
						circle.attr('r', projection.scale())
					}
				});
				
			//zoomed = true;
		//}
	}

	function zoomOut()																				// The zoom-out function. Uses same logic as above. 
	{
		//if(zoomed) {
			d3.transition()
				.duration(2000)
				.tween("scale", function(){
					//var s = d3.interpolate(0, Math.PI / 2);
					scale = scale/2; 
					return function(t) {
						//projection.scale( 300 + Math.cos(s(t)) * 300 );
						projection.scale(scale);
						globe.attr("d", path);
						circle.attr('r', projection.scale())
					}
				});
				
			//zoomed = false;
		//}
	}
	$('.represented').click(function(){
			var thisCountry = $(this).attr('id');
			var thisCountryonGlobe = d3.select('path#' + thisCountry);
			panTo(thisCountryonGlobe.datum());
	});
	$('.searchsurround1').click(function(){
				zoomIn();
	});

	$('.searchsurround2').click(function(){
			zoomOut();
	});
	//start showPerson
	function showPerson(thisCountry) {
	    
		for (var i=0; i<countryAbbrev.length; i++) {
					if (thisCountry == countryAbbrev[i]) {
						
						location.hash = countryAbbrev[i];
						$('#Name').html(personName[i]);
						$('#Country').text(countryName[i]);
						$('#Age').text(age[i]);
						$('#Origin').html(origin[i]);
						$('#Neighborhood').text(neighborhood[i]);
						$('#Occupation').text(occupation[i]);
						var vidfilenoextension = video[i];
						vidfilenoextension = vidfilenoextension.substring(0, vidfilenoextension.length-12);
						$('#vidspace').css('width', '100%');
						$('#vidspace').css('height', '214px');
						$('#vidspace').css('background', 'url("./img/' + personimage[i] + '") center center no-repeat');
						$('#vidspace').html("<video id='video' width='380' height='214'><source src='./video/" + vidfilenoextension + ".mp4' type='video/mp4'><source src='./video/" + video[i] + "' type='video/webm'></video>");
						thisvid = video[i];
						if (thisvid.length > 2) {
							$('video').css('cursor', 'pointer');
						}
						
						
							var countryname = countryName[i];
							countryname = countryname.replace(" ", "+");
							if ($(window).width() > 600 ) { //show images only if screen is wide enough
								//$('#countryimage').attr('src', "http://maps.googleapis.com/maps/api/staticmap?center=" + countryname + "&size=400x400&zoom=5&sensor=false");
								$('#countryimage').attr('src', "./img/" + countryimage[i]);
								$('#countryimage').show();
								//$('#worldimage').attr('src', "http://maps.googleapis.com/maps/api/staticmap?center=" + countryname + "&size=400x400&zoom=3&sensor=false");
								//$('#worldimage').show();
							
						}
						if (notes[i] != "") {
							$('#Notes').html(notes[i]);
							$('#Notes').show();
						} 
						$('#aboutcountry h4').text(countryName[i]);
						
						$('#population').text(pop[i] + " million");
						
						if (gdp[i].length > 3) {
							str = gdp[i];
							num = parseInt(str);
							num = (num/1000).toFixed(3);
							$('#gdp').text("$" + num + " trillion");
						} else {
							$('#gdp').text("$" + gdp[i] + " billion");
						}
						
						$('#income').text(income[i]);
						if ($('#largescreen').length) {
							$('#largescreen').remove();
						}
						var content = "<video id='largescreen' fullscreen><source src='./video/" + vidfilenoextension + ".mp4' type='video/mp4'><source src='./video/" + video[i] + "' type='video/webm'></video>";
						$('#grayout').append(content);
						
						if ($.trim(image2[i]) != "") {
							$('#largeimage').html("<img src='./img/" + image2[i] + "' />");
						} 
						if ($.trim(image3[i]) != "") {
							$('#thumbs').append("<img class='thumb' src='./img/" + image3[i] + "' />")
						}
						if ($.trim(image4[i]) != "") {
							$('#thumbs').append("<img class='thumb' src='./img/" + image4[i] + "' />")
						}
						if ($.trim(image5[i]) != "") {
							$('#thumbs').append("<img class='thumb' src='./img/" + image5[i] + "' />")
						}
						if ($.trim(image6[i]) != "") {
							$('#thumbs').append("<img class='thumb' src='./img/" + image6[i] + "' />")
						}
						break;
					}
				}
				
				$('#grayout').fadeIn( function () {
					$('#grayout').css('z-index', '2');
					
						$('#largescreen').css('z-index', '999');
						$('#largescreen').fadeIn();
						$('#largescreen').get(0).play();
						$('#largescreen').bind('ended', function(){
							$('#largescreen').fadeOut();
							var screenTop = $(document).scrollTop();
							var personTop = screenTop + 10;
							$('#person_wrapper').css('top', personTop + 'px');
							$('#person_wrapper').fadeIn();
							//center person-wrapper
							w = $('#person_wrapper').width();
							winW = $(window).width();
							mL = (winW - w)/2;
							if ($(window).width() > 600) {
								$('#person_wrapper').css('margin-left', mL + "px");
								
							//bring up the page header 
							$('#social h1').css('z-index', '99');
							$('#social h1').css('color', 'gray');
							}
					});
					$('.thumb').click(function() {
						var thisSrc = $(this).attr('src'); //source of thumb they clicked
						var largeSrc = $('#largeimage img').attr('src'); //source of the large image;
						$(this).attr('src', largeSrc);
						$('#largeimage img').attr('src', thisSrc);
					});
				});
				
				
				
	}
	//end showPerson
	//when click video, start from beginning
	$('#vidspace').click(function(){
		  $('#vidspace video').get(0).pause(); 
		  $('#vidspace video').get(0).currentTime = 0; 
		 $('#vidspace video').get(0).play();
	});

}//end handleGlobe()

fillAge();
var position = $('.socialWrapper').position();
			if ($(window).width() > 600) {
				$('#credits').css('top', position.top - 200 + 'px');
			}
//when click tab on right, show countries tab
	$('#countriesTab').click(function(){
		if ($( "#countriesTab i" ).hasClass( "fa fa-angle-double-left" )) {
			$('#panel').animate({right: "0px"}, 1000);
			$('#countriesTab').animate({right: 360 + "px"}, 1000);
			$('#countriesTab i').removeClass();
			$('#countriesTab i').addClass('fa fa-angle-double-right');
		} else {
			$('#panel').animate({right: "-360px"}, 1000);
			$('#countriesTab').animate({right: "0px"}, 1000);
			$('#countriesTab i').removeClass();
			$('#countriesTab i').addClass('fa fa-angle-double-left');
		}
		
	});
	$('.close').click(function(){
		
		$( this ).parent().fadeOut();
		$('#grayout').fadeOut(function(){
			
		});

	});
	$('.closecredits').click(function(){
		
		$( this ).parent().fadeOut();

	});
	$('#credits').click(function(){
		
		$( this ).fadeOut();

	});
	$('.closeperson').click(function(){
		$( '#person_wrapper').fadeOut();
		$('#vidspace video').get(0).pause(); 
		$('#grayout').fadeOut();
		d3.selectAll('path').style('fill', '#e8e8e8'); //change all colors back to default
		for (var a=0; a<represented.length; a++) {
			d3.select('path#' + represented[a]).style("fill", "#aaaaaa"); //but make sure that countries with people are a darker color
			//d3.select('path#' + unrepresented[a]).attr("class", "country unrepresented");
		}
	});
	
	$('#request').click(function(){
		$('#fTellUs').fadeIn();
		
	});
	
	$('.social .logo').click(function() {
		window.open("http://www.post-gazette.com");
	});
	
	$('.creditClick').click(function() {
		if ($('#credits').is(":hidden")) {
			$('#credits').fadeIn();
		} else {
			$('#credits').fadeOut();
		}
	});
	function fillAge() {
	//feed integers into age dropdown - limit bad data
	var strAges = "<option value='0'>Select age</option>"; //must a give a value here or else it tries to enter "seclect age" into dB and causes crash
	for (var k=1; k<105; k++) {
		strAges += "<option value='" + k + "'>" + k + "</option>";
		//$('#tellAge').append(new Option(k, k));
	}
	$('#tellAge').append(strAges);
	}
	
	$("#tellusForm").on("submit", function() { //when they try to contact us
		
		event.preventDefault();
		var name = $("#tellName").val();
		var age = $("#tellAge").val();
		var country = $("#tellCountry").val();
		var occupation = $("#tellOccupation").val();
		var email = $("#tellEmail").val();
		var phone = $("#tellPhone").val();
		var about = $("#tellAbout").val();
		
		$.post("../php/tellus.php", {tellName:name, tellCountry: country, tellAge: age, tellOccupation: occupation, tellEmail: email, tellPhone: phone, tellAbout: about}, function(data){
				$('.form-control').css('visibility', 'hidden');
				$('.submit').css('display', 'none');
				$('#fTellUs #thank').css('display', 'block');
				setTimeout(function() {
					  $('#fTellUs').fadeOut();
				}, 500);
		});
		
		
		
	});
	
});
*/