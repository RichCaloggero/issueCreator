function tree2html (tree) {
// a tree is an array of nodes
// each node is object with properties label and children, where label is a string and children is a tree
// returns a jQuery object

var html = "";

if (! tree || !(tree instanceof Array)) {
alert ("invalid tree data");
throw new Error ("invalid tree data");
} // if

if (tree.length == 0) return "";

html = "<ul>";
tree.forEach (function (node) {
var text;
text = "<li>"
+ makeLabel(node.label)
+ tree2html (node.children)
+ "</li>";
//debug ("node: ", text);
html += text;
}); // forEach node in tree
html += "</ul>";

return html;


function makeLabel (text) {
return `<a href="#">${text}</a>`;
} // makeLabel

} // tree2html

function importTreeData (data) {
var lines = data.split ("\n");

return	importTree(lines, 0);

function importTree (lines, depth) {
var data = null;var line = "";var split = /^([\d]*)(.*)$/;var parseData = /^(.+)=(.+)$/;var level = 0;var label = "";var tree = [];
var node = null;

line = getNextLine ();
while (line) {//		debug ("importNode from", line, " at depth ", depth);data = line.match (split);

if (! data) {
alert ("bad data - no match");
throw new Error("bad data - no match");
} // if

level = data[1], label = data[2];
if (! level) level = 0;


if (level > depth+1) {
alert ("bad data: level should be " + (depth+1) + ", but got " + level);
throw new Error ("bad data - invalid level");
} // if


if (level == depth) {
node = {
label: label,
children: importTree (lines, depth+1)
};

data = label.match (parseData);
if (data) {
node.label = data[1];
node.data = data[2];
} // if data

tree.push (node);
//debug ("importNode: ", level, node.label, node.data);
} // if

if (level < depth) {
lines.unshift (line);
break;
} // if

line = getNextLine ();
} // while more lines

//debug ("tree ", depth, ": ", tree);
return tree;


function getNextLine () {
var line = null;
do {
if (! lines || lines.length == 0) return null;
line = lines.shift().trim();
} while (! line);

return line;
} // getNextLine

} // importTree

} // importTreeData
