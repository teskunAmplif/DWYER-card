class CommandParser {
    parse(command) {
        command = command.trim();
        
        // 支持 .draw 指令
        if (command.startsWith('.draw ')) {
            const deckName = command.slice(6).trim();
            if (deckName) {
                return {
                    valid: true,
                    type: 'draw',
                    deckName: deckName,
                    original: command
                };
            }
        }
        
        return {
            valid: false,
            type: 'unknown',
            original: command
        };
    }
    
    getHelp() {
        return {
            '.draw <牌堆名>': '从指定牌堆抽取内容',
            '.help': '显示帮助信息',
            '.clear': '清空当前结果',
            '.history': '查看抽取历史'
        };
    }
}