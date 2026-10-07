import SleepState from './sleepState.js';
import SleepUI from './sleepUI.js';

export default class SleepManager {
    constructor(firebaseManager) {
        this.stateManager = new SleepState(firebaseManager);
        this.ui = new SleepUI(this.stateManager);
        
        this.stateManager.onStateChange = () => {
            this.ui.onStateUpdate();
        };

        this.ui.initDate();
        this.stateManager.init();
    }
}
