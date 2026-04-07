// 本地存储系统 - 优化版
// 集成 LZString 压缩库
const LZString = {
    _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    
    compressToBase64: function(input) {
        if (input == null) return '';
        const compressed = this._compress(input, 6, function(a) {
            return LZString._keyStr.charAt(a);
        });
        switch (compressed.length % 4) {
            default:
            case 0: return compressed;
            case 1: return compressed + '===';
            case 2: return compressed + '==';
            case 3: return compressed + '=';
        }
    },
    
    decompressFromBase64: function(input) {
        if (input == null) return '';
        if (input == '') return null;
        return this._decompress(input.length, 32, function(index) {
            return LZString._keyStr.indexOf(input.charAt(index));
        });
    },
    
    compress: function(input) {
        if (input == null) return '';
        return this._compress(input, 16, function(a) {
            return String.fromCharCode(a);
        });
    },
    
    _compress: function(input, bitsPerChar, getCharFromInt) {
        if (input == null) return '';
        let i, value, context_dictionary = {}, context_dictionaryToCreate = {},
            context_c = '', context_wc = '', context_w = '', context_enlargeIn = 2,
            context_dictSize = 3, context_numBits = 2, context_data = [],
            context_data_val = 0, context_data_position = 0, ii;
        
        for (ii = 0; ii < input.length; ii += 1) {
            context_c = input.charAt(ii);
            if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                context_dictionary[context_c] = context_dictSize++;
                context_dictionaryToCreate[context_c] = true;
            }
            context_wc = context_w + context_c;
            if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                context_w = context_wc;
            } else {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
                context_dictionary[context_wc] = context_dictSize++;
                context_w = String(context_c);
            }
        }
        
        if (context_w !== '') {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                    }
                    value = context_w.charCodeAt(0);
                    for (i = 0; i < 8; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                } else {
                    value = 1;
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | value;
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                    value = context_w.charCodeAt(0);
                    for (i = 0; i < 16; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
            } else {
                value = context_dictionary[context_w];
                for (i = 0; i < context_numBits; i++) {
                    context_data_val = (context_data_val << 1) | (value & 1);
                    if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                    } else {
                        context_data_position++;
                    }
                    value = value >> 1;
                }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
            }
        }
        
        value = 2;
        for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
            } else {
                context_data_position++;
            }
            value = value >> 1;
        }
        
        while (true) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar - 1) {
                context_data.push(getCharFromInt(context_data_val));
                break;
            } else {
                context_data_position++;
            }
        }
        return context_data.join('');
    },
    
    decompress: function(compressed) {
        if (compressed == null) return '';
        if (compressed == '') return null;
        return this._decompress(compressed.length, 32768, function(index) {
            return compressed.charCodeAt(index);
        });
    },
    
    _decompress: function(length, resetValue, getNextValue) {
        let dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3,
            entry = '', result = [], i, w, bits, resb, maxpower, power, c,
            data = { val: getNextValue(0), position: resetValue, index: 1 };
        
        for (i = 0; i < 3; i += 1) {
            dictionary[i] = i;
        }
        
        bits = 0;
        maxpower = Math.pow(2, 2);
        power = 1;
        while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
        }
        
        switch (next = bits) {
            case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                c = String.fromCharCode(bits);
                break;
            case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                c = String.fromCharCode(bits);
                break;
            case 2:
                return '';
        }
        dictionary[3] = c;
        w = c;
        result.push(c);
        while (true) {
            if (data.index > length) {
                return '';
            }
            
            bits = 0;
            maxpower = Math.pow(2, numBits);
            power = 1;
            while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            
            switch (c = bits) {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2, 8);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    dictionary[dictSize++] = String.fromCharCode(bits);
                    c = dictSize - 1;
                    enlargeIn--;
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2, 16);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    dictionary[dictSize++] = String.fromCharCode(bits);
                    c = dictSize - 1;
                    enlargeIn--;
                    break;
                case 2:
                    return result.join('');
            }
            
            if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }
            
            if (dictionary[c]) {
                entry = dictionary[c];
            } else {
                if (c === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }
            result.push(entry);
            dictionary[dictSize++] = w + entry.charAt(0);
            enlargeIn--;
            if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }
            w = entry;
        }
    }
};

