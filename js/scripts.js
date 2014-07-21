// **************************************************
// Global variables
// **************************************************

var world,
	navbar,
	currentScreen,
	width,
	height,
	startscale,
	which_stage,
	timer;

// **************************************************
// Loading functions
// **************************************************

// --------------------------------------------------
// Universal things we'll always want loaded

// Hash change
window.onhashchange = function(){
	if( window.location.hash == "#browse" ){
		if (d3.select(".intro").style("display") != "none" ) { loadBrowse();}
		else returnToBrowse();
	}
}

// Window resize
window.onresize = resize;


// Jump to mobile if small enough
if( window.innerWidth < 900 ) window.location = "m/";

// temporary fix for macs
 if (navigator.platform.match(/(iPhone|iPod|iPad)/i)?true:false) window.location = "http://newsinteractive.post-gazette.com/odysseys/m";

//detect if Firefox
var FF = !(window.mozInnerScreenX == null); 

var svg = d3.select("#canvas"),
	globe = svg.selectAll(".country"),
	sens = .25,
	circle, 
	zoomed = false,
	timer_on = false;
	
resize();

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
	
	// This sorts the countries alphabetically
	world.objects.countries.geometries.sort(function(a, b){
		if(a.properties.name > b.properties.name) return 1;
		if(b.properties.name > a.properties.name) return -1;
		return 0;
	});
	
	d3.json("php/getNations.php?operation=getActiveCountries", function(error, results){
		
		// Build an associative array of countries from our database
		// to more easily match with the geometries file
		associative_results = [];
		results.forEach(function(item){
			associative_results[item.Country] = {"count": +item.Count, "active": item.Activated, "date_published": item.DatePublished};
		});
		
		
		
		// This function adds one or two properties to the geometries file, indicating
		// whether or not a) a country is involved in the project, b) we have completed
		// a story for said country and c) its publication date.
		world.objects.countries.geometries.forEach(function(country,i){
			if( typeof associative_results[country.properties.name] != "undefined") {
				// Insert publish date
				world.objects.countries.geometries[i].properties.date_published = associative_results[country.properties.name].date_published;
				
				// Mark as in the project 
				world.objects.countries.geometries[i].properties.in_project = true;
				
				// Test for activation
				if( associative_results[country.properties.name].count > 1 && associative_results[country.properties.name].active == 1 ) 
					world.objects.countries.geometries[i].properties.completed = true;
				else
					world.objects.countries.geometries[i].properties.completed = false;
			}
			else world.objects.countries.geometries[i].properties.in_project = false;
		});
	
		// add background circle for aesthetics
		circle = svg.append("circle")
			.attr('cx', width / 2)
			.attr('cy', height / 2)
			.attr('r', projection.scale())
			.attr("fill", "lightblue")
			.attr("filter", "url(#glow)")
			.attr("fill", "url(#gradBlue)")
			.on("mousemove", function(){
				d3.selectAll(".country").classed("hover", false) //have to do this for IE;
			});
		
		// Generate globe	
		countries = topojson.feature(world, world.objects.countries).features;						
		globe = globe.data(countries)
			.enter()
				.append("path")
				.attr("d", path)
				.attr("class", function(d){
					output = "country";
					if(d.properties.completed) output += " completed";
					return output;
				})
				.attr("id", function(d){ return d.properties.id })
				.attr("country", function(d){ return d.properties.name })
				.on("mouseover", function(){
					d3.select(this).moveToFront();
					//d3.selectAll(".country").classed("hover", false);
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
		
		navBar = d3.select(".navbar");
	
		var nav = navBar.selectAll("div")
			.data(world.objects.countries.geometries).enter()
		.append("div")
			.attr("class",function(d){
				output = "nav";
				if(!d.properties.in_project) output += " not_in_project";
				if(d.properties.completed) output += " completed";
				return output;
			})
			.attr("country", function(d){ return d.properties.id })
			.attr("id", function(d){ return "nav_" + d.properties.id })
			.on("mouseover", function(d){
				if(d.properties.completed) {
					target = d3.select( "#" + d3.select(this).attr("country") );
					panTo( target.datum() , 1000);
					target.moveToFront();
					target.classed("hover", true);
					if(FF) target.style("filter", "none"); // also because of dratted firefox
				}
			})
			.on("mouseout", function(){
				d3.select( "#" + d3.select(this).attr("country") ).classed("hover", false);
				
			})
			.on("click", function(d){
				if(d.properties.completed) {
					countryName = d3.select(this).html().toLowerCase();
					countryName = countryName.split(' ').join('_');
					window.location.hash = countryName;
					getReadyToLoadVideo(countryName);
				}
			});
			
		nav.append("div")
			.classed("dot", true)
			.classed("active", function(d){ 
				if( typeof d.properties.date_published != "undefined" && d.properties.date_published != "0000-00-00") {
					return (new Date() - new Date(d.properties.date_published) <= 604800000 ? true : false)
				}
				
				return false;
				
			});
		
		nav.append("span")
			.html(function(d){ return d.properties.name });
		
		
			
			
		
		navBar.on("mousewheel", function(){
			navBar.node().scrollTop += event.deltaY;
		});
		
		d3.selectAll(".navbarWrapper .fa")
			.on("mousedown", function(){
				var temp = this;
				timer = setInterval( function(){ navBar.node().scrollTop += parseInt(d3.select(temp).attr("deltaY")); },50 );
			})
			.on("mouseup", function(){
				clearInterval(timer);
			})
			.on("mouseout", function(){
				clearInterval(timer);
			});
			
		d3.selectAll(".handle")
			.on("click", function(){
				d3.select(this.parentNode).classed("out",!d3.select(this.parentNode).classed("out")); 
				
			});
		var countrytoLoad = getUrlParameter('country');
		
		if ((window.location.hash == '') && (countrytoLoad === undefined)){ //there's no hash variable or url variable
			
		// Start the intro ** use this for final **
				loadIntro(function(){//so load the intro
					d3.select(".loader")
						.classed("hidden",true);
					d3.select(".content")
						.classed("hidden",false);
				});
			} 
		if (countrytoLoad !== undefined) {//there is a url variable, so grab the url variable and redirect to the hash url
				window.location.replace('http://newsinteractive.post-gazette.com/odysseys#' + countrytoLoad);
		}
		
		if (window.location.hash != '') { //there is a hash variable, so grab the country in the hash and load that country
			var countryname = window.location.hash;
			countryname = countryname.substring(1, countryname.length);
			enterViaHash(countryname);
		}
		
	});
	
	
	
	$("#creditslink").click(function(){ 
		if ($('#creditsbarWrap').is(":visible")) {
			$('#creditsbarWrap').fadeOut();
			$('#creditslink').css('color', '#b8b8b8');
			$('.fa-twitter-square').css('border-color', '#b8b8b8');
			if ($('#commentsWrapper').hasClass('out')) {
				$('#pglogo').attr('src','img/PGwhite.png');
			} else {
				$('#pglogo').attr('src','img/PGblack.png');
			}
			if (($('#personStats').is(':visible'))) {
				$('#pglogo').attr('src','img/PGwhite.png');
			}
			if ($('.videoHolder').length) { //if the video is present
			$('#pglogo').attr('src','img/PGwhite.png');
			}
		} else {
			$('#creditsbarWrap').fadeIn();
			$('#creditslink').css('color', '#333');
			$('.fa-twitter-square').css('border-color', '#333');
			$('#pglogo').attr('src','img/PGwhite.png');
		}
		
		
	});
	
	$("#creditsbarWrap").click(function(){ 
		var video = $('video');
		var videoElement = video.get(0);
		
		$('#creditsbarWrap').fadeOut();
		$('#creditslink').css('color', '#b8b8b8');
		$('.fa-twitter-square').css('border-color', '#b8b8b8');
		if ($('#commentsWrapper').hasClass('out')) {
			$('#pglogo').attr('src','img/PGwhite.png');
		} else {
			$('#pglogo').attr('src','img/PGblack.png');
		}
		if (($('#personStats').is(':visible'))) {
			$('#pglogo').attr('src','img/PGwhite.png');
		}
		if ($('.videoHolder').length) { //if the video is present
			$('#pglogo').attr('src','img/PGwhite.png');
		}
	});
	
	$("h1#title").click(function(){ 
		window.location.hash = "browse";
	});

	
	
});

