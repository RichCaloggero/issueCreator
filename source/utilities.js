"use strict";



function getData ($elements, method) {
	return $elements.get().map ((element) => $(element)[method] ());
	} // getData

function setData ($elements, data, method) {
	$elements.each (function (index, element) {
		var value = (data instanceof Array)? data[index] : data[getFieldName($(element))];
		$(element)[method] (value);
	}); // each

return $elements;
} // setData

function createEmptyElements (elementName, count = 1) {
	var $elements = $();
	for (var i=0; i<count; i++) {
	$elements = $elements.add ( $(`<${elementName}></${elementName}>`) );
} // for

return $elements;
} // createEmptyElements

function issueToObject ($fields) {
	return pairsToObject (
	_.zip (getFieldNames($fields), getData($fields, "val"))
	); // pairsToObject
} // issueToObject

function setIssueData (object, $fields) {
	var fieldNames = getFieldNames ($fields);
	return setData ($fields, objectToOrderedPairs(object, fieldNames), "val");
	} // setIssueData


function get ($field, key) {
	return $field.data(key);
} // get

function set ($field, key, value) {
	return $field.data (key, value);
} // set

function getFieldName ($field) {
	return get($field, "name");
} // getFieldName

function getFieldNames ($fields) {
	return $fields.get().map ((element) => getFieldName($(element)));
	} // getFieldNames

function objectToOrderedPairs (object, keys) {
	if (! object) return [];
	if (! keys || keys.length === 0) keys = Object.keys(object);
	return keys.map ((key) => [key, object[key]]);
	} // objectToOrderedPairs 

function pairsToObject (pairs) {
	var object;
	pairs.forEach ((pair) => object[pair[0]] = pair[1]);
	return object;
	} // pairsToObject 


/// tests

/*var $table;
var issues = [{
	title: "title1",
	code: "code1",
	guideline: "1.1.1"
}, {
	title: "title2",
	code: "code2",
	guideline: "2.1.1"
}];
debug ("issues: ", issues.length);

$table = createIssueTable (issues, ["guideline", "code", "title"]);
debug ("table: ", $("tr", $table).length);
$table.appendTo ("body");
*/

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

//alert ("utilities.js loaded");
