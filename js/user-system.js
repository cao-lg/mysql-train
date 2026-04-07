// 用户系统
import storage from './storage.js';

class UserSystem {
    constructor() {
        this.currentUser = null;
        this.validRoles = ['teacher', 'student'];
        this.rolePermissions = {
            teacher: ['view_problems', 'submit_solutions', 'view_submissions', 'manage_problems', 'view_all_submissions', 'manage_users'],
            student: ['view_problems', 'submit_solutions', 'view_submissions']
        };
        this.init();
    }

    async init() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                if (!this.currentUser.role) {
                    this.currentUser.role = 'student';
                }
                console.log('用户已登录:', this.currentUser.username, '角色:', this.currentUser.role);
            } catch (error) {
                console.error('解析用户数据失败:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    async register(username, password, role = 'student') {
        try {
            if (!this.validRoles.includes(role)) {
                return { success: false, message: '无效的角色类型' };
            }

            const existingUser = await this.getUser(username);
            if (existingUser) {
                return { success: false, message: '用户名已存在' };
            }

            const user = {
                username,
                password: this.hashPassword(password),
                role,
                registeredAt: new Date().toISOString(),
                solvedCount: 0,
                submitCount: 0,
                accuracy: 0
            };

            await this.storeUser(user);

            await this.login(username, password);

            return { success: true, message: '注册成功' };
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, message: '注册失败，请重试' };
        }
    }

    async login(username, password) {
        try {
            const user = await this.getUser(username);
            if (!user) {
                return { success: false, message: '用户名或密码错误' };
            }

            if (this.hashPassword(password) !== user.password) {
                return { success: false, message: '用户名或密码错误' };
            }

            if (!user.role) {
                user.role = 'student';
                await this.storeUser(user);
            }

            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));

            return { success: true, message: '登录成功' };
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: '登录失败，请重试' };
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        console.log('用户已退出登录');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    hasRole(role) {
        if (!this.currentUser) {
            return false;
        }
        return this.currentUser.role === role;
    }

    isTeacher() {
        return this.hasRole('teacher');
    }

    isStudent() {
        return this.hasRole('student');
    }

    requireRole(role) {
        if (!this.isLoggedIn()) {
            return { success: false, message: '请先登录' };
        }
        if (!this.hasRole(role)) {
            return { success: false, message: '权限不足，需要 ' + this.getRoleDisplayName(role) + ' 角色' };
        }
        return { success: true, message: '验证通过' };
    }

    checkPermission(permission) {
        if (!this.currentUser) {
            return false;
        }
        const role = this.currentUser.role;
        const permissions = this.rolePermissions[role] || [];
        return permissions.includes(permission);
    }

    getRoleDisplayName(role) {
        const roleNames = {
            teacher: '教师',
            student: '学生'
        };
        return roleNames[role] || role;
    }

    getCurrentUserPermissions() {
        if (!this.currentUser) {
            return [];
        }
        return this.rolePermissions[this.currentUser.role] || [];
    }

    async getUser(username) {
        try {
            return await storage.getUser(username);
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return null;
        }
    }

    async storeUser(user) {
        try {
            await storage.storeUser(user);
        } catch (error) {
            console.error('存储用户数据失败:', error);
            throw error;
        }
    }

    async updateUserRecord(username, problemId, result) {
        try {
            const user = await this.getUser(username);
            if (!user) {
                return;
            }

            user.submitCount++;

            if (result === 'AC') {
                user.solvedCount++;
            }

            user.accuracy = user.submitCount > 0 ? Math.round((user.solvedCount / user.submitCount) * 100) : 0;

            await this.storeUser(user);

            if (this.currentUser && this.currentUser.username === username) {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
        } catch (error) {
            console.error('更新用户记录失败:', error);
        }
    }

    async storeSubmission(username, problemId, problemTitle, sql, result, executionTime) {
        try {
            const submission = {
                username,
                problemId,
                problemTitle,
                sql,
                result,
                executionTime,
                timestamp: new Date().toISOString()
            };
            await storage.storeSubmission(submission);
        } catch (error) {
            console.error('存储提交记录失败:', error);
        }
    }

    async getUserSubmissions(username, limit = 10) {
        try {
            return await storage.getUserSubmissions(username, limit);
        } catch (error) {
            console.error('获取提交记录失败:', error);
            return [];
        }
    }

    async getAllUsers() {
        try {
            return await storage.getAllUsers();
        } catch (error) {
            console.error('获取所有用户失败:', error);
            return [];
        }
    }

    async deleteUser(username) {
        try {
            await storage.delete('users', username);
        } catch (error) {
            console.error('删除用户失败:', error);
            throw error;
        }
    }

    async exportUserData(username) {
        try {
            return await storage.exportUserData(username);
        } catch (error) {
            console.error('导出用户数据失败:', error);
            return null;
        }
    }

    async exportAndDownload(type = 'all') {
        if (!this.currentUser) {
            return { success: false, error: '请先登录' };
        }
        
        try {
            return await storage.exportAndDownload(this.currentUser.username, type);
        } catch (error) {
            console.error('导出数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getStorageStats() {
        try {
            return await storage.getStorageStats();
        } catch (error) {
            console.error('获取存储统计失败:', error);
            return null;
        }
    }

    async manualCleanup(options = {}) {
        try {
            return await storage.manualCleanup(options);
        } catch (error) {
            console.error('手动清理失败:', error);
            return { success: false, error: error.message };
        }
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

const userSystem = new UserSystem();
export default userSystem;
