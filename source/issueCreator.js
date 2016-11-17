"use strict";
$(document).ready (function () {
const project = {};

initializeWcagBrowser ($("#issues .create .wcag-browser"));

initializeProject (project);
$(project).on ("update", (e, data) => projectUpdated(e.target, data));


/// keyboard handling

$(document).on ("keydown", "button", function (e) {
if (e.keyCode === 13 || e.keyCode === 32) {
$(e.target).trigger ("click");
return false;
} // if
}); // synthesize clicks on buttons when pressing enter and spacebar


/// projects

$("#project")
.on ("click", ".new", function () {
if (project.durty && !confirm ("Continuing will remove unsaved project data! Do you wish to continue?")) return;
initializeProject (project, "clear local storage");
statusMessage ("New Project initialized.");
return false;
}) // new


.on ("click", ".load", function (e) {
if (project.durty && !confirm ("Continuing will remove unsaved project data! Do you wish to continue?")) return;
loadProject (project);
return false;
}) // load

.on ("click", ".save", function (e) {
if (project.name) {
$("#project .file").show()
.find (".csv").focus();
} else {
statusMessage ("Need a project name.");
$("#project .projectName").focus ();
} // if
return false;
}) // save

.on ("change", ".file .csv", function (e) {
if (e.target.checked) {
prepareCsv (project);
} else {
prepareJson (project.issues, project.fieldNames);
} // if

return true;
})

.on ("change", ".projectName", function (e) {
project.name = $(e.target).val ();
update (project, {status: false});
return true;
}) // change projectName

.on ("change", ".file .selector", function (e) {
var fileSelector = e.target;
var file = fileSelector.files[0];
var reader = null;

//debug (`event ${e.type}`);

if (! file) {
statusMessage ("cannot select file.");
return false;
} // if

//debug(`file: ${file.size} ${file.name}`);

reader = new FileReader ();
reader.readAsText (file);

$(reader).on ("load", function () {
var newProject = reader.result;

try {
newProject = JSON.parse (reader.result);
Object.assign (project, newProject);
project.durty = false;
$("#issues .selector").focus ();
update (project, {message: "loaded"});

} catch (e) {
statusMessage (`${e} -- cannot parse file.`);
} // try
}); // file.load
return true;
}) // change .file .selector

.on ("click", ".file .cancel", function (e) {
$("#project .save").focus ();
$("#project .file").hide ();
}) // cancel

.on ("click", ".download", function (e) {
$("#project .file").hide ();
return true;
});

// helpers

function initializeProject (project, clearLocalStorage) {
Object.assign (project,{
fieldNames: getFieldNames ($('#issues .create [data-name]')),
name: "",
issues: [],
durty: false
});


if (localStorage) {
if (clearLocalStorage) {
localStorage.project = null;
} else if (localStorage.project) {
project = JSON.parse(localStorage.project);
} // if

} else {
alert ("Local storage not available, so save often!");
} // if

statusMessage ("Ready.");
return project;
} // initializeProject

function loadProject (project) {
$("#project .file .selector").trigger ("click");
} // loadProject

function prepareJson (project) {
var url =  createBlob (project);
$("#project .file .download").attr ({
"href": url,
"download": project.name + ".json"
});
} // prepareJson

function prepareCsv (list, fields) {
var url =  createBlob (toCsv(list, fields));
$("#project .file .download").attr ({
"href": url,
"download": project.name + ".csv"
});
} // prepareCsv


function update (object, data) {
data = Object.assign ({displayStatus: true, message: ""}, data);
$(object).trigger ("update", data);
} // update

function projectUpdated (project, data) {
var message = (message)?
" " + data.message : "";
if (localStorage) {
localStorage.project = JSON.stringify (project);
} // if

$("#project .projectName").val (project.name);
updateAppTitle (project.name);
generateIssueDisplay (project.issues);

if (data.displayStatus) statusMessage (`${project.issues.length} issues${message}.`);
} // projectUpdated

function updateAppTitle (name) {
if (name) {
$("#app .projectName").text (name);
$("#app .separator").show ();
$("title").text ( $("#app .title").text() );

} else {
$("#app .projectName").text ("");
$("#app .separator").hide ();
$("title").text ( $("#app .name").text() );
} // if

} // updateAppTitle


/// issues

$("#issues")
.on ("click", ".create .add", function (e) {
updateIssue ($("#issues .create [data-name]"));
return false;
}) // create new issue

.on ("click", ".create .update", function (e) {
updateIssue ($("#issues .create [data-name]"), $("#issues .selector").val());
return false;
}) // update existing issue

.on ("loaded", ".create .wcag-browser", function () {
statusMessage ("Guideline data loaded.");
})

.on ("click", ".create .browse", function (e) {
var $browser = $("#issues .create .wcag-browser");
var $browse = $(e.target);

if ($browse.attr("aria-expanded") === "true") {
$browser.hide ();
$browse.attr ("aria-expanded", "false");
} else if ($browse.attr ("aria-expanded") === "false") {
$browser.show ()
.find (".verbosity").focus ();
$browse.attr ("aria-expanded", "true");
} // if

return true;
}) // browse

.on ("click", ".delete", function (e) {
var index = $("#issues .selector").val ();
if (index >= 0) {
project.issues.splice (index, 1);
project.durty = true;
update (project);
} // if

$("#issues .selector").focus ()
.find ("option:first").trigger ("click");
return true;
}) // .delete

.on ("change", ".display .type", function () {
generateIssueDisplay (project.issues);
statusMessage ("Display reset.");
return true;
})

.on ("change", ".selector", function () {
var index = Number($(this).val ());
var issue;

if (index >= 0) {
issue = project.issues[index];
setIssueData ($("#issues .create [data-name]"), issue);
} // if
return true;
})

.on ("display", ".create .wcag-browser", function (e, data) {
var $short= $("#issues .create [data-name=guideline]");
var $full = $("#issues .create [data-name=guidelineFull]");
var $html = $('<div></div>').html (data.html);
var text = $html.find (".sc-handle").text ();
var level = $html.text().match (/\(Level (A+)\)/);
var levelText = (level)? level[0] : "";
//debug ("display: ", levelText);

if (data.verbosity) {
$full.attr ("aria-live", "polite");
} else {
$full.attr ("aria-live", "off");
} // if

$short.val (`${text} ${levelText}`);
$full.html (data.html);
}); // display full text in guideline field



// helpers

function updateIssue ($issue, index = -1) {
var invalid = checkValidity($("#issues .create [data-name]").not ("[data-name=guidelineFull]"));

if (invalid.length > 0) {
statusMessage ("Invalid issue; please correct and resubmit.");
invalid[0].focus ();
return false;
} // if

if (index < 0) index = project.issues.length;
project.issues[index] = _.zipObject (project.fieldNames, getIssueData ($("#issues .create [data-name]")));
project.durty = true;
update (project);
} // updateIssue

function generateIssueDisplay (issues) {
$("#issues .display table, #issues .display ol").remove ();
createIssueDisplay (issues, $("#issues .display .type").val())
.appendTo ("#issues .display");
generateIssueSelector (issues);
} // generateIssueDisplay

function createIssueDisplay (issues, type) {
if (type === "table") {
return createIssueTable (issues, project.fieldNames);
} else if (type === "list") {
return createIssueList (issues, project.fieldNames);
} else {
alert (`createIssueDisplay: invalid type -- ${type}`);
return null;
} // if
} // createIssueDisplay

function createIssueList ($issues, fieldNames) {
	return createEmptyElements ("ol").append (
	issues.map (function (issue) {
		return createEmptyElements ("li").addClass ("issue").append (
		objectToOrderedPairs(issue, fieldNames).map (function (field) {
			return $(`
<div><span>${field[0]} : ${field[1]}</span></div>
<hr>
`);
			}) // map over fields
		); // append
	}) // map over issues
	); // append to list
} // createIssueList

function createIssueTable (issues, fieldNames) {
	return createEmptyElements ("table").append (
	createEmptyElements("tr").append (createTableHeaders (["number"].concat (fieldNames))),
	issues.map (	function (issue, index) {
		var fieldValues = [index+1].concat (_.unzip(objectToOrderedPairs(issue, fieldNames))[1]);
		return createEmptyElements ("tr").addClass ("issue")
		.append (setData (createEmptyElements("td", project.fieldNames.length), fieldValues, "text"));
	}) // map
	); // append

	function createTableHeaders (fieldNames) {
	return setData (createEmptyElements ("th", fieldNames.length), fieldNames, "text");
	} // createTableHeaders
} // createIssueTable

function getIssueData ($issue) {
return getData ($issue, "val");
} // getIssueData

function setIssueData ($issue, data) {
return setData ($issue, data, "val");
} // setIssueData

function generateIssueSelector (issues) {
$("#issues .selector").empty()
.append (createIssueSelector (issues));
} // generateIssueSelector

function createIssueSelector (issues) {
var $options = $('<option value="-1">[none]</option>');
getIssueField ("title", issues)
.forEach ((text, index) => $options = $options.add (`<option value=${index}>${text}</option>`))
return $options;
} // createIssueSelector

function getIssueField (name, issues) {
return issues.map ((issue) => issue[name]);
} // getIssueField

function createBlob (object) {
var data = new Blob ([JSON.stringify(object)], {type: "application/json"});
return URL.createObjectURL(data);
} // createBlob

function getFieldNames ($fields) {
return $fields.map ((i, element) => $(element).data ("name").trim()).get();
} // getFieldNames

function statusMessage (message) {
setTimeout (() => $("#status").html("").text(message), 100);
} // statusMessage

function checkValidity ($fields) {
return $fields.get().filter(function (element) {
var name = element.nodeName.toLowerCase();
//debug ("checking ", name);
if (
(name === "input" || name === "textarea")
&& !element.validity.valid
) return element;
}); // map
} // checkValidity
}); // ready

//alert ("issueCreator.js loaded");
