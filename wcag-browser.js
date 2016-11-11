"use strict";
function initializeWcagBrowser ($ui) {
//debug ("--start--");

// import data
var import_treeData = jQuery.ajax({url: "wcag-data.txt", dataType: "text"})
.fail (function (error) {alert (JSON.stringify(error));})
.done (function (data) {
var html, tree, $menu;

//debug ("text: ", data);
tree = importTreeData (data);
//debug ("tree: ", tree);

html = tree2html (tree);
//debug ("html: ", html);

$(".menu", $ui).html (html);
//debug ("html added");

$(".menu > ul", $ui)
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

afterOpen: function ($node) {
}, // afterOpen

close: function ($node) {
$node
.superfish("hide");
} // close

}); // makeAccessible

}); // ajax

var import_wcagData = $.get ("http://www.w3.org/TR/WCAG20/")
.fail (function (error) {
alert (error.message);
}).done (function (data) {
//debug ("Guidelines loaded");

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
var $tree = $(".menu", $ui);
var loc, text;

loc = location($tree, getSelectedNode($tree));
//debug (`loc: ${loc}`);
text = extractText($guidelines, selectors, loc);
//debug (`text: ${text}`);
$ui.trigger ("loaded");
display (text);

$tree.on ("selectNode", function (e) {
var loc, text;

//debug ();
loc = location($tree, $(e.target));
//debug (`loc: ${loc}`);
text = extractText($guidelines, selectors, loc);
//debug (`text: ${text}`);
display (text);
});

function display (text) {
var loc = location($tree, getSelectedNode($tree));

if (loc.length-1 >= getVerbosity()) {
$(".text", $ui).attr ("aria-live", "polite");
} else {
$(".text", $ui).attr ("aria-live", "off");
} // if

setTimeout (function () {
$(".text", $ui).html (text);
$ui.trigger ("display", $(".text", $ui).text());
}, 200);
} // display

function getVerbosity () {
return $(".verbosity", $ui).val();
} // getVerbosity


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

function getSelectedNode ($tree) {
var id = $tree.attr("aria-activedescendant");
return $("#" + id, $tree);
} // getSelected


} // initializeWcagBrowser



//alert ("wcag-browser.js loaded");
