// 自动判题引擎
class JudgeEngine {
    constructor() {
        this.mysqlEngine = null;
    }

    // 设置 MySQL 引擎
    setMySQLEngine(engine) {
        this.mysqlEngine = engine;
    }

    // 判题主函数
    async judge(problem, userSQL) {
        try {
            // 执行用户 SQL
            const userResult = await this.mysqlEngine.execute(userSQL);
            
            if (!userResult.success) {
                // 语法错误或执行异常
                return {
                    result: 'CE',
                    message: userResult.error || '语法错误'
                };
            }
            
            // 执行标准答案
            const answerResult = await this.mysqlEngine.execute(problem.answer);
            
            if (!answerResult.success) {
                // 标准答案执行失败，可能是题目数据问题
                return {
                    result: 'RE',
                    message: '标准答案执行失败'
                };
            }
            
            // 根据题型进行判题
            const judgeResult = await this.compareResults(problem, userResult, answerResult);
            return judgeResult;
        } catch (error) {
            console.error('判题过程出错:', error);
            return {
                result: 'RE',
                message: '判题过程出错'
            };
        }
    }

    // 比较执行结果
    async compareResults(problem, userResult, answerResult) {
        // 根据题目类型进行不同的判题逻辑
        const problemType = this.getProblemType(problem);
        
        switch (problemType) {
            case 'database':
                return await this.judgeDatabaseOperation(problem, userResult, answerResult);
            case 'table':
                return this.judgeTableOperation(problem, userResult, answerResult);
            case 'select':
                return this.judgeSelectQuery(problem, userResult, answerResult);
            case 'insert':
            case 'update':
            case 'delete':
                return this.judgeDataModification(problem, userResult, answerResult);
            case 'view':
                return this.judgeViewOperation(problem, userResult, answerResult);
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
        // 检查是否存在指定数据库
        if (problem.judgeRule.includes('检查是否存在名为')) {
            const dbName = problem.judgeRule.match(/检查是否存在名为 (\w+) 的数据库/)[1];
            // 查询数据库列表并检查
            try {
                const showDatabasesResult = await this.mysqlEngine.execute('SHOW DATABASES;');
                if (showDatabasesResult.success && showDatabasesResult.data) {
                    const databases = showDatabasesResult.data.map(row => Object.values(row)[0]);
                    if (databases.includes(dbName)) {
                        return {
                            result: 'AC',
                            message: '答案正确'
                        };
                    } else {
                        return {
                            result: 'WA',
                            message: `数据库 ${dbName} 不存在`
                        };
                    }
                } else {
                    return {
                        result: 'RE',
                        message: '无法查询数据库列表'
                    };
                }
            } catch (error) {
                return {
                    result: 'RE',
                    message: '检查数据库时出错'
                };
            }
        }
        
        return {
            result: 'AC',
            message: '答案正确'
        };
    }

    // 判表结构操作题
    judgeTableOperation(problem, userResult, answerResult) {
        // 检查表结构是否正确
        // 暂时返回 AC
        return {
            result: 'AC',
            message: '答案正确'
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
    judgeViewOperation(problem, userResult, answerResult) {
        // 检查视图是否创建成功
        // 暂时返回 AC
        return {
            result: 'AC',
            message: '答案正确'
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