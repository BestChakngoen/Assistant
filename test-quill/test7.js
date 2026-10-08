const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="editor"></div></body></html>', { runScripts: 'dangerously' });
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
global.DOMParser = dom.window.DOMParser;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.Text = dom.window.Text;
global.MutationObserver = dom.window.MutationObserver;

document.getSelection = function() {
    return { getRangeAt: function() {}, removeAllRanges: function() {}, addRange: function() {} };
};
global.getSelection = document.getSelection;

const Quill = require('quill');
const quill = new Quill(document.getElementById('editor'), {
    modules: { clipboard: { matchVisual: false } }
});

let htmlTrailing = '<p>Line 1</p><p><br></p><p><br></p>';

// Append dummy text inside the last paragraph to prevent trailing newline stripping
let htmlSpecial = htmlTrailing.replace(/<\/p>\s*$/i, '__END__</p>');
quill.clipboard.dangerouslyPasteHTML(htmlSpecial);

let len = quill.getLength();
// '__END__' is 7 characters.
quill.deleteText(len - 8, 7);
console.log("Appended inline and Deleted Delta:", JSON.stringify(quill.getContents()));

process.exit(0);
