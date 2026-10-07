const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function moveItem(src, dest) {
    if (fs.existsSync(src)) {
        if (!fs.existsSync(path.dirname(dest))) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
        }
        // Use git mv to preserve git history
        try {
            execSync(`git mv "${src}" "${dest}"`);
            console.log(`Moved: ${src} -> ${dest}`);
        } catch (e) {
            // fallback to fs.rename if git mv fails (e.g. untracked files)
            fs.renameSync(src, dest);
            console.log(`Moved (fs): ${src} -> ${dest}`);
        }
    }
}

// Moves
moveItem('js/ui/DiagramManager.js', 'js/strategy/DiagramManager.js');
moveItem('js/ui/diagram', 'js/strategy/diagram');
moveItem('js/ui/ShareManager.js', 'js/share/ShareManager.js');

// For contents of js/ui/share
if (fs.existsSync('js/ui/share')) {
    const shareFiles = fs.readdirSync('js/ui/share');
    for (const file of shareFiles) {
        moveItem(`js/ui/share/${file}`, `js/share/${file}`);
    }
    try { fs.rmdirSync('js/ui/share'); } catch(e){}
}

// For contents of js/ui/games
if (fs.existsSync('js/ui/games')) {
    const gameFiles = fs.readdirSync('js/ui/games');
    for (const file of gameFiles) {
        moveItem(`js/ui/games/${file}`, `js/game/${file}`);
    }
    try { fs.rmdirSync('js/ui/games'); } catch(e){}
}

moveItem('js/ui/uimanager/UIStrategyLab.js', 'js/strategy/UIStrategyLab.js');
moveItem('js/ui/uimanager/UIChartEngine.js', 'js/trade/UIChartEngine.js');
moveItem('js/ui/uimanager/UIHistoryRenderer.js', 'js/trade/UIHistoryRenderer.js');
moveItem('js/ui/uimanager/UIStatsCalculator.js', 'js/trade/UIStatsCalculator.js');
moveItem('js/ui/uimanager/UINavigation.js', 'js/ui/UINavigation.js');

try { fs.rmdirSync('js/ui/uimanager'); } catch(e){}

// File text replacements
function replaceInFile(filePath, replacements) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        for (const {from, to} of replacements) {
            newContent = newContent.split(from).join(to);
        }
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated imports in: ${filePath}`);
        }
    }
}

function replaceInDir(dir, replacements) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of files) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            replaceInDir(fullPath, replacements);
        } else if (dirent.name.endsWith('.js') || dirent.name.endsWith('.html')) {
            replaceInFile(fullPath, replacements);
        }
    }
}

const replacements = [
    // imports in UIManager.js
    { from: "from './DiagramManager.js'", to: "from '../strategy/DiagramManager.js'" },
    { from: "from './ShareManager.js'", to: "from '../share/ShareManager.js'" },
    { from: "from './uimanager/UIChartEngine.js'", to: "from '../trade/UIChartEngine.js'" },
    { from: "from './uimanager/UIStatsCalculator.js'", to: "from '../trade/UIStatsCalculator.js'" },
    { from: "from './uimanager/UIHistoryRenderer.js'", to: "from '../trade/UIHistoryRenderer.js'" },
    { from: "from './uimanager/UIStrategyLab.js'", to: "from '../strategy/UIStrategyLab.js'" },
    { from: "from './uimanager/UINavigation.js'", to: "from './UINavigation.js'" },
    
    // TrackerView.html
    { from: "'./js/ui/games/phonkRunner.js'", to: "'./js/game/phonkRunner.js'" },

    // DiagramManager imports inside DiagramManager.js
    { from: "from './diagram/", to: "from './diagram/" }, // stays the same as it moved together

    // ShareManager imports inside ShareManager.js
    { from: "from './share/", to: "from './" }, // moved from js/ui/share to js/share, so ShareManager.js (in js/share) now imports from './'
    // Also inside Share files
    { from: "from './ShareFeedState.js'", to: "from './ShareFeedState.js'" }, // same directory
    // other cross file imports might need check if they crossed from js/ui to js/ui/share
];

replaceInDir('js', replacements);
replaceInFile('TrackerView.html', replacements);

console.log('Folders reorganized and imports updated.');
