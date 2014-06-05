var buttonTimer, swipeTimer, swipeX0;


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