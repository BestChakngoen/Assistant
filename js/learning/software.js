import { BaseQuestController } from './core/BaseQuestController.js';
import { softwareData } from './data/softwareData.js';
import { programmingScopeQuest } from './quests/programmingScopeQuest.js';

export { softwareData as topicData };

/**
 * SoftwareQuestController - Controller for Software Engineering Learning Sandbox
 * Extends BaseQuestController to support future game-based learning quests.
 */
export class SoftwareQuestController extends BaseQuestController {
    constructor() {
        super({
            subjectKey: 'software',
            subjectTitle: 'Software Engineering',
            topicData: softwareData,
            themeColor: 'cyan'
        });

        // Register interactive game quests
        this.registerQuestHandler('programming', 0, programmingScopeQuest);
    }

    closeSuccessModal() {
        const modal = document.getElementById('success-modal');
        if (modal) modal.classList.add('hidden');
    }
}
