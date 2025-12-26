class DeckManager {
    constructor() {
        this.decks = new Map();
        this.cache = new Map(); // 缓存解析结果
    }
    
    async loadDeck(name, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.decks.set(name, data);
            console.log(`牌堆加载成功: ${name}`);
            return true;
        } catch (error) {
            console.error(`加载牌堆失败 ${name}:`, error);
            return false;
        }
    }
    
    hasDeck(name) {
        return this.decks.has(name);
    }
    
    getDeck(name) {
        return this.decks.get(name);
    }
    
    draw(deckName) {
        const deck = this.getDeck(deckName);
        if (!deck) return null;
        
        // 处理特殊字段
        if (deckName === '拼接兽' && deck['拼接兽']) {
            return this.processDeckEntry(deck['拼接兽'][0], deck);
        }
        
        // 查找可能的牌堆数组
        for (const [key, value] of Object.entries(deck)) {
            if (Array.isArray(value)) {
                const entry = this.selectRandomEntry(value);
                return this.processDeckEntry(entry, deck);
            }
        }
        
        return null;
    }
    
    selectRandomEntry(entries) {
        const weightedEntries = [];
        
        entries.forEach(entry => {
            let weight = 1;
            let content = entry;
            
            // 解析权重格式 "::5::内容"
            const weightMatch = entry.match(/^::(\d+)::(.*)$/);
            if (weightMatch) {
                weight = parseInt(weightMatch[1]);
                content = weightMatch[2];
            }
            
            for (let i = 0; i < weight; i++) {
                weightedEntries.push(content);
            }
        });
        
        const randomIndex = Math.floor(Math.random() * weightedEntries.length);
        return weightedEntries[randomIndex];
    }
    
    processDeckEntry(entry, deck) {
        if (typeof entry !== 'string') return entry;
        
        // 解析嵌套引用 {%牌堆名}
        return entry.replace(/\{%([^}]+)\}/g, (match, deckRef) => {
            // 处理玩家标记 [$t玩家]
            if (deckRef === '$t玩家') return '玩家';
            
            // 解析引用链条
            const parts = deckRef.split('.');
            let currentDeck = deck;
            
            for (const part of parts) {
                if (currentDeck && currentDeck[part]) {
                    currentDeck = currentDeck[part];
                } else {
                    return `[缺失:${part}]`;
                }
            }
            
            // 如果是数组，随机选择一个
            if (Array.isArray(currentDeck)) {
                return this.selectRandomEntry(currentDeck);
            }
            
            return currentDeck || `[未找到:${deckRef}]`;
        });
    }
    
    getDeckCount() {
        return this.decks.size;
    }
    
    clearCache() {
        this.cache.clear();
    }
}