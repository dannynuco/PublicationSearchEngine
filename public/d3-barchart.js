// function for drawing d3 barchart on screen
// dependency: src="http://d3js.org/d3.v4.0.0-alpha.45.min.js

// variables for tracking chart state
var chartDrawn=false;
var svg;
var graph;

function drawChart(newData){
    if(chartDrawn){
        svg.selectAll('*').remove();
    }
    svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var x = d3.scaleBand().rangeRound([0, width]).padding(0),
        y = d3.scaleLinear().rangeRound([0, height]);

    g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Need to convert object to array for d3 use
    var data=[];
    var counter=0;
    for(var i in newData){
        data.push({
            "order":counter,
            "letter":i,
            "frequency":newData[i]
        });
        counter++;
    }

    x.domain(data.map(function(d) { return d.letter; }));
    y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    var bar = g.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")

    bar.append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.letter); })
        .attr("y", function(d) { return height; })
        .attr("width", x.bandwidth())
        .attr("fill", function(d){ return d.order%2==0?"deepskyblue":"lightgreen" })
        .transition()
        .duration(300)
        .delay(function (d, i) {
            return i * 150;
        })
        .attr("y", function (d, i) {
            return height - y(d.frequency);
        })
        .attr("height", function (d, i) {
            return y(d.frequency);
        })


    bar.append("text")
        .attr("dy", ".75em")
        .style('fill', 'white')
        .style('font-size', "18px")
        .attr("y", function(d) {
            return Math.min(height-20, height-y(d.frequency)+10);
        })
        .attr("x", function(d, i) {
            return (i+0.5) * (width / data.length);
        })
        .attr("text-anchor", "middle")
        .text(function(d) { return d.frequency; });

    chartDrawn=true
    graph = graph || document.getElementById("technique-barchart");
    graph.style.display="inline";
}