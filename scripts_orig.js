var svg = d3.select("#canvas"),
	globe = svg.selectAll(".country"),
	sens = .25, //sensitivity so doesn't move too fast
	circle, 
	zoomed = false;
	
width = window.innerWidth;															// Get width and height of container	
height = window.innerHeight;

svg
.attr("width", width)
.attr("height", height)

var projection = d3.geo.orthographic()															// Set up globe projection
    .scale(300)
    .translate([width / 2, height / 2])
	.rotate([0,0])
    .clipAngle(90)
    .precision(.1);
	

var path = d3.geo.path()																		// Make path object to generate paths using the projection
    .projection(projection);

	
d3.json("world.json", function(error, world) {													// add background circle for aesthetics
	  	
	circle = svg.append("circle")																// add background circle for aesthetics
		.attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale())
		.attr("stroke", "black")
		.attr("stroke-width", "1")
		.attr("fill", "lightblue");
	
		
	countries = topojson.feature(world, world.objects.countries).features;						// Make globe
	globe = globe.data(countries)
		.enter()
			.append("path")
			.attr("d", path)
			.attr("class", "country")
			.attr("id", function(d){return d.properties.id})
			.on("click", panTo);
	
	
	
	/*
	// Start the globe's auto-rotate
	rotate = [10, -10],
    velocity = [.03, -.001],
    time = Date.now();
	
	d3.timer(function(){
		var dt = Date.now() - time;
		projection.rotate([rotate[0] + velocity[0] * dt, 0]);
		globe.attr("d", path);
	});
	*/
	
	
	panTo(svg.selectAll("#USA").datum());														// Have globe zoom to USA (this is just a test)
	
	
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
		if(event.which == 27) { zoomOut() } 
	});		
	
	
	
});

function panTo(d){	
	
	centroid = d3.geo.centroid(d);																//Find center of selected country
	
	/*

	
	
	// for kicks, delete as desired.
	d3.transition()																				// Old style of stop-and-start zoom. I ditched this because it 
		.duration(500)																			// chained together TWO transitions, meaning the globe would 
		.tween("scale", function(){																// first zoom out, then turn, then zoom back in. 
			var s = d3.interpolate(projection.scale(), 300);                                    // LAME! This way, it's seamless
			return function(t) {																// (if a bit more math-intensive). I'm keeping example code 
				projection.scale(s(t));															// of the first half of the original transition here for fun. 
				globe.attr("d", path);
			}
		});
	*/
	
	// Start transition
	d3.transition()
		.duration(2000)
		.tween("rotate", function() {															// Let it know we'll be transition a rotate animation
			var r = d3.interpolate(projection.rotate(), [-centroid[0], -centroid[1]]);			// Have computer calculate all rotation values from starting rotation position to finished position
			return function(t) {																// This tells computer what to do at every frame of tween
				projection.rotate(r(t));														// Rotate globe projection to tweened position
				globe.attr("d", path);															// Update globe's path (actually draws new rotation to screen)
			};
		})
		.tween("scale", function(){																// At the same time, do the zoom
			var end = (zoomed) ? 2 * Math.PI : Math.PI / 2										// If we're zoomed in, end is 2pi. If not, 1/2 pi. 
			var s = d3.interpolate(0, end);														// Calculate all values between 0 and 2pi or 1/2 pi
			return function(t){
				if(zoomed) {
					zoomLevel = (Math.cos(s(t)) < 0) ? 0 : Math.cos(s(t));						// If zoomed, calculate current tween scale using cosine
					projection.scale( 300 + zoomLevel * 300 );									// Starts with base of 300, adds 300 * cosine value (which is between 1 and -1
				}
				else {
					projection.scale( 300 + Math.sin( s(t) ) * 300 )							// If we're zoomed out, do sine (and only do it up until 1/2 pi)
				} 
				globe.attr("d", path);															// Redraw globe
				circle.attr('r', projection.scale())											// Redraw background circle
				
			}
		})
		.each("end", function(){ if(!zoomed) zoomed = true; });									// At end of animation, set zoom to true.

}

function zoomOut()																				// The zoom-out function. Uses same logic as above. 
{
	if(zoomed) {
		d3.transition()
			.duration(2000)
			.tween("scale", function(){
				var s = d3.interpolate(0, Math.PI / 2);
				return function(t) {
					projection.scale( 300 + Math.cos(s(t)) * 300 ); //projection.scale s(t)
					globe.attr("d", path);
					circle.attr('r', projection.scale())
				}
			});
			
		zoomed = false;
	}
}
