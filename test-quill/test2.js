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
    return {
        getRangeAt: function() {},
        removeAllRanges: function() {},
        addRange: function() {}
    };
};
global.getSelection = document.getSelection;

const Quill = require('quill');

const quill = new Quill(document.getElementById('editor'), {
    modules: {
        clipboard: {
            matchVisual: false
        }
    }
});

let html = '<p>Line 1</p><p><br></p><p>Line 2</p>';
console.log("Original HTML:", html);

quill.clipboard.dangerouslyPasteHTML(html);
console.log("Delta WITHOUT fix:", JSON.stringify(quill.getContents()));

// Apply current fix
let fixedHtml = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<br>');
console.log("Fixed HTML:", fixedHtml);

quill.clipboard.dangerouslyPasteHTML(fixedHtml);
console.log("Delta WITH fix:", JSON.stringify(quill.getContents()));
