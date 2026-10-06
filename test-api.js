async function test10() {
    try {
        const res = await fetch('https://cleanuri.com/api/v1/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `url=${encodeURIComponent('https://gemini.google.com/app/e70ce8d5bfb3cb8b')}`
        });
        console.log(await res.text());
    } catch(e) {
        console.log("Error:", e);
    }
}
test10();
