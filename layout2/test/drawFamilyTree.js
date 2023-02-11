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



var zoom = d3.behavior.zoom()
.scaleExtent([1, 5])
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

function extract_select2_data(node,leaves,index){
		if (node.children){
			for(var i = 0;i<node.children.length;i++){
				index = extract_select2_data(node.children[i],leaves,index)[0];
			}
		}
		else {
			leaves.push({id:++index,text:node.name});
		}
		return [index,leaves];
}

var div = d3.select("body")
	.append("div") // declare the tooltip div
	.attr("class", "tooltip")
	.style("opacity", 0);
	

var margin = {top: 20, right: 120, bottom: 20, left: 120},
	width = 960 - margin.right - margin.left,
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

var svg = d3.select("body").append("svg")
	.attr("width",document.body.offsetWidth)
	.attr("height", document.documentElement.clientHeight)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	.call(zoom);

var rect = svg.append("rect")
.attr("width", document.body.offsetWidth)
.attr("height", document.documentElement.clientHeight)
.style("fill", "none")
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
select2_data = extract_select2_data(treeData[0],[],0)[1];//I know, not the prettiest...
root.x0 = height / 2;
root.y0 = 0;
	
root.children.forEach(collapse);
//console.log(root);
update(root);

//init search box
$("#search").select2({
	data: select2_data,
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
})

$("#search1").on("select2-selecting", function(e) {
	var paths = searchTree(root,e.object.text,[]);
	if(typeof(paths) !== "undefined"){
		openPaths(paths);
	}
	else{
		alert(e.object.text+" not found!");
	}
})


d3.select(self.frameElement).style("height", "800px");

function update(source) {
	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(),
	links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) { d.y = d.depth * 200; });

	// Update the nodesâ€¦
	var node = svg.selectAll("g.node")
		.data(nodes, function(d) { return d.id || (d.id = ++i); });

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("g")
		.attr("class", "node")
	.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
	.on("click", click);

	nodeEnter.append("circle")
	.attr("r", 1e-6)
	.style("fill", function(d) { return d._children ? "blue" : "#fff"; });

	nodeEnter.append("text")
		.attr("x", function(d) { return d.children || d._children ? -20 : 20; })
		.attr("dy", ".35em")
		.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		.text(function(d) { 
		  if (d.gender.toLowerCase()=='male') {
			return d.name+ " (" + d.spouse + ") (S)" ; 
		  } else {
			return d.name+ " (" + d.spouse + ") (D)"; 
		  }			  
		})
		.style("fill-opacity", 1e-6);

	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	nodeUpdate.select("circle")
		.attr("r", 10)
		.style("fill", function(d) {
			if(d.class === "found"){
				return "white"; //red
			}
			else if(d._children){
				return "orange";
			}
			else{
				return "white";
			}
		})
		.style("stroke", function(d) {
			if(d.class === "found"){
				return "red"; //red
			}
	});

	nodeUpdate.select("text")
		.style("fill-opacity", 1);

	// Transition exiting nodes to the parent's new position.
	var nodeExit = node.exit().transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
		.remove();

	nodeExit.select("circle")
		.attr("r", 1e-6);

	nodeExit.select("text")
		.style("fill-opacity", 1e-6);

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
				return "blue";
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


function zoomed() {
	svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
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
	}
}

function refreshPage() {
location.reload();
}