// End universal loading section
// --------------------------------------------------

// --------------------------------------------------
// Load if entering via hash 
function enterViaHash(countryname, callback){
	
	d3.select("h1#title")
		.style({"margin-top":"25px", "font-size":"65px", "padding-left":"10px","position":"fixed", "top":"0px"})
	
	
	var commentBar = d3.select(".commentsWrapper");
	commentBar.style("left", function(){
		return -parseInt(commentBar.node().offsetWidth) + "px"; //add 10 so border shows
	});
	
	
	d3.select(".navbarWrapper")
		.classed("hidden", false)
		.classed("out", true); 
	
	d3.select("#credits")
		.classed("hidden", false);
	
	d3.select(".commentsWrapper")
		.style("opacity", 1);
			
	d3.select(".loader")
		.classed("hidden", true);
	
	d3.select(".content")
		.classed("hidden", false);
	
	if( countryname == "browse" ) {
		loadBrowse();
	}
	else {
	
		$.getJSON("php/getNations.php?operation=getSingleCountry&country=" + countryname.split('_').join(' '), function(data){ //grab data from database via php
			
			if( data != "") data = data[0];
			
			// Change metadata so Facebook/Twitter links refer to this page
			d3.select("head").selectAll("meta.meta_replace").remove();
			// Facebook title
			d3.select("head").append("meta")
				.attr("class", "meta_replace")
				.attr("property", "og:title")
				.attr("content", "Odysseys: " + data.Name + "'s story, from " + data.Country + " to Pittsburgh.");			
			// Facebook description
			d3.select("head").append("meta")
				.attr("class", "meta_replace")
				.attr("property", "og:description")
				.attr("content", data.Name + " left " + data.Country + " and moved to Pittsburgh. This is what happened next. (Part of the Pittsburgh Post-Gazette's \"Odysseys\" project, sharing stories of immigrants to Pittsburgh.");
			// Facebook image
			d3.select("head").append("meta")
				.attr("class", "meta_replace")
				.attr("property", "og:image")
				.attr("content", './countries/' + data.Country.toLowerCase().to_underscore() + '/img/' + data.Country.toLowerCase().to_underscore() + '_portrait.jpg');
			// Facebook url
			d3.select("head").append("meta")
				.attr("class", "meta_replace")
				.attr("property", "og:url")
				.attr("content", 'http://newsinteractive.post-gazette.com/odysseys/countries/' + data.Country.toLowerCase().to_underscore());
			// Twitter title
			d3.select("head").append("meta")
				.attr("class", "meta_replace")
				.attr("property", "twitter:title")
				.attr("content", "Odysseys: " + data.Name + "'s story, from " + data.Country + " to Pittsburgh.");
			// Twitter description
			d3.select("head").append("meta")
				.attr("class", "meta_replace")
				.attr("property", "twitter:description")
				.attr("content", data.Name + " left " + data.Country + " and moved to Pittsburgh. This is what happened next.");
			// Twitter image
			d3.select("head").append("meta")
				.attr("class", "meta_replace")
				.attr("property", "twitter:image")
				.attr("content", 'http://newsinteractive.post-gazette.com/odysseys/countries/' + data.Country.toLowerCase().to_underscore() + '/img/' + data.Country.toLowerCase().to_underscore() + '_portrait.jpg');
			
			//Send all this to Facebook
			//d3.xhr("http://graph.facebook.com/v2.0/").post({id: "http://newsinteractive.post-gazette.com/odysseys/countries/#" + data.Country.toLowerCase().to_underscore(), scrape:"true" });
				
	
			moveAndZoom(width / 2, height / 2, height / 2 * .8, 1, function(){
				panTo(d3.select("#USA").datum(), 500);
				d3.select(".intro").style("display","none");
			
				
				
				getReadyToLoadVideo(countryname);	
				if(typeof callback === 'function') callback();
			});
		
		});
	}
	
	
}
// End if entering via hash 
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
		window.location.hash = "browse";
	});
	
	if(typeof callback === 'function') callback();
	
}

