// jQuery plugin: WCTeditor
// by garann means
//
// text editor with basic markup functionality

(function($) {

	$.get("../WCTeditor.css", function(r) {
		$("head").append('<style media="all">' + r + '</style>');
	});
	$.template('linkModalTemplate','<div class="linkModal"><label>URL:<input type="text"/></label><button>OK</button></div>');
	$.get("../tmpl/editor-tmpl.txt", function(r) {
		$.template("wcteditorTemplate",r);
	});

	$.fn.WCTeditor = function(config) {
		var defaults = {
				showBold: true,
				showItalic: true,
				showUnderline: true,
				showNumList: true,
				showBullList: true,
				showLink: true,
				showStripHtml: true,
				showSpellCheck: true,
				userClasses: [],
				defaultText: "",
				showCharCount: false,
				charCountTmpl: "Characters remaining: ${chars}",
				maxLength: 0
			},
			that = $.extend(true,{},defaults,config),
			textarea = this;
			
		$.template("charCountTemplate",that.charCountTmpl);		

		if (!$.template("wcteditorTemplate").length) {
			$.get("../tmpl/editor-tmpl.txt", function(r) {
				$.template("wcteditorTemplate",r);
				that = init(textarea, that);
			});
		} else {
			that = init(textarea, that);
		}	

		that.applyFormatting = function(type) {
			document.execCommand(type, null, null);
			that.updateTextarea();
		};

		that.updateTextarea = function() {
			var current = that.editor.html();
			textarea.val(current);
			if (that.showCharCount) that.updateCharCount();
		};
		
		that.updateCharCount = function() {
//			var l = that.maxLength - that.editor.html().length,
//				t = $(that.charCount).tmplItem();
//			t.data.chars = l;
//			t.update();
		};

		that.updateButtons = function() {
			$("div.wcte-buttons button",that.container).removeClass("active");
			var range = getRange(),
				sel = $(range.startContainer ? range.startContainer : range.parentElement()),
				parents = sel.parentsUntil("div.wcte-editor");
			parents.each(function() {
				var tag = this.tagName.toLowerCase(),
					btn = that.buttons[tag];
				if (btn != null) {
					btn.addClass("active");
				} else if (tag == "strong") {
					that.buttons["b"].addClass("active");
				} else if (tag == "em") {
					that.buttons["i"].addClass("active");
				} else if (tag == "span") {
					var t = $(this);
					if (t.css("font-weight") == "bold") that.buttons["b"].addClass("active");
					if (t.css("font-style") == "italic") that.buttons["i"].addClass("active");
					if (t.css("text-decoration") == "underline") that.buttons["u"].addClass("active");
				}
			});
		};

		return that;
	};

	function init(textarea, that) {
			
		that.defaultText = textarea.val();
		that.maxLength = textarea.attr("maxlength");
		that.chars = that.maxLength;
		textarea.after($.tmpl("wcteditorTemplate",that));			
		textarea.hide();
		that.container = textarea.next("div.wcte-container");
		that.editor = that.container.find("div.wcte-editor");
		if (that.showCharCount) that.charCount = that.editor.next();

		// setup button actions
		that.container.delegate(".wcte-btn-bold","click",function(e) {
			that.applyFormatting("bold");
			$(this).addClass("active");
			return false;
		});
		that.container.delegate(".wcte-btn-italic","click",function(e) {
			that.applyFormatting("italic");
			$(this).addClass("active");
			return false;
		});
		that.container.delegate(".wcte-btn-underline","click",function(e) {
			that.applyFormatting("underline");
			$(this).addClass("active");
			return false;
		});
		that.container.delegate(".wcte-btn-list-num","click",function(e) {
			that.applyFormatting("insertOrderedList");
			$(this).addClass("active");
			return false;
		});
		that.container.delegate(".wcte-btn-list-bull","click",function(e) {
			that.applyFormatting("insertUnorderedList");
			$(this).addClass("active");
			return false;
		});
		that.container.delegate(".wcte-btn-link","click",function(e) {
			setLink(that);
			$(this).addClass("active");
			return false;
		});
		/*that.container.delegate(".wcte-btn-bold","click",function(e) {
			that.applyFormatting("bold");
			$(this).addClass("active");
		});
		that.container.delegate(".wcte-btn-bold","click",function(e) {
			that.applyFormatting("bold");
			$(this).addClass("active");
		});*/

		that.buttons = [];
		that.buttons["b"] = $("button.wcte-btn-bold",that.container);
		that.buttons["i"] = $("button.wcte-btn-italic",that.container);
		that.buttons["u"] = $("button.wcte-btn-underline",that.container);
		that.buttons["ol"] = $("button.wcte-btn-list-num",that.container);
		that.buttons["ul"] = $("button.wcte-btn-list-bull",that.container);
		that.buttons["a"] = $("button.wcte-btn-link",that.container);

		that.editor.bind("keyup click",function(e) {
			that.updateButtons();
			that.updateTextarea();
		});

		return that;
	}

	function setLink(that) {
		var linkText = getRange();
		that.container.append($.tmpl("linkModalTemplate",null));
		var modal = that.container.find("div.linkModal");
		modal.find("button").click(function(e) {
			e.preventDefault();
			var link = modal.find("input").val();
			setSelection(linkText);
			document.execCommand("createLink",null,(link.indexOf("//") < 0 ? "http://" + link : link));
			modal.remove();
		});					
	}

	function getRange() {
		return window.getSelection ? window.getSelection().getRangeAt(0) : document.selection.createRange();
	}

	function setSelection(range) {
		if (range.select) {
			range.select();
		} else {
			var selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

})(jQuery);