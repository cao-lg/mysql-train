// 自动判题引擎
class JudgeEngine {
    constructor() {
        this.mysqlEngine = null;
    }

    // 设置 MySQL 引擎
    setMySQLEngine(engine) {
        this.mysqlEngine = engine;
    }

    // 判题方法
    async judge(problem, userSQL) {
        try {
            // 获取题目类型
            const problemType = this.getProblemType(problem);
            
            // 根据题目类型使用不同的判题逻辑
            if (problemType === 'database') {
                return await this.judgeDatabaseBySQL(problem, userSQL);
            } else if (problemType === 'table') {
                return await this.judgeTableBySQL(problem, userSQL);
            } else if (problemType === 'view') {
                return await this.judgeViewBySQL(problem, userSQL);
            } else {
                // 对于查询题，先执行用户SQL
                const userResult = await this.mysqlEngine.execute(userSQL);
                userResult.sql = userSQL;
                
                if (!userResult.success) {
                    return {
                        result: 'CE',
                        message: userResult.error || '语法错误'
                    };
                }
                
                // 执行标准答案
                const answerResult = await this.mysqlEngine.execute(problem.answer);
                
                if (!answerResult.success) {
                    return {
                        result: 'RE',
                        message: '标准答案执行失败'
                    };
                }
                
                // 根据题型进行判题
                const judgeResult = await this.compareResults(problem, userResult, answerResult);
                return judgeResult;
            }
        } catch (error) {
            console.error('判题过程出错:', error);
            return {
                result: 'RE',
                message: '判题过程出错: ' + error.message
            };
        }
    }

    // 通过SQL比较判数据库操作题
    async judgeDatabaseBySQL(problem, userSQL) {
        const userSQLTrimmed = userSQL.trim();
        const answerSQLTrimmed = problem.answer.trim();
        const userLower = userSQLTrimmed.toLowerCase();
        const answerLower = answerSQLTrimmed.toLowerCase();
        
        // 检查SQL类型是否匹配
        const userType = this.getSQLType(userLower);
        const answerType = this.getSQLType(answerLower);
        
        if (userType !== answerType) {
            return {
                result: 'WA',
                message: `SQL语句类型不正确，期望 ${this.getSQLTypeName(answerType)}，实际 ${this.getSQLTypeName(userType)}`
            };
        }
        
        // 比较数据库名称
        const userDbName = this.extractDatabaseName(userSQLTrimmed, userType);
        const answerDbName = this.extractDatabaseName(answerSQLTrimmed, answerType);
        
        if (userDbName && answerDbName) {
            if (userDbName.toLowerCase() === answerDbName.toLowerCase()) {
                return {
                    result: 'AC',
                    message: '答案正确'
                };
            } else {
                return {
                    result: 'WA',
                    message: `数据库名称不正确，期望 ${answerDbName}，实际 ${userDbName}`
                };
            }
        }
        
        // 对于 SHOW DATABASES 等查询
        if (userType === 'show_databases') {
            return {
                result: 'AC',
                message: '答案正确'
            };
        }
        
        return {
            result: 'WA',
            message: 'SQL语句不正确'
        };
    }

    // 获取SQL类型
    getSQLType(sql) {
        if (sql.startsWith('create database')) return 'create_database';
        if (sql.startsWith('drop database')) return 'drop_database';
        if (sql.startsWith('show databases')) return 'show_databases';
        if (sql.startsWith('use ')) return 'use_database';
        if (sql.includes('select database()')) return 'select_database';
        if (sql.startsWith('show create database')) return 'show_create_database';
        if (sql.startsWith('alter database')) return 'alter_database';
        return 'unknown';
    }

    // 获取SQL类型名称
    getSQLTypeName(type) {
        const names = {
            'create_database': 'CREATE DATABASE',
            'drop_database': 'DROP DATABASE',
            'show_databases': 'SHOW DATABASES',
            'use_database': 'USE',
            'select_database': 'SELECT DATABASE()',
            'show_create_database': 'SHOW CREATE DATABASE',
            'alter_database': 'ALTER DATABASE'
        };
        return names[type] || type;
    }

