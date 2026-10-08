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

// Append a zero-width space inside a paragraph at the very end
let htmlFixed = htmlTrailing + '<p>&#8203;</p>';
quill.clipboard.dangerouslyPasteHTML(htmlFixed);
console.log("Appended ZWS Delta:", JSON.stringify(quill.getContents()));

// Another approach: append a special character, paste, then delete the last character
let htmlSpecial = htmlTrailing + '<p>__END__</p>';
quill.clipboard.dangerouslyPasteHTML(htmlSpecial);
// get length
let len = quill.getLength();
// delete the dummy text '__END__'
quill.deleteText(len - 8, 7);
console.log("Appended and Deleted Delta:", JSON.stringify(quill.getContents()));

process.exit(0);
