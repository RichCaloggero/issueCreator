var $table;
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

function createIssueTable (issues, fieldNames) {
	return createEmptyElements ("table").append (
	createEmptyElements("tr").append (createTableHeaders (["number"].concat (fieldNames))),
	issues.map (	function (issue, index) {
		var fieldValues = [index+1].concat (_.unzip(objectToOrderedPairs(issue, fieldNames))[1]);
		return createEmptyElements ("tr").addClass ("issue")
		.append (setData (createEmptyElements("td", fieldNames.length), fieldValues, "text"));
	}) // map
	); // append

	function createTableHeaders (fieldNames) {
	return setData (createEmptyElements ("th", fieldNames.length), fieldNames, "text");
	} // createTableHeaders
} // createIssueTable


function getData ($elements, method) {
	return $elements.get().map ((element) => $(element)[method] ());
	} // getData

function setData ($elements, values, method) {
	return $elements.each (function (index, element) {
		$(element)[method] (values[index]);
	}); // map
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

	
