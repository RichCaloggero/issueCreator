
function getFieldNames ($fields) {
return getData ($fields, "name");
} // extract

function getData ($fields, name) {
return $fields.map ((i, element) => $(element).data (name).trim()).get();
} // getData


function getIssueData ($issue) {
var issueData = {};

return $issue.get().map (function (element) {
var name = $(element).data (name);
return [name, $(element).val()];
}); // map
} // getIssueData



function setData ($fields, name, value) {
return $fields.each ((index, element) => $(element).data (name, value));
} // setData


