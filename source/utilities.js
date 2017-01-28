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
codeExample: marked,
screenshot: identity

}, formData: {
_default: "val",
guideline_fullText: "html",
screenshot: {
get: function () {return this.html();},
set: function (value) {
value = (isString(value))?
{src: value} : value;
$("img", this).attr(value); // attr
} // set
} // image
} // formData
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

function buildFormProcessor ($form, handler) {
var $fields = $form.find ("[data-name]");
var form = {};

$fields.each (function () {
var $field = $(this);
var name = $field.data("name");
var descriptor = {};
var _handle = handler[name] || handler._default || undefined;
descriptor = createDescriptor ($field, _handle);
Object.defineProperty (form, name, descriptor);
}); // each $fields

return form;
} // buildFormProcessor

function createDescriptor ($field, _handle) {
var name = $field.data("name");
var descriptor = Object.create(null);
//alert ("createDescriptor for " + name);

if (isString(_handle)) {
descriptor.get = descriptor.set = _handle;
//alert ("string descriptor for " + name + " is " + _handle);

} else if (typeof(_handle) === "object" || _handle instanceof Object) {
Object.assign(descriptor, _handle);
//alert ("object descriptor for " + name + " is " + descriptor);

} else {
alert ("invalid form handler for field named " + name);
throw new Error ("invalid form handler for field named " + name);
} // if

if (isString(descriptor.get)) descriptor.get = $field[descriptor.get];
if (isString(descriptor.set)) descriptor.set = $field[descriptor.set];
//alert ("descriptor: " + descriptor.toSource());

descriptor.get = _.bind (descriptor.get, $field);
descriptor.set = _.bind (descriptor.set, $field);
descriptor.enumerable = true;

return descriptor;
} // createDescriptor

function fieldData ($field, value) {
if (arguments.length < 1) return undefined;

if (arguments.length === 1) return $field.data("get") ();
return $field.data ("set") (value);
} // fieldData


function transformObject (object, transformer) {
transformer = transformer || transformers.display;
//debug ("transformObject: transformer = ", Object.keys(transformer));

return _.mapValues (object, function (value, key) {
var t = transformer[key] || transformer._default || identity;
//if (key === "code-example")
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

function isString (s) {return typeof(s) === "string" || s instanceof String;}
function isObject (o) {return typeof(o) === "object" || o instanceof Object;}
function identity (x) {return x;};

//alert ("utilities.js loaded");
