const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of files) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            replaceInDir(fullPath);
        } else if (dirent.name.endsWith('.js') || dirent.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;
            
            // Replaces for ShareUI and Share things
            // e.g. ../ui/share/ShareUI.js -> ../share/ShareUI.js
            newContent = newContent.replace(/\.\.\/ui\/share\//g, '../share/');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/share\//g, '../../share/');
            newContent = newContent.replace(/\.\/ui\/share\//g, './share/');
            
            // Replaces for Diagram
            newContent = newContent.replace(/\.\.\/ui\/DiagramManager\.js/g, '../strategy/DiagramManager.js');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/DiagramManager\.js/g, '../../strategy/DiagramManager.js');
            
            // Replaces for UI uimanager components
            newContent = newContent.replace(/\.\.\/ui\/uimanager\/UIChartEngine\.js/g, '../trade/UIChartEngine.js');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/uimanager\/UIChartEngine\.js/g, '../../trade/UIChartEngine.js');
            newContent = newContent.replace(/\.\.\/ui\/uimanager\/UIStatsCalculator\.js/g, '../trade/UIStatsCalculator.js');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/uimanager\/UIStatsCalculator\.js/g, '../../trade/UIStatsCalculator.js');
            newContent = newContent.replace(/\.\.\/ui\/uimanager\/UIHistoryRenderer\.js/g, '../trade/UIHistoryRenderer.js');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/uimanager\/UIHistoryRenderer\.js/g, '../../trade/UIHistoryRenderer.js');
            newContent = newContent.replace(/\.\.\/ui\/uimanager\/UIStrategyLab\.js/g, '../strategy/UIStrategyLab.js');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/uimanager\/UIStrategyLab\.js/g, '../../strategy/UIStrategyLab.js');

            // uimanager/UINavigation.js -> ui/UINavigation.js
            newContent = newContent.replace(/\.\.\/ui\/uimanager\/UINavigation\.js/g, '../ui/UINavigation.js');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/uimanager\/UINavigation\.js/g, '../../ui/UINavigation.js');

            // Game
            newContent = newContent.replace(/\.\.\/ui\/games\//g, '../game/');
            newContent = newContent.replace(/\.\.\/\.\.\/ui\/games\//g, '../../game/');

            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated imports in: ${fullPath}`);
            }
        }
    }
}

replaceInDir('js');
console.log('All imports fixed!');