// End load intro
// --------------------------------------------------

// --------------------------------------------------
// Load browse

function loadBrowse(callback) {

	$('#credits').animate({'left': "18px"}, 1000);
	
	// turn off rotation (if it's even activated to begin with)
	timer_on = true;																			
	newZoom = 100;																				
	sens = 1;	// makes it easier to rotate smaller globe			

	// Scroll country list to display proper nation when hover on globe. 
	d3.selectAll(".country")
		.on("mouseover", function(d){
			if(d.properties.completed) {
				d3.select(this).moveToFront();
				d3.selectAll(".country.hover").classed("hover", false); // I have to do this because of dratted IE
				d3.select(this).classed("hover", true); // I have to do it this way because of dratted firefox
				if(FF) d3.select(this).style("filter", "none"); // also because of dratted firefox
				
				endpoint = d3.select( "#nav_" + d3.select(this).attr("id") ).node().offsetTop;
				d3.selectAll( ".nav" ).classed("hover", false); // I have to do this because of dratted IE
				d3.select( "#nav_" + d3.select(this).attr("id") ).classed("hover", true);
				 
				navBar.transition()
					.duration(1000)
					.tween("scrollTop", function() {
						var r = d3.interpolate(navBar.node().scrollTop, endpoint - (height / 2) );			
						return function(t) {																
							navBar.node().scrollTop = r(t);														
						};
					});
			}
		})
		.on("mouseout", function(){
			d3.select( "#nav_" + d3.select(this).attr("id") ).classed("hover", false);
			d3.select(this).classed("hover", false);
		})
		.on("click", function(d){
			if(d.properties.completed) {
				countryName = d3.select(this).attr("country").toLowerCase();
				countryName = countryName.split(' ').join('_');
				window.location.hash = countryName;
				if( !d3.select("body").classed("white") ) getReadyToLoadVideo(countryName)
			}
		});	
		
	// Make sure clicking on the circle doesn't do anything
	circle.on("click", function(){
		
	});
	
	moveAndZoom(width / 2, height / 2, height / 2 * .8, 500, function(){
		panTo(d3.select("#USA").datum(), 250);
	});
	
	$(".intro").fadeOut(500); 

	d3.select("body").classed("white", false);
	
	d3.select("h1#title")
		.transition().duration(500)
		.style({"margin-top":"25px", "font-size":"65px", "padding-left":"10px"})
		.each("end", function(){ d3.select(this).style({"position":"fixed", "top":"0px"}) });
	
	var commentBar = d3.select(".commentsWrapper");
	commentBar.style("left", function(){
		return -parseInt(commentBar.node().offsetWidth) + "px"; //add 10 so border shows
	});
	
	d3.select(".navbarWrapper")
		.classed("hidden", false);
	setTimeout(function(){ d3.select(".navbarWrapper").classed("out", true); }, 1000);
	
	d3.select("#credits")
		.classed("hidden", false);
	
	d3.select(".commentsWrapper")
		.transition().duration(1000)
		.style("opacity", 1);
	
	if(typeof callback === 'function') callback();
}

