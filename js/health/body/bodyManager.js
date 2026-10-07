import BodyState from './bodyState.js';
import BodyUI from './bodyUI.js';

export default class BodyManager {
    constructor(firebaseManager, onTargetChange) {
        this.stateManager = new BodyState(firebaseManager);
        this.ui = new BodyUI(this.stateManager, onTargetChange);
        
        // Connect State Changes to UI updates
        this.stateManager.onStateChange = () => {
            this.ui.onStateUpdate();
        };

        // Initialize State and UI Date
        this.ui.initDate();
        this.stateManager.init();
    }
}
