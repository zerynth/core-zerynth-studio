ace.define("ace/theme/blackboard",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-blackboard";
exports.cssText = ".ace-blackboard .ace_gutter {\
background: #0c1021;\
color: #888888\
}\
.ace-blackboard .ace_print-margin {\
width: 1px;\
background: #555651\
}\
.ace-blackboard {\
background-color: #0c1021;\
color: #ff6400\
}\
.ace-blackboard .ace_cursor {\
color: #F8F8F0\
}\
.ace-blackboard .ace_marker-layer .ace_selection {\
background: #253b76\
}\
.ace-blackboard.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #272822;\
}\
.ace-blackboard .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-blackboard .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid red\
}\
.ace-blackboard .ace_marker-layer .ace_active-line {\
background: #151c3b\
}\
.ace-blackboard .ace_gutter-active-line {\
background-color: #151c3b\
}\
.ace-blackboard .ace_marker-layer .ace_selected-word {\
border: 1px solid #49483E\
}\
.ace-blackboard .ace_invisible {\
color: #52524d\
}\
.ace-blackboard .ace_entity.ace_name.ace_tag,\
.ace-blackboard .ace_keyword,\
.ace-blackboard .ace_meta.ace_tag,\
.ace-blackboard .ace_storage {\
color: #ddc52b\
}\
.ace-blackboard .ace_punctuation,\
.ace-blackboard .ace_punctuation.ace_tag {\
color: #fff !important\
}\
.ace-blackboard .ace_constant.ace_character,\
.ace-blackboard .ace_constant.ace_language,\
.ace-blackboard .ace_constant.ace_numeric,\
.ace-blackboard .ace_constant.ace_other {\
color: #FEdd2b\
}\
.ace-blackboard .ace_invalid {\
color: #F8F8F0;\
background-color: #F92672\
}\
.ace-blackboard .ace_invalid.ace_deprecated {\
color: #F8F8F0;\
background-color: #AE81FF\
}\
.ace-blackboard .ace_support.ace_constant,\
.ace-blackboard .ace_support.ace_function {\
color: #ff6400\
}\
.ace-blackboard .ace_fold {\
background-color: #A6E22E;\
border-color: #F8F8F2\
}\
.ace-blackboard .ace_storage.ace_type,\
.ace-blackboard .ace_support.ace_class,\
.ace-blackboard .ace_support.ace_type {\
font-style: italic;\
color: #66D9EF\
}\
.ace-blackboard .ace_entity.ace_name.ace_function,\
.ace-blackboard .ace_entity.ace_other,\
.ace-blackboard .ace_entity.ace_other.ace_attribute-name,\
.ace-blackboard .ace_variable {\
color: #fff\
}\
.ace-blackboard .ace_variable.ace_parameter {\
font-style: italic;\
color: #FD971F\
}\
.ace-blackboard .ace_string {\
color: #4ea436\
}\
.ace-blackboard .ace_comment {\
color: #aeaeae\
}\
.ace-blackboard .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWPQ0FD0ZXBzd/wPAAjVAoxeSgNeAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