// End load browse
// --------------------------------------------------

// --------------------------------------------------
// Get ready to load video from browse page
function getReadyToLoadVideo(countryName) {
			loadVideo(countryName, function(){
				// Fade out when video done and load story
				d3.select(".videoHolder").transition().duration(500)
					.style("opacity", "0")
					.each("end", function(){
						d3.select(".videoHolder").remove();
						loadStory(countryName);
						
					});
				
			});	
}
			
// End getting ready to load video from browse page
// --------------------------------------------------

// --------------------------------------------------
// Load video

function loadVideo(countryName, callback) {
	//make pg logo turn black if background is white
	$('#pglogo').attr('src', 'img/PGwhite.png');
	d3.select(".navbarWrapper").classed("out", false);
	d3.select(".navbarWrapper").classed("hidden", true);
	d3.select("body").classed("white", true);
	d3.select(".content").classed("white", true);
	
	$('body').css('overflow-y', 'hidden'); //disable scrolling
	
	// Slide away globe and text widget
	moveAndZoom(width - 120, height - 100, 75, 500, function(){
		circle.attr("fill", "white")
			.attr("stroke", "lightgray")
			.attr("filter", "none");
		d3.selectAll(".country").classed("small", true);
	});
	
	//push little globe and title to top so they stay visible
	$('svg').css({
		'position': 'relative',
		'z-index': '99'
	});
	$('h1#title').css({
		'z-index': '99'
	});
	
	d3.select("body").transition()
		.duration(500)
		.style("background-color", "white");
		
	//put vidholder and video on the page
	var video = d3.select(".content")
		.insert("div", ".story")
			.attr("class", "videoHolder")
		.append("video")
			.style("opacity", "0")
			.attr("class", "fullscreen");
			
		
		if(FF) { //if firefox, use webm
			d3.select("video")
			.append("source")
				.attr("src", "countries/" + countryName + "/vid/" + countryName + "_portrait.webm") //older versions of Firefox need webm
				.attr("type", "video/webm");
		} else { //else use mp4
			d3.select("video")
			.append("source")
				.attr("src", "countries/" + countryName + "/vid/" + countryName + "_portrait.mp4") //other browsers can use mp4 
				.attr("type", "video/mp4");
		}
		
		//add "Back to story" button
		$('.content').prepend("<div tip='Return to story' class='arrowdown' id='arrowdown'><i class='fa fa-arrow-circle-o-down fa-2x vidclose'></i></div>");
		
		d3.select("video").on("canplay", function(){
				centerVideo();
				
				video.transition().duration(1000)
					.style("opacity", "1")
					.each("end", function(){
						video.on("ended", function(){
							if(typeof callback === 'function') callback();
						});
					});
			});
		
		video.node().play();
	$('.vidclose').click(function(){ //if click video close
				 vidClose(countryName);
	});
	
	$(document).keyup(function(e) {
	  if (e.keyCode == 27) { 
		vidClose(countryName);
	  }   // esc
	});
	
	globe.on("click", function(){		
		$('video').stop(); // stop video
	
		d3.select(".videoHolder").transition().duration(1000)
			.style("opacity", "0")
			.each("end", function(){
				d3.select(".videoHolder").remove();
				window.location.hash = "browse";
			});
	});

}

