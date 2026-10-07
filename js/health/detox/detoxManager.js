import DetoxState from './detoxState.js';
import DetoxUI from './detoxUI.js';

export default class DetoxManager {
    constructor(firebaseManager) {
        this.stateManager = new DetoxState(firebaseManager);
        this.ui = new DetoxUI(this.stateManager);
        
        // Connect State Changes to UI updates
        this.stateManager.onStateChange = () => {
            this.ui.onStateUpdate();
        };

        // Initialize State and UI Date
        this.ui.initDate();
        this.stateManager.init();
    }
}
