"use strict";
/* makeAccessible
  arguments:
 options,
 or container, name, options
  ** Note: container should be the top "ul" element in the list structure

  This function adds aria tree markup to the superfish menu structure, as well as keyboard navigation.
  Options:
  - open: called when a node is opened with node as argument;
  - close: called when a node is closed, with node as an argument
  - beforeOpen: called before open with node as an argument
  - role_root: role of root element (default: "tree")
  - role_group: role of grouping element (default: "group")
  - role_item: role of branch (default: "treeitem")
  - state_expanded: indicates expanded branch (default: "aria-expanded")

***  note: if open and close functions are not supplied, this function will have no effect; the open and close functions should generally show / hide nodes, respectively.
*/

function makeAccessible($container, name) {
  // defaults
  var options = {
    open: function open() {}, close: function close() {},
    role_root: "tree",
    role_group: "group",
    role_item: "treeitem",
    state_expanded: "aria-expanded"
  }; // defaults

  if (arguments.length == 1) {
    options = $.extend(options, arguments[0]);
  } else if (arguments.length == 2) {
    options = $.extend(options, { $container: $container, name: name });
  } else if (arguments.length == 3) {
    options = $.extend(options, { $container: $container, name: name }, arguments[2]);
  } // if

  var activeDescendant_id = options.name + "activeDescendant";
  //debug ("makeAccessible:", options);

  return addKeyboardNavigation(addAria(options.$container));

  function addAria($container) {
    /* focus management is done via aria-activedescendant rather than a roving tabindex. See the following for an explanation:
    Keyboard-navigable JavaScript widgets - Accessibility | MDN
    https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets
    */
    var $ul;
    var $hasChildren, $li;

    // remove all implicit keyboard focus handlers (i.e. links and buttons should not be tabbable here since we're using aria-activedescendant to manage focus)
    $("a, button, input, textarea, select", $container).attr("tabindex", "-1");
    //debug ("- implicit keyboard handling removed");

    // "ul" requires role="group"
    $ul = $("ul", $container).addBack().attr("role", options.role_group);
    //debug ("$ul.length: ", $ul.length);

    // "li" are tree nodes and require role="treeitem"
    $li = $("li", $container).attr({ role: options.role_item });
    //debug ("$li.length: ", $li.length);

    // add aria-expanded to nodes only if they are not leaf nodes
    $hasChildren = $li.has("ul");
    //debug ("hasChildren.length: ", $hasChildren.length);
    $hasChildren.attr(options.state_expanded, "false");

    // unhide the top-level nodes and tell the container that the first node should have focus
    $ul.first().find("li").first().attr({ "id": activeDescendant_id });

    // replace role="group" with role="tree" on the first group and cause the tree to look for our currently active node
    $ul.first().attr({
      "role": options.role_root,
      "tabindex": "0",
      "aria-activedescendant": activeDescendant_id
    }).focus();

    return $container;
  } // addAria

  function addKeyboardNavigation($container) {

    // add keyboard handler
    $container.on("keydown", keyboardHandler);
    return $container;

    function keyboardHandler(e) {
      var key = e.which || e.keyCode;
      var $newNode = null;
      var $currentNode = getCurrentNode();

      if (key >= 35 && key <= 40) {
        //debug ("key: " + key);
        $newNode = navigate(getCurrentNode(), key);

        if (isValidNode($newNode) && $newNode !== $currentNode) {
          //debugNode ($newNode, "navigate: ");
          if (options.leaveNode && options.leaveNode instanceof Function) options.leaveNode($currentNode, $newNode);
          setCurrentNode($newNode);
        } // if
        return false;
      } // if

      // key not handled above, so let it keep its default action
      return true;
    } // keyboardHandler


    // this function defines the actual keyboard behavior seen
    function navigate($start, key) {
      //debugNode ($start, "navigate: ");
      if (!isValidNode($start)) return null;

      switch (key) {
        case 38:
          return previous($start); // upArrow moves to previous sibling
        case 40:
          return next($start); // downArrow moves to next sibling

        // leftArrow moves up a level and closes
        case 37:
          if (options.beforeClose && options.beforeClose instanceof Function) options.beforeClose($start);
          $start = up($start);
          close($start);
          return $start;

        // rightArrow opens and moves down a level
        case 39:
          if (!isOpened($start)) {
            $start = open($start);
            $start = down($start);
            if (options.afterOpen && options.afterOpen instanceof Function) options.afterOpen($start);
          } // if
          return $start;

        default:
          return null;
      } // switch

      function hasChildren($node) {
        return $node.attr(options.state_expanded);
      } // hasChildren


      function isOpened($node) {
        return isValidNode($node) && $node.attr(options.state_expanded) === "true";
      } // isOpened

      function open($node) {
        if (hasChildren($node) && !isOpened($node)) {
          $node.attr(options.state_expanded, "true");
          if (options.open && options.open instanceof Function) options.open($node);
        } // if

        return $node;
      } // open

      function close($node) {
        if (isOpened($node)) {
          $node.attr(options.state_expanded, "false");
          if (options.close && options.close instanceof Function) options.close($node);
        } // if
        return $node;
      } // close

      function next($node) {
        return $node.next("[role=" + options.role_item + "]");
      } // next

      function previous($node) {
        return $node.prev("[role=" + options.role_item + "]");
      } // previous

      function up($node) {
        return $node.parent().closest("[role=" + options.role_item + "]");
      } // up

      function down($node) {
        return $node.find("[role=" + options.role_item + "]:first");
      } // down
    } // navigate


    function getCurrentNode() {
      var $node;
      if (!activeDescendant_id) {
        alert("active descendant not defined");
        return null;
      } // if

      $node = $("#" + activeDescendant_id);
      return isValidNode($node) ? $node : null;
    } // getCurrentNode

    function setCurrentNode($newNode) {
      var $node = getCurrentNode();

      if (isValidNode($newNode) && isValidNode($node)) {

        $node.removeAttr("id");
        $newNode.attr({ "id": activeDescendant_id });

        $container.removeAttr("aria-activedescendant").attr("aria-activedescendant", activeDescendant_id);

        if (options.currentNode && options.currentNode instanceof Function) options.currentNode($newNode);

        return $newNode;
      } // if valid

      return null;
    } // setCurrentNode

    function isValidNode($node) {
      return $node && $node.length == 1;
    } // isValidNode


    function debugNode($node, label) {
      //return;
      var info = "(invalid)";

      if (isValidNode($node)) info = $node[0].nodeName + $node.find("a:first").text();
      if (label) debug(label, info);
      return info;
    } // debugNode
  } // addKeyboardNavigation
} // makeAccessible