    // 提取数据库名称
    extractDatabaseName(sql, type) {
        if (type === 'create_database') {
            const match = sql.match(/create database\s+(?:if not exists\s+)?([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'drop_database') {
            const match = sql.match(/drop database\s+(?:if exists\s+)?([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'use_database') {
            const match = sql.match(/use\s+([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'show_create_database') {
            const match = sql.match(/show create database\s+([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'alter_database') {
            const match = sql.match(/alter database\s+([\w_]+)/i);
            return match ? match[1] : null;
        }
        return null;
    }

    // 通过SQL比较判表操作题
    async judgeTableBySQL(problem, userSQL) {
        const userSQLTrimmed = userSQL.trim();
        const answerSQLTrimmed = problem.answer.trim();
        const userLower = userSQLTrimmed.toLowerCase();
        const answerLower = answerSQLTrimmed.toLowerCase();
        
        // 检查SQL类型是否匹配
        const userType = this.getTableSQLType(userLower);
        const answerType = this.getTableSQLType(answerLower);
        
        if (userType !== answerType) {
            return {
                result: 'WA',
                message: `SQL语句类型不正确，期望 ${this.getTableSQLTypeName(answerType)}，实际 ${this.getTableSQLTypeName(userType)}`
            };
        }
        
        // 比较表名称
        const userTableName = this.extractTableName(userSQLTrimmed, userType);
        const answerTableName = this.extractTableName(answerSQLTrimmed, answerType);
        
        if (userTableName && answerTableName) {
            if (userTableName.toLowerCase() === answerTableName.toLowerCase()) {
                return {
                    result: 'AC',
                    message: '答案正确'
                };
            } else {
                return {
                    result: 'WA',
                    message: `表名称不正确，期望 ${answerTableName}，实际 ${userTableName}`
                };
            }
        }
        
        return {
            result: 'WA',
            message: 'SQL语句不正确'
        };
    }

    // 获取表SQL类型
    getTableSQLType(sql) {
        if (sql.startsWith('create table')) return 'create_table';
        if (sql.startsWith('drop table')) return 'drop_table';
        if (sql.startsWith('alter table')) return 'alter_table';
        if (sql.startsWith('show tables')) return 'show_tables';
        if (sql.startsWith('describe ') || sql.startsWith('desc ')) return 'describe';
        return 'unknown';
    }

    // 获取表SQL类型名称
    getTableSQLTypeName(type) {
        const names = {
            'create_table': 'CREATE TABLE',
            'drop_table': 'DROP TABLE',
            'alter_table': 'ALTER TABLE',
            'show_tables': 'SHOW TABLES',
            'describe': 'DESCRIBE'
        };
        return names[type] || type;
    }

    // 提取表名称
    extractTableName(sql, type) {
        if (type === 'create_table') {
            const match = sql.match(/create table\s+(?:if not exists\s+)?([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'drop_table') {
            const match = sql.match(/drop table\s+(?:if exists\s+)?([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'alter_table') {
            const match = sql.match(/alter table\s+([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'describe') {
            const match = sql.match(/(?:describe|desc)\s+([\w_]+)/i);
            return match ? match[1] : null;
        }
        return null;
    }

    // 通过SQL比较判视图操作题
    async judgeViewBySQL(problem, userSQL) {
        const userSQLTrimmed = userSQL.trim();
        const answerSQLTrimmed = problem.answer.trim();
        const userLower = userSQLTrimmed.toLowerCase();
        const answerLower = answerSQLTrimmed.toLowerCase();
        
        // 检查SQL类型是否匹配
        const userType = this.getViewSQLType(userLower);
        const answerType = this.getViewSQLType(answerLower);
        
        if (userType !== answerType) {
            return {
                result: 'WA',
                message: `SQL语句类型不正确，期望 ${this.getViewSQLTypeName(answerType)}，实际 ${this.getViewSQLTypeName(userType)}`
            };
        }
        
        // 比较视图名称
        const userViewName = this.extractViewName(userSQLTrimmed, userType);
        const answerViewName = this.extractViewName(answerSQLTrimmed, answerType);
        
        if (userViewName && answerViewName) {
            if (userViewName.toLowerCase() === answerViewName.toLowerCase()) {
                return {
                    result: 'AC',
                    message: '答案正确'
                };
            } else {
                return {
                    result: 'WA',
                    message: `视图名称不正确，期望 ${answerViewName}，实际 ${userViewName}`
                };
            }
        }
        
        return {
            result: 'WA',
            message: 'SQL语句不正确'
        };
    }

    // 获取视图SQL类型
    getViewSQLType(sql) {
        if (sql.startsWith('create view')) return 'create_view';
        if (sql.startsWith('drop view')) return 'drop_view';
        return 'unknown';
    }

    // 获取视图SQL类型名称
    getViewSQLTypeName(type) {
        const names = {
            'create_view': 'CREATE VIEW',
            'drop_view': 'DROP VIEW'
        };
        return names[type] || type;
    }

    // 提取视图名称
    extractViewName(sql, type) {
        if (type === 'create_view') {
            const match = sql.match(/create view\s+([\w_]+)/i);
            return match ? match[1] : null;
        }
        if (type === 'drop_view') {
            const match = sql.match(/drop view\s+(?:if exists\s+)?([\w_]+)/i);
            return match ? match[1] : null;
        }
        return null;
    }

    // 比较执行结果
    async compareResults(problem, userResult, answerResult) {
        // 根据题目类型进行不同的判题逻辑
        const problemType = this.getProblemType(problem);
        
        switch (problemType) {
            case 'database':
                return await this.judgeDatabaseOperation(problem, userResult, answerResult);
            case 'table':
                return await this.judgeTableOperation(problem, userResult, answerResult);
            case 'select':
                return this.judgeSelectQuery(problem, userResult, answerResult);
            case 'insert':
            case 'update':
            case 'delete':
                return this.judgeDataModification(problem, userResult, answerResult);
            case 'view':
                return await this.judgeViewOperation(problem, userResult, answerResult);
            default:
                return this.judgeDefault(problem, userResult, answerResult);
        }
    }

    // 获取题目类型
    getProblemType(problem) {
        const lowerTitle = problem.title.toLowerCase();
        if (lowerTitle.includes('database') || lowerTitle.includes('库')) {
            return 'database';
        } else if (lowerTitle.includes('table') || lowerTitle.includes('表')) {
            return 'table';
        } else if (lowerTitle.includes('select') || lowerTitle.includes('查询')) {
            return 'select';
        } else if (lowerTitle.includes('insert') || lowerTitle.includes('插入')) {
            return 'insert';
        } else if (lowerTitle.includes('update') || lowerTitle.includes('更新')) {
            return 'update';
        } else if (lowerTitle.includes('delete') || lowerTitle.includes('删除')) {
            return 'delete';
        } else if (lowerTitle.includes('view') || lowerTitle.includes('视图')) {
            return 'view';
        } else {
            return 'default';
        }
    }

    // 判数据库操作题
    async judgeDatabaseOperation(problem, userResult, answerResult) {
        const userSQL = userResult.sql || '';
        const lowerSQL = userSQL.toLowerCase().trim();
        const answerSQL = problem.answer.toLowerCase().trim();
        
        // 检查是否是 CREATE DATABASE 语句
        if (lowerSQL.startsWith('create database')) {
            const userDbMatch = userSQL.match(/create database\s+(?:if not exists\s+)?([\w_]+)/i);
            const answerDbMatch = problem.answer.match(/create database\s+(?:if not exists\s+)?([\w_]+)/i);
            
            if (userDbMatch && answerDbMatch) {
                const userDb = userDbMatch[1].toLowerCase();
                const answerDb = answerDbMatch[1].toLowerCase();
                
                if (userDb === answerDb) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `数据库名称不正确，期望 ${answerDb}，实际 ${userDb}`
                    };
                }
            }
        }
        
        // 检查是否是 DROP DATABASE 语句
        if (lowerSQL.startsWith('drop database')) {
            const userDbMatch = userSQL.match(/drop database\s+(?:if exists\s+)?([\w_]+)/i);
            const answerDbMatch = problem.answer.match(/drop database\s+(?:if exists\s+)?([\w_]+)/i);
            
            if (userDbMatch && answerDbMatch) {
                const userDb = userDbMatch[1].toLowerCase();
                const answerDb = answerDbMatch[1].toLowerCase();
                
                if (userDb === answerDb) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `数据库名称不正确，期望 ${answerDb}，实际 ${userDb}`
                    };
                }
            }
        }
        
        // 检查是否是 SHOW DATABASES 语句
        if (lowerSQL.startsWith('show databases')) {
            if (answerSQL.startsWith('show databases')) {
                return {
                    result: 'AC',
                    message: '答案正确'
                };
            }
        }
        
        // 检查是否是 USE 语句
        if (lowerSQL.startsWith('use ')) {
            const userDbMatch = userSQL.match(/use\s+([\w_]+)/i);
            const answerDbMatch = problem.answer.match(/use\s+([\w_]+)/i);
            
            if (userDbMatch && answerDbMatch) {
                const userDb = userDbMatch[1].toLowerCase();
                const answerDb = answerDbMatch[1].toLowerCase();
                
                if (userDb === answerDb) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `数据库名称不正确，期望 ${answerDb}，实际 ${userDb}`
                    };
                }
            }
        }
        
        // 默认返回错误
        return {
            result: 'WA',
            message: 'SQL语句不正确'
        };
    }

    // 判表结构操作题
    async judgeTableOperation(problem, userResult, answerResult) {
        const userSQL = userResult.sql || '';
        const lowerSQL = userSQL.toLowerCase().trim();
        const answerSQL = problem.answer.toLowerCase().trim();
        
        // 检查是否是 CREATE TABLE 语句
        if (lowerSQL.startsWith('create table')) {
            const userTableMatch = userSQL.match(/create table\s+(?:if not exists\s+)?([\w_]+)/i);
            const answerTableMatch = problem.answer.match(/create table\s+(?:if not exists\s+)?([\w_]+)/i);
            
            if (userTableMatch && answerTableMatch) {
                const userTable = userTableMatch[1].toLowerCase();
                const answerTable = answerTableMatch[1].toLowerCase();
                
                if (userTable === answerTable) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `表名称不正确，期望 ${answerTable}，实际 ${userTable}`
                    };
                }
            }
        }
        
        // 检查是否是 DROP TABLE 语句
        if (lowerSQL.startsWith('drop table')) {
            const userTableMatch = userSQL.match(/drop table\s+(?:if exists\s+)?([\w_]+)/i);
            const answerTableMatch = problem.answer.match(/drop table\s+(?:if exists\s+)?([\w_]+)/i);
            
            if (userTableMatch && answerTableMatch) {
                const userTable = userTableMatch[1].toLowerCase();
                const answerTable = answerTableMatch[1].toLowerCase();
                
                if (userTable === answerTable) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `表名称不正确，期望 ${answerTable}，实际 ${userTable}`
                    };
                }
            }
        }
        
        // 检查是否是 ALTER TABLE 语句
        if (lowerSQL.startsWith('alter table')) {
            const userTableMatch = userSQL.match(/alter table\s+([\w_]+)/i);
            const answerTableMatch = problem.answer.match(/alter table\s+([\w_]+)/i);
            
            if (userTableMatch && answerTableMatch) {
                const userTable = userTableMatch[1].toLowerCase();
                const answerTable = answerTableMatch[1].toLowerCase();
                
                if (userTable === answerTable) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `表名称不正确，期望 ${answerTable}，实际 ${userTable}`
                    };
                }
            }
        }
        
        // 默认返回错误
        return {
            result: 'WA',
            message: 'SQL语句不正确'
        };
    }

    // 判 SELECT 查询题
    judgeSelectQuery(problem, userResult, answerResult) {
        // 比较查询结果
        if (!userResult.data || !answerResult.data) {
            return {
                result: 'WA',
                message: '查询结果为空'
            };
        }
        
        // 比较行数
        if (userResult.data.length !== answerResult.data.length) {
            return {
                result: 'WA',
                message: `行数不匹配，期望 ${answerResult.data.length} 行，实际 ${userResult.data.length} 行`
            };
        }
        
        // 比较列数
        const userColumns = Object.keys(userResult.data[0]);
        const answerColumns = Object.keys(answerResult.data[0]);
        if (userColumns.length !== answerColumns.length) {
            return {
                result: 'WA',
                message: `列数不匹配，期望 ${answerColumns.length} 列，实际 ${userColumns.length} 列`
            };
        }
        
        // 比较列名
        for (let i = 0; i < userColumns.length; i++) {
            if (userColumns[i] !== answerColumns[i]) {
                return {
                    result: 'WA',
                    message: `列名不匹配，期望 ${answerColumns[i]}，实际 ${userColumns[i]}`
                };
            }
        }
        
        // 比较数据
        for (let i = 0; i < userResult.data.length; i++) {
            for (const column of userColumns) {
                if (userResult.data[i][column] !== answerResult.data[i][column]) {
                    return {
                        result: 'WA',
                        message: `数据不匹配，第 ${i+1} 行 ${column} 列，期望 ${answerResult.data[i][column]}，实际 ${userResult.data[i][column]}`
                    };
                }
            }
        }
        
        return {
            result: 'AC',
            message: '答案正确'
        };
    }

    // 判数据修改题
    judgeDataModification(problem, userResult, answerResult) {
        // 比较影响行数
        if (userResult.affectedRows !== answerResult.affectedRows) {
            return {
                result: 'WA',
                message: `影响行数不匹配，期望 ${answerResult.affectedRows} 行，实际 ${userResult.affectedRows} 行`
            };
        }
        
        return {
            result: 'AC',
            message: '答案正确'
        };
    }

    // 判视图操作题
    async judgeViewOperation(problem, userResult, answerResult) {
        const userSQL = userResult.sql || '';
        const lowerSQL = userSQL.toLowerCase().trim();
        const answerSQL = problem.answer.toLowerCase().trim();
        
        // 检查是否是 CREATE VIEW 语句
        if (lowerSQL.startsWith('create view')) {
            const userViewMatch = userSQL.match(/create view\s+([\w_]+)/i);
            const answerViewMatch = problem.answer.match(/create view\s+([\w_]+)/i);
            
            if (userViewMatch && answerViewMatch) {
                const userView = userViewMatch[1].toLowerCase();
                const answerView = answerViewMatch[1].toLowerCase();
                
                if (userView === answerView) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `视图名称不正确，期望 ${answerView}，实际 ${userView}`
                    };
                }
            }
        }
        
        // 检查是否是 DROP VIEW 语句
        if (lowerSQL.startsWith('drop view')) {
            const userViewMatch = userSQL.match(/drop view\s+(?:if exists\s+)?([\w_]+)/i);
            const answerViewMatch = problem.answer.match(/drop view\s+(?:if exists\s+)?([\w_]+)/i);
            
            if (userViewMatch && answerViewMatch) {
                const userView = userViewMatch[1].toLowerCase();
                const answerView = answerViewMatch[1].toLowerCase();
                
                if (userView === answerView) {
                    return {
                        result: 'AC',
                        message: '答案正确'
                    };
                } else {
                    return {
                        result: 'WA',
                        message: `视图名称不正确，期望 ${answerView}，实际 ${userView}`
                    };
                }
            }
        }
        
        // 默认返回错误
        return {
            result: 'WA',
            message: 'SQL语句不正确'
        };
    }

    // 默认判题逻辑
    judgeDefault(problem, userResult, answerResult) {
        // 简单比较执行结果
        if (JSON.stringify(userResult.data) === JSON.stringify(answerResult.data)) {
            return {
                result: 'AC',
                message: '答案正确'
            };
        } else {
            return {
                result: 'WA',
                message: '答案错误'
            };
        }
    }
}

// 导出单例实例
const judgeEngine = new JudgeEngine();
export default judgeEngine;