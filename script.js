class DeckSystem {
    constructor() {
        this.decks = new Map();
        this.history = [];
        this.sessionCount = 0;
        this.init();
    }

    async init() {
        // 初始化事件监听
        this.setupEventListeners();
        
        // 加载可用牌堆列表
        await this.loadDeckList();
        
        // 从本地存储加载历史记录
        this.loadHistory();
        
        // 更新UI
        this.updateCounters();
        
        // 自动聚焦到输入框
        document.getElementById('commandInput').focus();
    }

    setupEventListeners() {
        const input = document.getElementById('commandInput');
        const submitBtn = document.getElementById('submitBtn');
        const clearBtn = document.getElementById('clearHistory');
        
        // 提交命令
        submitBtn.addEventListener('click', () => this.processCommand());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processCommand();
        });
        
        // 清空历史
        clearBtn.addEventListener('click', () => this.clearHistory());
        
        // 命令提示点击
        document.querySelectorAll('.hint-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                input.value = e.target.dataset.command;
                this.processCommand();
            });
        });
        
        // 输入框获得焦点时的动画
        input.addEventListener('focus', () => {
            document.querySelector('.command-input-wrapper').classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            document.querySelector('.command-input-wrapper').classList.remove('focused');
        });
    }

    async loadDeckList() {
        try {
            // 这里列出所有可用的牌堆文件
            const deckFiles = [
    '星体',      // 新增
    '星座',      // 新增
    '宫位',      // 新增
    '占星骰子'   // 新增（复合牌堆）
                // 添加更多牌堆名称
            ];
            
            // 检查哪些牌堆文件存在
            const availableDecks = [];
            for (const deck of deckFiles) {
                try {
                    const response = await fetch(`decks/${deck}.json`);
                    if (response.ok) {
                        availableDecks.push(deck);
                    }
                } catch (error) {
                    console.warn(`牌堆 ${deck} 不存在或加载失败:`, error);
                }
            }
            
            // 更新命令提示
            this.updateCommandHints(availableDecks);
            
            // 更新状态栏
            document.getElementById('deckCount').textContent = `${availableDecks.length} 个牌堆已加载`;
            
        } catch (error) {
            console.error('加载牌堆列表失败:', error);
            document.getElementById('deckCount').textContent = '加载失败';
        }
    }

    updateCommandHints(decks) {
        const hintsContainer = document.querySelector('.command-hints');
        hintsContainer.innerHTML = '';
        
        decks.forEach(deck => {
            const hint = document.createElement('div');
            hint.className = 'hint-tag';
            hint.dataset.command = `.draw ${deck}`;
            hint.textContent = `.draw ${deck}`;
            hint.addEventListener('click', () => {
                document.getElementById('commandInput').value = `.draw ${deck}`;
                this.processCommand();
            });
            hintsContainer.appendChild(hint);
        });
    }

    async processCommand() {
        const input = document.getElementById('commandInput');
        const command = input.value.trim();
        
        if (!command) return;
        
        // 解析命令
        const parts = command.split(' ');
        if (parts[0] !== '.draw' || parts.length < 2) {
            this.showError('无效命令，请使用 .draw [牌堆名称] 格式');
            return;
        }
        
        const deckName = parts[1];
        
        // 抽取牌堆
        await this.drawFromDeck(deckName);
        
        // 清空输入框
        input.value = '';
        
        // 更新计数
        this.sessionCount++;
        this.updateCounters();
    }

async drawFromDeck(deckName) {
    try {
        this.showLoading();
        
        let deck;
        if (this.decks.has(deckName)) {
            deck = this.decks.get(deckName);
        } else {
            const response = await fetch(`decks/${deckName}.json`);
            if (!response.ok) {
                throw new Error(`牌堆 "${deckName}" 不存在`);
            }
            deck = await response.json();
            this.decks.set(deckName, deck);
        }
        
        // 检查是否为复合牌堆（包含占位符）
        if (deckName === '占星骰子') {
            // 处理复合抽取逻辑
            const result = this.drawCompoundDeck();
            this.displayResult(deckName, result);
            this.addToHistory(deckName, result);
        } else {
            // 普通牌堆的随机抽取
            if (!Array.isArray(deck) || deck.length === 0) {
                throw new Error(`牌堆 "${deckName}" 格式错误或为空`);
            }
            
            const randomIndex = Math.floor(Math.random() * deck.length);
            const result = deck[randomIndex];
            
            this.displayResult(deckName, result, randomIndex);
            this.addToHistory(deckName, result);
        }
        
        this.saveHistory();
        
    } catch (error) {
        console.error('抽取失败:', error);
        this.showError(error.message || '抽取失败，请检查牌堆名称');
    }
}

