"use strict";
/* treeWalker
  arguments:
 options,
 or container, name, options
  ** Note: container should be the top "ul" element in the list structure

  This function adds aria tree markup to the superfish menu structure, as well as keyboard navigation.
  Options:
- root: root node,
- open: called when a node is opened with node as argument;
  - close: called when a node is closed, with node as an argument
  - beforeOpen: called before open with node as an argument
  
  - group: selects grouping items (default "ul")
  - role_group: role to attach to grouping items (default "group")
  - role_root: role of root element (default: "tree")

  - branch: selects branches (default "li")
  - role_branch: role to attach to branches (default "treeitem")

- state_expanded: indicates expanded branch (default: "aria-expanded")

***  note: if open and close functions are not supplied, this function will have no effect; the open and close functions should generally show / hide nodes, respectively.
*/

function treeWalker($container, name) {
// defaults
var options = {
name: "treeWalker",
open: function(){}, close: function(){},
role_root: "tree",
role_group: "group",
role_branch: "treeitem",
group: "ul",
branch: "li",
state_expanded: "aria-expanded"
}; // defaults

var activeDescendant_id = options.name + "-activeDescendant";

if (arguments.length == 1) {
options = $.extend (options, arguments[0]);
} else if (arguments.length == 2) {
options = $.extend (options, {$container: $container, name: name});
} else if (arguments.length == 3) {
options = $.extend (options, {$container: $container, name: name}, arguments[2]);
} // if

//debug ("makeAccessible:", options);

return addKeyboardNavigation (addAria (options.$container));

function addAria ($container) {
/* focus management is done via aria-activedescendant rather than a roving tabindex. See the following for an explanation:
Keyboard-navigable JavaScript widgets - Accessibility | MDN
https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets
*/
var $groups, $branches, $hasChildren;

// remove all implicit keyboard focus handlers (i.e. links and buttons should not be tabbable here since we're using aria-activedescendant to manage focus)
$("a, button, [tabindex]", $container).attr ("tabindex", "-1");
//debug ("- implicit keyboard handling removed");

$groups = $(options.group, $container).addBack()
.attr ("role", options.role_group);

$branches = $(options.branch, $groups)
.attr ({role: options.role_branch}); 

// add aria-expanded to nodes only if they are not leaf nodes
$hasChildren = $branches.has(options.group);
$hasChildren.attr (options.state_expanded, "false");

// unhide the top-level nodes and tell the container that the first node should have focus
$groups.first().find(options.branch).first()
//.show ()
.attr ({"id": activeDescendant_id});

// replace role="group" with role="tree" on the first group and cause the tree to look for our currently active node
$groups.first()
.attr({
"role": options.role_root,
"tabindex": "0",
"aria-activedescendant": activeDescendant_id
}).focus();

return $container;
} // addAria

function addKeyboardNavigation ($container) {

// add keyboard handler
$container.on ("keydown", interactionHandler)
.on ("mouseenter", `[role=${options.role_branch}]`, function (e) {
var $node = $(e.target).closest (`[role=${options.role_branch}]`);
//debug ("entering ", e.target.nodeName, $node.children().first().text());

if ($node[0] !== getCurrentNode()[0]) setCurrentNode ($node);
return true;
});

return $container;

function interactionHandler (e) {
var action = (e.type === "keydown")? (e.which || e.keyCode) : "click";
var $newNode = null;
var $currentNode = getCurrentNode();
var actions = {
//click: "click",
13: "click", 32: "click",

"38": "previous", "40": "next",
"37": "up", "39": "down"
};

if (! (action in actions)) return true;

//debug ("action: ", action);
$newNode = navigate ($currentNode, actions[String(action)]);

if (isValidNode($newNode)) {
//debugNode ($newNode, "navigate: ");
if (action === "click" || $newNode !== $currentNode) {
if (options.leaveNode && options.leaveNode instanceof Function) options.leaveNode ($currentNode, $newNode);
setCurrentNode ($newNode);
} // if
} // if
return false;

} // interactionHandler


function navigate ($start, operation) {
//debugNode ($start, "navigate: ");
if (! isValidNode($start)) return null;
//debug ("navigate: ", operation);

if (operation === "click") {
if (isLeafNode ($start)) {
return ($start);
} // if

if (!isOpened($start)) $start = open($start);
else $start = close ($start);
return $start;
} // if

if (options.noArrowKeyNavigation) return null;

switch (operation) {
case "previous": return previous ($start, options.flow);

case "next": return next ($start, options.flow);

case "up":
if (options.flow) {
$start = close($start);
$start = up($start);
} else {
$start = up($start);
$start = close($start);
} // if
return $start;

case "down": 
$start = open ($start);
return $start = down ($start);

default: return null;
} // switch

function hasChildren ($node) {
return !isLeafNode ($node);
} // hasChildren

function isLeafNode ($node) {
return !$node.is(`[${options.state_expanded}]`);
} // isLeafNode

function isOpened ($node) {
return isValidNode($node) && $node.attr(options.state_expanded) === "true";
} // isOpened

function open ($node) {
if (hasChildren($node) && !isOpened($node)) {
$node.attr (options.state_expanded, "true");
if (options.open && options.open instanceof Function) options.open ($node);
} // if

return $node;
} // open

function close ($node) {
if (options.beforeClose && options.beforeClose instanceof Function) options.beforeClose($node); 
if (isOpened($node)) {
$node.attr (options.state_expanded, "false");
if (options.close && options.close instanceof Function) options.close($node);
} // if

return $node;
} // close

function previous ($node, flow) {
var $result;
var $parent = up($node);
var $previous = $node.prev ();
if (! flow) return $previous;

if (isValidNode($previous) && !isLeafNode($previous) && isOpened($previous)) {
$result = down ($previous);
if ($result.nextAll().length > 0) $result = $result.nextAll().last();
return $result;
} // if

if (! isValidNode($previous) && isValidNode($parent) && isOpened($parent)) return $parent;
return $previous;
} // previous

function next ($node, flow) {
var $parent = up($node);
var $next = $node.next ();
if (! flow) return $next;

if (!isLeafNode($node) && isOpened($node)) return down ($node);

if (! isValidNode($next) && isValidNode($parent) && isOpened($parent)) return next($parent);
return $next;
} // next

function down ($node) {
return $node.find("[role=" + options.role_branch + "]:first");
} // down

function up ($node) {
return $node.parent().closest("[role=" + options.role_branch + "]");
} // up

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

if (isValidNode ($newNode) && isValidNode ($node)) {

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
return ($node && $node.length === 1);
} // isValidNode


function debugNode ($node, label) {
//return;
var info = "(invalid)";

if (isValidNode($node)) info = $node[0].nodeName + $node.find("a:first").text();
if (label) debug (label, info);
return info;
} // debugNode

} // addKeyboardNavigation

} // treeWalker

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

//alert ("treeWalker.js loaded");

