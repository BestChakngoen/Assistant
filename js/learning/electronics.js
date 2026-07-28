import { BaseQuestController } from './core/BaseQuestController.js';
import { electronicsData } from './data/electronicsData.js';

export { electronicsData as topicData };

/**
 * ElectronicsQuestController - Controller for Electricity & Electronics Learning Sandbox
 * Extends BaseQuestController to support future game-based learning quests.
 */
export class ElectronicsQuestController extends BaseQuestController {
    constructor() {
        super({
            subjectKey: 'electronics',
            subjectTitle: 'Electricity & Electronics',
            topicData: electronicsData,
            themeColor: 'amber'
        });
    }
}
