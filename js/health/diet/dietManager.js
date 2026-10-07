import DietState from './dietState.js';
import DietUI from './dietUI.js';

export default class DietManager {
    constructor(firebaseManager) {
        this.stateManager = new DietState(firebaseManager);
        this.ui = new DietUI(this.stateManager);
        
        this.stateManager.onStateChange = () => {
            this.ui.onStateUpdate();
        };

        this.ui.initDate();
        this.stateManager.init();
    }

    setTarget(newTarget) {
        this.stateManager.setTarget(newTarget);
    }
}
