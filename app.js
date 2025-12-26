class DrawSystem {
    constructor() {
        this.deckManager = new DeckManager();
        this.commandParser = new CommandParser();
        this.history = JSON.parse(localStorage.getItem('drawHistory') || '[]');
        this.drawCount = parseInt(localStorage.getItem('drawCount') || '0');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateStats();
        this.renderHistory();
        this.loadDefaultDecks();
    }
    
    bindEvents() {
        const commandInput = document.getElementById('command-input');
        const executeBtn = document.getElementById('execute-btn');
        const copyBtn = document.getElementById('copy-result');
        const clearBtn = document.getElementById('clear-result');
        const clearHistoryBtn = document.getElementById('clear-history');
        const toggleHistoryBtn = document.getElementById('toggle-history');
        
        // 执行指令
        executeBtn.addEventListener('click', () => this.executeCommand());
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.executeCommand();
        });
        
        // 复制结果
        copyBtn.addEventListener('click', () => this.copyResult());
        
        // 清空结果
        clearBtn.addEventListener('click', () => this.clearResult());
        
        // 历史记录控制
        clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        toggleHistoryBtn.addEventListener('click', () => this.toggleHistory());
        
        // 聚焦输入框
        commandInput.focus();
    }
    
    async loadDefaultDecks() {
        try {
            // 加载默认的拼接兽牌堆
            await this.deckManager.loadDeck('拼接兽', 'decks/拼接兽.json');
            this.updateStats();
        } catch (error) {
            console.error('加载默认牌堆失败:', error);
        }
    }
    
    async executeCommand() {
        const commandInput = document.getElementById('command-input');
        const command = commandInput.value.trim();
        
        if (!command) return;
        
        // 解析指令
        const parsed = this.commandParser.parse(command);
        
        if (!parsed.valid) {
            this.showResult('错误', `无效指令: ${command}\n\n支持的指令格式:\n.draw 牌堆名称`, 'error');
            return;
        }
        
        if (parsed.type === 'draw') {
            await this.drawFromDeck(parsed.deckName);
        }
        
        // 清空输入框
        commandInput.value = '';
        commandInput.focus();
    }
    
    async drawFromDeck(deckName) {
        try {
            // 检查牌堆是否已加载
            if (!this.deckManager.hasDeck(deckName)) {
                // 尝试加载牌堆文件
                const loaded = await this.deckManager.loadDeck(deckName, `decks/${deckName}.json`);
                if (!loaded) {
                    this.showResult('错误', `找不到牌堆: ${deckName}`, 'error');
                    return;
                }
                this.updateStats();
            }
            
            // 抽取内容
            const result = this.deckManager.draw(deckName);
            
            if (!result) {
                this.showResult('错误', `抽取牌堆失败: ${deckName}`, 'error');
                return;
            }
            
            // 显示结果
            this.showResult(deckName, result);
            
            // 记录历史
            this.addToHistory({
                command: `.draw ${deckName}`,
                result: result,
                deck: deckName,
                timestamp: new Date().toLocaleString('zh-CN')
            });
            
            // 更新计数
            this.drawCount++;
            localStorage.setItem('drawCount', this.drawCount.toString());
            this.updateStats();
            
        } catch (error) {
            console.error('抽取失败:', error);
            this.showResult('错误', `抽取过程中发生错误: ${error.message}`, 'error');
        }
    }
    
    showResult(title, content, type = 'success') {
        const resultDisplay = document.getElementById('result-display');
        
        // 创建结果卡片
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        const time = new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        resultCard.innerHTML = `
            <div class="result-header ${type}">
                <div class="result-title">
                    <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'dice'}"></i>
                    <h3>${title}</h3>
                </div>
                <span class="result-time">${time}</span>
            </div>
            <div class="result-content">
                <pre>${content}</pre>
            </div>
        `;
        
        // 清除欢迎信息
        const welcomeMsg = resultDisplay.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // 添加到结果区
        resultDisplay.prepend(resultCard);
        
        // 自动滚动到顶部
        resultDisplay.scrollTop = 0;
    }
    
    addToHistory(item) {
        this.history.unshift(item);
        
        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        // 保存到本地存储
        localStorage.setItem('drawHistory', JSON.stringify(this.history));
        
        // 更新显示
        this.renderHistory();
    }
    
    renderHistory() {
        const historyList = document.getElementById('history-list');
        
        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-history"></i>
                    <p>暂无抽取历史</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.history.map((item, index) => `
            <div class="history-item">
                <div class="history-command">
                    <span class="time">${item.timestamp}</span>
                    <code class="command">${item.command}</code>
                </div>
                <div class="history-result">
                    <strong>牌堆:</strong> ${item.deck}<br>
                    <strong>结果:</strong><br>
                    <pre>${item.result}</pre>
                </div>
            </div>
        `).join('');
    }
    
    clearResult() {
        const resultDisplay = document.getElementById('result-display');
        resultDisplay.innerHTML = `
            <div class="welcome-message">
                <h3>欢迎使用跑团牌堆抽取系统</h3>
                <p>请输入 .draw 指令开始抽取牌堆内容</p>
                <div class="examples">
                    <p><strong>示例指令：</strong></p>
                    <code>.draw 拼接兽</code>
                    <code>.draw 随机事件</code>
                    <code>.draw NPC生成</code>
                </div>
            </div>
        `;
    }
    
    clearHistory() {
        if (confirm('确定要清空所有抽取历史吗？')) {
            this.history = [];
            localStorage.removeItem('drawHistory');
            this.renderHistory();
        }
    }
    
    toggleHistory() {
        const historyList = document.getElementById('history-list');
        const toggleIcon = document.getElementById('toggle-history').querySelector('i');
        
        historyList.classList.toggle('collapsed');
        toggleIcon.classList.toggle('fa-chevron-up');
        toggleIcon.classList.toggle('fa-chevron-down');
    }
    
    async copyResult() {
        const resultContent = document.querySelector('.result-content pre');
        if (resultContent) {
            try {
                await navigator.clipboard.writeText(resultContent.textContent);
                this.showToast('结果已复制到剪贴板', 'success');
            } catch (err) {
                console.error('复制失败:', err);
                this.showToast('复制失败，请手动复制', 'error');
            }
        }
    }
    
    showToast(message, type = 'info') {
        // 创建并显示临时提示
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    updateStats() {
        document.getElementById('draw-count').textContent = this.drawCount;
        document.getElementById('deck-count').textContent = this.deckManager.getDeckCount();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.drawSystem = new DrawSystem();
});