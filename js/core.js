import userSystem from './user-system.js';

class Core {
    constructor() {
        this.initTheme();
        this.initEventListeners();
        this.initNavigation();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            this.updateThemeButton();
        }
    }

    initEventListeners() {
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                this.updateThemeButton();
                localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            });
        }

        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            });

            navMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                });
            });
        }
    }

    updateThemeButton() {
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
        }
    }

    initNavigation() {
        const navMenu = document.getElementById('nav-menu');
        if (!navMenu) return;

        const menuItems = this.getMenuItems();
        this.renderMenu(navMenu, menuItems);
        this.highlightCurrentPage();
    }

    getMenuItems() {
        const isLoggedIn = userSystem.isLoggedIn();
        const isTeacher = userSystem.isTeacher();
        const isStudent = userSystem.isStudent();
        const basePath = this.getBasePath();

        if (!isLoggedIn) {
            return [
                { href: `${basePath}index.html`, text: '首页', icon: '🏠' },
                { href: `${basePath}pages/problems.html`, text: '题库', icon: '📚' },
                { href: `${basePath}pages/user.html`, text: '登录', icon: '🔐' }
            ];
        }

        if (isTeacher) {
            return [
                { href: `${basePath}index.html`, text: '首页', icon: '🏠' },
                { href: `${basePath}pages/problems.html`, text: '题库', icon: '📚' },
                { href: `${basePath}pages/exam/manage.html`, text: '考试管理', icon: '📝' },
                { href: `${basePath}pages/user.html`, text: '用户中心', icon: '👤' }
            ];
        }

        if (isStudent) {
            return [
                { href: `${basePath}index.html`, text: '首页', icon: '🏠' },
                { href: `${basePath}pages/problems.html`, text: '题库', icon: '📚' },
                { href: `${basePath}pages/exam/manage.html`, text: '参加考试', icon: '✍️' },
                { href: `${basePath}pages/exam/history.html`, text: '考试历史', icon: '📊' },
                { href: `${basePath}pages/user.html`, text: '用户中心', icon: '👤' }
            ];
        }

        return [
            { href: `${basePath}index.html`, text: '首页', icon: '🏠' },
            { href: `${basePath}pages/problems.html`, text: '题库', icon: '📚' },
            { href: `${basePath}pages/user.html`, text: '用户中心', icon: '👤' }
        ];
    }

    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/pages/exam/')) {
            return '../../';
        } else if (path.includes('/pages/')) {
            return '../';
        }
        return '';
    }

    renderMenu(container, items) {
        container.innerHTML = items.map(item => `
            <li><a href="${item.href}" data-nav="${item.href}">${item.text}</a></li>
        `).join('');
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('#nav-menu a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const resolvedPath = new URL(href, window.location.origin).pathname;
            
            if (currentPath === resolvedPath || 
                (currentPath.includes('/pages/exam/') && href.includes('exam/manage.html'))) {
                link.classList.add('active');
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Core();
});
