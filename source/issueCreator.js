"use strict";
$(document).ready (function () {
const project = {};

initializeWcagBrowser ($("#issues .create .wcag-browser"));

$(project).on ("update", (e, data) => projectUpdated(e.target, data));
initializeProject (project);


/// keyboard handling

$(document)
.on ("keydown", "button", function (e) {
if (e.keyCode === 13 || e.keyCode === 32) {
$(e.target).trigger ("click");
return false;
} // if
}) // synthesize clicks on buttons when pressing enter and spacebar

.on ("focusin", function () {
if ($(".modal").is (":visible")) $(".modal:visible:first .close").focus ();
});

createKeyboardHelp ()
.appendTo ("body")
.on ("focusout", ".close", (e) => {$(e.target).focus(); return false;});

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
prepareDownload ( $("#project .file .csv").prop ("checked"));
} else {
statusMessage ("Need a project name.");
$("#project .projectName").focus ();
} // if
return false;
}) // save

.on ("change", ".file .csv", function (e) {
prepareDownload (e.target.checked);
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
var type = $(fileSelector).data("type");

//debug (`event ${e.type}`);

if (! file) {
statusMessage ("cannot select file.");
return false;
} // if

//debug(`file: ${file.size} ${file.name}`);

reader = new FileReader ();
reader[type] (file);

$(reader).on ("load", function () {
if (type === "readAsText") {
getProjectData ();
} else if (type === "readAsDataURL") {
getScreenshotData ();
} // if

function getProjectData () {
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
} // getProjectData

function getScreenshotData () {
var imageData = reader.result;
$("#issues .create [data-name=screenshot]").attr ("src", imageData);
} // getScreenshotData
}); // file.load
return true;
}) // change .file .selector

.on ("click", ".file .cancel", function (e) {
$("#project .save").focus ();
$("#project .file").hide ();
}) // cancel

.on ("click", ".download", function (e) {
$("#project .file").hide ();
if (! $("#project .file .csv").prop("checked")) project.durty = false;
return true;
});

// helpers

function initializeProject (project, clearLocalStorage) {
var restoredProject, message;
// we use assign here because project is const
Object.assign (project,{
fieldNames: getFieldNames (getIssueFields()),
name: "",
issues: [],
currentIssue: -1,
durty: false
});


if (localStorage) {
if (clearLocalStorage) {
localStorage.project = null;
} else if (localStorage.project) {
restoredProject = JSON.parse(localStorage.project);
Object.assign (project, restoredProject);
message = "loaded from local storage";
} // if

} else {
alert ("Local storage not available, so save often!");
} // if

update (project, {
message: message || "Ready.",
focusOnSelector: (project.issues.length > 0),
save: false // don't want to re-save
});

return project;
} // initializeProject

function loadProject (project) {
$("#project .file .selector").data("type", "readAsText").trigger ("click");
} // loadProject

function prepareDownload (csv) {
if (csv) {
prepareCsv (project.issues, project.fieldNames);
} else {
prepareJson (project);
} // if

return csv;
} // prepareDownload

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
data = Object.assign ({displayStatus: true, message: "", save: true}, data);
$(object).trigger ("update", data);
} // update

function projectUpdated (project, data) {
var message = (data.message)?
" " + data.message : "";
if (localStorage && data.save) {
localStorage.project = JSON.stringify (project);
} // if

$("#project .projectName").val (project.name);
updateAppTitle (project.name);
generateIssueDisplay (project.issues);

if (data.displayStatus) statusMessage (`${project.issues.length} issues${message}.`);
if (data.focusOnSelector) setTimeout (() => $("#issues .selector").focus (), 100);
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
updateIssue ();
return false;
}) // create new issue

.on ("click", ".create .update", function (e) {
updateIssue ($("#issues .selector").val());
return false;
}) // update existing issue

.on ("click", ".create .getScreenshot", function () {
$("#project .file .selector").data("type", "readAsDataURL").trigger ("click");
})

.on ("loaded", ".create .wcag-browser", function () {
$("#issues .create [data-name='guideline-fullText']").html ("");
})

.on ("shown.bs.collapse", ".create .wcag-browser", function (e) {
$("#issues .create .browse").attr ("aria-expanded", "true");
$(".verbosity", e.target).focus ();
})

.on ("hidden.bs.collapse", ".create .wcag-browser", function (e) {
$("#issues .create .browse").attr ("aria-expanded", "false");
})

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

if (index >= 0) {
setIssueData (project.issues[index]);
} // if
return true;
})

.on ("display", ".create .wcag-browser", function (e, data) {
var $short= $("#issues .create [data-name=guideline]");
var $full = $("#issues .create [data-name=guideline-fullText]");
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

function updateIssue (index = -1) {
var invalid = checkValidity(getIssueFields().filter ("input"));

if (invalid.length > 0) {
statusMessage ("Invalid issue; please correct and resubmit.");
invalid[0].focus ();
return false;
} // if

if (index < 0) index = project.issues.length;
project.issues[index] = _.zipObject (project.fieldNames, getIssueData ());
project.durty = true;
project.currentIssue = index;
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
		.append (setContent(createEmptyElements("td", project.fieldNames.length), fieldValues));
	}) // map
	); // append

	function createTableHeaders (fieldNames) {
	return setContent (createEmptyElements ("th", fieldNames.length), fieldNames);
	} // createTableHeaders