/*function debug (text) {
//return;
var text = $.map ($.makeArray (arguments), function (arg) {
	var type = typeof(arg);
	if (type === "array" || type == "object") return JSON.stringify(arg) + "\n";
	else return arg;
}).join (" ");

if ($("#debug").length > 0) {
if (! text) {
$("#debug").html ("");
} else {
	$("#debug").append (document.createTextNode(text), "<br>\n");
} // if

} else {
console.error (text);
} // if
} // debug
*/

//alert ("makeAccessible loaded");
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function debug(text) {
  //return;
  var text = $.map($.makeArray(arguments), function (arg) {
    var type = typeof arg === "undefined" ? "undefined" : _typeof(arg);
    if (type === "array" || type == "object") return JSON.stringify(arg) + "\n";else return arg;
  }).join(" ");

  if ($("#debug").length > 0) {
    if (!text) {
      $("#debug").html("");
    } else {
      $("#debug").append(document.createTextNode(text), "<br>\n");
    } // if
  } else {
    console.error(text);
  } // if
} // debug

function debugNode($node, label) {
  //return;
  var info = "(invalid)";

  if (isValidNode($node)) info = $node[0].nodeName + $node.find("a:first").text();
  if (label) debug(label, info);
  return info;

  function isValidNode($node) {
    return $node && $node.length == 1;
  } // isValidNode
} // debugNode
"use strict";

