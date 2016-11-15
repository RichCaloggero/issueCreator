"use strict";
function initializeWcagBrowser ($ui, $display) {
//debug ("--start--");

// import data
var import_treeData = jQuery.ajax({url: "wcag-data.txt", dataType: "text"})
.fail (function (error) {alert (JSON.stringify(error));})
.done (function (data) {
var html, tree, $menuContainer, $menu;
$menuContainer = $(".menu", $ui);

//debug ("text: ", data);
tree = importTreeData (data);
//debug ("tree: ", tree);

html = tree2html (tree);
//debug ("html: ", html);

$menuContainer.html (html);
//debug ("html added");

$("ul:first", $menuContainer)
.addClass ("sf-menu");

// initialise plugin
$menu = $(".sf-menu", $ui).superfish({
//add options here if required
});

makeAccessible ($menu, "a11y-", {
currentNode: function ($node) {
$node.trigger ("selectNode");
},

open: function ($node) {
$node.superfish("show");
}, // open

close: function ($node) {
$node.superfish("hide");
} // close

}); // makeAccessible

}); // ajax

var import_wcagData = $.get ("http://www.w3.org/TR/WCAG20/")
.fail (function (error) {
alert (error.message);
}).done (function (data) {
//debug ("Guidelines loaded");
$ui.trigger ("loaded");
}); // ajax

$.when (import_treeData, import_wcagData)
.then (function (treeData, wcagData) {
var selectors = [
[".div2", ".principle"],
[".div3", ".guideline :header:first"],
[".sc", ".scinner"]
];
var $wcag = $('<div class="document" id="wcag-2.0"></div>').append (wcagData);
var $guidelines = $wcag.find (".body .div1:first");
var $tree = $(".sf-menu", $ui);

display (getFullText(getSelectedNode ($tree)), $display);

$tree.on ("selectNode", function (e) {
display (getFullText($(e.target)), $display);
return false;
}); // selectNode

function getFullText (node) {
var loc = location($tree, node);
//debug (`loc: ${loc}`);
var text = extractText($guidelines, selectors, loc);
//debug (`text: ${text}`);
return text;
} // getFullText

function extractText ($doc, selectors, loc) {
var index, selector, $nodes, $node;

$node = $doc;
for (var depth=0; depth<loc.length; depth++) {
selector = selectors[depth];
index = loc[depth];
//debug (`- search: ${depth} ${index}`);
$nodes = $node.find (selector[0]);
$node = $nodes.eq(index);
} // for

return $node.find (selector[1]).html();
} // extractText

function display (text, $display) {
var loc = location($tree, getSelectedNode($tree));
var $text = ($display && $display.length === 1)? 
$display : $(".text", $ui);
//debug ("display: ", $text.attr("data-name"));
//debug ("verbosity: ", getVerbosity(), (loc.length)-1);

if ((loc.length) - 1 >= getVerbosity()) {
$text.attr ("aria-live", "polite");
} else {
$text.attr ("aria-live", "off");
} // if


setTimeout (function () {
$text.html (text);
$text.trigger ("display", text);
}, 100);
} // display

function getVerbosity () {
return $(".verbosity", $ui).val();
} // getVerbosity

return false;
}); // when

/// tree helpers

function location ($tree, $node) {
var loc = [];
loc.push ($node.index());

$node = $node.parent().closest ("[role=treeitem]", $tree);
while ($node && $node.length === 1) {
loc.push ($node.index());
$node = $node.parent().closest ("[role=treeitem]", $tree);
} // while

return loc.reverse();
} // location


function getSelectedNode ($tree) {
var id = $tree.attr("aria-activedescendant");
return $("#" + id, $tree);
} // getSelected


} // initializeWcagBrowser



//alert ("wcag-browser.js loaded");
