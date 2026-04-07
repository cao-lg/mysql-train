// 考试工具函数

// 时间格式化
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 生成唯一ID
export function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// 深度克隆对象
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 随机打乱数组
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 计算考试进度
export function calculateProgress(current, total) {
    return Math.round((current / total) * 100);
}

// 检查是否在考试中
export function isInExam() {
    const session = localStorage.getItem('currentExamSession');
    return session !== null;
}

// 获取当前考试状态
export function getCurrentExamStatus() {
    try {
        const session = localStorage.getItem('currentExamSession');
        if (session) {
            return JSON.parse(session);
        }
        return null;
    } catch (error) {
        console.error('获取考试状态失败:', error);
        return null;
    }
}

// 格式化日期时间
export function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 验证考试配置
export function validateExamConfig(config) {
    const errors = [];
    
    if (!config.name || config.name.trim() === '') {
        errors.push('考试名称不能为空');
    }
    
    if (!config.duration || config.duration < 1) {
        errors.push('考试时长必须大于0分钟');
    }
    
    if (!config.questionCount || config.questionCount < 1) {
        errors.push('题目数量必须大于0');
    }
    
    if (!config.difficulty) {
        errors.push('请选择难度级别');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// 生成考试题目
export async function generateExamQuestions(examConfig) {
    try {
        const problemLoader = await import('./problem-loader.js').then(module => module.default);
        const allProblems = await problemLoader.getAllProblems();
        
        // 筛选符合条件的题目
        let filteredProblems = allProblems;
        
        // 按章节筛选
        if (examConfig.chapters && examConfig.chapters.length > 0) {
            filteredProblems = filteredProblems.filter(problem => 
                examConfig.chapters.includes(problem.chapter)
            );
        }
        
        // 按难度筛选
        if (examConfig.difficulty && examConfig.difficulty !== 'all') {
            filteredProblems = filteredProblems.filter(problem => 
                problem.difficulty === examConfig.difficulty
            );
        }
        
        // 随机选择题目
        const shuffled = shuffleArray(filteredProblems);
        const selected = shuffled.slice(0, examConfig.questionCount);
        
        return { success: true, questions: selected };
    } catch (error) {
        console.error('生成考试题目失败:', error);
        return { success: false, error: error.message };
    }
}

// 保存考试数据到本地存储
export function saveExamData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('保存考试数据失败:', error);
        return false;
    }
}

// 从本地存储加载考试数据
export function loadExamData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('加载考试数据失败:', error);
        return null;
    }
}

// 清除考试数据
export function clearExamData() {
    try {
        localStorage.removeItem('currentExamSession');
        localStorage.removeItem('examHistory');
        return true;
    } catch (error) {
        console.error('清除考试数据失败:', error);
        return false;
    }
}

// 检查浏览器兼容性
export function checkBrowserCompatibility() {
    const features = {
        localStorage: 'localStorage' in window,
        indexedDB: 'indexedDB' in window,
        promises: typeof Promise !== 'undefined',
        asyncAwait: typeof (async function() {}) === 'function'
    };
    
    return {
        compatible: Object.values(features).every(feature => feature),
        features
    };
}

// 计算得分等级
export function getScoreLevel(score, totalScore) {
    const percentage = (score / totalScore) * 100;
    
    if (percentage >= 90) return { level: 'A', text: '优秀', color: '#4CAF50' };
    if (percentage >= 80) return { level: 'B', text: '良好', color: '#2196F3' };
    if (percentage >= 70) return { level: 'C', text: '中等', color: '#FF9800' };
    if (percentage >= 60) return { level: 'D', text: '及格', color: '#FFC107' };
    return { level: 'F', text: '不及格', color: '#F44336' };
}

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}