function tree2html(tree) {
  // a tree is an array of nodes
  // each node is object with properties label and children, where label is a string and children is a tree
  // returns a jQuery object

  var html = "";

  if (!tree || !(tree instanceof Array)) {
    alert("invalid tree data");
    throw new Error("invalid tree data");
  } // if

  if (tree.length == 0) return "";

  html = "<ul>";
  tree.forEach(function (node) {
    var text;
    text = "<li>" + makeLabel(node.label) + tree2html(node.children) + "</li>";
    //debug ("node: ", text);
    html += text;
  }); // forEach node in tree
  html += "</ul>";

  return html;

  function makeLabel(text) {
    return "<a href=\"#\">" + text + "</a>";
  } // makeLabel
} // tree2html

function importTreeData(data) {
  var lines = data.split("\n");

  return importTree(lines, 0);

  function importTree(lines, depth) {
    var data = null;
    var line = "";
    var split = /^([\d]*)(.*)$/;
    var parseData = /^(.+)=(.+)$/;
    var level = 0;
    var label = "";
    var tree = [];
    var node = null;

    line = getNextLine();
    while (line) {
      //		debug ("importNode from", line, " at depth ", depth);
      data = line.match(split);

      if (!data) {
        alert("bad data - no match");
        throw new Error("bad data - no match");
      } // if

      level = data[1], label = data[2];
      if (!level) level = 0;

      if (level > depth + 1) {
        alert("bad data: level should be " + (depth + 1) + ", but got " + level);
        throw new Error("bad data - invalid level");
      } // if


      if (level == depth) {
        node = {
          label: label,
          children: importTree(lines, depth + 1)
        };

        data = label.match(parseData);
        if (data) {
          node.label = data[1];
          node.data = data[2];
        } // if data

        tree.push(node);
        //debug ("importNode: ", level, node.label, node.data);
      } // if

      if (level < depth) {
        lines.unshift(line);
        break;
      } // if

      line = getNextLine();
    } // while more lines

    //debug ("tree ", depth, ": ", tree);
    return tree;

    function getNextLine() {
      var line = null;
      do {
        if (!lines || lines.length == 0) return null;
        line = lines.shift().trim();
      } while (!line);

      return line;
    } // getNextLine
  } // importTree
} // importTreeData
"use strict";