function setContent ($elements, data) {
return $elements.map ((index, element) => {$(element).text (data[index]); return element;});
} // setContent

} // createIssueTable

function getIssueData ($issue = getIssueFields()) {
return $issue.get().map ((element) => issueFieldAccessor (element) ());
} // getIssueData

function setIssueData (data, $issue = getIssueFields()) {
return $issue.get().forEach (function (element, index) {
var name = getFieldName ($(element));
var value = (data instanceof Array)? data[index] : data[name];
issueFieldAccessor (element) (value);
}); // forEach
} // setIssueData

function getIssueFields () {
return $("#issues .create [data-name]");
} // getIssueFields

function issueFieldAccessor (element) {
var name = getFieldName ($(element));
var $element = $(element);
//debug ("issueField: ", name);

switch (name) {
case "screenshot": return _.bind($element.attr, $element, "src");

case "guideline-fullText": return _.bind($element.html, $element);

default: return _.bind($element.val, $element);
} // switch

} // issueFieldAccess

function generateIssueSelector (issues) {
$("#issues .selector").empty()
.append (createOptions (issues));
$("#issues .selector").val (project.currentIssue);
//if (project.currentIssue >= 0) setIssueData (project.issues[project.currentIssue]);

function createOptions (issues) {
var $options = $('<option value="-1">[none]</option>');
getIssueField ("title", issues)
.forEach (function (text, index) {
$options = $options.add (`<option value=${index}>${text}</option>`);
}); // forEach

return $options;
} // createIssueSelector
} // generateIssueSelector

function getIssueField (name, issues) {
return issues.map ((issue) => issue[name]);
} // getIssueField

function createBlob (object) {
var data;

if (typeof(object) === "string" || object instanceof String) {
data = new Blob ([object], {type: "application/json"});
} else {
data = new Blob ([JSON.stringify(object)], {type: "application/json"});
} // if

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


/// keyboard help

function createKeyboardHelp ($controls) {
var $headerRow = $('<tr><th>Action</th><th>Key</th></tr>\n');
var $content;

if (! $controls || $controls.length === 0) $controls = $("button[accesskey]");
//debug (`controls: ${$controls.length}`);


$content = $('<table></table>\n').append (
$headerRow,
$controls.map (function (index, control) {
var modifierString = "alt+shift";
var action = $(control).text();
var key = $(control).attr ("accesskey");
//debug (`- ${action}, ${key}`);
return  $(`<tr><td class="action">${action}</td><td class="key">${key}</td></tr>`)[0];
}) // map
); // append

//debug (`- modal: ${$content.html()}`);
return createModal ("keyboardHelp", "Keyboard Help", $content, "Below are the keyboard shortcuts used in this application:");
} // keyboardHelp

function createModal (id, title, $content, description) {
var id_title = `${id}-title`;
var id_description = `${id}-description`;

var $modal =
$(`<div class="modal" id="${id}"  role="dialog" aria-labelledby="${id_title}" aria-describedby="${id_description}"></div>`)
.append (`
<div class="modal-dialog" role="document">
<div class="modal-content">
<div class="modal-header">
<h2 class="modal-title" id="${id_title}">${title}</h2>
<button type="button" class="close" data-dismiss="modal" aria-label="Close">&times;</button>
</div><!-- .modal-header -->

<div class="modal-body">
<div id="${id_description}" class="description"></div>
<div class="content"></div>
</div><!-- .modal-body -->

<div class="modal-footer"></div>

</div><!-- .modal-content -->
</div><!-- .modal-dialog -->
</div><!-- .modal -->
`);

if (description) $(".modal-body .description", $modal).append (`<p>${description}</p>`);
if ($content) $(".modal-body .content", $modal).append ($content);
//debug (`modal: ${$modal.length}`);

// the following focuses on the close button rather than bootstraps default of focusing on the .modal itself
$modal.on ("shown.bs.modal", function (e) {
$(".close", $modal ).focus ();
}); // focus modals when they open

$modal.on ("hidden.bs.modal", ".modal", function (e) {
//$modal.data ("trigger").focus();
}); // focus on the modal's trigger

return $modal;
} // createModal

function fixRangeInputs () {
$("input[type=range]").each (function () {
var min = $(this).attr ("min") || 0;
var max = $(this).attr ("max") || 100;

$(this).before (`<span aria-hidden="true">${min}</span>`)
.after (`<span aria-hidden="true">${max}</span>`);
});

} // fixRangeInputs


}); // ready

//alert ("issueCreator.js loaded");
