function debug () {
//return;
var text = $.map ($.makeArray (arguments), function (arg) {
	var type = typeof(arg);
	if (type === "array" || type == "object") return JSON.stringify(arg) + "\n";
	else return arg;
}).join (" ");

if ($("#debug").length > 0) {
$("#debug").append (document.createTextNode(text), "<br>\n");
} else {
console.log (text);
} // if
} // debug