$(document).ready(function () {
	var project = {};

	initializeWcagBrowser($("#issues .create .wcag-browser"));

	$(project).on("update", function (e, data) {
		return projectUpdated(e.target, data);
	});
	initializeProject(project);
	fixRangeInputs();

	/// keyboard handling

	$(document).on("keydown", "button", function (e) {
		if (e.keyCode === 13 || e.keyCode === 32) {
			$(e.target).trigger("click");
			return false;
		} // if
	}) // synthesize clicks on buttons when pressing enter and spacebar

	.on("focusin", function () {
		if ($(".modal").is(":visible")) $(".modal:visible:first .close").focus();
	});

	createKeyboardHelp().appendTo("body").on("focusout", ".close", function (e) {
		$(e.target).focus();return false;
	});

	/// projects

	$("#project").on("click", ".new", function () {
		if (project.durty && !confirm("Continuing will remove unsaved project data! Do you wish to continue?")) return;
		initializeProject(project, "clear local storage");
		statusMessage("New Project initialized.");
		return false;
	}) // new


	.on("click", ".load", function (e) {
		if (project.durty && !confirm("Continuing will remove unsaved project data! Do you wish to continue?")) return;
		loadProject(project);
		return false;
	}) // load

	.on("click", ".save", function (e) {
		if (project.name) {
			$("#project .file").show().find(".csv").focus();
			prepareDownload($("#project .file .csv").prop("checked"));
		} else {
			statusMessage("Need a project name.");
			$("#project .projectName").focus();
		} // if
		return false;
	}) // save

	.on("change", ".file .csv", function (e) {
		prepareDownload(e.target.checked);
		return true;
	}).on("change", ".projectName", function (e) {
		project.name = $(e.target).val();
		update(project, { status: false });
		return true;
	}) // change projectName

	.on("change", ".file .selector", function (e) {
		var fileSelector = e.target;
		var file = fileSelector.files[0];
		var reader = null;
		var type = $(fileSelector).data("type");

		//debug (`event ${e.type}`);

		if (!file) {
			statusMessage("cannot select file.");
			return false;
		} // if

		//debug(`file: ${file.size} ${file.name}`);

		reader = new FileReader();
		reader[type](file);

		$(reader).on("load", function () {
			if (type === "readAsText") {
				getProjectData();
			} else if (type === "readAsDataURL") {
				getScreenshotData();
			} // if

			function getProjectData() {
				var newProject = reader.result;

				try {
					newProject = JSON.parse(reader.result);
					Object.assign(project, newProject);
					project.durty = false;
					$("#issues .selector").focus();
					update(project, { message: "loaded" });
				} catch (e) {
					statusMessage(e + " -- cannot parse file.");
				} // try
			} // getProjectData

			function getScreenshotData() {
				var imageData = reader.result;
				$("#issues .create [data-name=screenshot]").attr("src", imageData);
			} // getScreenshotData
		}); // file.load
		return true;
	}) // change .file .selector

	.on("click", ".file .cancel", function (e) {
		$("#project .save").focus();
		$("#project .file").hide();
	}) // cancel

	.on("click", ".download", function (e) {
		$("#project .file").hide();
		if (!$("#project .file .csv").prop("checked")) project.durty = false;
		return true;
	});

	// helpers

	function initializeProject(project, clearLocalStorage) {
		var restoredProject, message;
		// we use assign here because project is const
		Object.assign(project, {
			fieldNames: getFieldNames(getIssueFields()),
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
				Object.assign(project, restoredProject);
				message = "loaded from local storage";
			} // if
		} else {
			alert("Local storage not available, so save often!");
		} // if

		update(project, {
			message: message || "Ready.",
			focusOnSelector: project.issues.length > 0,
			save: false // don't want to re-save
		});

		return project;
	} // initializeProject

	function loadProject(project) {
		$("#project .file .selector").data("type", "readAsText").trigger("click");
	} // loadProject

	function prepareDownload(csv) {
		if (csv) {
			prepareCsv(project.issues, project.fieldNames);
		} else {
			prepareJson(project);
		} // if

		return csv;
	} // prepareDownload

	function prepareJson(project) {
		var url = createBlob(project);
		$("#project .file .download").attr({
			"href": url,
			"download": project.name + ".json"
		});
	} // prepareJson

	function prepareCsv(list, fields) {
		var url = createBlob(toCsv(list, fields));
		$("#project .file .download").attr({
			"href": url,
			"download": project.name + ".csv"
		});
	} // prepareCsv


	function update(object, data) {
		data = Object.assign({ displayStatus: true, message: "", save: true }, data);
		$(object).trigger("update", data);
	} // update

	function projectUpdated(project, data) {
		var message = data.message ? " " + data.message : "";
		if (localStorage && data.save) {
			localStorage.project = JSON.stringify(project);
			alert("saved in local storage");
		} // if

		$("#project .projectName").val(project.name);
		updateAppTitle(project.name);
		generateIssueDisplay(project.issues);

		if (data.displayStatus) statusMessage(project.issues.length + " issues" + message + ".");
		if (data.focusOnSelector) setTimeout(function () {
			return $("#issues .selector").focus();
		}, 100);
	} // projectUpdated

	function updateAppTitle(name) {
		if (name) {
			$("#app .projectName").text(name);
			$("#app .separator").show();
			$("title").text($("#app .title").text());
		} else {
			$("#app .projectName").text("");
			$("#app .separator").hide();
			$("title").text($("#app .name").text());
		} // if
	} // updateAppTitle


	/// issues

	$("#issues").on("click", ".create .add", function (e) {
		updateIssue();
		return false;
	}) // create new issue

	.on("click", ".create .update", function (e) {
		updateIssue($("#issues .selector").val());
		return false;
	}) // update existing issue

	.on("click", ".create .getScreenshot", function () {
		$("#project .file .selector").data("type", "readAsDataURL").trigger("click");
	}).on("loaded", ".create .wcag-browser", function () {
		$("#issues .create [data-name='guideline-fullText']").html("");
	}).on("shown.bs.collapse", ".create .wcag-browser", function (e) {
		$("#issues .create .browse").attr("aria-expanded", "true");
		$(".verbosity", e.target).focus();
	}).on("hidden.bs.collapse", ".create .wcag-browser", function (e) {
		$("#issues .create .browse").attr("aria-expanded", "false");
	}).on("click", ".delete", function (e) {
		var index = $("#issues .selector").val();
		if (index >= 0) {
			project.issues.splice(index, 1);
			project.durty = true;
			update(project);
		} // if

		$("#issues .selector").focus().find("option:first").trigger("click");
		return true;
	}) // .delete

	.on("change", ".display .type", function () {
		generateIssueDisplay(project.issues);
		statusMessage("Display reset.");
		return true;
	}).on("change", ".selector", function () {
		var index = Number($(this).val());

		if (index >= 0) {
			setIssueData(project.issues[index]);
		} // if
		return true;
	}).on("display", ".create .wcag-browser", function (e, data) {
		var $short = $("#issues .create [data-name=guideline]");
		var $full = $("#issues .create [data-name=guideline-fullText]");
		var $html = $('<div></div>').html(data.html);
		var text = $html.find(".sc-handle").text();
		var level = $html.text().match(/\(Level (A+)\)/);
		var levelText = level ? level[0] : "";
		//debug ("display: ", levelText);

		if (data.verbosity) {
			$full.attr("aria-live", "polite");
		} else {
			$full.attr("aria-live", "off");
		} // if

		$short.val(text + " " + levelText);
		$full.html(data.html);
	}); // display full text in guideline field


	// helpers

	function updateIssue() {
		var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;

		var invalid = checkValidity(getIssueFields().filter("input"));

		if (invalid.length > 0) {
			statusMessage("Invalid issue; please correct and resubmit.");
			invalid[0].focus();
			return false;
		} // if

		if (index < 0) index = project.issues.length;
		project.issues[index] = _.zipObject(project.fieldNames, getIssueData());
		project.durty = true;
		project.currentIssue = index;
		update(project);
	} // updateIssue


	function generateIssueDisplay(issues) {
		$("#issues .display table, #issues .display ol").remove();
		createIssueDisplay(issues, $("#issues .display .type").val()).appendTo("#issues .display");
		generateIssueSelector(issues);
	} // generateIssueDisplay

	function createIssueDisplay(issues, type) {
		if (type === "table") {
			return createIssueTable(issues, project.fieldNames);
		} else if (type === "list") {
			return createIssueList(issues, project.fieldNames);
		} else {
			alert("createIssueDisplay: invalid type -- " + type);
			return null;
		} // if
	} // createIssueDisplay

	function createIssueList($issues, fieldNames) {
		return createEmptyElements("ol").append(issues.map(function (issue) {
			return createEmptyElements("li").addClass("issue").append(objectToOrderedPairs(issue, fieldNames).map(function (field) {
				return $("\n<div><span>" + field[0] + " : " + field[1] + "</span></div>\n<hr>\n");
			}) // map over fields
			); // append
		}) // map over issues
		); // append to list
	} // createIssueList

	function createIssueTable(issues, fieldNames) {
		return createEmptyElements("table").append(createEmptyElements("tr").append(createTableHeaders(["number"].concat(fieldNames))), issues.map(function (issue, index) {
			var fieldValues = [index + 1].concat(_.unzip(objectToOrderedPairs(issue, fieldNames))[1]);
			return createEmptyElements("tr").addClass("issue").append(setContent(createEmptyElements("td", project.fieldNames.length), fieldValues));
		}) // map
		); // append

		function createTableHeaders(fieldNames) {
			return setContent(createEmptyElements("th", fieldNames.length), fieldNames);
		} // createTableHeaders

		function setContent($elements, data) {
			return $elements.map(function (index, element) {
				$(element).text(data[index]);return element;
			});
		} // setContent
	} // createIssueTable

	function getIssueData() {
		var $issue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getIssueFields();

		return $issue.get().map(function (element) {
			return issueFieldAccessor(element)();
		});
	} // getIssueData

	function setIssueData(data) {
		var $issue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getIssueFields();

		return $issue.get().forEach(function (element, index) {
			var name = getFieldName($(element));
			var value = data instanceof Array ? data[index] : data[name];
			issueFieldAccessor(element)(value);
		}); // forEach
	} // setIssueData

	function getIssueFields() {
		return $("#issues .create [data-name]");
	} // getIssueFields

	function issueFieldAccessor(element) {
		var name = getFieldName($(element));
		var $element = $(element);
		//debug ("issueField: ", name);

		switch (name) {
			case "screenshot":
				return _.bind($element.attr, $element, "src");

			case "guideline-fullText":
				return _.bind($element.html, $element);

			default:
				return _.bind($element.val, $element);
		} // switch
	} // issueFieldAccess

	function generateIssueSelector(issues) {
		$("#issues .selector").empty().append(createOptions(issues));
		$("#issues .selector").val(project.currentIssue);
		//if (project.currentIssue >= 0) setIssueData (project.issues[project.currentIssue]);

		function createOptions(issues) {
			var $options = $('<option value="-1">[none]</option>');
			getIssueField("title", issues).forEach(function (text, index) {
				$options = $options.add("<option value=" + index + ">" + text + "</option>");
			}); // forEach

			return $options;
		} // createIssueSelector
	} // generateIssueSelector

	function getIssueField(name, issues) {
		return issues.map(function (issue) {
			return issue[name];
		});
	} // getIssueField

	function createBlob(object) {
		var data;

		if (typeof object === "string" || object instanceof String) {
			data = new Blob([object], { type: "application/json" });
		} else {
			data = new Blob([JSON.stringify(object)], { type: "application/json" });
		} // if

		return URL.createObjectURL(data);
	} // createBlob

	function getFieldNames($fields) {
		return $fields.map(function (i, element) {
			return $(element).data("name").trim();
		}).get();
	} // getFieldNames

	function statusMessage(message) {
		setTimeout(function () {
			return $("#status").html("").text(message);
		}, 100);
	} // statusMessage

	function checkValidity($fields) {
		return $fields.get().filter(function (element) {
			var name = element.nodeName.toLowerCase();
			//debug ("checking ", name);
			if ((name === "input" || name === "textarea") && !element.validity.valid) return element;
		}); // map
	} // checkValidity


	/// keyboard help

	function createKeyboardHelp($controls) {
		var $headerRow = $('<tr><th>Action</th><th>Key</th></tr>\n');
		var $content;

		if (!$controls || $controls.length === 0) $controls = $("button[accesskey]");
		//debug (`controls: ${$controls.length}`);


		$content = $('<table></table>\n').append($headerRow, $controls.map(function (index, control) {
			var modifierString = "alt+shift";
			var action = $(control).text();
			var key = $(control).attr("accesskey");
			//debug (`- ${action}, ${key}`);
			return $("<tr><td class=\"action\">" + action + "</td><td class=\"key\">" + key + "</td></tr>")[0];
		}) // map
		); // append

		//debug (`- modal: ${$content.html()}`);
		return createModal("keyboardHelp", "Keyboard Help", $content, "Below are the keyboard shortcuts used in this application:");
	} // keyboardHelp

	function createModal(id, title, $content, description) {
		var id_title = id + "-title";
		var id_description = id + "-description";

		var $modal = $("<div class=\"modal\" id=\"" + id + "\"  role=\"dialog\" aria-labelledby=\"" + id_title + "\" aria-describedby=\"" + id_description + "\"></div>").append("\n<div class=\"modal-dialog\" role=\"document\">\n<div class=\"modal-content\">\n<div class=\"modal-header\">\n<h2 class=\"modal-title\" id=\"" + id_title + "\">" + title + "</h2>\n<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">&times;</button>\n</div><!-- .modal-header -->\n\n<div class=\"modal-body\">\n<div id=\"" + id_description + "\" class=\"description\"></div>\n<div class=\"content\"></div>\n</div><!-- .modal-body -->\n\n<div class=\"modal-footer\"></div>\n\n</div><!-- .modal-content -->\n</div><!-- .modal-dialog -->\n</div><!-- .modal -->\n");

		if (description) $(".modal-body .description", $modal).append("<p>" + description + "</p>");
		if ($content) $(".modal-body .content", $modal).append($content);
		//debug (`modal: ${$modal.length}`);

		// the following focuses on the close button rather than bootstraps default of focusing on the .modal itself
		$modal.on("shown.bs.modal", function (e) {
			$(".close", $modal).focus();
		}); // focus modals when they open

		$modal.on("hidden.bs.modal", ".modal", function (e) {
			//$modal.data ("trigger").focus();
		}); // focus on the modal's trigger

		return $modal;
	} // createModal

	function fixRangeInputs() {
		$("input[type=range]").each(function () {
			var min = $(this).attr("min") || 0;
			var max = $(this).attr("max") || 100;

			$(this).before("<span aria-hidden=\"true\">" + min + "</span>").after("<span aria-hidden=\"true\">" + max + "</span>");
		});
	} // fixRangeInputs

}); // ready

