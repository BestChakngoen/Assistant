import { BaseQuestController } from './core/BaseQuestController.js';
import { agricultureData } from './data/agricultureData.js';

export { agricultureData as topicData };

/**
 * AgricultureQuestController - Controller for Smart Agriculture Learning Sandbox
 * Extends BaseQuestController to support future game-based learning quests.
 */
export class AgricultureQuestController extends BaseQuestController {
    constructor() {
        super({
            subjectKey: 'agriculture',
            subjectTitle: 'Smart Agriculture',
            topicData: agricultureData,
            themeColor: 'emerald'
        });
    }
}
