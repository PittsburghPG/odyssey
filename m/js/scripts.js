var buttonTimer, swipeTimer, swipeX0;

// *****************************************
// Intro behavior 

d3.select(".intro .button")
	.on("touchstart", function(){
		d3.event.preventDefault();
		d3.select(".intro .button .fa-globe").style("opacity", 1);
		buttonTimer = setTimeout(function(){
			loadBrowse(function(){
				d3.select(".intro").style("top", "-100%");
				d3.select(".browse").style("top", "0");
				d3.select(".browse .header").style("position", "fixed");
				d3.select(".intro").style("display", "none");
			});
		}, 2000);
	})
	.on("touchend", function(){
		clearTimeout(buttonTimer);
		d3.select(".intro .button .fa-globe").style("opacity", .25);
	})
	//REMOVE THIS FOR LIVE
	.on("click", function(){
		loadBrowse(function(){
			d3.select(".intro").style("top", "-100%");
			d3.select(".browse").style("top", "0");
			d3.select(".browse .header").style("position", "fixed");
			d3.select(".intro").style("display", "none");
		});
	});

d3.select(".intro")
	.on("touchstart", function(){
		d3.event.preventDefault();
		swipeX0 = d3.event.changedTouches[0].clientX;
	})
	.on("touchend", function() {
			
			
			if( d3.event.changedTouches[0].clientX - swipeX0 < -50)
			{
				
				d3.select(".intro")
					.style({"right":"100%", "opacity":0});
	
				d3.select(".tellUs")
					.style("left", "0");
			}
	});
	
// End Intro behavior 
// *****************************************



// *****************************************
// Start browse behavior 
function loadBrowse(callback) {
	history.pushState();
 	window.location.hash = 'countries';
	d3.json("../php/getNations.php?operation=getActiveCountries", function(error, results){
		d3.select(".browse").append("ul")
		.selectAll("li")
			.data(results).enter()
		.append("li")
			.attr("class", function(d){ return d.Count > 0 ? "" : "inactive" })
			.html(function(d){ return d.Country });
	
	
		d3.selectAll(".browse li")
		.on("click", function(d){
			loadStory(d.Country, function() {
				d3.select(".story").style("display", "block");
				window.scrollTo(0,0);
				d3.select(".browse").style("right", "100%");
				d3.select(".header").style("left", "-110%");
				d3.select(".story").style("left", "0");
			});
		});
	});
	if(typeof callback === 'function') callback();
}

// End browse behavior 
// *****************************************



// *****************************************
// Start story behavior 

function loadStory(country, callback) {
	
	$.getJSON("../php/getNations.php?operation=getSingleCountry&country=" + country, function(data){ 
		
		formattedName = data[0].Country.toLowerCase().replace(/ /g, "_");
		
		window.location.hash = formattedName;
		history.pushState();
		
		d3.select(".story h1")
			.text(data[0].Country);
		
		d3.select(".story h2")
			.text(data[0].Name)
		
		bio = d3.select(".story ul.bio");
		bio.selectAll("li").remove();
		bio.append("li").html("<strong>Origin:</strong> " + data[0].Origin);
		bio.append("li").html("<strong>Occupation:</strong> " + data[0].Occupation);
		bio.append("li").html("<strong>New neighborhood:</strong> " + data[0].Neighborhood);
		
		text = d3.select(".story .text");
		text.selectAll("p").remove();
		text.html(data[0].Notes)
		
		
		console.log(formattedName);
		d3.select(".story video").attr("src", "../countries/" + formattedName + "/vid/" + formattedName + "_portrait.mp4");
		
		// Activate swipe to go back to browse page
		d3.select(".story")
			.on("touchstart", function(){
				
				swipeX0 = d3.event.changedTouches[0].clientX;
			})
			.on("touchend", function() {
					
					
					if( d3.event.changedTouches[0].clientX - swipeX0 > 100)
					{
						
						d3.select(".story")
							.style({"left":"100%", "opacity":1});
			
						d3.select(".browse")
							.style("right", "0");
							
						d3.select(".header")
							.style("left", "0");
						
						d3.select(".story").style("display", "none");						
							
					}
			});
	});
	if(typeof callback === 'function') callback();
}
// End story behavior 
// *****************************************

