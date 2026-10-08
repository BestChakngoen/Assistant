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
quill.clipboard.dangerouslyPasteHTML(htmlTrailing);
console.log("Trailing Delta:", JSON.stringify(quill.getContents()));

// What about leading empty lines?
let htmlLeading = '<p><br></p><p>Line 1</p>';
quill.clipboard.dangerouslyPasteHTML(htmlLeading);
console.log("Leading Delta:", JSON.stringify(quill.getContents()));

// What if we use <br> directly as we fixed in test2
let htmlFixed = '<p>Line 1</p><br><br>';
quill.clipboard.dangerouslyPasteHTML(htmlFixed);
console.log("Fixed Trailing Delta:", JSON.stringify(quill.getContents()));

process.exit(0);
