import { ShareUI } from '../../ui/share/ShareUI.js';

/**
 * NoteManagerModal.js - Provides a visual grid UI for managing and grouping sheets into folders.
 */
export class NoteManagerModal {
    constructor(sheetManager, notePadTool) {
        this.sheetManager = sheetManager;
        this.notePadTool = notePadTool;
        this.overlay = null;
        this.currentViewFolderId = null; // null means 'All Notes'
    }

    open() {
        this.currentViewFolderId = this.sheetManager.activeFolderId;
        this.render();
    }

    close() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.classList.add('opacity-0');
            const card = this.overlay.querySelector('.modal-card');
            if (card) {
                card.classList.add('scale-95', 'opacity-0');
            }
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
            }, 300);
        }
    }

    render() {
        let isFirstRender = false;
        if (!this.overlay) {
            isFirstRender = true;
            this.overlay = document.createElement('div');
            this.overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 opacity-0 p-4';
            document.body.appendChild(this.overlay);

            // Close when clicking outside
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });
        }

        const folders = this.sheetManager.folders || [];
        const sheets = this.sheetManager.sheets || [];

        // Determine which sheets to show
        let displaySheets = sheets;
        if (this.currentViewFolderId) {
            displaySheets = sheets.filter(s => s.folderId === this.currentViewFolderId);
        }

        this.overlay.innerHTML = `
            <div class="modal-card w-full max-w-4xl bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] max-h-[700px] transition-all duration-300 ${isFirstRender ? 'scale-95 opacity-0' : ''}">
                
                <!-- Sidebar: Folders -->
                <div class="w-full md:w-64 bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-800/60 flex flex-col">
                    <div class="p-4 border-b border-slate-800/60 flex items-center justify-between">
                        <h3 class="text-sm font-mono font-bold text-white flex items-center gap-2">
                            <i data-lucide="folder-tree" class="size-4 text-amber-400"></i>
                            Folders
                        </h3>
                        <button id="btn-add-folder" type="button" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors" title="New Folder">
                            <i data-lucide="folder-plus" class="size-4"></i>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        <button type="button" class="folder-item w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors font-mono text-xs ${this.currentViewFolderId === null ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'}" data-folder-id="">
                            <i data-lucide="layers" class="size-4 ${this.currentViewFolderId === null ? 'text-amber-400' : 'text-slate-500'}"></i>
                            <span class="flex-1 truncate">All Notes</span>
                            <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-500">${sheets.length}</span>
                        </button>
                        ${folders.map(f => {
                            const count = sheets.filter(s => s.folderId === f.id).length;
                            const isActive = this.currentViewFolderId === f.id;
                            return `
                            <div class="group flex items-center w-full">
                                <button type="button" class="folder-item flex-1 text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors font-mono text-xs ${isActive ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'}" data-folder-id="${f.id}">
                                    <i data-lucide="folder" class="size-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}"></i>
                                    <span class="flex-1 truncate">${f.name}</span>
                                    <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-500">${count}</span>
                                </button>
                                <button type="button" class="btn-delete-folder opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all shrink-0 ml-1" data-folder-id="${f.id}" title="Delete Folder">
                                    <i data-lucide="trash-2" class="size-3.5"></i>
                                </button>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Main: Sheets Grid -->
                <div class="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
                    <div class="p-4 sm:p-5 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80 backdrop-blur z-10">
                        <div class="flex items-center gap-3">
                            <h2 class="text-lg font-mono font-bold text-white">
                                ${this.currentViewFolderId === null ? 'All Notes' : (folders.find(f => f.id === this.currentViewFolderId)?.name || 'Folder')}
                            </h2>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">${displaySheets.length} sheets</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="btn-manager-add-sheet" type="button" class="btn-press px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all flex items-center gap-1.5 text-xs font-mono font-medium">
                                <i data-lucide="plus" class="size-3.5"></i>
                                <span class="hidden sm:inline">New Note</span>
                            </button>
                            <button id="btn-close-manager" type="button" class="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
                                <i data-lucide="x" class="size-5"></i>
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-4 sm:p-5">
                        ${displaySheets.length === 0 ? `
                            <div class="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                                <i data-lucide="file-x-2" class="size-12 opacity-20"></i>
                                <p class="text-xs font-mono">No notes in this folder</p>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${displaySheets.map((sheet, index) => {
                                    const title = (sheet.title && sheet.title.trim()) ? sheet.title.trim() : `Sheet ${this.sheetManager.sheets.findIndex(s=>s.id===sheet.id) + 1}`;
                                    const rawHtml = sheet.content || '';
                                    const tmp = document.createElement('div');
                                    tmp.innerHTML = rawHtml;
                                    const plainText = tmp.textContent || tmp.innerText || '';
                                    const preview = plainText.substring(0, 80).replace(/\n/g, ' ') + (plainText.length > 80 ? '...' : '');
                                    const dateStr = new Date(sheet.updatedAt).toLocaleDateString();
                                    
                                    return `
                                    <div class="group relative bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 hover:border-amber-500/30 rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-2 shadow-sm hover:shadow-lg h-32 sheet-card" data-sheet-id="${sheet.id}">
                                        <div class="flex items-start justify-between gap-2">
                                            <h4 class="text-sm font-bold font-mono text-slate-200 truncate flex-1" title="${title}">${title}</h4>
                                            
                                            <!-- Action dropdown toggle -->
                                            <button type="button" class="btn-sheet-menu shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-800 text-slate-400 transition-all" data-sheet-id="${sheet.id}">
                                                <i data-lucide="more-vertical" class="size-3.5"></i>
                                            </button>
                                        </div>
                                        <p class="text-xs font-sans text-slate-500 line-clamp-2 flex-1">${preview || '<span class="italic opacity-50">Empty</span>'}</p>
                                        <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/40">
                                            <span>${dateStr}</span>
                                            ${sheet.folderId && this.currentViewFolderId === null ? `
                                                <span class="flex items-center gap-1 text-amber-500/70"><i data-lucide="folder" class="size-3"></i> ${folders.find(f=>f.id===sheet.folderId)?.name || ''}</span>
                                            ` : ''}
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Reveal animation
        if (isFirstRender) {
            setTimeout(() => {
                this.overlay.classList.remove('opacity-0');
                const card = this.overlay.querySelector('.modal-card');
                if (card) {
                    card.classList.remove('scale-95', 'opacity-0');
                }
            }, 10);
        }

        this.bindEvents();
    }

    bindEvents() {
        // Close modal
        this.overlay.querySelector('#btn-close-manager').addEventListener('click', () => this.close());

        // Add Folder
        this.overlay.querySelector('#btn-add-folder').addEventListener('click', async () => {
            const folderName = await ShareUI.showPromptModal({
                title: 'New Folder',
                message: 'Enter a name for the new folder:',
                placeholder: 'e.g. Work, Ideas, Code...',
                icon: 'folder-plus',
                iconColor: 'text-amber-400',
                confirmLabel: 'Create Folder'
            });
            if (folderName && folderName.trim()) {
                const newFolder = {
                    id: `folder_${Date.now()}`,
                    name: folderName.trim(),
                    color: 'bg-slate-800'
                };
                this.sheetManager.folders.push(newFolder);
                this.sheetManager.callbacks.onDataChange(); // trigger save
                this.render();
            }
        });

        // Folder selection
        this.overlay.querySelectorAll('.folder-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-folder-id');
                this.currentViewFolderId = id ? id : null;
                // Update active folder filter in sheet manager so New Sheet adds to it
                this.sheetManager.activeFolderId = this.currentViewFolderId;
                this.sheetManager.renderTabs(); // Reflect tabs if we want tabs filtered
                this.render();
            });
        });

        // Delete folder
        this.overlay.querySelectorAll('.btn-delete-folder').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.currentTarget.getAttribute('data-folder-id');
                const folder = this.sheetManager.folders.find(f => f.id === id);
                if (!folder) return;

                const confirmed = await ShareUI.showConfirmModal({
                    title: 'Delete Folder?',
                    message: `Are you sure you want to delete folder "${folder.name}"? (Sheets inside will not be deleted, they will be moved to 'All Notes')`,
                    icon: 'trash-2'
                });
                if (confirmed) {
                    // Remove folder
                    this.sheetManager.folders = this.sheetManager.folders.filter(f => f.id !== id);
                    // Unassign sheets
                    this.sheetManager.sheets.forEach(s => {
                        if (s.folderId === id) s.folderId = null;
                    });
                    if (this.currentViewFolderId === id) this.currentViewFolderId = null;
                    this.sheetManager.activeFolderId = this.currentViewFolderId;
                    this.sheetManager.callbacks.onDataChange();
                    this.sheetManager.renderTabs();
                    this.render();
                }
            });
        });

        // Add new sheet from manager
        this.overlay.querySelector('#btn-manager-add-sheet').addEventListener('click', () => {
            this.sheetManager.activeFolderId = this.currentViewFolderId; // ensure context
            this.sheetManager.addSheet();
            this.render();
        });

        // Click sheet card to switch
        this.overlay.querySelectorAll('.sheet-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Ignore if clicked on menu button
                if (e.target.closest('.btn-sheet-menu') || e.target.closest('.sheet-action-menu')) return;
                
                const id = e.currentTarget.getAttribute('data-sheet-id');
                this.sheetManager.switchSheet(id);
                this.close();
            });
        });

        // Click sheet menu
        this.overlay.querySelectorAll('.btn-sheet-menu').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sheetId = e.currentTarget.getAttribute('data-sheet-id');
                this.showSheetMenu(e.currentTarget, sheetId);
            });
        });
    }

    showSheetMenu(button, sheetId) {
        // Remove existing menus
        document.querySelectorAll('.sheet-action-menu').forEach(m => m.remove());

        const rect = button.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'sheet-action-menu fixed z-[110] bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 w-48 flex flex-col overflow-hidden animate-fade-in';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left - 150}px`; // anchor right

        const sheet = this.sheetManager.sheets.find(s => s.id === sheetId);
        const folders = this.sheetManager.folders || [];

        let folderOptionsHtml = `
            <div class="px-3 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Move to Folder</div>
            <button type="button" class="btn-move w-full text-left px-3 py-2 text-xs font-mono ${sheet.folderId === null ? 'text-amber-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700'}" data-folder-id="">
                (None / All Notes)
            </button>
        `;
        folders.forEach(f => {
            folderOptionsHtml += `
                <button type="button" class="btn-move w-full text-left px-3 py-2 text-xs font-mono ${sheet.folderId === f.id ? 'text-amber-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700'}" data-folder-id="${f.id}">
                    <i data-lucide="folder" class="size-3 inline-block mr-1 opacity-50"></i>${f.name}
                </button>
            `;
        });

        menu.innerHTML = `
            ${folderOptionsHtml}
            <div class="h-px bg-slate-700 my-1 w-full"></div>
            <button type="button" class="btn-delete w-full text-left px-3 py-2 text-xs font-mono text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                <i data-lucide="trash-2" class="size-3"></i> Delete Note
            </button>
        `;

        document.body.appendChild(menu);
        if (window.lucide) window.lucide.createIcons();

        // Close menu on outside click
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== button && !button.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 10);

        // Bind actions
        menu.querySelectorAll('.btn-move').forEach(btn => {
            btn.addEventListener('click', () => {
                const fId = btn.getAttribute('data-folder-id');
                sheet.folderId = fId ? fId : null;
                this.sheetManager.callbacks.onDataChange(); // save
                this.sheetManager.renderTabs();
                this.render();
                menu.remove();
            });
        });

        menu.querySelector('.btn-delete').addEventListener('click', async () => {
            menu.remove();
            await this.sheetManager.deleteSheet(sheetId);
            this.render();
        });
    }
}
