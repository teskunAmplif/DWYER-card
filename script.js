// 主应用状态
const AppState = {
    decks: {},           // 加载的所有牌堆
    currentDeck: null,   // 当前选中的牌堆
    currentDeckName: '', // 当前牌堆名称
    drawnCards: [],      // 当前抽取的卡片
    drawHistory: [],     // 抽取历史
    deckState: {},       // 各牌堆的状态（剩余卡片等）
    settings: {          // 用户设置
        allowDuplicates: true,
        autoReshuffle: false,
        saveHistory: true
    }
};

// DOM元素
const DOM = {
    deckSelect: document.getElementById('deckSelect'),
    drawCount: document.getElementById('drawCount'),
    allowDuplicates: document.getElementById('allowDuplicates'),
    autoReshuffle: document.getElementById('autoReshuffle'),
    drawButton: document.getElementById('drawButton'),
    shuffleButton: document.getElementById('shuffleButton'),
    clearButton: document.getElementById('clearButton'),
    resultsContainer: document.getElementById('resultsContainer'),
    historyList: document.getElementById('historyList'),
    deckCount: document.getElementById('deckCount'),
    deckDesc: document.getElementById('deckDesc'),
    totalDraws: document.getElementById('totalDraws'),
    currentDeck: document.getElementById('currentDeck'),
    commandInput: document.getElementById('commandInput'),
    executeCommand: document.getElementById('executeCommand'),
    exportData: document.getElementById('exportData'),
    importData: document.getElementById('importData'),
    resetData: document.getElementById('resetData'),
    importModal: document.getElementById('importModal'),
    importTextarea: document.getElementById('importTextarea'),
    confirmImport: document.getElementById('confirmImport'),
    cancelImport: document.getElementById('cancelImport')
};

// 初始化应用
class CardDrawerApp {
    constructor() {
        this.init();
    }

    async init() {
        // 从本地存储加载设置
        this.loadSettings();
        
        // 加载牌堆
        await this.loadDecks();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 初始化UI
        this.updateUI();
        
        // 解析URL参数（如果有）
        this.parseUrlParams();
    }

    async loadDecks() {
        try {
            // 从decks文件夹加载所有JSON文件
            const deckFiles = [
                'combat.json',
                'encounter.json',
                'treasure.json'
                // 添加更多牌堆文件...
            ];
            
            for (const file of deckFiles) {
                try {
                    const response = await fetch(`decks/${file}`);
                    if (response.ok) {
                        const deck = await response.json();
                        const deckName = file.replace('.json', '');
                        AppState.decks[deckName] = deck;
                        
                        // 初始化牌堆状态
                        if (!AppState.deckState[deckName]) {
                            AppState.deckState[deckName] = {
                                remainingCards: [...deck.cards],
                                shuffled: false
                            };
                        }
                    }
                } catch (error) {
                    console.warn(`无法加载牌堆 ${file}:`, error);
                }
            }
            
            // 从本地存储加载自定义牌堆
            this.loadCustomDecks();
            
            // 更新牌堆选择器
            this.populateDeckSelector();
            
        } catch (error) {
            console.error('加载牌堆时出错:', error);
            this.showError('无法加载牌堆数据，请检查网络连接或数据格式');
        }
    }

    loadCustomDecks() {
        const customDecks = localStorage.getItem('customDecks');
        if (customDecks) {
            try {
                const decks = JSON.parse(customDecks);
                for (const [name, deck] of Object.entries(decks)) {
                    AppState.decks[name] = deck;
                    if (!AppState.deckState[name]) {
                        AppState.deckState[name] = {
                            remainingCards: [...deck.cards],
                            shuffled: false
                        };
                    }
                }
            } catch (error) {
                console.error('加载自定义牌堆时出错:', error);
            }
        }
    }

    populateDeckSelector() {
        DOM.deckSelect.innerHTML = '<option value="">选择牌堆...</option>';
        
        const deckNames = Object.keys(AppState.decks).sort();
        
        for (const deckName of deckNames) {
            const deck = AppState.decks[deckName];
            const option = document.createElement('option');
            option.value = deckName;
            option.textContent = `${deck.name} (${deck.cards.length}张)`;
            DOM.deckSelect.appendChild(option);
        }
        
        // 如果有当前选中的牌堆，恢复选择
        if (AppState.currentDeckName && AppState.decks[AppState.currentDeckName]) {
            DOM.deckSelect.value = AppState.currentDeckName;
            this.selectDeck(AppState.currentDeckName);
        }
    }

