// 项目初始化
class Core {
    constructor() {
        this.initTheme();
        this.initEventListeners();
    }

    // 初始化主题
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            this.updateThemeButton();
        }
    }

    // 初始化事件监听器
    initEventListeners() {
        // 主题切换按钮
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                this.updateThemeButton();
                localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            });
        }
    }

    // 更新主题按钮
    updateThemeButton() {
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
        }
    }
}

// 初始化项目
window.addEventListener('DOMContentLoaded', () => {
    new Core();
});