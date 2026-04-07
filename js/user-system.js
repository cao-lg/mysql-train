// 用户系统
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    // 初始化用户系统
    async init() {
        // 尝试从本地存储获取当前用户
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('用户已登录:', this.currentUser.username);
            } catch (error) {
                console.error('解析用户数据失败:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    // 注册用户
    async register(username, password) {
        try {
            // 检查用户是否已存在
            const existingUser = await this.getUser(username);
            if (existingUser) {
                return { success: false, message: '用户名已存在' };
            }

            // 创建新用户
            const user = {
                username,
                password: this.hashPassword(password),
                registeredAt: new Date().toISOString(),
                solvedCount: 0,
                submitCount: 0,
                accuracy: 0
            };

            // 存储用户数据
            await this.storeUser(user);

            // 登录用户
            await this.login(username, password);

            return { success: true, message: '注册成功' };
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, message: '注册失败，请重试' };
        }
    }

    // 登录用户
    async login(username, password) {
        try {
            // 获取用户数据
            const user = await this.getUser(username);
            if (!user) {
                return { success: false, message: '用户名或密码错误' };
            }

            // 验证密码
            if (this.hashPassword(password) !== user.password) {
                return { success: false, message: '用户名或密码错误' };
            }

            // 保存当前用户到本地存储
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));

            return { success: true, message: '登录成功' };
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: '登录失败，请重试' };
        }
    }

    // 退出登录
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        console.log('用户已退出登录');
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否已登录
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 获取用户数据
    async getUser(username) {
        try {
            // 这里应该从 IndexedDB 获取用户数据
            // 暂时使用模拟实现
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            return users[username] || null;
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return null;
        }
    }

    // 存储用户数据
    async storeUser(user) {
        try {
            // 这里应该存储到 IndexedDB
            // 暂时使用 localStorage 模拟
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[user.username] = user;
            localStorage.setItem('users', JSON.stringify(users));
        } catch (error) {
            console.error('存储用户数据失败:', error);
            throw error;
        }
    }

    // 更新用户做题记录
    async updateUserRecord(username, problemId, result) {
        try {
            const user = await this.getUser(username);
            if (!user) {
                return;
            }

            // 更新提交次数
            user.submitCount++;

            // 如果答案正确，更新已做题数
            if (result === 'AC') {
                user.solvedCount++;
            }

            // 更新正确率
            user.accuracy = user.submitCount > 0 ? Math.round((user.solvedCount / user.submitCount) * 100) : 0;

            // 存储更新后的用户数据
            await this.storeUser(user);

            // 如果是当前用户，更新内存中的用户数据
            if (this.currentUser && this.currentUser.username === username) {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
        } catch (error) {
            console.error('更新用户记录失败:', error);
        }
    }

    // 存储提交记录
    async storeSubmission(username, problemId, problemTitle, sql, result, executionTime) {
        try {
            // 这里应该存储到 IndexedDB
            // 暂时使用 localStorage 模拟
            const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
            submissions.push({
                id: Date.now(),
                username,
                problemId,
                problemTitle,
                sql,
                result,
                executionTime,
                timestamp: new Date().toISOString()
            });
            // 只保留最近 100 条提交记录
            const recentSubmissions = submissions.slice(-100);
            localStorage.setItem('submissions', JSON.stringify(recentSubmissions));
        } catch (error) {
            console.error('存储提交记录失败:', error);
        }
    }

    // 获取用户提交记录
    async getUserSubmissions(username, limit = 10) {
        try {
            // 这里应该从 IndexedDB 获取
            // 暂时使用 localStorage 模拟
            const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
            const userSubmissions = submissions
                .filter(sub => sub.username === username)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
            return userSubmissions;
        } catch (error) {
            console.error('获取提交记录失败:', error);
            return [];
        }
    }

    // 密码哈希（简单实现，实际项目中应该使用更安全的哈希算法）
    hashPassword(password) {
        // 简单的哈希实现，实际项目中应该使用 bcrypt 等安全算法
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

// 导出单例实例
const userSystem = new UserSystem();
export default userSystem;