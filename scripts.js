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
$.get("getNations.php", function(data){
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

		
	d3.json("world.json", function(error, world) {	//world.json is already a topojson file - converted // add background circle for aesthetics
			
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
		
		$.post("tellus.php", {tellName:name, tellCountry: country, tellAge: age, tellOccupation: occupation, tellEmail: email, tellPhone: phone, tellAbout: about}, function(data){
				$('.form-control').css('visibility', 'hidden');
				$('.submit').css('display', 'none');
				$('#fTellUs #thank').css('display', 'block');
				setTimeout(function() {
					  $('#fTellUs').fadeOut();
				}, 500);
		});
		
		
		
	});
	
});