//alert ("issueCreator.js loaded");
"use strict";

function toCsv(list, keys) {
	var result = "";
	result += JSON.stringify(keys).slice(1, -1) + "\n";

	list.forEach(function (object) {
		var values = _.unzip(objectToOrderedPairs(object, keys))[1].map(function (value) {
			return String(value);
		});
		debug("values: ", values);
		result += JSON.stringify(values).slice(1, -1) + "\n";
	}); // forEach item in list

	return result;
} // toCsv

/// test

var list = [{
	a: 1, b: 2, c: 3
}, {
	a: 4, b: 5, c: 6
}];
"use strict";

function createEmptyElements(elementName) {
	var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

	var $elements = $();
	for (var i = 0; i < count; i++) {
		$elements = $elements.add($("<" + elementName + "></" + elementName + ">"));
	} // for

	return $elements;
} // createEmptyElements


function getFieldName($field) {
	return get($field, "name");
} // getFieldName

function get($field, key) {
	return $field.data(key);
} // get

function set($field, key, value) {
	return $field.data(key, value);
} // set


function getFieldNames($fields) {
	return $fields.get().map(function (element) {
		return getFieldName($(element));
	});
} // getFieldNames


function objectToOrderedPairs(object, keys) {
	if (!object) return [];
	if (!keys || keys.length === 0) keys = Object.keys(object);
	return keys.map(function (key) {
		return [key, object[key]];
	});
} // objectToOrderedPairs 


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
//debug ("issues: ", issues.length);

