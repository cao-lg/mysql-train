// MySQL-WASM 核心引擎
class MySQLEngine {
    constructor() {
        this.instance = null;
        this.isInitialized = false;
        
        // 维护数据库状态
        this.databases = new Set(['mysql', 'information_schema', 'performance_schema', 'sys', 'test']);
        this.currentDatabase = null;
        this.tables = new Map(); // database -> Set of table names
        this.tableData = new Map(); // database -> tableName -> { columns, rows }
        
        // 初始化默认表
        this.tables.set('test', new Set(['users', 'students', 'courses']));
        this.tables.set('mysql', new Set(['user', 'db', 'tables_priv']));
        
        // 初始化默认数据
        this.initDefaultData();
        
        this.init();
    }

    // 初始化默认数据
    initDefaultData() {
        // test 数据库的 users 表
        this.tableData.set('test_users', {
            columns: ['id', 'username', 'email'],
            rows: [
                { id: 1, username: 'admin', email: 'admin@example.com' },
                { id: 2, username: 'user1', email: 'user1@example.com' },
                { id: 3, username: 'user2', email: 'user2@example.com' }
            ]
        });
        
        // test 数据库的 students 表
        this.tableData.set('test_students', {
            columns: ['id', 'name', 'age', 'score'],
            rows: [
                { id: 1, name: '张三', age: 18, score: 95 },
                { id: 2, name: '李四', age: 19, score: 88 },
                { id: 3, name: '王五', age: 17, score: 92 }
            ]
        });
        
        // test 数据库的 courses 表
        this.tableData.set('test_courses', {
            columns: ['id', 'name', 'credit'],
            rows: [
                { id: 1, name: '数据库原理', credit: 4 },
                { id: 2, name: '数据结构', credit: 3 },
                { id: 3, name: '算法设计', credit: 3 }
            ]
        });
    }

    // 初始化 MySQL 引擎
    async init() {
        try {
            console.log('正在初始化 MySQL-WASM 引擎...');
            
            // 模拟初始化过程
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.instance = {};
            this.isInitialized = true;
            console.log('MySQL-WASM 引擎初始化成功');
        } catch (error) {
            console.error('MySQL-WASM 引擎初始化失败:', error);
            throw error;
        }
    }

