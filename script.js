// 主应用类 - 精简版（完整逻辑与之前方案类似，但适配新UI）
class ArcanaDrawer {
    constructor() {
        this.init();
    }

    async init() {
        // 初始化
        this.setupEventListeners();
        this.loadSettings();
        await this.loadDecks();
        this.updateUI();
        
        // 主题切换
        this.setupTheme();
    }

    setupTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        // 检查保存的主题
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // 更新图标
            const icon = themeToggle.querySelector('i');
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }

    // ... 其他方法保持与之前类似，但更新DOM选择器和UI交互
}

// 添加主题切换的CSS
const themeCSS = `
[data-theme="light"] {
    --color-background: #f8fafc;
    --color-surface: #ffffff;
    --color-surface-elevated: #f1f5f9;
    --color-surface-hover: #e2e8f0;
    
    --color-text-primary: #1e293b;
    --color-text-secondary: #475569;
    --color-text-tertiary: #64748b;
    --color-text-muted: #94a3b8;
    
    --color-border: rgba(0, 0, 0, 0.1);
    --color-border-light: rgba(0, 0, 0, 0.05);
    
    --gradient-surface: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    --gradient-glass: linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
    
    --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] {
    --color-background: #0a0a0f;
    --color-surface: #161622;
    --color-surface-elevated: #1e1e2e;
    --color-surface-hover: #252536;
    
    --color-text-primary: #f8fafc;
    --color-text-secondary: #cbd5e1;
    --color-text-tertiary: #94a3b8;
    --color-text-muted: #64748b;
    
    --color-border: rgba(255, 255, 255, 0.1);
    --color-border-light: rgba(255, 255, 255, 0.05);
    
    --gradient-surface: linear-gradient(145deg, #161622 0%, #1a1a27 100%);
    --gradient-glass: linear-gradient(145deg, rgba(30, 30, 46, 0.8) 0%, rgba(30, 30, 46, 0.6) 100%);
    
    --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    --shadow-xl: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
}
`;

// 添加主题样式
const style = document.createElement('style');
style.textContent = themeCSS;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ArcanaDrawer();
    
    // 设置默认主题
    if (!document.documentElement.getAttribute('data-theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        document.documentElement.setAttribute('data-theme', prefersDark.matches ? 'dark' : 'light');
    }
});