    selectDeck(deckName) {
        if (!AppState.decks[deckName]) {
            console.error('牌堆不存在:', deckName);
            return;
        }
        
        AppState.currentDeckName = deckName;
        AppState.currentDeck = AppState.decks[deckName];
        
        // 更新UI
        DOM.deckCount.textContent = `${AppState.deckState[deckName].remainingCards.length}张`;
        DOM.deckDesc.textContent = AppState.currentDeck.description || '';
        DOM.currentDeck.textContent = AppState.currentDeck.name;
        
        // 保存到本地存储
        localStorage.setItem('lastSelectedDeck', deckName);
    }

    drawCards() {
        if (!AppState.currentDeck) {
            this.showError('请先选择牌堆！');
            return;
        }
        
        const count = parseInt(DOM.drawCount.value) || 1;
        const deckName = AppState.currentDeckName;
        const deckState = AppState.deckState[deckName];
        const allowDuplicates = DOM.allowDuplicates.checked;
        
        let drawn = [];
        
        if (allowDuplicates) {
            // 允许重复抽取
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * AppState.currentDeck.cards.length);
                drawn.push(AppState.currentDeck.cards[randomIndex]);
            }
        } else {
            // 不允许重复抽取
            if (deckState.remainingCards.length === 0) {
                if (DOM.autoReshuffle.checked) {
                    // 自动洗牌
                    this.shuffleDeck(deckName);
                } else {
                    this.showError('牌堆已空！请洗牌或选择允许重复抽取');
                    return;
                }
            }
            
            // 从剩余牌堆中抽取
            for (let i = 0; i < count && deckState.remainingCards.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * deckState.remainingCards.length);
                const card = deckState.remainingCards.splice(randomIndex, 1)[0];
                drawn.push(card);
            }
        }
        
        // 保存抽取结果
        AppState.drawnCards = drawn;
        
        // 记录历史
        const historyEntry = {
            deck: deckName,
            cards: [...drawn],
            timestamp: new Date().toISOString(),
            count: drawn.length
        };
        AppState.drawHistory.unshift(historyEntry);
        
        // 更新UI
        this.displayResults(drawn);
        this.updateHistory();
        this.updateStats();
        
        // 保存到本地存储
        this.saveState();
    }

    displayResults(cards) {
        DOM.resultsContainer.innerHTML = '';
        
        if (cards.length === 0) {
            DOM.resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>没有抽取到任何卡片！</p>
                </div>
            `;
            return;
        }
        
        cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index + 1);
            DOM.resultsContainer.appendChild(cardElement);
        });
        
        // 添加动画效果
        const cardElements = DOM.resultsContainer.querySelectorAll('.card');
        cardElements.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    createCardElement(cardText, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        cardDiv.innerHTML = `
            <div class="card-header">
                <div class="card-index">${index}</div>
                <div class="card-actions">
                    <button class="card-action copy-card" title="复制内容">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="card-action save-card" title="保存到收藏">
                        <i class="far fa-star"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">${this.escapeHtml(cardText)}</div>
        `;
        
        // 添加事件监听器
        const copyBtn = cardDiv.querySelector('.copy-card');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(cardText).then(() => {
                this.showToast('卡片内容已复制到剪贴板');
            });
        });
        
        const saveBtn = cardDiv.querySelector('.save-card');
        saveBtn.addEventListener('click', () => {
            this.saveCardToFavorites(cardText);
        });
        
        return cardDiv;
    }

    shuffleDeck(deckName = null) {
        const targetDeck = deckName || AppState.currentDeckName;
        if (!targetDeck || !AppState.decks[targetDeck]) {
            this.showError('请先选择牌堆！');
            return;
        }
        
        const deck = AppState.decks[targetDeck];
        const deckState = AppState.deckState[targetDeck];
        
        // 重置剩余牌堆
        deckState.remainingCards = [...deck.cards];
        deckState.shuffled = true;
        
        // 显示提示
        this.showToast(`${deck.name} 已洗牌！`);
        
        // 更新UI
        DOM.deckCount.textContent = `${deckState.remainingCards.length}张`;
        
        // 保存状态
        this.saveState();
    }

    updateHistory() {
        DOM.historyList.innerHTML = '';
        
        const recentHistory = AppState.drawHistory.slice(0, 10); // 只显示最近10条
        
        recentHistory.forEach((entry, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const deckName = AppState.decks[entry.deck]?.name || entry.deck;
            
            historyItem.innerHTML = `
                <strong>${time}</strong> - ${deckName} (${entry.count}张)
            `;
            
            // 点击历史项可以重新显示结果
            historyItem.addEventListener('click', () => {
                this.displayResults(entry.cards);
                AppState.drawnCards = entry.cards;
            });
            
            DOM.historyList.appendChild(historyItem);
        });
    }

    updateStats() {
        const totalDraws = AppState.drawHistory.reduce((sum, entry) => sum + entry.count, 0);
        DOM.totalDraws.textContent = `${totalDraws}次抽取`;
    }

    executeCommand(command) {
        command = command.trim().toLowerCase();
        
        // 解析类似 .draw combat 3 的指令
        const drawMatch = command.match(/^\.draw\s+(\w+)(?:\s+(\d+))?$/);
        if (drawMatch) {
            const deckName = drawMatch[1];
            const count = drawMatch[2] ? parseInt(drawMatch[2]) : 1;
            
            if (AppState.decks[deckName]) {
                DOM.deckSelect.value = deckName;
                this.selectDeck(deckName);
                DOM.drawCount.value = Math.min(count, 20);
                this.drawCards();
                return true;
            } else {
                this.showError(`牌堆 "${deckName}" 不存在！`);
                return false;
            }
        }
        
        // 解析洗牌指令
        const shuffleMatch = command.match(/^\.shuffle(?:\s+(\w+))?$/);
        if (shuffleMatch) {
            const deckName = shuffleMatch[1];
            this.shuffleDeck(deckName);
            return true;
        }
        
        // 解析帮助指令
        if (command === '.help' || command === '帮助') {
            this.showHelp();
            return true;
        }
        
        // 解析清空指令
        if (command === '.clear' || command === '清空') {
            this.clearResults();
            return true;
        }
        
        this.showError(`无法识别的指令: ${command}`);
        return false;
    }

    setupEventListeners() {
        // 牌堆选择
        DOM.deckSelect.addEventListener('change', (e) => {
            this.selectDeck(e.target.value);
        });
        
        // 抽取按钮
        DOM.drawButton.addEventListener('click', () => {
            this.drawCards();
        });
        
        // 洗牌按钮
        DOM.shuffleButton.addEventListener('click', () => {
            this.shuffleDeck();
        });
        
        // 清空按钮
        DOM.clearButton.addEventListener('click', () => {
            this.clearResults();
        });
        
        // 预设数量按钮
        document.querySelectorAll('.preset').forEach(button => {
            button.addEventListener('click', (e) => {
                const count = parseInt(e.target.dataset.count);
                DOM.drawCount.value = count;
            });
        });
        
        // 快捷指令按钮
        document.querySelectorAll('.quick-cmd').forEach(button => {
            button.addEventListener('click', (e) => {
                const command = e.target.dataset.cmd;
                DOM.commandInput.value = command;
                this.executeCommand(command);
            });
        });
        
        // 执行指令按钮
        DOM.executeCommand.addEventListener('click', () => {
            const command = DOM.commandInput.value;
            if (command) {
                this.executeCommand(command);
            }
        });
        
        // 指令输入框回车键
        DOM.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = DOM.commandInput.value;
                if (command) {
                    this.executeCommand(command);
                }
            }
        });
        
        // 导出数据
        DOM.exportData.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportData();
        });
        
        // 导入数据
        DOM.importData.addEventListener('click', (e) => {
            e.preventDefault();
            this.showImportModal();
        });
        
        // 重置数据
        DOM.resetData.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('确定要重置所有数据和设置吗？')) {
                this.resetData();
            }
        });
        
        // 导入模态框按钮
        DOM.confirmImport.addEventListener('click', () => {
            this.importData();
        });
        
        DOM.cancelImport.addEventListener('click', () => {
            this.hideImportModal();
        });
        
        // 设置变更
        DOM.allowDuplicates.addEventListener('change', () => {
            AppState.settings.allowDuplicates = DOM.allowDuplicates.checked;
            this.saveSettings();
        });
        
        DOM.autoReshuffle.addEventListener('change', () => {
            AppState.settings.autoReshuffle = DOM.autoReshuffle.checked;
            this.saveSettings();
        });
    }

    exportData() {
        const exportData = {
            decks: AppState.decks,
            history: AppState.drawHistory,
            settings: AppState.settings,
            deckState: AppState.deckState,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trpg-cards-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('数据导出成功！');
    }

    showImportModal() {
        DOM.importModal.style.display = 'block';
        DOM.importTextarea.value = '';
    }

    hideImportModal() {
        DOM.importModal.style.display = 'none';
    }

    importData() {
        try {
            const data = JSON.parse(DOM.importTextarea.value);
            
            // 验证数据格式
            if (!data.decks || typeof data.decks !== 'object') {
                throw new Error('无效的数据格式：缺少decks字段');
            }
            
            // 合并数据
            for (const [name, deck] of Object.entries(data.decks)) {
                AppState.decks[name] = deck;
                if (!AppState.deckState[name]) {
                    AppState.deckState[name] = {
                        remainingCards: [...deck.cards],
                        shuffled: false
                    };
                }
            }
            
            // 保存自定义牌堆到本地存储
            localStorage.setItem('customDecks', JSON.stringify(data.decks));
            
            // 更新UI
            this.populateDeckSelector();
            this.hideImportModal();
            this.showToast('牌堆数据导入成功！');
            
        } catch (error) {
            alert(`导入失败：${error.message}`);
        }
    }

    resetData() {
        // 清除本地存储
        localStorage.clear();
        
        // 重置应用状态
        AppState.decks = {};
        AppState.drawHistory = [];
        AppState.deckState = {};
        AppState.drawnCards = [];
        AppState.currentDeck = null;
        AppState.currentDeckName = '';
        
        // 重新加载默认牌堆
        this.loadDecks();
        
        // 重置UI
        this.displayResults([]);
        this.updateHistory();
        this.updateStats();
        
        this.showToast('数据已重置！');
    }

    saveCardToFavorites(cardText) {
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        favorites.push({
            text: cardText,
            timestamp: new Date().toISOString(),
            deck: AppState.currentDeckName
        });
        localStorage.setItem('favorites', JSON.stringify(favorites));
        this.showToast('已添加到收藏！');
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            try {
                AppState.settings = {...AppState.settings, ...JSON.parse(savedSettings)};
                DOM.allowDuplicates.checked = AppState.settings.allowDuplicates;
                DOM.autoReshuffle.checked = AppState.settings.autoReshuffle;
            } catch (error) {
                console.error('加载设置时出错:', error);
            }
        }
        
        // 加载上次选中的牌堆
        const lastDeck = localStorage.getItem('lastSelectedDeck');
        if (lastDeck) {
            AppState.currentDeckName = lastDeck;
        }
    }

    saveSettings() {
        localStorage.setItem('appSettings', JSON.stringify(AppState.settings));
    }

    saveState() {
        // 保存当前状态到本地存储
        localStorage.setItem('drawHistory', JSON.stringify(AppState.drawHistory));
        localStorage.setItem('deckState', JSON.stringify(AppState.deckState));
    }

    clearResults() {
        AppState.drawnCards = [];
        this.displayResults([]);
        this.showToast('结果已清空！');
    }

    showHelp() {
        const helpText = `
可用指令：
.draw <牌堆名> [数量]  - 抽取指定牌堆的卡片（数量默认为1）
.shuffle [牌堆名]     - 洗牌（默认为当前牌堆）
.clear                - 清空当前结果
.help                 - 显示此帮助

示例：
.draw combat         抽取1张战斗卡片
.draw treasure 3     抽取3张宝藏卡片
.shuffle            洗牌当前牌堆
        `.trim();
        
        alert(helpText);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        // 添加到页面顶部
        document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.header').nextSibling);
        
        // 3秒后移除
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    updateUI() {
        // 更新统计数据
        this.updateStats();
        
        // 更新牌堆信息
        if (AppState.currentDeck) {
            DOM.currentDeck.textContent = AppState.currentDeck.name;
            DOM.deckCount.textContent = `${AppState.deckState[AppState.currentDeckName]?.remainingCards.length || 0}张`;
        }
    }

    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const deckParam = params.get('deck');
        const drawParam = params.get('draw');
        
        if (deckParam && AppState.decks[deckParam]) {
            DOM.deckSelect.value = deckParam;
            this.selectDeck(deckParam);
            
            if (drawParam) {
                const count = parseInt(drawParam) || 1;
                DOM.drawCount.value = Math.min(count, 20);
                this.drawCards();
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

.error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 10px 15px;
    border-radius: 5px;
    margin: 10px 0;
    border: 1px solid #f5c6cb;
    animation: slideIn 0.3s ease;
}

.error-message i {
    margin-right: 10px;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new CardDrawerApp();
});