// **************************************************
// Global variables
// **************************************************
var world,
	currentScreen,
	width,
	height,
	startscale,
	which_stage;

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
	
	d3.json("php/getNations.php?operation=getActiveCountries", function(error, results){
		//console.log(results);
		// Build an associative array of countries from our database
		// to more easily match with the geometries file
		associative_results = [];
		results.forEach(function(item){
			associative_results[item.Country] = +item.Count;
		});
		
		// This function adds one or two properties to the geometries file, indicating
		// whether or not a) a country is involved in the project or b) we have completed
		// a story for said country. 
		world.objects.countries.geometries.forEach(function(country,i){
			if( typeof associative_results[country.properties.name] != "undefined") {
				world.objects.countries.geometries[i].properties.in_project = true;
				if( associative_results[country.properties.name] > 1 ) 
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
			.attr("fill", "url(#gradBlue)");
		
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
		
		var navBar = d3.select(".navbar");
	
		navBar.selectAll("div")
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
			.html(function(d){ return d.properties.name })
			.on("mouseover", function(d){
				if(d.properties.completed) {
					target = d3.select( "#" + d3.select(this).attr("country") );
					panTo( target.datum() , 1000);
					target.classed("hover", true);
					target.moveToFront();
				}
			})
			.on("mouseout", function(){
				d3.select( "#" + d3.select(this).attr("country") ).classed("hover", false);
			})
			.on("click", function(d){
				if(d.properties.completed) {
					countryName = d3.select(this).html().toLowerCase();
					if (countryName == 'bosnia and herzegovina') { countryName = 'bosnia';}
					window.location.hash = countryName;
					getReadyToLoadVideo(countryName)
				}
			});
		
		navBar.on("mousewheel", function(){
			navBar.node().scrollTop += event.deltaY;
		});
		
		d3.selectAll(".navbarWrapper .fa")
			.on("click", function(){
				navBar.node().scrollTop += parseInt(d3.select(this).attr("deltaY"));
			});
			
		// Scroll country list to display hovered nation. 
		d3.selectAll(".country")
			.on("mouseover", function(d){
				if(d.properties.completed) {
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
				}
			})
			.on("mouseout", function(){
				d3.select( "#nav_" + d3.select(this).attr("id") ).classed("hover", false);
			})
			.on("click", function(d){
				if(d.properties.completed) {
					countryName = d3.select(this).attr("country").toLowerCase();
					window.location.hash = countryName;
					if( !d3.select("body").classed("white") ) getReadyToLoadVideo(countryName)
				}
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
		if (($('video').length) && (!$("video").get(0).paused)){ //if there is a video on the page and it is playing, then stop the video
			$('video').stop();
		}
		d3.select(".videoHolder").transition().duration(1000)
					.style("opacity", 1)
					.each("end", function(){
						setTimeout(function() {
							  d3.select(".videoHolder").remove();
							//loadStory(countryName);
						}, 300);
					});
		window.location.hash = '';
		returnToBrowse();
	});
	
	/*$("[title]").tooltip({
         // tweak the position
          position: "center left",
		  effect: 'fade',
		  fadeInSpeed: 300,
          // make fadeOutSpeed similar to the browser's default
          fadeOutSpeed: 300,
		  offset: [22, 40]
         
      });*/
});

// End universal loading section
// --------------------------------------------------
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
// --------------------------------------------------
// Load if entering via hash 
function enterViaHash(countryname, callback){

	moveAndZoom(width / 2, height / 2, height / 2 * .8, 1, function(){
		panTo(d3.select("#USA").datum(), 500);
		d3.select(".intro").style("display","none");
	
		d3.select("h1#title")
			.style({"margin-top":"25px", "font-size":"65px", "padding-left":"10px","position":"fixed", "top":"0px"})
		
		var commentBar = d3.select(".commentsWrapper");
		commentBar.style("left", function(){
			return -parseInt(commentBar.node().offsetWidth-10) + "px"; //add 10 so border shows
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
		
		getReadyToLoadVideo(countryname);	
	});
	
	
		
	if(typeof callback === 'function') callback();
	
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
	$('#credits').animate({'left': "18px"}, 1000);
	
	// turn off rotation (if it's even activated to begin with)
	timer_on = true;																			
	newZoom = 100;																				
	sens = 1;	// makes it easier to rotate smaller globe																		

	moveAndZoom(width / 2, height / 2, height / 2 * .8, 1000, function(){
		panTo(d3.select("#USA").datum(), 500);
	});
	
	$(".intro").fadeOut(1000); 

	d3.select("body").classed("white", false);
	
	d3.select("h1#title")
		.transition().duration(1000)
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
			//window.location.hash = countryName; //put countryname in url
			loadVideo(countryName, function(){
				// Fade out when video done and load story
				d3.select(".videoHolder").transition().duration(1000)
					.style("opacity", "0")
					.each("end", function(){
						setTimeout(function() {
							  d3.select(".videoHolder").remove();
							loadStory(countryName);
						}, 300);
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
	
	
	// Slide away globe and text widget
	moveAndZoom(width - 120, height - 100, 75, 1000, function(){
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
	//put vidholder and video on the page
	var video = d3.select(".content")
		.insert("div", ".story")
			.attr("class", "videoHolder")
		.append("video")
			.style("opacity", "0")
			.attr("class", "fullscreen")
			.style("width", width)
			.style("height", height);
		
		var FF = !(window.mozInnerScreenX == null); //detect if Firefox
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
	
	//center video using vidholder class so that IE won't have black bars to the right and left of the video
	//var width = $(window).width();
	var vidwidth = $('video').width();
	var newleft = (width - vidwidth) / 2;
	$('.fullscreen').css('left', newleft + 'px');
	
	d3.select("body").transition()
		.duration(500)
		.style("background-color", "white")
		.each("end", function(){
			video.node().play();
			video.transition().duration(1000)
				.style("opacity", "1")
				.each("end", function(){
					video.on("ended", function(){
						if(typeof callback === 'function') callback();
					});
				});
			});
	
	globe.on("click", function(){
		
		if (!$("video").get(0).paused) { //if video is playing, then stop the video
			$('video').stop();
		}
		d3.select(".videoHolder").transition().duration(1000)
					.style("opacity", "1")
					.each("end", function(){
						setTimeout(function() {
							  d3.select(".videoHolder").remove();
							//loadStory(countryName);
						}, 300);
					});
		returnToBrowse();
	});
	
}

// End load video
// --------------------------------------------------


// --------------------------------------------------
// Load story

function loadStory(country, callback) {
	// Insert content below
	$.getJSON("php/getNations.php?operation=getSingleCountry&country=" + country, function(data){ //grab data from database via php
		var commentBar = d3.select(".commentsWrapper"); //reposition commentBar so border doesn't get cut off
		commentBar.style("left", function(){
			return -parseInt(commentBar.node().offsetWidth-10) + "px"; //add 10 so border shows
		});
		//remove positioning of svg so that story shows up
		$('svg').css({
				'position': '',
				'z-index': ''
			});
		$('.story').css('display', 'block'); //not showing in IE
		if( data != "") data = data[0];
		
		$('#name').html(data.Name);
		$('#country').text(data.Country);
		$('#age .personStat').text(data.Age);
		$('#origin .personStat').html(data.Origin);
		$('#pghHome .personStat').html(data.Neighborhood);
		$('#occupation .personStat').html(data.Occupation);
		
		$('.countryMap').attr('src','./countries/' + data.Country.toLowerCase() + '/img/' + data.Country.toLowerCase()+ '_map.jpg');
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
		
		//put image wrappers around each image and style images and captions
		$.each($('#bio img'), function( index, value ) {
			//console.log( index + ": " + value );
			$(this).load(function() {
				//alert('I loaded!');
					var imgW = $(this).width();
					var imgH = $(this).height();
					//console.log("w: " + imgW + " " + "h: " + imgH);
					var imgSrc = $(this).attr('src');
					var caption = $(this).attr('caption');
					if (imgW > imgH) { //if it's a horizontal image
						$( this ).wrap( "<div class='imgWrap_horizontal'></div>" );
						$(this).parent().append('<div class="caption">' + caption + '</div>');
						//imgW = $('#bio').width() * .66;
						//$(this).parent().children('.caption').css('left', imgW + 20);
						
					} else { //if it's a vertical image
						$( this ).wrap( "<div class='imgWrap_vertical'></div>" );
						/*imgW = width / 2 -196;
						$('.imgWrap_vertical').css({
						'width': imgW + 'px',
						'height': 'auto'
						});*/
						
						$(this).parent().append('<div class="caption">' + caption + '</div>');
					}
			});
		});
			
		d3.select(".story").style("display", "block");	
		
		$('.story').css('margin-left', ( $(window).width() - $(".story").width() ) / 2 ); 
		
		//position the stats in a fixed col on the left
		var storyPosition = $('.story').offset();
		var storyLeft = storyPosition.left;
		$('.story #personStats').css('left', storyLeft + 30 + "px");
		var textPosition = $('.text').position(); //note where the text div is positioned
		$('#personStats').css('top', textPosition + 'px'); //make the top of the stats align with the top of the text
		var statsHeight = $('#personStats').height();
		var statsWidth = $('#personStats').width();
		var bioLeft = $('#bio').position();
		bioLeft = bioLeft.left;
		if ($(window).height() < statsHeight) { //if the window is too short to show the whole stats column, then make the stats column scrollable with the body
			$('#personStats').css('position', 'absolute');
			var storytextMargLeft = $('.story .text').css('margin-left');
			storytextMargLeft = storytextMargLeft.substring(0, storytextMargLeft.length-2);
			var statsLeft = (storytextMargLeft - $('#personStats').width())/2;
			$('#personStats').css('left', statsLeft + 'px');
			var textTop = $('.text').offset().top - $(window).scrollTop();
			$('#personStats').css('top', textTop + 'px');
		} 
		
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
		
		//append sigil to end of story
		$("<div align='center'><i class='sigil fa fa-globe'></i></div>").insertAfter('.text #bio p:last');
		//$('.text #bio p:last').after("<p align='center'><i class='sigil fa fa-globe'></i></p>")
		
		$('body').css('overflow-y', 'scroll'); //put the scroll on the body, not the story		
		
		//if in bio page and click arrow up, scroll back to browse
		$('.fa-arrow-circle-o-up').click(function(){
			if( d3.select("body").classed("white") ) {
				window.location.hash = '';
				returnToBrowse();
			}
		});
		
		$('#replayside').click(function(){ //if click video replay
			$('#personStats, .story .text').css({
				'opacity': '0',
				'z-index': '1'
			});
			$('.commentsHandle').hide();
			var countryName = data.Country;
			countryName = countryName.toLowerCase();
			
			//push little globe to top so visible
			$('svg').css({
				'position': 'relative',
				'z-index': '99'
			});
			
			//$('.content').prepend("<div id='arrowdown' title='Return to globe'><i class='fa fa-arrow-circle-down fa-2x vidclose'></i></div><div class='videoHolder'><video class='fullscreen' width='" + width + "' height='" + height + "' controls></video>");
			$('.content').prepend("<div id='arrowdown' title='Return to globe'><i class='fa fa-arrow-circle-down fa-2x vidclose'></i></div>");
			
			var video = d3.select(".content")
			.insert("div", ".story")
				.attr("class", "videoHolder")
			.append("video")
				.style("opacity", "0")
				.attr("class", "fullscreen")
				.attr("controls", true)
				.style("width", width)
				.style("height", height);
			
			var FF = !(window.mozInnerScreenX == null); //detect if Firefox
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
			//center video in a way that IE likes
			var vidwidth = $('video').width();
			var newleft = (width - vidwidth) / 2;
			$('.fullscreen').css('left', newleft + 'px');
			
			d3.select("body").transition()
			.duration(500)
			.style("background-color", "white")
			.each("end", function(){
				video.node().play();
				video.transition().duration(1000)
					.style("opacity", "1")
					.each("end", function(){
						video.on("ended", function(){
							if(typeof callback === 'function') callback();
						});
					});
				});
			
			$('.vidclose').click(function(){ //if click video close
				 $('video').get(0).pause(); //if they click it in the middle of the video, we need to stop the video 
				 d3.select(".videoHolder").remove();
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
				
			});
			
			
		});
		
		$('.righticon')
		   .mouseenter(function() {
			$('.tooltip').text($(this).attr('tip'));
			$('.tooltip').css('top', $(this).css('top') );
			$('.tooltip').show();
		  })
		  .mouseleave(function() {
			$('.tooltip').hide();
		  });
		
		$('#facebookside').click(function(){
			//<a class="btn" target="_blank" href="http://www.facebook.com/sharer.php?s=100&amp;p[title]=<?php echo urlencode(YOUR_TITLE);?>&amp;p[summary]=<?php echo urlencode(YOUR_PAGE_DESCRIPTION) ?>&amp;p[url]=<?php echo urlencode(YOUR_PAGE_URL); ?>&amp;p[images][0]=<?php echo urlencode(YOUR_LINK_THUMBNAIL); ?>">share on facebook</a>
			//var url = "https://www.facebook.com/sharer/sharer.php?u=http://newsinteractive.post-gazette.com/odysseys#" + data.Country;
			//var url = "http://www.facebook.com/sharer.php?s=100&p[title]=Odysseys&p[summary]=The story of Pittsburgh\s immigrants&p[url]=http://newsinteractive.post-gazette.com/odysseys#" + data.Country + "&p[images][0]=http://newsinteractive.post-gazette.com/odysseys/img/globe.png";
			//var url = "https://www.facebook.com/dialog/share?app_id=145634995501895&display=popup&href=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2F&redirect_uri=https://developers.facebook.com/tools/explorer";
			var facebook_url = 'http://www.facebook.com/sharer.php?'+ 'u='+encodeURIComponent('http://newsinteractive.post-gazette.com/odysseys#' + data.Country.toLowerCase())+ '&amp;t='+encodeURIComponent('Odysseys:' + data.Country.toLowerCase());
			window.open(facebook_url, '_blank');


		});
		
		$('#twitterside').click(function(){
			var url = "https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Fnewsinteractive.post-gazette.com%2Fodysseys?country=" + data.Country.toLowerCase() + "%2F&text=Odysseys: From all over the world, people have come to Pittsburgh. (via @PittsburghPG):&:tw_p=tweetbutton&url=http://newsinteractive.post-gazette.com/odysseys?country=" + data.Country.toLowerCase();
			window.open(url, '_blank');
			
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
			d3.select(".videoHolder").transition().duration(1000)
						.style("opacity", 1)
						.each("end", function(){
							setTimeout(function() {
								  d3.select(".videoHolder").remove();
								//loadStory(countryName);
							}, 300);
						});
			returnToBrowse();
		});
			
		if(typeof callback === 'function') callback();
		
	});//end getJSON
}
// End load story
// --------------------------------------------------

// --------------------------------------------------
// Return from story/video to browse
function returnToBrowse(callback) {
	//$('body').css('overflow-y', 'hidden'); 
$('#pglogo').css('visibility', 'hidden');
	d3.select(".story").transition().duration(500)
			.style('opacity', '0')
			.style("margin-top", height + "px")
				.each("end", function(){
				d3.select(".story").style({"margin-top":"0px", "display":"none"});
				d3.select("body").transition()
					.duration(500)
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
	
	$('h1#title').hide();
	$('#countryTab').removeClass("out");
	
	$('body').append("<div id='commentsBg'></div>"); //insert dimmer
	$("#commentsBg").css("opacity"); // hacky solution to make browser recognize initial state of new element
	$('#commentsBg').css('opacity', ".5"); //fade in the dimmer
	$('#pglogo').attr('src', 'img/PGwhite.png');
	
	//size the width of the part of the page containing the tell us form
	var leftColWidth = $('.commentsWrapper').width() - $(".comments").outerWidth() - parseInt($(".comments").css("margin-left")) - parseInt($(".commentsLeft").css("padding-left")) - parseInt($(".commentsLeft").css("padding-right")); //minus the width of the commetns, minus the padding on comments, minus the left margin, minus the padding on commentsLeft
	$('.commentsLeft').css('width', leftColWidth + 'px');
	$(window).resize(myResizeFunction).trigger('resize');
	
	//resize textarea for story
	var commentsFormHeight = $('#commentsForm').height();
	var titleHeight = $('.commentsLeft h1').height();
	var chatterHeight = $('.formChatter').height();
	var commentsFormTop = $('#commentsForm').position().top;
	var remainingForForm = height - 150 - commentsFormTop - titleHeight - chatterHeight; //150 is for the credits
	var rowHeight = $('input[type=text]').height() + 10;
	var allRows = rowHeight * 4;
	var forText = remainingForForm - allRows;
	$('#formStory').css('height', forText + 'px');
	
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
			 $('.formChatter').append('<p id="thanks">Lorem ipsum dolor sit amet.</p>');
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
	$('.commentsWrapper').animate({'left': $(".commentsWrapper").outerWidth() * -1	}, 1000, function(){
		$("#commentsBg").remove();
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

// Add prototype to d3 selection moving an svg to the top of the heap
// so glows will work properly
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};