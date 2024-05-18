// *********** Convert flat data into a nice tree ***************
// create a name: node map
var dataMap = data.reduce(function(map, node) {
	map[node.id] = node;
	return map;
}, {});

// Function to search for an item by id
function searchNodeById(id) {
	return dataMap[id] || null;
}


function getNames(data,leaves) {	
	var leaves=[];	
	for (var d in data)  {	
		leaves.push({id: data[d].id,text:data[d].name});
	}		
	return leaves;
}

//******************SELECT2***************************************
// Function to dynamically add options to Select2
function addOptionsToSelect2(data) {			
	data.forEach(function(item) {			
	var newOption = new Option(item.text, item.id, false, false);	
	$('#customSelect').append(newOption);
	});
}	

// put data in select2 container
var peopleNames=getNames(data);	
peopleNames.sort((a,b) => (a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0));
addOptionsToSelect2(peopleNames);

// jquery matcher		
function prefixMatcher(params, data) {
	// If there are no search terms, return all data
	if ($.trim(params.term) === '') {
		return data;
	}

	// Convert the search term to uppercase to make the search case-insensitive
	var term = params.term.toUpperCase();

	// Check if the text of the option starts with the search term
	if (data.text.toUpperCase().startsWith(term)) {
		return data;
	}

	// Return null if the text does not start with the search term
	return null;
}

 $('#customSelect').select2({
	placeholder: "Search Names",
	minimumInputLength: 1,
	maximumSelectionLength: 5,
	matcher: prefixMatcher,
	language: {
			inputTooShort: function () {
				return "Type names"; // Return an empty string to not show any message
				} 
			}
 });

// ************************Custom Alert Message **********
	
function showCustomAlert(title, message) {
	let customAlert = 
			document.getElementById('customAlert');
	let customAlertTitle = 
			document.getElementById('customAlertTitle');
	let customAlertMessage = 
			document.getElementById('customAlertMessage');

	customAlertTitle.innerText = title;
	customAlertMessage.innerText = message;
	customAlert.style.display = 'block';
}

function hideCustomAlert() {
	let customAlert = document.getElementById('customAlert');
	customAlert.style.display = 'none';
}	
	
//********************JQUERY***********************

// Display messsage if names are selected
 
 $('#customSelect').on('change', function() {	 
		update(root,true);
		collapse(root);	
	 
	   // Get the current selections
		var currentSelections = $('#customSelect').val();	
		
		// variable for message
		var selectedTexts=[]; 	
			
		for(var k=0; k <currentSelections .length;k++) {
			
			var currentNode= searchNodeById(currentSelections [k]);	
			var parentID=currentNode.parent;
			
			// It seems there is a bug in the code when we call parent node.
			// In the first call it gives parent ID but in the second call it gives data structure
			if (typeof parentID==='string') {			
				parentID=parentID
			} else {
					parentID= parentID.id; 
			}
		
			var parentNode= searchNodeById(parentID);			
			selectedTexts.push(k+1 + ". " + currentNode.name + "-- Father: " + parentNode.name);	
		
			// Open nodes that are in the select box
			 var paths = searchTree(root,currentSelections [k],[]);			
			 if(typeof(paths) !== "undefined"){
				 openPaths(paths);	
			 }		
		}
		if (selectedTexts.length==0) {
			showCustomAlert("Selected People", "No people selected");
		}else{
			showCustomAlert("Selected People", selectedTexts.join('\n '));
		}
 });
 
 $('#resetTree').on('click', function() {
	location.reload();	
 });
  
// ********************D3 Codes***************************************
// *Modified by Deepak Rayamajhi
// 

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
.scaleExtent([0.0005, 10])
.on("zoom", zoomed);

//Search path to node
function searchTree(obj,search,path){
	if(obj.id === search){ //if search is found return, add the object to the path and return it
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

//Search path to node
function searchTree1(obj,search,path){
	if(obj.id === search){ //if search is found return, add the object to the path and return it
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
	update(d,false);
}

function openPaths(paths){
	for(var i =0;i<paths.length;i++){
		if(paths[i].id !== "1"){//i.e. not root
			paths[i].class = 'found';
			if(paths[i]._children){ //if children are hidden: open them, otherwise: don't do anything
				paths[i].children = paths[i]._children;
				paths[i]._children = null;
			}
			update(paths[i],false);
		}
	}
}

root = treeData[0];

root.x0 = height / 2;
root.y0 = 0;

// collapse nodes	
collapse(root);
update(root,true);
	 
d3.select(self.frameElement).style("height", "800px");

function update(source,resetLinkColorFlag) {
	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(),
	links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) { d.y = d.depth * 500; });
	nodes.forEach(function(d) { d.x = d.x * 2.0; });

	// Update the nodesâ€¦yes
	
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


	if (resetLinkColorFlag===true) {
		
		nodeUpdate.select("circle")
		.attr("r", 10)
		.style("fill", function(d) {
			if(d.class === "found"){
				let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--defaultNodeColor');
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
				return 'none';
			}
	});
	
			
	} else {

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
	
	}
	

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
	if (resetLinkColorFlag===true) {
		link.transition()
		.duration(duration)
		.attr("d", diagonal)
		.style("stroke",function(d){
			if(d.target.class==="found"){
				 let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--defaultLinkColor');
			}
		});
		
	}	else {	
		link.transition()
		.duration(duration)
		.attr("d", diagonal)
		.style("stroke",function(d){
			if(d.target.class==="found"){
				 let ele = document.querySelector(':root');	
				return getComputedStyle(ele).getPropertyValue('--updateLinkColorChange');
			}
		});
	}

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
	update(root,false);
}

function collapseAll(){
	root.children.forEach(collapse);
	collapse(root);
	update(root,false);
}


function expandTree() {
	if (document.getElementById('checkBoxExpandAll').checked) {
		expandAll();			
	} else {
	collapseAll();	
	}
}

// expandTree();