    // 执行 SQL 语句
    async execute(sql) {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            console.log('执行 SQL:', sql);
            
            // 模拟 SQL 执行过程
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 解析 SQL 语句并返回相应的结果
            const result = this.parseAndExecute(sql);
            
            return result;
        } catch (error) {
            console.error('SQL 执行失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 解析并执行 SQL 语句
    parseAndExecute(sql) {
        const lowerSql = sql.toLowerCase().trim();
        
        // 处理 CREATE DATABASE 语句
        if (lowerSql.startsWith('create database')) {
            return this.createDatabase(sql);
        }
        
        // 处理 DROP DATABASE 语句
        if (lowerSql.startsWith('drop database')) {
            return this.dropDatabase(sql);
        }
        
        // 处理 SHOW DATABASES 语句
        if (lowerSql.startsWith('show databases')) {
            return this.showDatabases();
        }
        
        // 处理 USE 语句
        if (lowerSql.startsWith('use ')) {
            return this.useDatabase(sql);
        }
        
        // 处理 SELECT DATABASE()
        if (lowerSql.includes('select database()')) {
            return this.selectDatabase();
        }
        
        // 处理 CREATE TABLE 语句
        if (lowerSql.startsWith('create table')) {
            return this.createTable(sql);
        }
        
        // 处理 DROP TABLE 语句
        if (lowerSql.startsWith('drop table')) {
            return this.dropTable(sql);
        }
        
        // 处理 SHOW TABLES 语句
        if (lowerSql.startsWith('show tables')) {
            return this.showTables();
        }
        
        // 处理 DESCRIBE 或 DESC 语句
        if (lowerSql.startsWith('describe') || lowerSql.startsWith('desc ')) {
            return this.describeTable(sql);
        }
        
        // 处理 INSERT 语句
        if (lowerSql.startsWith('insert into')) {
            return this.insertInto(sql);
        }
        
        // 处理 UPDATE 语句
        if (lowerSql.startsWith('update')) {
            return this.updateTable(sql);
        }
        
        // 处理 DELETE 语句
        if (lowerSql.startsWith('delete from')) {
            return this.deleteFrom(sql);
        }
        
        // 处理 SELECT 语句
        if (lowerSql.startsWith('select')) {
            return this.selectFrom(sql);
        }
        
        // 处理 ALTER DATABASE 语句
        if (lowerSql.startsWith('alter database')) {
            return this.alterDatabase(sql);
        }
        
        // 处理 SHOW CREATE DATABASE 语句
        if (lowerSql.startsWith('show create database')) {
            return this.showCreateDatabase(sql);
        }
        
        // 默认结果
        return {
            success: true,
            data: [
                { result: 'SQL executed successfully' }
            ],
            columns: ['result'],
            affectedRows: 0,
            executionTime: 1
        };
    }

    // 创建数据库
    createDatabase(sql) {
        const dbNameMatch = sql.match(/create database\s+(?:if not exists\s+)?([\w_]+)(?:\s+character\s+set\s+(\w+))?/i);
        if (dbNameMatch) {
            const dbName = dbNameMatch[1];
            const charset = dbNameMatch[2] || 'utf8mb4';
            
            if (this.databases.has(dbName.toLowerCase())) {
                if (!sql.toLowerCase().includes('if not exists')) {
                    return {
                        success: false,
                        error: `Database '${dbName}' already exists`
                    };
                }
                return {
                    success: true,
                    data: [],
                    columns: [],
                    affectedRows: 0,
                    executionTime: 1,
                    message: `Database '${dbName}' already exists`
                };
            }
            
            this.databases.add(dbName.toLowerCase());
            this.tables.set(dbName.toLowerCase(), new Set());
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: 0,
                executionTime: 5,
                message: `Database '${dbName}' created successfully with charset ${charset}`
            };
        }
        
        return {
            success: false,
            error: 'Invalid CREATE DATABASE syntax'
        };
    }

    // 删除数据库
    dropDatabase(sql) {
        const dbNameMatch = sql.match(/drop database\s+(?:if exists\s+)?([\w_]+)/i);
        if (dbNameMatch) {
            const dbName = dbNameMatch[1];
            
            if (!this.databases.has(dbName.toLowerCase())) {
                if (!sql.toLowerCase().includes('if exists')) {
                    return {
                        success: false,
                        error: `Database '${dbName}' doesn't exist`
                    };
                }
                return {
                    success: true,
                    data: [],
                    columns: [],
                    affectedRows: 0,
                    executionTime: 1,
                    message: `Database '${dbName}' doesn't exist`
                };
            }
            
            this.databases.delete(dbName.toLowerCase());
            this.tables.delete(dbName.toLowerCase());
            
            // 清理相关表数据
            for (const key of this.tableData.keys()) {
                if (key.startsWith(dbName.toLowerCase() + '_')) {
                    this.tableData.delete(key);
                }
            }
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: 0,
                executionTime: 4,
                message: `Database '${dbName}' dropped successfully`
            };
        }
        
        return {
            success: false,
            error: 'Invalid DROP DATABASE syntax'
        };
    }

    // 显示所有数据库
    showDatabases() {
        const dbList = Array.from(this.databases).sort().map(db => ({ Database: db }));
        return {
            success: true,
            data: dbList,
            columns: ['Database'],
            affectedRows: 0,
            executionTime: 2
        };
    }

    // 使用数据库
    useDatabase(sql) {
        const dbNameMatch = sql.match(/use\s+([\w_]+)/i);
        if (dbNameMatch) {
            const dbName = dbNameMatch[1];
            
            if (!this.databases.has(dbName.toLowerCase())) {
                return {
                    success: false,
                    error: `Unknown database '${dbName}'`
                };
            }
            
            this.currentDatabase = dbName.toLowerCase();
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: 0,
                executionTime: 1,
                message: `Database changed to '${dbName}'`
            };
        }
        