// End load video
// --------------------------------------------------


// --------------------------------------------------
// Load story

function loadStory(country, callback) {
	d3.select("#arrowdown").remove();
	d3.select(".videoHolder").remove();
	
	
	//calculate width of story text so that personStats gets placed correctly
	var storyWidth = width/2 -196;
	$('.story .text').css('width', storyWidth + 'px');
	
	
	
	// Insert content below
	$.getJSON("php/getNations.php?operation=getSingleCountry&country=" + country.split('_').join(' '), function(data){ //grab data from database via php
		
		if( data != "") data = data[0];
		
		
		var commentBar = d3.select(".commentsWrapper"); //reposition commentBar so border doesn't get cut off
		/*commentBar.style("left", function(){
			return -parseInt(commentBar.node().offsetWidth-10) + "px"; //add 10 so border shows
		});
		*/
		//remove positioning of svg so that story shows up
		$('svg').css({
				'position': '',
				'z-index': ''
			});
		$('.story').css('display', 'block'); //not showing in IE
		
		// Fill out biographical information
		$('#name').html(data.Name);
		$('#country').text(data.Country);
		$('#age .personStat').text(data.Age);
		$('#origin .personStat').html(data.Origin);
		$('#pghHome .personStat').html(data.Neighborhood);
		$('#occupation .personStat').html(data.Occupation);
		
		// Drop in biographical photos
		$('.countryMap').attr('src','./countries/' + data.Country.toLowerCase().to_underscore() + '/img/' + data.Country.toLowerCase().to_underscore() + '_map.jpg');
		$('.countryMap').attr('title', 'Map of ' + data.Country);
		$('.portrait').attr('src','./countries/' + data.Country.toLowerCase().to_underscore() + '/img/' + data.Country.toLowerCase().to_underscore() + '_portrait.jpg');
		$('.portrait').attr('title', data.Name);
		
		// Show headline if there is one; hide it otherwise.
		$('.text #bio').html(data.Notes);
		if (data.Heading.length > 0) {
			$('.text h1').html(data.Heading);
			$('.text h1').show();
		} else {
			$('.text h1').hide();
			$("#bio").css('margin-top', '0');
			$("#bio p:nth-child(1)").css('margin-top', '0');//close up space above top paragraph if there's no heading
		}
		
		//calculate height of story videos; the width is 100%
		var iframeHeight = storyWidth * 315 / 560;
		$('iframe').css('height', iframeHeight + 'px');
		
		//put image wrappers around each image and style images and captions
		$.each($('#bio img'), function( index, value ) {
			$(this).load(function() {
				//alert('I loaded!');
					var imgW = $(this).width();
					var imgH = $(this).height();
					var imgSrc = $(this).attr('src');
					var caption = $(this).attr('caption');
					if (imgW > imgH) { //if it's a horizontal image
						$( this ).wrap( "<div class='imgWrap_horizontal'></div>" );
						$(this).parent().append('<div class="caption">' + caption + '</div>');
						
						
					} else { //if it's a vertical image
						$( this ).wrap( "<div class='imgWrap_vertical'></div>" );
						
						
						$(this).parent().append('<div class="caption">' + caption + '</div>');
					}
					$( this ).fadeIn();
			});
		});
			
		// Center story
		$('.story').css('margin-left', ( $(window).width() - $(".story").width() ) / 2 ); 
		
		//position the stats in a fixed col on the left
		var storyPosition = $('.story').offset();
		var storyLeft = storyPosition.left;
		//$('.story #personStats').css('left', storyLeft + 30 + "px");
		var textPosition = $('.text').position(); //note where the text div is positioned
		$('#personStats').css('top', textPosition + 'px'); //make the top of the stats align with the top of the text
		var statsHeight = $('#personStats').height();
		var statsWidth = $('#personStats').width();
		var bioLeft = $('#bio').position();
		bioLeft = bioLeft.left;
		if ($(window).height() * .9 < statsHeight) { //if the window is too short to show the whole stats column, then make the stats column scrollable with the body
			$('#personStats').css('position', 'absolute');
			var storytextMargLeft = $('.story .text').css('margin-left');
			storytextMargLeft = storytextMargLeft.substring(0, storytextMargLeft.length-2);
			var statsLeft = (storytextMargLeft - $('#personStats').width())/2;
			$('#personStats').css('left', statsLeft + 'px');
			
			var textTop = $('.story .text').offset().top;
			
			$('#personStats').css('top', textTop + 'px');
		} 
		
		
		
		//append sigil to end of story
		$('.text #bio p:last').append("<div class = 'sigil'><i class='fa fa-globe'></i></div>");
		
		//append Facebook comments
		var bioW = $('.text #bio p').width();
		var data_href = "http://newsinteractive.post-gazette.com/odysseys/#" + data.Country.toLowerCase().to_underscore();
		
		
			//$('.text').append("<div class='fb-comments' id='countrycomments' data-href='" + data_href + "' data-width='" + bioW + "' data-numposts='25' data-colorscheme='light'></div>");
			$('#storycomments').html("<div class='fb-comments' id='countrycomments' data-href='" + data_href + "' data-width='" + bioW + "' data-numposts='25' data-colorscheme='light'></div>");
			FB.XFBML.parse();
		
		
		
		$('body').css('overflow-y', 'scroll'); //put the scroll on the body, not the story		
		
		//show bio
		d3.select(".story").style("display", "block");
		d3.select(".story, .story .text, .story #personStats").transition().duration(500)
			.style('opacity', '1'); //make story visible
		
		//$('.imgWrap_vertical img, .imgWrap_horizontal img, #bio img').fadeIn();
		$('#personStats').fadeIn();
		$('.story').css('opacity', '1');
		//position portrait overlay
		var portraitP = $('.portrait').position();
		var pW = $('.portrait').width();
		var pH = $('.portrait').height();
		var playHW = $('.fa-play-circle').width();
		$('#replayIcon').css({
			'left' : 100-(.5*playHW),
			'top'  : 75-(.5*playHW)
			
		});
		
		//if in bio page and click arrow up, scroll back to browse
		$('.fa-arrow-circle-o-up').click(function(){
			if( d3.select("body").classed("white") ) {
				window.location.hash = 'browse';
			}
		});
		
		$('#replayside').click(function(){ //if click video replay
			
			$('#personStats, .story .text').css({
				'opacity': '0',
				'z-index': '1'
			});
			$('.commentsHandle').hide();
			d3.select(".videoHolder").remove();
			var countryName = data.Country;
			countryName = countryName.toLowerCase();
			countryName = countryName.split(' ').join('_');//put underscores between words
			
			//disable scrolling
			$('body').css('overflow-y', 'hidden'); 
			
			//push little globe to top so visible
			$('svg').css({
				'position': 'relative',
				'z-index': '99'
			});
			
			$('.content').prepend("<div tip='Return to story' class='arrowdown' id='arrowdown'><i class='fa fa-arrow-circle-o-down fa-2x vidclose'></i></div>");
			
			var video = d3.select(".content")
			.insert("div", ".story")
				.attr("class", "videoHolder")
			.append("video")
				.style("opacity", "0")
				.attr("class", "fullscreen")
				.attr("controls", true);
				//.style("width", width)
				//.style("height", height);
				
			if(FF) {
				d3.select("video")
				.append("source")
					.attr("src", "countries/" + countryName + "/vid/" + countryName + "_portrait.webm") //older versions of Firefox need webm
					.attr("type", "video/webm");
			} else { 
				d3.select("video")
				.append("source")
					.attr("src", "countries/" + countryName + "/vid/" + countryName + "_portrait.mp4") //other browsers can use mp4 
					.attr("type", "video/mp4");
			}
			d3.select("body").transition()
			.duration(500)
			.style("background-color", "white");
			
			d3.select("video").on("canplay", function(){
				//console.log(video.node().networkState);
				//console.log("canplaythrough");
				centerVideo();
				
				video.transition().duration(1000)
					.style("opacity", "1")
					.each("end", function(){
						video.on("ended", function(){
							if(typeof callback === 'function') callback();
						});
					});
			});
		
		video.node().play();
			
			globe.on("click", function(){		
				clickGlobeOnBioPage();
			});
			
			$('.vidclose').click(function(){ //if click video close
				 vidClose(countryName);
			});
			
			$(document).keyup(function(e) {
			  if (e.keyCode == 27) { 
				vidClose(countryName);
			  }   // esc
			});
			
			
		});
		
		
		$('#facebookside').click(function(){
			var facebook_url = 'http://www.facebook.com/sharer.php?'+ 'u='+encodeURIComponent('http://newsinteractive.post-gazette.com/odysseys#' + data.Country.toLowerCase())+ '&amp;t='+encodeURIComponent('Odysseys:' + data.Country.toLowerCase());
			window.open(facebook_url, '_blank');
		});
		
		$('#twitterside').click(function(){
			var url = "https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Fnewsinteractive.post-gazette.com%2Fodysseys?country=" + data.Country.toLowerCase() + "%2F&text=Odysseys: From all over the world, people have come to Pittsburgh. (via @PittsburghPG):&:tw_p=tweetbutton&url=http://newsinteractive.post-gazette.com/odysseys?country=" + data.Country.toLowerCase();
			window.open(url, '_blank');
		});
		
		$('#comments').click(function(){
			//loadComments();
			var point = $('.sigil'); //this marks the end of the story
			$('html, body').animate({scrollTop: point.offset().top},'slow');
			 
		});
		
		$('#shareside').click(function(){
			 $('#copylinkbox').show();
			 $('#copyfield').val(document.URL);
			 $('#copyfield').focus();
			 $('#copyfield').select();
			 
			 $('#closesharelink').click(function(){
				$('#copylinkbox').fadeOut();
			});
		});
		
		
		//if in bio page and click globe, scroll back to browse
		globe.on("click", function(){
			clickGlobeOnBioPage();
		});
		
		circle.on("click", function(){
			clickGlobeOnBioPage();
		});
		
		// Putting this in a function just to keep DRY (don't repeat yourself) alive
		function clickGlobeOnBioPage() {
			$('video').stop(); // stop video
			$('#arrowdown').fadeOut('fast');
			d3.select(".videoHolder").transition().duration(1000)
				.style("opacity", 1)
				.each("end", function(){
					setTimeout(function() {
						d3.select(".videoHolder").remove();
						//loadStory(countryName);
					}, 300);
				});
			window.location.hash = "browse";
		}
		if(typeof callback === 'function') callback();
		
	});//end getJSON
}
// End load story
// --------------------------------------------------