// 新增：处理复合牌堆抽取
drawCompoundDeck() {
    // 确保子牌堆已加载
    const 星体 = this.decks.get('星体') || [];
    const 星座 = this.decks.get('星座') || [];
    const 宫位 = this.decks.get('宫位') || [];
    
    if (星体.length === 0 || 星座.length === 0 || 宫位.length === 0) {
        throw new Error('请先加载星体、星座、宫位牌堆');
    }
    
    // 随机抽取各个子牌堆
    const random星体 = 星体[Math.floor(Math.random() * 星体.length)];
    const random星座 = 星座[Math.floor(Math.random() * 星座.length)];
    const random宫位 = 宫位[Math.floor(Math.random() * 宫位.length)];
    
    // 组合结果
    return `星体：${random星体}\n\n星座：${random星座}\n\n宫位：${random宫位}`;
}
            
            const randomIndex = Math.floor(Math.random() * deck.length);
            const result = deck[randomIndex];
            
            // 显示结果
            this.displayResult(deckName, result, randomIndex);
            
            // 保存到历史记录
            this.addToHistory(deckName, result);
            
            // 保存到本地存储
            this.saveHistory();
            
        } catch (error) {
            console.error('抽取失败:', error);
            this.showError(error.message || '抽取失败，请检查牌堆名称');
        }
    }

    displayResult(deckName, content, index) {
        const template = document.getElementById('cardTemplate');
        const card = template.content.cloneNode(true);
        
        // 填充卡片内容
        const deckNameEl = card.querySelector('.deck-name');
        const cardTime = card.querySelector('.card-time');
        const cardContent = card.querySelector('.card-content');
        const cardIndex = card.querySelector('.card-index');
        
        deckNameEl.textContent = deckName;
        cardTime.textContent = this.formatTime(new Date());
        cardContent.textContent = typeof content === 'object' ? JSON.stringify(content) : content;
        cardIndex.textContent = `#${index + 1}`;
        
        // 插入到显示区域顶部
        const displayArea = document.querySelector('.card-display-area');
        const welcomeCard = displayArea.querySelector('.welcome-card');
        
        if (welcomeCard) {
            welcomeCard.style.display = 'none';
        }
        
        // 只保留最新的3个结果
        const existingCards = displayArea.querySelectorAll('.result-card');
        if (existingCards.length >= 3) {
            displayArea.removeChild(existingCards[existingCards.length - 1]);
        }
        
        displayArea.insertBefore(card, displayArea.firstChild);
    }

    showError(message) {
        const errorCard = document.createElement('div');
        errorCard.className = 'result-card error';
        errorCard.innerHTML = `
            <div class="card-header">
                <span class="deck-name" style="color: #ef4444;">错误</span>
                <span class="card-time">${this.formatTime(new Date())}</span>
            </div>
            <div class="card-content" style="border-left-color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
        
        const displayArea = document.querySelector('.card-display-area');
        displayArea.insertBefore(errorCard, displayArea.firstChild);
        
        // 自动移除错误提示
        setTimeout(() => {
            if (errorCard.parentNode) {
                errorCard.style.opacity = '0';
                setTimeout(() => errorCard.parentNode.removeChild(errorCard), 300);
            }
        }, 5000);
    }

    showLoading() {
        const inputWrapper = document.querySelector('.command-input-wrapper');
        const originalContent = inputWrapper.innerHTML;
        
        inputWrapper.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <span style="color: var(--accent-color); margin-left: 10px;">正在抽取...</span>
            </div>
        `;
        
        return () => {
            inputWrapper.innerHTML = originalContent;
        };
    }

    addToHistory(deckName, result) {
        const historyItem = {
            id: Date.now(),
            time: new Date(),
            command: `.draw ${deckName}`,
            result: typeof result === 'object' ? JSON.stringify(result) : result,
            deckName: deckName
        };
        
        this.history.unshift(historyItem);
        
        // 只保留最近50条记录
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const countElement = document.getElementById('historyCount');
        
        // 更新计数
        countElement.textContent = this.history.length;
        
        // 清空列表
        historyList.innerHTML = '';
        
        // 添加历史记录
        this.history.forEach(item => {
            const template = document.getElementById('historyTemplate');
            const historyItem = template.content.cloneNode(true);
            
            historyItem.querySelector('.history-time').textContent = this.formatTime(item.time);
            historyItem.querySelector('.history-command').textContent = item.command;
            historyItem.querySelector('.history-result').textContent = 
                item.result.length > 50 ? item.result.substring(0, 50) + '...' : item.result;
            
            historyList.appendChild(historyItem);
        });
    }

    clearHistory() {
        if (confirm('确定要清空所有抽取记录吗？')) {
            this.history = [];
            this.sessionCount = 0;
            localStorage.removeItem('trpg_deck_history');
            localStorage.removeItem('trpg_session_count');
            this.updateHistoryDisplay();
            this.updateCounters();
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('trpg_deck_history', JSON.stringify(this.history));
            localStorage.setItem('trpg_session_count', this.sessionCount.toString());
        } catch (error) {
            console.error('保存历史记录失败:', error);
        }
    }

    loadHistory() {
        try {
            const savedHistory = localStorage.getItem('trpg_deck_history');
            const savedCount = localStorage.getItem('trpg_session_count');
            
            if (savedHistory) {
                this.history = JSON.parse(savedHistory).map(item => ({
                    ...item,
                    time: new Date(item.time)
                }));
            }
            
            if (savedCount) {
                this.sessionCount = parseInt(savedCount, 10);
            }
            
            this.updateHistoryDisplay();
        } catch (error) {
            console.error('加载历史记录失败:', error);
        }
    }

    updateCounters() {
        document.getElementById('sessionCount').textContent = this.sessionCount;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        // 如果是今天，显示时间
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // 如果是昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return '昨天 ' + date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // 其他情况显示日期
        return date.toLocaleDateString('zh-CN');
    }
}

// 添加额外的CSS
const extraStyles = `
.loading-indicator {
    display: flex;
    align-items: center;
    padding: 15px;
    width: 100%;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.command-input-wrapper.focused {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3);
}
`;

// 添加额外的样式
const styleSheet = document.createElement('style');
styleSheet.textContent = extraStyles;
document.head.appendChild(styleSheet);

// 初始化系统
let deckSystem;
document.addEventListener('DOMContentLoaded', () => {
    deckSystem = new DeckSystem();
});

// 添加窗口大小变化的处理
window.addEventListener('resize', () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

// 初始设置
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);