        return {
            success: false,
            error: 'Invalid USE syntax'
        };
    }

    // 查询当前数据库
    selectDatabase() {
        return {
            success: true,
            data: [{ 'DATABASE()': this.currentDatabase || null }],
            columns: ['DATABASE()'],
            affectedRows: 0,
            executionTime: 1
        };
    }

    // 创建表
    createTable(sql) {
        const dbNameMatch = sql.match(/create table\s+(?:if not exists\s+)?([\w_]+)/i);
        if (dbNameMatch) {
            const tableName = dbNameMatch[1];
            const db = this.currentDatabase || 'test';
            
            if (!this.databases.has(db)) {
                return {
                    success: false,
                    error: `No database selected`
                };
            }
            
            const dbTables = this.tables.get(db) || new Set();
            if (dbTables.has(tableName.toLowerCase())) {
                if (!sql.toLowerCase().includes('if not exists')) {
                    return {
                        success: false,
                        error: `Table '${tableName}' already exists`
                    };
                }
                return {
                    success: true,
                    data: [],
                    columns: [],
                    affectedRows: 0,
                    executionTime: 1,
                    message: `Table '${tableName}' already exists`
                };
            }
            
            dbTables.add(tableName.toLowerCase());
            this.tables.set(db, dbTables);
            
            // 解析列定义
            const columnsMatch = sql.match(/\(([\s\S]+)\)/);
            let columns = ['id'];
            if (columnsMatch) {
                const colDefs = columnsMatch[1].split(',').map(c => c.trim());
                columns = colDefs.map(def => {
                    const colMatch = def.match(/^([\w_]+)/);
                    return colMatch ? colMatch[1] : 'column';
                });
            }
            
            // 创建空表
            this.tableData.set(`${db}_${tableName.toLowerCase()}`, {
                columns: columns,
                rows: []
            });
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: 0,
                executionTime: 8,
                message: `Table '${tableName}' created successfully`
            };
        }
        
        return {
            success: false,
            error: 'Invalid CREATE TABLE syntax'
        };
    }

    // 删除表
    dropTable(sql) {
        const tableNameMatch = sql.match(/drop table\s+(?:if exists\s+)?([\w_]+)/i);
        if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            const db = this.currentDatabase || 'test';
            
            const dbTables = this.tables.get(db) || new Set();
            if (!dbTables.has(tableName.toLowerCase())) {
                if (!sql.toLowerCase().includes('if exists')) {
                    return {
                        success: false,
                        error: `Unknown table '${tableName}'`
                    };
                }
                return {
                    success: true,
                    data: [],
                    columns: [],
                    affectedRows: 0,
                    executionTime: 1,
                    message: `Table '${tableName}' doesn't exist`
                };
            }
            
            dbTables.delete(tableName.toLowerCase());
            this.tableData.delete(`${db}_${tableName.toLowerCase()}`);
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: 0,
                executionTime: 3,
                message: `Table '${tableName}' dropped successfully`
            };
        }
        
        return {
            success: false,
            error: 'Invalid DROP TABLE syntax'
        };
    }

    // 显示所有表
    showTables() {
        const db = this.currentDatabase || 'test';
        const dbTables = this.tables.get(db) || new Set();
        const tableList = Array.from(dbTables).sort().map(t => ({ [`Tables_in_${db}`]: t }));
        
        return {
            success: true,
            data: tableList,
            columns: [`Tables_in_${db}`],
            affectedRows: 0,
            executionTime: 2
        };
    }

    // 描述表结构
    describeTable(sql) {
        const tableNameMatch = sql.match(/(?:describe|desc)\s+([\w_]+)/i);
        if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            const db = this.currentDatabase || 'test';
            const tableKey = `${db}_${tableName.toLowerCase()}`;
            
            const tableInfo = this.tableData.get(tableKey);
            if (!tableInfo) {
                return {
                    success: false,
                    error: `Unknown table '${tableName}'`
                };
            }
            
            const fields = tableInfo.columns.map((col, idx) => ({
                Field: col,
                Type: col === 'id' ? 'int(11)' : 'varchar(255)',
                Null: idx === 0 ? 'NO' : 'YES',
                Key: idx === 0 ? 'PRI' : '',
                Default: null,
                Extra: idx === 0 ? 'auto_increment' : ''
            }));
            
            return {
                success: true,
                data: fields,
                columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
                affectedRows: 0,
                executionTime: 3
            };
        }
        
        return {
            success: false,
            error: 'Invalid DESCRIBE syntax'
        };
    }

    // 插入数据
    insertInto(sql) {
        const tableNameMatch = sql.match(/insert into\s+([\w_]+)/i);
        if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            const db = this.currentDatabase || 'test';
            const tableKey = `${db}_${tableName.toLowerCase()}`;
            
            const tableInfo = this.tableData.get(tableKey);
            if (!tableInfo) {
                return {
                    success: false,
                    error: `Unknown table '${tableName}'`
                };
            }
            
            // 简单模拟插入
            const newRow = {};
            tableInfo.columns.forEach((col, idx) => {
                newRow[col] = tableInfo.rows.length + idx + 1;
            });
            tableInfo.rows.push(newRow);
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: 1,
                executionTime: 3,
                message: `1 row inserted into '${tableName}'`
            };
        }
        
        return {
            success: false,
            error: 'Invalid INSERT syntax'
        };
    }

    // 更新数据
    updateTable(sql) {
        const tableNameMatch = sql.match(/update\s+([\w_]+)/i);
        if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            const db = this.currentDatabase || 'test';
            const tableKey = `${db}_${tableName.toLowerCase()}`;
            
            const tableInfo = this.tableData.get(tableKey);
            if (!tableInfo) {
                return {
                    success: false,
                    error: `Unknown table '${tableName}'`
                };
            }
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: Math.min(1, tableInfo.rows.length),
                executionTime: 4,
                message: `${Math.min(1, tableInfo.rows.length)} row(s) updated in '${tableName}'`
            };
        }
        
        return {
            success: false,
            error: 'Invalid UPDATE syntax'
        };
    }

    // 删除数据
    deleteFrom(sql) {
        const tableNameMatch = sql.match(/delete from\s+([\w_]+)/i);
        if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            const db = this.currentDatabase || 'test';
            const tableKey = `${db}_${tableName.toLowerCase()}`;
            
            const tableInfo = this.tableData.get(tableKey);
            if (!tableInfo) {
                return {
                    success: false,
                    error: `Unknown table '${tableName}'`
                };
            }
            
            const deletedCount = Math.min(1, tableInfo.rows.length);
            if (tableInfo.rows.length > 0) {
                tableInfo.rows.pop();
            }
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: deletedCount,
                executionTime: 2,
                message: `${deletedCount} row(s) deleted from '${tableName}'`
            };
        }
        
        return {
            success: false,
            error: 'Invalid DELETE syntax'
        };
    }

    // 查询数据
    selectFrom(sql) {
        const lowerSql = sql.toLowerCase();
        
        // 检查是否查询特定表
        const fromMatch = sql.match(/from\s+([\w_]+)/i);
        if (fromMatch) {
            const tableName = fromMatch[1];
            const db = this.currentDatabase || 'test';
            const tableKey = `${db}_${tableName.toLowerCase()}`;
            
            const tableInfo = this.tableData.get(tableKey);
            if (tableInfo) {
                return {
                    success: true,
                    data: tableInfo.rows,
                    columns: tableInfo.columns,
                    affectedRows: 0,
                    executionTime: 6
                };
            }
        }
        
        // 默认 SELECT 结果
        return {
            success: true,
            data: [
                { id: 1, value: '数据1' },
                { id: 2, value: '数据2' },
                { id: 3, value: '数据3' }
            ],
            columns: ['id', 'value'],
            affectedRows: 0,
            executionTime: 4
        };
    }

    // 修改数据库
    alterDatabase(sql) {
        const dbNameMatch = sql.match(/alter database\s+([\w_]+)/i);
        if (dbNameMatch) {
            const dbName = dbNameMatch[1];
            
            if (!this.databases.has(dbName.toLowerCase())) {
                return {
                    success: false,
                    error: `Unknown database '${dbName}'`
                };
            }
            
            return {
                success: true,
                data: [],
                columns: [],
                affectedRows: 0,
                executionTime: 3,
                message: `Database '${dbName}' altered successfully`
            };
        }
        
        return {
            success: false,
            error: 'Invalid ALTER DATABASE syntax'
        };
    }

    // 显示创建数据库语句
    showCreateDatabase(sql) {
        const dbNameMatch = sql.match(/show create database\s+([\w_]+)/i);
        if (dbNameMatch) {
            const dbName = dbNameMatch[1];
            
            if (!this.databases.has(dbName.toLowerCase())) {
                return {
                    success: false,
                    error: `Unknown database '${dbName}'`
                };
            }
            
            return {
                success: true,
                data: [{
                    Database: dbName,
                    'Create Database': `CREATE DATABASE \`${dbName}\` /*!40100 DEFAULT CHARACTER SET utf8mb4 */`
                }],
                columns: ['Database', 'Create Database'],
                affectedRows: 0,
                executionTime: 2
            };
        }
        
        return {
            success: false,
            error: 'Invalid SHOW CREATE DATABASE syntax'
        };
    }

    // 启动 MySQL 服务
    async start() {
        if (!this.isInitialized) {
            await this.init();
        }
        console.log('MySQL 服务已启动');
    }

    // 停止 MySQL 服务
    stop() {
        console.log('MySQL 服务已停止');
        this.isInitialized = false;
        this.instance = null;
    }

    // 检查 MySQL 服务状态
    getStatus() {
        return this.isInitialized ? 'running' : 'stopped';
    }
    
    // 检查数据库是否存在
    hasDatabase(dbName) {
        return this.databases.has(dbName.toLowerCase());
    }
    
    // 检查表是否存在
    hasTable(tableName, dbName) {
        const db = dbName || this.currentDatabase || 'test';
        const dbTables = this.tables.get(db.toLowerCase());
        return dbTables ? dbTables.has(tableName.toLowerCase()) : false;
    }
}

// 导出单例实例
const mysqlEngine = new MySQLEngine();
export default mysqlEngine;
