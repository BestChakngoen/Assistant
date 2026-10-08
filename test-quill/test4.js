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

quill.setContents([
  { insert: "Line 1\n" },
  { insert: "\n" },
  { insert: "Line 2\n" }
]);

console.log("innerHTML:", quill.root.innerHTML);
process.exit(0);