class Storage {
    constructor() {
        this.dbName = 'mysql-oj-system';
        this.dbVersion = 2;
        this.db = null;
        this.isReady = false;
        this.readyPromise = this.init();
        
        this.config = {
            maxHistoryRecords: 100,
            maxSubmissions: 200,
            dataExpirationDays: 90,
            compressionThreshold: 1024,
            autoCleanupInterval: 24 * 60 * 60 * 1000
        };
        
        this.compressedStores = ['examResults', 'examHistory', 'sessionData'];
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('数据库打开失败:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                console.log('数据库打开成功');
                this.isReady = true;
                await this.migrateData();
                this.scheduleAutoCleanup();
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    createStores(db) {
        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'username' });
            userStore.createIndex('role', 'role', { unique: false });
            userStore.createIndex('registeredAt', 'registeredAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('submissions')) {
            const submissionStore = db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
            submissionStore.createIndex('username', 'username', { unique: false });
            submissionStore.createIndex('problemId', 'problemId', { unique: false });
            submissionStore.createIndex('result', 'result', { unique: false });
            submissionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('problemRecords')) {
            const recordStore = db.createObjectStore('problemRecords', { keyPath: ['username', 'problemId'] });
            recordStore.createIndex('username', 'username', { unique: false });
            recordStore.createIndex('problemId', 'problemId', { unique: false });
        }

        if (!db.objectStoreNames.contains('exams')) {
            const examStore = db.createObjectStore('exams', { keyPath: 'id' });
            examStore.createIndex('createdBy', 'createdBy', { unique: false });
            examStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('examResults')) {
            const examResultStore = db.createObjectStore('examResults', { keyPath: 'id' });
            examResultStore.createIndex('examId', 'examId', { unique: false });
            examResultStore.createIndex('username', 'username', { unique: false });
            examResultStore.createIndex('completedAt', 'completedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('examHistory')) {
            const historyStore = db.createObjectStore('examHistory', { keyPath: 'id' });
            historyStore.createIndex('userId', 'userId', { unique: false });
            historyStore.createIndex('examId', 'examId', { unique: false });
            historyStore.createIndex('endTime', 'endTime', { unique: false });
        }

        if (!db.objectStoreNames.contains('sessionData')) {
            const sessionStore = db.createObjectStore('sessionData', { keyPath: 'resultId' });
            sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
    }

    async migrateData() {
        try {
            const oldExams = localStorage.getItem('exams');
            if (oldExams) {
                const exams = JSON.parse(oldExams);
                for (const exam of exams) {
                    await this.put('exams', exam);
                }
                console.log('迁移考试数据完成');
            }

            const oldExamResults = localStorage.getItem('examResults');
            if (oldExamResults) {
                const results = JSON.parse(oldExamResults);
                for (const result of results) {
                    await this.put('examResults', result);
                }
                console.log('迁移考试结果数据完成');
            }

            const oldExamHistory = localStorage.getItem('examHistory');
            if (oldExamHistory) {
                const history = JSON.parse(oldExamHistory);
                for (const item of history) {
                    await this.put('examHistory', item);
                }
                console.log('迁移考试历史数据完成');
            }

            const oldUsers = localStorage.getItem('users');
            if (oldUsers) {
                const users = JSON.parse(oldUsers);
                for (const username in users) {
                    if (users.hasOwnProperty(username)) {
                        await this.put('users', users[username]);
                    }
                }
                console.log('迁移用户数据完成');
            }

            const oldSubmissions = localStorage.getItem('submissions');
            if (oldSubmissions) {
                const submissions = JSON.parse(oldSubmissions);
                for (const submission of submissions) {
                    if (!submission.id) {
                        submission.id = Date.now() + Math.random();
                    }
                    await this.put('submissions', submission);
                }
                console.log('迁移提交记录数据完成');
            }

            console.log('数据迁移完成');
        } catch (error) {
            console.error('数据迁移失败:', error);
        }
    }

    async ensureReady() {
        if (!this.isReady) {
            await this.readyPromise;
        }
    }

    compress(data) {
        const jsonStr = JSON.stringify(data);
        if (jsonStr.length < this.config.compressionThreshold) {
            return { compressed: false, data: jsonStr };
        }
        const compressed = LZString.compressToBase64(jsonStr);
        return { compressed: true, data: compressed };
    }

    decompress(storedData) {
        if (!storedData) return null;
        if (storedData.compressed) {
            const decompressed = LZString.decompressFromBase64(storedData.data);
            return JSON.parse(decompressed);
        }
        return JSON.parse(storedData.data);
    }

    async put(storeName, data, useCompression = false) {
        await this.ensureReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let dataToStore = data;
            if (useCompression && this.compressedStores.includes(storeName)) {
                dataToStore = {
                    ...data,
                    _compressed: true,
                    _data: this.compress(data)
                };
                delete dataToStore._data.data;
            }
            
            const request = store.put(dataToStore);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error(`存储 ${storeName} 失败:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    async get(storeName, key) {
        await this.ensureReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                if (result && result._compressed) {
                    resolve(this.decompress(result._data));
                } else {
                    resolve(result);
                }
            };

            request.onerror = (event) => {
                console.error(`获取 ${storeName} 失败:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        await this.ensureReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            let request;
            
            if (indexName && query !== null) {
                const index = store.index(indexName);
                request = index.getAll(IDBKeyRange.only(query));
            } else if (indexName) {
                const index = store.index(indexName);
                request = index.getAll();
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                const results = request.result.map(item => {
                    if (item && item._compressed) {
                        return this.decompress(item._data);
                    }
                    return item;
                });
                resolve(results);
            };

            request.onerror = (event) => {
                console.error(`获取 ${storeName} 所有数据失败:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    async delete(storeName, key) {
        await this.ensureReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error(`删除 ${storeName} 失败:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    async clear(storeName) {
        await this.ensureReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error(`清空 ${storeName} 失败:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    async count(storeName, indexName = null, query = null) {
        await this.ensureReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            let request;
            
            if (indexName && query !== null) {
                const index = store.index(indexName);
                request = index.count(IDBKeyRange.only(query));
            } else {
                request = store.count();
            }

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error(`计数 ${storeName} 失败:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    async storeUser(user) {
        return this.put('users', user);
    }

    async getUser(username) {
        return this.get('users', username);
    }

    async getAllUsers() {
        return this.getAll('users');
    }

    async storeSubmission(submission) {
        if (!submission.id) {
            submission.id = Date.now() + Math.random();
        }
        if (!submission.timestamp) {
            submission.timestamp = new Date().toISOString();
        }
        
        const count = await this.count('submissions', 'username', submission.username);
        if (count >= this.config.maxSubmissions) {
            await this.cleanupOldSubmissions(submission.username);
        }
        
        return this.put('submissions', submission);
    }

    async getUserSubmissions(username, limit = 10) {
        const submissions = await this.getAll('submissions', 'username', username);
        submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return submissions.slice(0, limit);
    }

    async storeProblemRecord(record) {
        return this.put('problemRecords', record);
    }

    async getUserProblemRecords(username) {
        return this.getAll('problemRecords', 'username', username);
    }

    async storeExam(exam) {
        return this.put('exams', exam);
    }

    async getExam(examId) {
        return this.get('exams', examId);
    }

    async getAllExams() {
        return this.getAll('exams');
    }

    async getExamsByCreator(creator) {
        return this.getAll('exams', 'createdBy', creator);
    }

    async deleteExam(examId) {
        await this.delete('exams', examId);
        const results = await this.getAll('examResults', 'examId', examId);
        for (const result of results) {
            await this.delete('examResults', result.id);
        }
    }

    async storeExamResult(result) {
        if (!result.id) {
            result.id = Date.now().toString();
        }
        if (!result.completedAt) {
            result.completedAt = new Date().toISOString();
        }
        
        const count = await this.count('examResults');
        if (count >= this.config.maxHistoryRecords * 10) {
            await this.cleanupOldExamResults();
        }
        
        return this.put('examResults', result, true);
    }

    async getExamResult(resultId) {
        return this.get('examResults', resultId);
    }

    async getExamResults(examId) {
        return this.getAll('examResults', 'examId', examId);
    }

    async getUserExamResults(username) {
        return this.getAll('examResults', 'username', username);
    }

    async storeExamHistory(history) {
        if (!history.id) {
            history.id = Date.now().toString();
        }
        
        const count = await this.count('examHistory', 'userId', history.userId);
        if (count >= this.config.maxHistoryRecords) {
            await this.cleanupOldHistory(history.userId);
        }
        
        return this.put('examHistory', history, true);
    }

    async getExamHistory(historyId) {
        return this.get('examHistory', historyId);
    }

    async getUserExamHistory(userId) {
        return this.getAll('examHistory', 'userId', userId);
    }

    async getAllExamHistory() {
        return this.getAll('examHistory');
    }

    async storeSessionData(resultId, sessionData) {
        const data = {
            resultId,
            data: sessionData,
            createdAt: new Date().toISOString()
        };
        return this.put('sessionData', data, true);
    }

    async getSessionData(resultId) {
        const data = await this.get('sessionData', resultId);
        return data ? data.data : null;
    }

    async deleteSessionData(resultId) {
        return this.delete('sessionData', resultId);
    }

    scheduleAutoCleanup() {
        setInterval(() => {
            this.cleanupExpiredData();
        }, this.config.autoCleanupInterval);
    }

    async cleanupExpiredData() {
        console.log('开始自动清理过期数据...');
        
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - this.config.dataExpirationDays);
        
        try {
            await this.cleanupExpiredSubmissions(expirationDate);
            await this.cleanupExpiredExamResults(expirationDate);
            await this.cleanupExpiredHistory(expirationDate);
            await this.cleanupExpiredSessionData(expirationDate);
            
            console.log('自动清理完成');
        } catch (error) {
            console.error('自动清理失败:', error);
        }
    }

    async cleanupOldSubmissions(username) {
        const submissions = await this.getAll('submissions', 'username', username);
        submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const toDelete = submissions.slice(this.config.maxSubmissions);
        for (const sub of toDelete) {
            await this.delete('submissions', sub.id);
        }
    }

    async cleanupExpiredSubmissions(expirationDate) {
        const allSubmissions = await this.getAll('submissions');
        const expired = allSubmissions.filter(s => new Date(s.timestamp) < expirationDate);
        
        for (const sub of expired) {
            await this.delete('submissions', sub.id);
        }
        
        if (expired.length > 0) {
            console.log(`清理了 ${expired.length} 条过期提交记录`);
        }
    }

    async cleanupOldHistory(userId) {
        const history = await this.getAll('examHistory', 'userId', userId);
        history.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
        
        const toDelete = history.slice(this.config.maxHistoryRecords);
        for (const item of toDelete) {
            await this.delete('examHistory', item.id);
            await this.deleteSessionData(item.id);
        }
    }

    async cleanupExpiredExamResults(expirationDate) {
        const allResults = await this.getAll('examResults');
        const expired = allResults.filter(r => new Date(r.completedAt) < expirationDate);
        
        for (const result of expired) {
            await this.delete('examResults', result.id);
        }
        
        if (expired.length > 0) {
            console.log(`清理了 ${expired.length} 条过期考试结果`);
        }
    }

    async cleanupExpiredHistory(expirationDate) {
        const allHistory = await this.getAll('examHistory');
        const expired = allHistory.filter(h => new Date(h.endTime) < expirationDate);
        
        for (const item of expired) {
            await this.delete('examHistory', item.id);
            await this.deleteSessionData(item.id);
        }
        
        if (expired.length > 0) {
            console.log(`清理了 ${expired.length} 条过期历史记录`);
        }
    }

    async cleanupExpiredSessionData(expirationDate) {
        const allSessions = await this.getAll('sessionData');
        const expired = allSessions.filter(s => new Date(s.createdAt) < expirationDate);
        
        for (const session of expired) {
            await this.delete('sessionData', session.resultId);
        }
        
        if (expired.length > 0) {
            console.log(`清理了 ${expired.length} 条过期会话数据`);
        }
    }

    async manualCleanup(options = {}) {
        const results = {
            submissions: 0,
            examResults: 0,
            history: 0,
            sessionData: 0
        };
        
        if (options.clearSubmissions) {
            const count = await this.count('submissions');
            await this.clear('submissions');
            results.submissions = count;
        }
        
        if (options.clearExamResults) {
            const count = await this.count('examResults');
            await this.clear('examResults');
            results.examResults = count;
        }
        
        if (options.clearHistory) {
            const count = await this.count('examHistory');
            await this.clear('examHistory');
            results.history = count;
        }
        
        if (options.clearSessionData) {
            const count = await this.count('sessionData');
            await this.clear('sessionData');
            results.sessionData = count;
        }
        
        return results;
    }

    async exportUserData(username) {
        const user = await this.getUser(username);
        const submissions = await this.getUserSubmissions(username, 1000);
        const problemRecords = await this.getUserProblemRecords(username);
        const examResults = await this.getUserExamResults(username);
        const examHistory = await this.getUserExamHistory(username);
        
        return {
            exportDate: new Date().toISOString(),
            user: {
                username: user.username,
                role: user.role,
                registeredAt: user.registeredAt,
                solvedCount: user.solvedCount,
                submitCount: user.submitCount,
                accuracy: user.accuracy
            },
            submissions,
            problemRecords,
            examResults,
            examHistory
        };
    }

    async exportExamHistory(username) {
        const examHistory = await this.getUserExamHistory(username);
        
        return {
            exportDate: new Date().toISOString(),
            username,
            history: examHistory
        };
    }

    async exportExamResultDetail(resultId) {
        const result = await this.getExamResult(resultId);
        if (!result) {
            return null;
        }
        
        const sessionData = await this.getSessionData(resultId);
        
        return {
            exportDate: new Date().toISOString(),
            result,
            sessionData
        };
    }

    async exportAllData(username) {
        const userData = await this.exportUserData(username);
        const examHistory = await this.exportExamHistory(username);
        
        return {
            ...userData,
            examHistory: examHistory.history
        };
    }

    downloadAsJson(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async exportAndDownload(username, type = 'all') {
        let data;
        let filename;
        
        switch (type) {
            case 'user':
                data = await this.exportUserData(username);
                filename = `user_data_${username}_${Date.now()}.json`;
                break;
            case 'history':
                data = await this.exportExamHistory(username);
                filename = `exam_history_${username}_${Date.now()}.json`;
                break;
            case 'all':
            default:
                data = await this.exportAllData(username);
                filename = `all_data_${username}_${Date.now()}.json`;
                break;
        }
        
        this.downloadAsJson(data, filename);
        return { success: true, filename };
    }

    async clearAll() {
        await this.ensureReady();
        
        const storeNames = ['users', 'submissions', 'problemRecords', 'exams', 'examResults', 'examHistory', 'sessionData'];
        
        for (const storeName of storeNames) {
            await this.clear(storeName);
        }
        
        console.log('所有数据已清除');
    }

    async getStorageStats() {
        await this.ensureReady();
        
        const stats = {
            users: await this.count('users'),
            submissions: await this.count('submissions'),
            problemRecords: await this.count('problemRecords'),
            exams: await this.count('exams'),
            examResults: await this.count('examResults'),
            examHistory: await this.count('examHistory'),
            sessionData: await this.count('sessionData')
        };
        
        return stats;
    }
}

const storage = new Storage();
export default storage;
