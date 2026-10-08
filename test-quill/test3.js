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

let html2 = '<p>Line 1</p><p></p><p>Line 2</p>';
console.log("Empty P HTML:", html2);
quill.clipboard.dangerouslyPasteHTML(html2);
console.log("Empty P Delta:", JSON.stringify(quill.getContents()));

// What if the user is typing simply plain text with newlines?
let html3 = 'Line 1\n\nLine 2';
let fixedHtml3 = html3.replace(/\n/g, '<br>');
console.log("Plain Text Fixed HTML:", fixedHtml3);
quill.clipboard.dangerouslyPasteHTML(fixedHtml3);
console.log("Plain Text Delta:", JSON.stringify(quill.getContents()));

process.exit(0);
