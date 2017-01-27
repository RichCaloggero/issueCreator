"use strict";


function createEmptyElements (elementName, count = 1) {
	var $elements = $();
	for (var i=0; i<count; i++) {
		$elements = $elements.add ( $(`<${elementName}></${elementName}>`) );
	} // for
	
	return $elements;
} // createEmptyElements


function getFieldName ($field) {
	return get($field, "name");
} // getFieldName

function get ($field, key) {
return $field.data(key);
} // get

function set ($field, key, value) {
return $field.data(key, value);
} // set


function getFieldNames ($fields) {
	return $fields.get().map ((element) => getFieldName($(element)));
} // getFieldNames


function objectToOrderedPairs (object, keys) {
	if (! object) return [];
	if (! keys || keys.length === 0) keys = Object.keys(object);
	return keys.map ((key) => [key, object[key]]);
} // objectToOrderedPairs 


function toCsv (list, keys) {
var result = "";
result += JSON.stringify(keys).slice (1,-1) + "\n";

list.forEach (function (object) {
var values = _.unzip(objectToOrderedPairs(object, keys))[1]
.map ((value) => String(value));
result += JSON.stringify(values).slice (1,-1) + "\n";
}); // forEach item in list

return result;
} // toCsv

/// transformation

var transformers = {
display: {
_default: escapeHtml,
codeExample: marked
}, formData: {
_default: "val",
codeExample: "html",
screenshot: "html"
}
}; // transformers

function getFormData ($fields, transformer = transformers.form) {
return fromPairs(
$fields.get().map (function ($field) {
var name = getFieldName($field);
return [
name,
$field[method(name, transformer)]
]; // return
}) // map
); // fromPairs
} // getFormData

function setFormData ($fields, object, transformer = transformers.form) {
$fields.each (function () {
var $field = $(this);
var name = getFieldName($field);
$field[method(name, transformer)] (object[name]);
}); // each
} // setFormData


function transformObject (object, transformer) {
var identity = function (x) {return x;};
transformer = transformer || transformers.display;
//debug ("transformObject: transformer = ", Object.keys(transformer));

return _.mapValues (object, function (value, key) {
var t = transformer[key] || transformer._default || identity;
if (key === "code-example")
//debug ("mapValues: ", key, t, t(value));

switch (typeof(t)) {
case "function": return t(value);

default: alert ("invalid transformer -- should never happen!");
} // switch
return [];
}); // mapValues
} // transformObject



function method (object, key, transformer) {
var methodName = "";
if (! transformer[key]) {
if (transformer._default) {
methodName = transformer._default;
} else {
alert ("invalid transform, no default set");
throw new Error ("invalid transform, no default set");
} // if

} else if (transformer[key] instanceof Function) {
methodName = transformer[key] (object, key);

} else if (typeof(transformer[key] === "string")) {
methodName = transformer[key];
} // if


return methodName;
} // method

function escapeHtml (text) {
	//debug ("escape:", text);
	text = text.replace (/\&/g, "\&amp;");
text = text.replace (/\</g, "\&lt;");
text = text.replace (/\>/g, "\&gt;");

//debug ("- returns:", text);
return text;
} // escapeHtml

//alert ("utilities.js loaded");