// --------------------------------------------------
// Return from story/video to browse
function returnToBrowse(callback) {
	//Turn off video
	d3.select(".videoHolder").remove();
	
	$('body').css('overflow-y', 'hidden'); //hide scroll 
	$('#pglogo').css('visibility', 'hidden');
	$('svg').css({
		'position': 'relative',
		'z-index': '1'
	});
		
	d3.select(".story").transition().duration(250)
			.style('opacity', '0')
				.each("end", function(){
				d3.select(".story").style({"margin-top":"0px", "display":"none"});
				d3.select("body").transition()
					.duration(250)
					.style("background-color", "black")
					.each("end", function(){
						circle.attr("filter", "url(#glow)")
							.attr("fill", "url(#gradBlue)")
							.attr("stroke", "none");
						d3.selectAll(".country").classed("small", false);
						$('#pglogo').attr('src', 'img/PGblack.png'); //turn pg logo back to white to contrast with dark bg
						$('#pglogo').css('visibility', 'visible');
						loadBrowse();
					});
			});		
}

// End return form story/video to browse
// --------------------------------------------------

function vidClose(countryName) {
	$('video').get(0).pause(); //if they click it in the middle of the video, we need to stop the video 
				 d3.select(".videoHolder").remove();
				 $('body').css('overflow-y','scroll'); //put back the scroll
				$('.vidclose').remove();
				$('.commentsHandle').show();
				$( "#personStats, .story .text" ).animate({ //fade in the bio
					'opacity': 1,
					'z-index': '5'
				  }, 500);
				
				//push little globe back to original DOM order so that story can be seen
				$('svg').css({
					'position': '',
					'z-index': ''
				});
				loadStory(countryName);
}

