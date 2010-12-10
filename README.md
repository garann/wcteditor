# WCTeditor #

A super-simple text editor for modern browsers. Supports:

+ bold
+ italic
+ underline
+ numbered lists
+ bulleted lists
+ links
+ stripping html (except line breaks/paragraphs)
+ spell-check via callback (_coming soon!_)

Tested so far and works ok in:

+ FF 3.6
+ Chrome 8
+ Safari 5
+ IE 7+

## Usage ##

Apply the plugin to a textarea with some options:

	$("#myTextArea").WCTeditor({
		showNumList: true,
		showBullList: true,
		pathToPlugin:"../"
	});

Yay! Done.

## Options ##

### showBold ###
boolean:
Whether or not you'd like the bold button to be shown. On by default.

### showItalic ###
boolean:
Whether or not you'd like the italicize button to be shown. On by default.

### showUnderline ###
boolean:
Whether or not you'd like the underline button to be shown.

### showNumList ###
boolean:
Whether or not you'd like the ordered list button to be shown.

### showBullList ###
boolean:
Whether or not you'd like the unordered list button to be shown.

### showLink ###
boolean:
Whether or not you'd like the link button to be shown. On by default.

### showStripHtml ###
boolean:
Whether or not you'd like the strip/clean up HTML button to be shown.

### showSpellCheck ###
boolean:
Whether or not you'd like the spellcheck button to be shown.

### userClasses ###
array of strings:
CSS classes you'd like to have applied to the div that wraps the editor.

### defaultText ###
string:
Text you want the editor to display with, if different than what's in your textarea.

### showCharCount ###
boolean:
Whether or not you'd like to show a character counter. See below for where to change the way the character counter works.

### charCountTmpl ###
string:
The template for your character counter. This can be just text or some HTML, but you need to insert "{{html chars}}" where you want the count to actually appear.

### maxLength ###
integer:
The maximum length of the user's input, including HTML, if different than the maxlength of your textarea.

### spellcheckUrl ###
string:
Path to the spellchecking service you'd like to call. 

### pathToPlugin ###
string:
Location of this plugin (i.e., location of WCTeditor.js) relative to the file it's being implemented in.

## Functions ##

You may want to override some of these to change the default functionality.

### applyFormatting ###
Applies the basic designMode commands.

### updateTextarea ###
Pushes changes to the editor to your textarea, then calls updateCharCount if it's enabled.

### updateCharCount ###
Updates the character count. Counts down from your specified maximum, then goes to negative. Assigns the CSS class "tooLong" to the count only once it goes negative.

### updateButtons ###
Updates the state of the formatting buttons depending on the cursor location.

### setLink ###
args: leftPosition (left position of formatting button)

Displays the interface to set a URL and wires up the button in that interface to update the editor markup.

### stripHTML ###
Removes all markup except paragraphs and line breaks.

### spellcheck ###
_Coming soon!_
