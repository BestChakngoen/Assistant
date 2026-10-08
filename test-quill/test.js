const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="editor"></div></body></html>', { runScripts: 'dangerously' });
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
global.DOMParser = dom.window.DOMParser;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;

// Provide MutationObserver mock since JSDOM might not have it fully compatible with Quill
global.MutationObserver = dom.window.MutationObserver;

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

// Apply current fix
let fixedHtml = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<br>');
console.log("Fixed HTML:", fixedHtml);

quill.clipboard.dangerouslyPasteHTML(fixedHtml);
console.log("Delta after fix:", JSON.stringify(quill.getContents()));

// Test matchVisual: true approach
const quill2 = new Quill(dom.window.document.createElement('div'), {
    modules: {
        clipboard: {
            matchVisual: true
        }
    }
});
quill2.clipboard.dangerouslyPasteHTML(html);
console.log("Delta with matchVisual:true :", JSON.stringify(quill2.getContents()));