// --------------------------------------------------
// Load comments
$('.commentsHandle').click(function(){
	if ($('.commentsWrapper').css('left') != '0px') {
		loadComments();
	} else {
		unloadComments();
	}
	
});

function loadComments(callback) {
	
	//$('h1#title').hide();
	$('#countryTab').removeClass("out");
	
	$('body').append("<div id='commentsBg'></div>"); //insert dimmer
	$("#commentsBg").css("opacity"); // hacky solution to make browser recognize initial state of new element
	$('#commentsBg').css('opacity', ".5"); //fade in the dimmer
	
	//size the width of the part of the page containing the tell us form
	var leftColWidth = $('.commentsWrapper').width() - $(".comments").outerWidth() - parseInt($(".comments").css("margin-left")) - parseInt($(".commentsLeft").css("padding-left")) - parseInt($(".commentsLeft").css("padding-right")); //minus the width of the comments, minus the padding on comments, minus the left margin, minus the padding on commentsLeft
	$('.commentsLeft').css('width', leftColWidth + 'px');
	$(window).resize(myResizeFunction).trigger('resize');
	
	//resize textarea for story
	var titleHeight = $('.commentsLeft h1').height();
	var chatterHeight = $('.formChatter').height();
	//console.log("titleHeight: " +  titleHeight );
	//console.log("chatterHeight: " + chatterHeight );
	//console.log('height of page: ' + height);
	var remainingForForm = height - 20 - titleHeight - chatterHeight; //150 is for the credits; 20 is the top padding
	
	
	$('#formStory, #blinking_caret').click(function(){
		$('#blinking_caret').stop( true, true ).fadeOut(0);
	});
	
	//make first and last name fields half of one row
	var rowW = $('.row').width();
	$('#first, #last').css('width', rowW/2 - 10);
	
	
	//give the button some space to the left by shortening the row that the contact textfield is in
	var buttonW = $('#tellus_submit').width();
	var contactrowW = $('#contactrow').width();
	var newcontactrowW = contactrowW - buttonW - 60;
	$('#contactrow').css('width', newcontactrowW + 'px');
	
	$('#neighborhood, #countryofOrigin').attr('maxlength', '60'); //make sure neighborhood doesn't go off the screen
	
	
	
	$('.commentsWrapper').animate({'left': "0"}, 1000); 
	
	var rowHeight = $('#contactrow').height() + 10;
	//console.log('row height: ' + rowHeight);
	//console.log("remainingForForm: " + remainingForForm);
	var allRows = rowHeight * 4 + 10; //10 is for the border at the bottom of the form
	//console.log("allRows: " + allRows);
	var forText = remainingForForm - allRows - 100; //100 for padding
	//console.log("forText: " + forText);
	$('#formStory').css('height', forText + 'px');
	
	//autocomplete
	var options, a;
	jQuery(function(){
		options = { serviceUrl:'php/getCountries.php' };
		a = $('#countryofOrigin').autocomplete(options);
	}); 
	$("#tellus_submit").click(function(){ 
		var first = $("#first").val();
		var last = $("#last").val();
		var contact = $("#contact").val();
		var country = $("#countryofOrigin").val();
		var neighborhood = $("#neighborhood").val();
		var about = $("#formStory").val();
		$.post("php/tellus.php", { first: first, last: last, contact: contact, country: country, neighborhood: neighborhood, about: about },
		   function(data) {
			 $('#commentsForm').fadeOut();
			 $('.formChatter').append('<p id="thanks">Thank you.</p>');
			 $('#thanks').fadeIn();
		});
	});
	
}

