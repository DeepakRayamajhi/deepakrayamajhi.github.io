// *********** Convert flat data into a nice tree ***************
// create a name: node map
var dataMap = data.reduce(function(map, node) {
	map[node.id] = node;
	return map;
}, {});

var treeData = [];
data.forEach(function(node) {
// add to parent
var parent = dataMap[node.parent];
if (parent) {
	// create child array if it doesn't exist
	(parent.children || (parent.children = []))
		// add node to child array
		.push(node);
} else {
	// parent is null or missing
	treeData.push(node);
}
});


function getNames(data,leaves) {		
	for (var d in data)  {
	var name=data[d].name;	 
		leaves.push({id: data[d].id,text:name});			
	}		
	return leaves;
}
// console.log(getNames(data,[]));

// put data in select2 container
var peopleNames=getNames(data,[]);	
peopleNames.sort((a,b) => (a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0));

console.log(peopleNames);
// ***********************************************************

var zoom = d3.behavior.zoom()
.scaleExtent([0.0005, 10])
.on("zoom", zoomed);


//basically a way to get the path to an object
function searchTree(obj,search,path){
	if(obj.name === search){ //if search is found return, add the object to the path and return it
		path.push(obj);
		return path;
	}
	else if(obj.children || obj._children){ //if children are collapsed d3 object will have them instantiated as _children
		var children = (obj.children) ? obj.children : obj._children;
		for(var i=0;i<children.length;i++){
			path.push(obj);// we assume this path is the right one
			var found = searchTree(children[i],search,path);
			if(found){// we were right, this should return the bubbled-up path from the first if statement
				return found;
			}
			else{//we were wrong, remove this parent from the path and continue iterating
				path.pop();
			}
		}
	}
	else{//not the right object, return false so it will continue to iterate in the loop
		return false;
	}
}


var div = d3.select("body")
	.append("div") // declare the tooltip div
	.attr("class", "tooltip")
	.style("opacity", 0);
	

var margin = {top: 20, right: 120, bottom: 20, left: 120},
	width = 1500 - margin.right - margin.left,
	height = 800 - margin.top - margin.bottom;

var i = 0,
	duration = 750,
	root,
	select2_data;

var diameter = 960;

var tree = d3.layout.tree()
	.size([height, width])
	.nodeSize([30, 30]);

var diagonal = d3.svg.diagonal()
	.projection(function(d) { return [d.y, d.x]; });


var width = d3.select("#familyTree")[0][0].clientWidth,
height = d3.select("#familyTree")[0][0].clientHeight;



var svg = d3.select("#familyTree").append("svg")
	.attr("width",width)
	.attr("height", height)
	.append("g")
	.attr("transform", "translate(" + width/2 + "," + height/2 + ")")
	.call(zoom)
	.append("g");

let ele = document.querySelector(':root');	
var rect = svg.append("rect")
.attr("width", 40000000)
.attr("height", 40000000)
.attr("x",-20000000)
.attr("y",-20000000)
.style("fill", getComputedStyle(ele).getPropertyValue('--canvasBackgroundColor'))
.style("pointer-events", "all");

//recursively collapse children
function collapse(d) {
	if (d.children) {
		d._children = d.children;
		d._children.forEach(collapse);
		d.children = null;
	}
}

// Toggle children on click.
function click(d) {
	if (d.children) {
		d._children = d.children;
		d.children = null;
	}
	else{
		d.children = d._children;
		d._children = null;
	}
	update(d);
}

function openPaths(paths){
	for(var i =0;i<paths.length;i++){
		if(paths[i].id !== "1"){//i.e. not root
			paths[i].class = 'found';
			if(paths[i]._children){ //if children are hidden: open them, otherwise: don't do anything
				paths[i].children = paths[i]._children;
				paths[i]._children = null;
			}
			update(paths[i]);
		}
	}
}

root = treeData[0];

// select2_data = extract_select2_data(treeData[0],[],0)[1];//I know, not the prettiest...
root.x0 = height / 2;
root.y0 = 0;



// collapse nodes	
collapse(root);
update(root);


//init search box
$("#search").select2({
	data: peopleNames,
	containerCssClass: "search"
});

//attach search box listener
$("#search").on("select2-selecting", function(e) {
	var paths = searchTree(root,e.object.text,[]);
	if(typeof(paths) !== "undefined"){
		openPaths(paths);
	}
	else{
		alert(e.object.text+" not found!");
	}
});


d3.select(self.frameElement).style("height", "800px");

function update(source) {
	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(),
	links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) { d.y = d.depth * 500; });
	nodes.forEach(function(d) { d.x = d.x * 2.0; });

	// Update the nodesâ€¦
	var node = svg.selectAll("g.node")
		.data(nodes, function(d) { return d.id || (d.id = ++i); });

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("g")
		.attr("class", "node")
	.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
	.on("click", click);

	nodeEnter.append("circle")
	.attr("r", 1e-6);

	nodeEnter.append("text")
		.attr("x", function(d) { return d.children || d._children ? -20 : 20; })
		.attr("dy", "-0.1em")
		.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		.text(function(d) { 
		  if (d.gender.toLowerCase()=='male') {
			return d.name+ " (" + d.spouse + ") (S)" ; 
		  } else {
			return d.name+ " (" + d.spouse + ") (D)"; 
		  }			  
		});
		
		

	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	nodeUpdate.select("circle")
		.attr("r", 10)
		.style("fill", function(d) {
			if(d.class === "found"){
				let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--nodeFoundColorChange');
			}
			else if(d._children){
				let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--nodeColorWithChildern');
			}
			else{
				let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--defaultNodeColor');
			}
		})
		.style("stroke", function(d) {
			if(d.class === "found"){
				let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--nodeFoundBorderColorChange');
			}
	});

	// Transition exiting nodes to the parent's new position.
	var nodeExit = node.exit().transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
		.remove();

	// Update the linksâ€¦
	var link = svg.selectAll("path.link")
		.data(links, function(d) { return d.target.id; });

	// Enter any new links at the parent's previous position.
	link.enter().insert("path", "g")
		.attr("class", "link")
		.attr("d", function(d) {
			var o = {x: source.x0, y: source.y0};
			return diagonal({source: o, target: o});
		});

	// Transition links to their new position.		
		link.transition()
		.duration(duration)
		.attr("d", diagonal)
		.style("stroke",function(d){
			if(d.target.class==="found"){
				 let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--nodeLinkColorChange');
			}
		});

	// Transition exiting nodes to the parent's new position.
	link.exit().transition()
		.duration(duration)
		.attr("d", function(d) {
			var o = {x: source.x, y: source.y};
			return diagonal({source: o, target: o});
		})
		.remove();

	// Stash the old positions for transition.
	nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	  });
}


function zoomed(e) {	
	 svg.attr("transform", "translate(" +d3.event.translate      + ")scale(" + d3.event.scale + ")");
}


function expand(d){   
if (d._children) {        
	d.children = d._children;
	d._children = null;       
}
	var children = (d.children)?d.children:d._children;
	if(children)
	  children.forEach(expand);
}

function expandAll(){
	expand(root); 
	update(root);
}

function collapseAll(){
	root.children.forEach(collapse);
	collapse(root);
	update(root);
}


function expandTree() {
	if (document.getElementById('checkBoxExpandAll').checked) {
		expandAll();			
	} else {
	collapseAll();
	// location.reload();
	}
}

expandTree();
