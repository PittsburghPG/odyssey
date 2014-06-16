var buttonTimer, swipeTimer, swipeX0;

// *****************************************
// Loading behavior 

hashChange();

window.onhashchange = function(){ hashChange(); }

// End loading behavior
// *****************************************

// *****************************************
// Hash event behavior

function hashChange(){
	console.log("changed");
	if( window.location.hash == "") {
		loadIntro();
	}
	else if( window.location.hash == "#countries" ) {
		loadBrowse(function(){
			d3.select(".browse")
				.style("top", "0")
				.style("right", "0");
			d3.select(".browse .header").style("display", "block")
				
			d3.select(".intro").style("top", "-100%");
			
			d3.select(".story")
				.style({"left":"100%"})
				.style("display", "none");	
		});
		
	}
	else {
		d3.select(".intro").style("top", "-100%");
		loadStory(window.location.hash.slice(1), function(){
			d3.select(".story")
				.style("display", "block")
				.style("left", "0");
			window.scrollTo(0,0);
			d3.select(".browse").style("right", "100%");
			d3.select(".header").style("display", "none");
		});
	}


}

// End hash event
// *****************************************


// *****************************************
// Intro behavior 
function loadIntro(callback) {
	d3.select(".intro .button")
		.on("touchstart", function(){
			d3.event.preventDefault();
			d3.select(".intro .button .fa-globe").style("opacity", 1);
			buttonTimer = setTimeout(function(){
				window.location.hash = "countries";
			}, 2000);
		})
		.on("touchend", function(){
			clearTimeout(buttonTimer);
			d3.select(".intro .button .fa-globe").style("opacity", .25);
		})
		//REMOVE THIS FOR LIVE
		.on("click", function(){
			loadBrowse(function(){
				window.location.hash = "countries";
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
		if(typeof callback === 'function') callback();
}	
// End Intro behavior 
// *****************************************



// *****************************************
// Start browse behavior 
function loadBrowse(callback) {
	
	if(d3.selectAll(".browse li").node() == null) {
		d3.json("../php/getNations.php?operation=getActiveCountries", function(error, results){
			d3.select(".browse").append("ul")
			.selectAll("li")
				.data(results).enter()
			.append("li")
				.attr("class", function(d){ return d.Count > 0 ? "" : "inactive" })
				.html(function(d){ return d.Country });
		
		
			d3.selectAll(".browse li")
			.on("click", function(d){
				window.location.hash = d.Country;
			});
		});
	}
	if(typeof callback === 'function') callback();
}

// End browse behavior 
// *****************************************



// *****************************************
// Start story behavior 

function loadStory(country, callback) {
	
	d3.select(".story video").remove();
	
	$.getJSON("../php/getNations.php?operation=getSingleCountry&country=" + country, function(data){ 
		
		formattedName = data[0].Country.toLowerCase().replace(/ /g, "_");
	
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
		d3.select(".story").insert("video", "h2")
			.attr("src", "../countries/" + formattedName + "/vid/" + formattedName + "_portrait.mp4");
		
		// Activate swipe to go back to browse page
		d3.select(".story")
			.on("touchstart", function(){
				
				swipeX0 = d3.event.changedTouches[0].clientX;
			})
			.on("touchend", function() {
					
					
					if( d3.event.changedTouches[0].clientX - swipeX0 > 100)
					{
						
						window.location.hash = "countries";			
							
					}
			});
	
		if(typeof callback === 'function') callback();
		
	});
	
}
// End story behavior 
// *****************************************