function myResizeFunction() {
  leftColWidth = $('.commentsWrapper').width() - $(".comments").outerWidth() - parseInt($(".comments").css("margin-left")) - parseInt($(".commentsLeft").css("padding-left")) - parseInt($(".commentsLeft").css("padding-right")); //minus the width of the commetns, minus the padding on comments, minus the left margin, minus the padding on commentsLeft
	$('.commentsLeft').css('width', leftColWidth + 'px');
}

function unloadComments(callback) {
	$('#commentsBg').css('opacity',0);
	$('#countryTab').addClass("out");
	$("#commentsBg").remove();
	$('.commentsWrapper').animate({'left': $(".commentsWrapper").outerWidth() * -1	}, 1000, function(){
		$('h1#title').delay(500).show();
	});
	if ($('.videoHolder').is(":visible")) {
		$('#pglogo').attr('src', 'img/PGwhite.png');
	} else if ($('#personStats').is(":visible")){
		$('#pglogo').attr('src', 'img/PGwhite.png');
	} else {
		$('#pglogo').attr('src', 'img/PGblack.png');
	}
	
}
// End load comments
// --------------------------------------------------

// **************************************************
// Helper functions that get stuff done
// **************************************************


//function to get url variable
function getUrlParameter(sParam)
{
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++)
	{
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam)
		{
			return sParameterName[1];
		}
	}
}

function resize(){
	// Get width and height of container	
	width = window.innerWidth;													
	height = window.innerHeight;
	
	startScale = width;
	
	svg.attr("width", width)
		.attr("height", height);

}

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
	circle.attr("filter", "none");
	
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

// Center portrait video dynamically
function centerVideo(){
	//center video using vidholder class so that IE won't have black bars to the right and left of the video
	var newleft = ($(window).width() - $('video').width()) / 2;
	$('.fullscreen').css('margin-left', newleft + 'px');
	
}

// Add ability to convert spaces to underscores to String prototype
String.prototype.to_underscore = function() {
	return this.split(' ').join('_');
}

// Add prototype to d3 selection moving an svg to the top of the heap
// so glows will work properly
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};