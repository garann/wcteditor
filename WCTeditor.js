// jQuery plugin: WCTeditor
// by garann means
//
// text editor with basic markup functionality

(function($) {
	var tmplLoaded = false;

	function _multiple(that, config) {
		var editors = [];
		$.each(that,function(i) {
			editors.push($(this).WCTeditor(config));
		});
		return editors;
	}

	function _loadTemplates(path) {		
		// load editor templates
		$.get(path + "tmpl/editor-tmpl.txt", function(r) {
			$.template("wcteditorTemplate",r);	
			tmplLoaded = true;
		});	
		$.template('contentsTemplate','<span class="wcte-placeholder">${placeholderText}</span> ');
		$.template('linkModalTemplate','<div class="wcte-linkModal wcte-modal"><label>URL:<input type="text" value="${href}"/></label><button>OK</button><a>Cancel</a></div>');
		$.template('linkOverlayTemplate','<div class="wcte-linkOverlay wcte-modal" contenteditable="false">${url}<br/><a href="${url}" target="_blank">Open link</a></div>');
		$.template('spellCheckTemplate','<div class="wcte-spellCheckModal wcte-modal" contenteditable="false">{{each suggestions}}<a class="wcte-sug">${$value}</a><br/>{{/each}}<a>Ignore</a></div>');
	}

	$.fn.WCTeditor = function(config) {
		
		tmplLoaded || _loadTemplates(config.pathToPlugin);
		
		if (this[1]) {
			return _multiple(this, config);
		}

		var defaults = {
				showBold: true,
				showItalic: true,
				showUnderline: false,
				showNumList: false,
				showBullList: false,
				showLink: true,
				showStripHtml: false,
				showSpellCheck: false,
				userClasses: [],
				defaultText: null,
				showCharCount: false,
				charCountTmpl: "Characters remaining: {{html chars}}",
				showLinkOverlays: true,
				maxLength: 0,
				spellcheckUrl: "",
				pathToPlugin:"",
				theme: "",
				placeholderText: "",
				textarea: this,
				init: _init,
				remove: _remove,
				getRange: _getRange,
				setSelection: _setSelection,
				supportsContentEditable: _supportsContentEditable,
				applyFormatting: _applyFormatting,
				updateTextarea: _updateTextarea,
				updateCharCount: _updateCharCount,
				updateButtons: _updateButtons,
				setLink: _setLink,
				stripHTML: _stripHTML,
				stripHTMLComments: _stripHTMLComments,
				spellcheck: _spellcheck,
				events: {}
			},
			that = $.extend(true,{},defaults,config);

		$.template("charCountTemplate",that.charCountTmpl);	
		// load basic CSS
		$.get((that.theme.length?that.pathToPlugin+"themes/"+that.theme+"/":that.pathToPlugin) + "WCTeditor.css", function(r) {
			$("head").append('<style media="all">' + r + '</style>');		
			// render editor
			that = that.init(that);	
		});	
		that.handle = function(eventName, callback) {
			_subscribe(that, eventName, callback);
		};
		
		return that;
	};

	function _init(that) {
		// check to make sure contenteditable works - otherwise ABORT! ABORT! ABORT!
		if (that.supportsContentEditable()) {	
			that = $.extend(true,that,{
				maxLength: that.textarea.attr("maxlength"),
				chars: '<span class="chars">' + that.maxLength + '</span>'
			});
			that.defaultText = that.defaultText || that.textarea.val();
			if (that.defaultText.length) {
				$.template('contentsTemplate','{{html defaultText}} ');
			}
			// only show spellcheck for IE, since it's only gonna work for IE and only IE doesn't do it automatically
			that.showSpellCheck = that.showSpellCheck && document.body.createTextRange;
			that.textarea.after($.tmpl("wcteditorTemplate",that)).hide();
			that.container = that.textarea.next("div.wcte-container");
			that.editor = that.container.find("div.wcte-editor");
			if (that.showCharCount) that.charCount = that.container.find("div.wcte-charCount span.chars");

			// setup button actions
			that.container
			.delegate(".wcte-btn-bold","click",function(e) {
				that.applyFormatting(that,"bold");
				$(this).addClass("active");
				return false;
			})
			.delegate(".wcte-btn-italic","click",function(e) {
				that.applyFormatting(that,"italic");
				$(this).addClass("active");
				return false;
			})
			.delegate(".wcte-btn-underline","click",function(e) {
				that.applyFormatting(that,"underline");
				$(this).addClass("active");
				return false;
			})
			.delegate(".wcte-btn-list-num","click",function(e) {
				that.applyFormatting(that,"insertOrderedList");
				$(this).addClass("active");
				return false;
			})
			.delegate(".wcte-btn-list-bull","click",function(e) {
				that.applyFormatting(that,"insertUnorderedList");
				$(this).addClass("active");
				return false;
			})
			.delegate(".wcte-btn-link","click",function(e) {
				var t = $(this);
				that.setLink(that, t.position().left);
				t.addClass("active");
				return false;
			})
			.delegate(".wcte-btn-unlink","click",function(e) {
				that.applyFormatting(that,"unlink");
				that.updateTextarea(that);
				return false;
			})
			.delegate(".wcte-btn-strip","click",function(e) {
				that.editor.html(that.stripHTML(that, $.trim(that.editor.html())));
				that.updateTextarea(that);
				that.stripHTMLComments(that);
				return false;
			})
			.delegate(".wcte-btn-spell","click",function(e) {
				that.spellcheck(that);
				return false;
			});

			// save references to buttons
			that.buttons = [];
			that.buttons["b"] = $("button.wcte-btn-bold",that.container);
			that.buttons["i"] = $("button.wcte-btn-italic",that.container);
			that.buttons["u"] = $("button.wcte-btn-underline",that.container);
			that.buttons["ol"] = $("button.wcte-btn-list-num",that.container);
			that.buttons["ul"] = $("button.wcte-btn-list-bull",that.container);
			that.buttons["a"] = $("button.wcte-btn-link",that.container);

			that.editor.bind("keyup click",function(e) {
					$(this).parent().find("div.wcte-modal").remove();
				that.updateButtons(that).updateTextarea(that);
			})
			.bind("paste",function(e) {
				// automatically strip HTML from pasted content for non-IE browsers
				if (document.createRange) {
					document.execCommand("insertHorizontalRule", null, null);
					window.setTimeout(function(){
						document.execCommand("insertHorizontalRule", null, null);
						var hr = that.editor.find("hr").eq(0),
							inserted = hr.nextUntil("hr"),
							range = document.createRange();
						if (inserted.length) {						
							range.selectNode(inserted[0]); 
							var cleandup = that.stripHTML(that, range.toString().trim());
							range.deleteContents();
							hr.after(cleandup);
						}
						that.editor.find("hr").remove();
						that.updateTextarea(that)
						that.stripHTMLComments(that);
					},1);
				}
			})
			.focus(function(){
				if (that.editor.text().length > 0)
				that.setSelection(that.getRange());
			})
			.blur(function(){
				if (that.editor.text().length < 1 && !that.editor.find("span.wcte-placeholder")[0])
					that.editor.prepend($.tmpl("contentsTemplate",that));
			})
			.delegate("a","click",function(e) {
				e.stopPropagation();
				var t = $(this), pos = t.position();
				t.after($.tmpl("linkOverlayTemplate",{url:t.attr("href")}));
				t.siblings("div.wcte-modal").css("left",pos.left).css("top",pos.top + 20);
			});
		}

		_publish(that.events, "wcte.loaded", that);
		return that;
	}

	function _remove(that) {
		_publish(that.events, "wcte.beforeRemove", that);
		that.textarea.show();
		that.container.remove();
	}

	function _getRange() {
		return window.getSelection ? window.getSelection().getRangeAt(0) : document.selection.createRange();
	}

	function _setSelection(range) {
		if (range.select) {
			range.select();
		} else {
			var selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

	function _supportsContentEditable() {
		if (!document.execCommand) 
			return false;
		var uagent = navigator.userAgent.toLowerCase();
		if (uagent.indexOf("iphone") > -1 || uagent.indexOf("ipod") > -1 || uagent.indexOf("ipad") > -1) 
			return false;
		if (uagent.indexOf("android") > -1) 
			return false;
		if (uagent.indexOf("webkit") > -1 && uagent.indexOf("symbian") > -1)
			return false;
		return true;
	}

	// do basic designMode commands
	function _applyFormatting(that, type) {
		document.execCommand(type, null, null);
		that.updateTextarea(that);
	}

	// mirror changes in original textarea
	function _updateTextarea(that) {
		var p = that.editor.find("span.wcte-placeholder");
		if (p[0] && that.editor.text().length) p.remove(); 
		var current = that.editor.html().replace(/&nbsp;/g," ");
		that.textarea.val(current);
		if (that.showCharCount) that.updateCharCount(that);
		return that;
	}

	// update character counter
	function _updateCharCount(that) {
		var l = that.maxLength - that.editor.text().length;
		that.charCount.removeClass("tooLong");
		that.charCount.html(l);
		if (l < 0) that.charCount.addClass("tooLong");
	}

	// show correct formatting button states for cursor position
	function _updateButtons(that) {
		if (that.editor.text().length < 1) return that;
		$("div.wcte-buttons button",that.container).removeClass("active");
		var range = that.getRange();
		if (range.startContainer) {
			parents = $(range.startContainer).parentsUntil("div.wcte-editor");
		} else {
			parents = $(range.parentElement()).parentsUntil("div.wcte-editor").andSelf();
		}
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
		return that;	
	}
				
	// show interface to add a URL to current selection
	function _setLink(that, leftPosition) {
		var linkText = that.getRange();
		var href = (linkText.startContainer ? 
			$(linkText.startContainer).closest("a") :
			$(linkText.parentElement()) || $(linkText.parentElement()).closest("a")).attr("href");
		that.container.append($.tmpl("linkModalTemplate",{href: href}));
		var modal = that.container.find("div.wcte-linkModal");
		modal.css("left",leftPosition);
		modal.find("button").click(function(e) {
			e.preventDefault();
			var link = modal.find("input").val();
			that.setSelection(linkText);
			document.execCommand("createLink",null,(link.indexOf("//") < 0 ? "http://" + link : link));
			modal.remove();
			that.updateTextarea(that);
		});	
		modal.find("a").click(function(e) {
			modal.remove();
			return false;
		});
		return that;				
	}

	// remove all markup except paragraphs and line breaks
	function _stripHTML(that, html) {
		var strippedContent = html.replace(/<!(?:--[\s\S]*?--\s*)?>\s*/g,"");						// comments.. does this even work? innerhtml seems to dump html comments
		strippedContent = strippedContent.replace(/\r\n|\r|\n/g,"<br/>");							// non-html line breaks
		strippedContent = strippedContent.replace(/\u00A0\u00A0/g," ");								// tons of spaces
		strippedContent = strippedContent.replace(/(\<)\/?(?!br(\s|\/|\>))(?!(\/)?p)(.*?)\>/gi,"");	// tags that are not <br> or <p>
		strippedContent = strippedContent.replace(/<p(?:[\s\S]*?>)/gi,"<p>");						// attributes in <p> tags
		strippedContent = strippedContent.replace(/<p>(?:\s*(\&nbsp;)*\s*)?<\/p>/gi,"");			// empty paragraphs
		return strippedContent;	
	}

	// remove html comments from textarea b/c innerHTML of contenteditable element doesn't include them
	function _stripHTMLComments(that) {
		var html = that.textarea.val(),
			strippedContent = html.replace(/<!(?:--[\s\S]*?--\s*)?>\s*/g,"");
		that.textarea.val(strippedContent);
		that.editor.html(strippedContent);
	}

	function _spellcheck(that) {
		if (document.body.createTextRange) {
			// get text
			var vals = that.editor.text(),
				btn = that.container.find(".wcte-btn-spell");
			// receive misspellings [] of {originalWord:string,suggestions:[]} - same word misspelled 2x gets 2 entries?
			$.post(that.spellcheckUrl,{s:$.trim(vals)},function(d) {
				if (d.length) btn.addClass("errors");
				// find misspelled words in editor.html()
				$.each(d,function(i) {
					var r = document.body.createTextRange();
					r.moveToElementText(that.editor[0]);
					r.findText(this.originalWord);
					r.select();
					// wrap misspellings in <font> - yes, really
					document.execCommand("foreColor", null, "#ff0000");
					that.editor.find("font").last().data("suggestions",this.suggestions);
				});
			});
			// click on .misspelled shows list of suggestions + "Ignore"
			that.editor
			.delegate("font","click",function() {
				var t = $(this), pos = t.position();
				that.editor.after($.tmpl("spellCheckTemplate",t.data()));
				var m = that.editor.siblings("div.wcte-modal");
				m.css("left",pos.left)
					.css("top",pos.top + 20)
					.find("a").click(function() {
						var sug = $(this);
						t.replaceWith(sug.hasClass("wcte-sug") ? sug.text() : t.text());
						sug.parent().remove();
						if (!that.editor.find("font").length) btn.removeClass("errors");
						that.updateTextarea(that);
					});
			})
		}
	}

	function _subscribe(that, eventName, callback) {
		that.events[eventName] || (that.events[eventName] = []);
		that.events[eventName].push(callback);
	}

	function _publish(events, eventName, args) {
		if (!events[eventName]) return;
		$.each(events[eventName], function(i) {
			this.call(args);
		});
	}

})(jQuery);