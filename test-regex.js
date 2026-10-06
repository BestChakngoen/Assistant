const text = "Here is a link [🔗 gemini.google.com/app...](https://gemini.google.com/app/e70ce8d5bfb3cb8b) and another https://google.com ok?";
const urlRegex = /(https?:\/\/[^\s\)]+)/g;
let match;
while ((match = urlRegex.exec(text)) !== null) {
    console.log("Found:", match[1], "at", match.index, "to", match.index + match[1].length);
}
