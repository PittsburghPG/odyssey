var buttonTimer, swipeTimer, swipeX0;

// *****************************************
// Intro behavior 

d3.select(".intro .button")
	.on("touchstart", function(){
		d3.event.preventDefault();
		d3.select(".intro .button .fa-globe").style("opacity", 1);
		buttonTimer = setTimeout(function(){
			d3.select(".intro").style("top", "-100%");
			d3.select(".browse").style("top", "0");
		}, 2000);
	})
	.on("touchend", function(){
		clearTimeout(buttonTimer);
		d3.select(".intro .button .fa-globe").style("opacity", .25);
		setTimeout(function(){
			d3.select(".browse .header").style("position", "fixed");
			d3.select(".intro").style("display", "none");
		},500)
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

	d3.selectAll(".browse li")
	.on("click", function(){
		d3.select(".browse").style("right", "100%");
		d3.select(".story").style("left", "0");
		
	});


// End browse behavior 
// *****************************************



// *****************************************
// Start story behavior 

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
			}
	});

// End story behavior 
// *****************************************

