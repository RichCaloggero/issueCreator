/* makeAccessible
  arguments:
 options,
 or container, name, options
  ** Note: container should be the top "ul" element in the list structure

  This function adds aria tree markup to the superfish menu structure, as well as keyboard navigation.
  Options:
  - open: called when a node is opened with node as argument;
  - close: called when a node is closed, with node as an argument
  - beforeOpen: called before open with node as an argument
  - role_root: role of root element (default: "tree")
  - role_group: role of grouping element (default: "group")
  - role_item: role of branch (default: "treeitem")
  - state_expanded: indicates expanded branch (default: "aria-expanded")

***  note: if open and close functions are not supplied, this function will have no effect; the open and close functions should generally show / hide nodes, respectively.
*/

function makeAccessible ($container, name) {
// defaults
var options = {
open: function(){}, close: function(){},
role_root: "tree",
role_group: "group",
role_item: "treeitem",
state_expanded: "aria-expanded"
}; // defaults

if (arguments.length == 1) {
options = $.extend (options, arguments[0]);
} else if (arguments.length == 2) {
options = $.extend (options, {$container: $container, name: name});
} else if (arguments.length == 3) {
options = $.extend (options, {$container: $container, name: name}, arguments[2]);
} // if

var activeDescendant_id = options.name + "activeDescendant";
//debug ("makeAccessible:", options);

return addKeyboardNavigation (addAria (options.$container));

function addAria ($container) {
/* focus management is done via aria-activedescendant rather than a roving tabindex. See the following for an explanation:
Keyboard-navigable JavaScript widgets - Accessibility | MDN
https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets
*/
var $ul;
var $hasChildren, $li;

// remove all implicit keyboard focus handlers (i.e. links and buttons should not be tabbable here since we're using aria-activedescendant to manage focus)
$("a, button", $container).attr ("tabindex", "-1");
//debug ("- implicit keyboard handling removed");

// "ul" requires role="group"
$ul = $("ul", $container).addBack()
.attr ("role", options.role_group);

// "li" are tree nodes and require role="treeitem"
$li = $("li", $ul)
.attr ({role: options.role_item}); 

// add aria-expanded to nodes only if they are not leaf nodes
$hasChildren = $li.has("ul");
$hasChildren.attr (options.state_expanded, "false");

// unhide the top-level nodes and tell the container that the first node should have focus
$ul.first().find("li").first()
//.show ()
.attr ({"id": activeDescendant_id});

// replace role="group" with role="tree" on the first group and cause the tree to look for our currently active node
$ul.first()
.attr({
"role": options.role_root,
"tabindex": "0",
"aria-activedescendant": activeDescendant_id
}).focus();

return $container;
} // addAria

function addKeyboardNavigation ($container) {

// add keyboard handler
$container.on ("keydown", keyboardHandler);
return $container;

function keyboardHandler (e) {
var key = e.which || e.keyCode;
var $newNode = null;
var $currentNode = getCurrentNode();

if (key >= 35 && key <= 40) {
//debug ("key: " + key);
$newNode = navigate (getCurrentNode(), key);

if (isValidNode($newNode) && $newNode !== $currentNode) {
//debugNode ($newNode, "navigate: ");
if (options.leaveNode && options.leaveNode instanceof Function) options.leaveNode ($currentNode, $newNode);
setCurrentNode ($newNode);
} // if
return false;
} // if

// key not handled above, so let it keep its default action
return true;
} // keyboardHandler
 

// this function defines the actual keyboard behavior seen
// add code to "open()" and "close()" functions to integrate with current implementation
function navigate ($start, key) {
//debugNode ($start, "navigate: ");
if (! isValidNode($start)) return null;

switch (key) {
case 38: return previous (); // upArrow moves to previous sibling
case 40: return next(); // downArrow moves to next sibling

// leftArrow moves up a level and closes
case 37:
if (options.beforeClose && options.beforeClose instanceof Function) options.beforeClose($start); 
$start =  up();
 close();
 return $start;

// rightArrow opens and moves down a level
case 39: if (! isOpened()) open ();
$start = down();
if (options.afterOpen && options.afterOpen instanceof Function) options.afterOpen ($start);
return $start;

default: return null;
} // switch

function isOpened () {
return $start && $start.length == 1 && $start.attr(options.state_expanded) == "true";
} // isOpened

function open () {
if (!isOpened()) {
$start.attr (options.state_expanded, "true");
if (options.open && options.open instanceof Function) options.open ($start);
} // if
} // open

function close () {
if (isOpened()) {
$start.attr (options.state_expanded, "false");
if (options.close && options.close instanceof Function) options.close($start);
} // if
} // close

function next () {
return $start.next ("[role=" + options.role_item + "]");
} // next

function previous () {
return $start.prev("[role=" + options.role_item + "]");
} // previous

function up () {
return $start.parent().closest("[role=" + options.role_item + "]");
} // up

function down () {
return $start.find("[role=" + options.role_item + "]:first");
} // down

} // navigate


function getCurrentNode () {
var $node;
if (! activeDescendant_id) {
alert ("active descendant not defined");
return null;
} // if

$node = $("#" + activeDescendant_id);
return (isValidNode($node))?
$node : null;
} // getCurrentNode

function setCurrentNode ($newNode) {
var $node = getCurrentNode ();
if (
isValidNode ($newNode)
&& isValidNode ($node)) {

$node.removeAttr ("id");
$newNode.attr ({"id": activeDescendant_id});

$container.removeAttr ("aria-activedescendant")
.attr ("aria-activedescendant", activeDescendant_id);

if (options.currentNode && options.currentNode instanceof Function) options.currentNode ($newNode);

return $newNode;
} // if valid

return null;
} // setCurrentNode

function isValidNode ($node) {
return ($node && $node.length == 1);
} // isValidNode



function debugNode ($node, label) {
//return;
var info = "(invalid)";

if (isValidNode($node)) info = $node[0].nodeName + $node.find("a:first").text();
if (label) debug (label, info);
return info;
} // debugNode

} // addKeyboardNavigation

} // makeAccessible

/*function debug (text) {
//return;
var text = $.map ($.makeArray (arguments), function (arg) {
	var type = typeof(arg);
	if (type === "array" || type == "object") return JSON.stringify(arg) + "\n";
	else return arg;
}).join (" ");

if ($("#debug").length > 0) {
if (! text) {
$("#debug").html ("");
} else {
	$("#debug").append (document.createTextNode(text), "<br>\n");
} // if

} else {
console.error (text);
} // if
} // debug
*/

//alert ("makeAccessible loaded");

