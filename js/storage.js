// 本地存储系统
class Storage {
    constructor() {
        this.dbName = 'mysql-oj-system';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('数据库打开失败:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('数据库打开成功');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建用户表
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'username' });
                    userStore.createIndex('password', 'password', { unique: false });
                }

                // 创建提交记录表
                if (!db.objectStoreNames.contains('submissions')) {
                    const submissionStore = db.createObjectStore('submissions', { autoIncrement: true });
                    submissionStore.createIndex('username', 'username', { unique: false });
                    submissionStore.createIndex('problemId', 'problemId', { unique: false });
                    submissionStore.createIndex('result', 'result', { unique: false });
                }

                // 创建做题记录表
                if (!db.objectStoreNames.contains('problemRecords')) {
                    const recordStore = db.createObjectStore('problemRecords', { keyPath: ['username', 'problemId'] });
                    recordStore.createIndex('username', 'username', { unique: false });
                    recordStore.createIndex('problemId', 'problemId', { unique: false });
                }
            };
        });
    }

    // 存储用户数据
    async storeUser(user) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);

            request.onsuccess = () => {
                console.log('用户数据存储成功');
                resolve();
            };

            request.onerror = (event) => {
                console.error('用户数据存储失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // 获取用户数据
    async getUser(username) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(username);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('获取用户数据失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // 存储提交记录
    async storeSubmission(submission) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['submissions'], 'readwrite');
            const store = transaction.objectStore('submissions');
            const request = store.add(submission);

            request.onsuccess = () => {
                console.log('提交记录存储成功');
                resolve();
            };

            request.onerror = (event) => {
                console.error('提交记录存储失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // 获取用户提交记录
    async getUserSubmissions(username, limit = 10) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['submissions'], 'readonly');
            const store = transaction.objectStore('submissions');
            const index = store.index('username');
            const request = index.getAll(IDBKeyRange.only(username));

            request.onsuccess = () => {
                const submissions = request.result;
                // 按时间倒序排序并限制数量
                submissions.sort((a, b) => b.timestamp - a.timestamp);
                resolve(submissions.slice(0, limit));
            };

            request.onerror = (event) => {
                console.error('获取提交记录失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // 存储做题记录
    async storeProblemRecord(record) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['problemRecords'], 'readwrite');
            const store = transaction.objectStore('problemRecords');
            const request = store.put(record);

            request.onsuccess = () => {
                console.log('做题记录存储成功');
                resolve();
            };

            request.onerror = (event) => {
                console.error('做题记录存储失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // 获取用户做题记录
    async getUserProblemRecords(username) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['problemRecords'], 'readonly');
            const store = transaction.objectStore('problemRecords');
            const index = store.index('username');
            const request = index.getAll(IDBKeyRange.only(username));

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('获取做题记录失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // 清除所有数据（用于测试）
    async clearAll() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users', 'submissions', 'problemRecords'], 'readwrite');
            
            transaction.objectStore('users').clear();
            transaction.objectStore('submissions').clear();
            transaction.objectStore('problemRecords').clear();

            transaction.oncomplete = () => {
                console.log('所有数据已清除');
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('清除数据失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }
}

// 导出单例实例
const storage = new Storage();
export default storage;