$table = createIssueTable (issues, ["guideline", "code", "title"]);
//debug ("table: ", $("tr", $table).length);
$table.appendTo ("body");
*/

function toCsv(list, keys) {
	var result = "";
	result += JSON.stringify(keys).slice(1, -1) + "\n";

	list.forEach(function (object) {
		var values = _.unzip(objectToOrderedPairs(object, keys))[1].map(function (value) {
			return String(value);
		});
		result += JSON.stringify(values).slice(1, -1) + "\n";
	}); // forEach item in list

	return result;
} // toCsv

//alert ("utilities.js loaded");
"use strict";

function initializeWcagBrowser($ui, $display) {
  //debug ("--start--");

  // import data
  var import_treeData = jQuery.ajax({ url: "wcag-data.txt", dataType: "text" }).fail(function (error) {
    alert(JSON.stringify(error));
  }).done(function (data) {
    var html, tree, $menuContainer, $menu;
    $menuContainer = $(".menu", $ui);

    //debug ("text: ", data);
    tree = importTreeData(data);
    //debug ("tree: ", tree);

    html = tree2html(tree);
    //debug ("html: ", html);

    $menuContainer.html(html);
    //debug ("html added");

    $("ul:first", $menuContainer).addClass("sf-menu");

    // initialise plugin
    $menu = $(".sf-menu", $ui).superfish({
      //add options here if required
    });

    makeAccessible($menu, "a11y-", {
      currentNode: function currentNode($node) {
        $node.trigger("selectNode");
      },

      open: function open($node) {
        $node.superfish("show");
      }, // open

      close: function close($node) {
        $node.superfish("hide");
      } // close

    }); // makeAccessible
  }); // ajax

  var import_wcagData = $.get("http://www.w3.org/TR/WCAG20/").fail(function (error) {
    alert("cannot get guideline data -- " + JSON.stringify(error));
  }).done(function (data) {
    //debug ("Guidelines loaded");
    $ui.trigger("loaded");
  }); // ajax

  $.when(import_treeData, import_wcagData).then(function (treeData, wcagData) {
    var selectors = [[".div2", ".principle"], [".div3", ".guideline :header:first"], [".sc", ".scinner"]];
    var $wcag = $('<div class="document" id="wcag-2.0"></div>').append(wcagData);
    var $guidelines = $wcag.find(".body .div1:first");
    var $tree = $(".sf-menu", $ui);

    display(getFullText(getSelectedNode($tree)), $display);

    $tree.on("selectNode", function (e) {
      display(getFullText($(e.target)), $display);
      return false;
    }); // selectNode

    function getFullText(node) {
      var loc = location($tree, node);
      //debug (`loc: ${loc}`);
      var text = extractText($guidelines, selectors, loc);
      //debug (`text: ${text}`);
      return text;
    } // getFullText

    function extractText($doc, selectors, loc) {
      var index, selector, $nodes, $node;

      $node = $doc;
      for (var depth = 0; depth < loc.length; depth++) {
        selector = selectors[depth];
        index = loc[depth];
        //debug (`- search: ${depth} ${index}`);
        $nodes = $node.find(selector[0]);
        $node = $nodes.eq(index);
      } // for

      return $node.find(selector[1]).html();
    } // extractText

    function display(text, $display) {
      var data = { html: text, verbosity: false };
      var loc = location($tree, getSelectedNode($tree));
      var $text = $display && $display.length === 1 ? $display : $(".text", $ui);
      //debug ("display: ", $text.attr("data-name"));
      //debug ("verbosity: ", getVerbosity(), (loc.length)-1);
      data.verbosity = loc.length - 1 >= getVerbosity();

      setTimeout(function () {
        //$text.html (text);
        $text.trigger("display", data);
      }, 100);
    } // display

    function getVerbosity() {
      return $(".verbosity", $ui).val();
    } // getVerbosity

    return false;
  }); // when

  /// tree helpers

  function location($tree, $node) {
    var loc = [];
    loc.push($node.index());

    $node = $node.parent().closest("[role=treeitem]", $tree);
    while ($node && $node.length === 1) {
      loc.push($node.index());
      $node = $node.parent().closest("[role=treeitem]", $tree);
    } // while

    return loc.reverse();
  } // location


  function getSelectedNode($tree) {
    var id = $tree.attr("aria-activedescendant");
    return $("#" + id, $tree);
  } // getSelected

} // initializeWcagBrowser


//alert ("wcag-browser.js loaded");
