// 考试结果分析模块
import storage from './storage.js';

class ExamResult {
    constructor() {
        this.results = [];
        this.chapterNames = {
            'chapter1': '数据库基础',
            'chapter2': '表的管理',
            'chapter3': 'SELECT查询',
            'chapter4': 'WHERE条件',
            'chapter5': '排序与限制',
            'chapter6': '分组聚合',
            'chapter7': '连接查询',
            'chapter8': '子查询',
            'chapter9': '数据操作',
            'chapter10': '视图'
        };
        this.init();
    }

    async init() {
        await this.loadResults();
    }

    async loadResults() {
        try {
            this.results = await storage.getAllExamHistory();
        } catch (error) {
            console.error('加载考试结果失败:', error);
            this.results = [];
        }
    }

    async saveResults() {
        try {
            for (const result of this.results) {
                await storage.storeExamHistory(result);
            }
            return { success: true };
        } catch (error) {
            console.error('保存考试结果失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllResults() {
        return this.results;
    }

    async getResultsByUser(userId) {
        return this.results.filter(result => result.userId === userId);
    }

    async getResultsByExam(examId) {
        return this.results.filter(result => result.examId === examId);
    }

    async getResultById(resultId) {
        let result = this.results.find(result => result.id === resultId);
        if (!result) {
            result = await storage.getExamHistory(resultId);
        }
        return result;
    }

    async addResult(result) {
        if (!result.id) {
            result.id = Date.now().toString();
        }
        this.results.push(result);
        await storage.storeExamHistory(result);
        return result;
    }

    async generateAnalysis(resultId) {
        try {
            const result = await this.getResultById(resultId);
            if (!result) {
                return { success: false, error: '考试结果不存在' };
            }

            const examManager = await import('./exam-manager.js').then(module => module.default);
            const exam = await examManager.getExamById(result.examId);

            if (!exam) {
                return { success: false, error: '考试不存在' };
            }

            const totalQuestions = result.questionCount;
            const correctAnswers = Math.floor(result.score / 10);
            const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
            const duration = this.calculateDuration(result.startTime, result.endTime);

            const analysis = {
                examName: exam.name,
                score: result.score,
                totalScore: totalQuestions * 10,
                accuracy: accuracy.toFixed(2),
                duration: duration,
                startTime: result.startTime,
                endTime: result.endTime,
                correctAnswers: correctAnswers,
                totalQuestions: totalQuestions,
                incorrectAnswers: totalQuestions - correctAnswers
            };

            return { success: true, analysis };
        } catch (error) {
            console.error('生成分析报告失败:', error);
            return { success: false, error: error.message };
        }
    }

    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = end - start;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}分${seconds}秒`;
    }

    async getScoreStatistics() {
        try {
            const scores = this.results.map(result => result.score);
            if (scores.length === 0) {
                return { success: false, error: '没有考试记录' };
            }

            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const highest = Math.max(...scores);
            const lowest = Math.min(...scores);
            const passCount = scores.filter(score => score >= 60).length;
            const passRate = (passCount / scores.length) * 100;

            return {
                success: true,
                statistics: {
                    totalExams: scores.length,
                    averageScore: average.toFixed(2),
                    highestScore: highest,
                    lowestScore: lowest,
                    passRate: passRate.toFixed(2)
                }
            };
        } catch (error) {
            console.error('获取成绩统计失败:', error);
            return { success: false, error: error.message };
        }
    }

    async exportResults(format = 'json') {
        try {
            if (format === 'json') {
                return {
                    success: true,
                    data: JSON.stringify(this.results, null, 2),
                    format: 'json'
                };
            } else if (format === 'csv') {
                const csv = this.convertToCSV(this.results);
                return {
                    success: true,
                    data: csv,
                    format: 'csv'
                };
            } else {
                return { success: false, error: '不支持的导出格式' };
            }
        } catch (error) {
            console.error('导出结果失败:', error);
            return { success: false, error: error.message };
        }
    }

    convertToCSV(results) {
        const headers = ['ID', 'Exam ID', 'User ID', 'Start Time', 'End Time', 'Score', 'Questions'];
        const rows = results.map(result => [
            result.id,
            result.examId,
            result.userId,
            result.startTime,
            result.endTime,
            result.score,
            result.questionCount
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    async getChapterAnalysis(resultId) {
        try {
            const result = await this.getResultById(resultId);
            if (!result) {
                return { success: false, error: '考试结果不存在' };
            }

            const sessionData = await this.getSessionData(resultId);
            if (!sessionData || !sessionData.questions) {
                return { success: false, error: '无法获取题目数据' };
            }

            const chapterStats = {};
            const questions = sessionData.questions;
            const questionResults = sessionData.questionResults || [];
            const answers = sessionData.answers || {};

            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const chapterId = question.chapter || 'unknown';
                const chapterName = this.chapterNames[chapterId] || question.chapterName || '未知章节';
                
                if (!chapterStats[chapterId]) {
                    chapterStats[chapterId] = {
                        chapterId: chapterId,
                        chapterName: chapterName,
                        total: 0,
                        correct: 0,
                        incorrect: 0,
                        unanswered: 0,
                        score: 0,
                        totalScore: 0
                    };
                }

                chapterStats[chapterId].total++;
                chapterStats[chapterId].totalScore += 10;

                const questionResult = questionResults[i];
                const answer = answers[i];

                if (!answer || answer.trim() === '') {
                    chapterStats[chapterId].unanswered++;
                } else if (questionResult && questionResult.result === 'AC') {
                    chapterStats[chapterId].correct++;
                    chapterStats[chapterId].score += 10;
                } else {
                    chapterStats[chapterId].incorrect++;
                }
            }

            const chapterAnalysis = Object.values(chapterStats).map(stat => ({
                ...stat,
                accuracy: stat.total > 0 ? ((stat.correct / stat.total) * 100).toFixed(2) : 0,
                scoreRate: stat.totalScore > 0 ? ((stat.score / stat.totalScore) * 100).toFixed(2) : 0
            }));

            chapterAnalysis.sort((a, b) => b.total - a.total);

            return { success: true, chapterAnalysis };
        } catch (error) {
            console.error('获取章节分析失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getSessionData(resultId) {
        try {
            return await storage.getSessionData(resultId);
        } catch (error) {
            console.error('获取会话数据失败:', error);
            return null;
        }
    }

    async saveSessionData(resultId, sessionData) {
        try {
            await storage.storeSessionData(resultId, sessionData);
            return { success: true };
        } catch (error) {
            console.error('保存会话数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getQuestionDetails(resultId) {
        try {
            const result = await this.getResultById(resultId);
            if (!result) {
                return { success: false, error: '考试结果不存在' };
            }

            const sessionData = await this.getSessionData(resultId);
            if (!sessionData || !sessionData.questions) {
                return { success: false, error: '无法获取题目数据' };
            }

            const questions = sessionData.questions;
            const questionResults = sessionData.questionResults || [];
            const answers = sessionData.answers || {};

            const details = questions.map((question, index) => {
                const qResult = questionResults[index] || { result: 'NA', score: 0 };
                const answer = answers[index] || '';
                
                let status = 'UNANSWERED';
                if (answer && answer.trim() !== '') {
                    status = qResult.result === 'AC' ? 'AC' : 'WA';
                }

                return {
                    index: index + 1,
                    id: question.id,
                    title: question.title,
                    description: question.description,
                    difficulty: question.difficulty,
                    chapter: question.chapter,
                    chapterName: this.chapterNames[question.chapter] || question.chapterName || '未知章节',
                    userAnswer: answer,
                    correctAnswer: question.answer || question.expectedOutput || '',
                    explanation: question.explanation || '暂无解析',
                    status: status,
                    score: qResult.score || 0,
                    maxScore: 10,
                    isCorrect: status === 'AC'
                };
            });

            return { success: true, questionDetails: details };
        } catch (error) {
            console.error('获取题目详情失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getHistoryList(filters = {}) {
        try {
            let filteredResults = [...this.results];

            if (filters.userId) {
                filteredResults = filteredResults.filter(r => r.userId === filters.userId);
            }

            if (filters.timeRange) {
                const now = new Date();
                let startDate;
                switch (filters.timeRange) {
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case 'all':
                    default:
                        startDate = null;
                }
                if (startDate) {
                    filteredResults = filteredResults.filter(r => new Date(r.endTime) >= startDate);
                }
            }

            if (filters.scoreFilter) {
                switch (filters.scoreFilter) {
                    case 'pass':
                        filteredResults = filteredResults.filter(r => r.score >= 60);
                        break;
                    case 'fail':
                        filteredResults = filteredResults.filter(r => r.score < 60);
                        break;
                }
            }

            if (filters.keyword && filters.keyword.trim() !== '') {
                const keyword = filters.keyword.toLowerCase().trim();
                filteredResults = filteredResults.filter(r => 
                    r.examName && r.examName.toLowerCase().includes(keyword)
                );
            }

            if (filters.sortBy) {
                switch (filters.sortBy) {
                    case 'date_desc':
                        filteredResults.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
                        break;
                    case 'date_asc':
                        filteredResults.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
                        break;
                    case 'score_desc':
                        filteredResults.sort((a, b) => b.score - a.score);
                        break;
                    case 'score_asc':
                        filteredResults.sort((a, b) => a.score - b.score);
                        break;
                }
            } else {
                filteredResults.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
            }

            return { success: true, results: filteredResults };
        } catch (error) {
            console.error('获取历史记录列表失败:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteResult(resultId) {
        try {
            const index = this.results.findIndex(r => r.id === resultId);
            if (index === -1) {
                return { success: false, error: '记录不存在' };
            }

            this.results.splice(index, 1);
            await storage.delete('examHistory', resultId);
            await storage.deleteSessionData(resultId);

            return { success: true };
        } catch (error) {
            console.error('删除考试结果失败:', error);
            return { success: false, error: error.message };
        }
    }

    async clearAllHistory(userId) {
        try {
            if (userId) {
                const toDelete = this.results.filter(r => r.userId === userId);
                for (const item of toDelete) {
                    await storage.delete('examHistory', item.id);
                    await storage.deleteSessionData(item.id);
                }
                this.results = this.results.filter(r => r.userId !== userId);
            } else {
                await storage.clear('examHistory');
                await storage.clear('sessionData');
                this.results = [];
            }
            return { success: true };
        } catch (error) {
            console.error('清空历史记录失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserStatistics(userId) {
        try {
            let userResults = this.results;
            if (userId) {
                userResults = this.results.filter(r => r.userId === userId);
            }

            if (userResults.length === 0) {
                return {
                    success: true,
                    statistics: {
                        totalExams: 0,
                        totalScore: 0,
                        averageScore: 0,
                        highestScore: 0,
                        lowestScore: 0,
                        passCount: 0,
                        failCount: 0,
                        passRate: 0,
                        totalQuestions: 0,
                        totalCorrect: 0,
                        totalDuration: 0
                    }
                };
            }

            const scores = userResults.map(r => r.score);
            const totalScore = scores.reduce((sum, s) => sum + s, 0);
            const averageScore = totalScore / scores.length;
            const highestScore = Math.max(...scores);
            const lowestScore = Math.min(...scores);
            const passCount = scores.filter(s => s >= 60).length;
            const failCount = scores.length - passCount;
            const passRate = (passCount / scores.length) * 100;

            const totalQuestions = userResults.reduce((sum, r) => sum + (r.questionCount || 0), 0);
            const totalCorrect = userResults.reduce((sum, r) => sum + Math.floor((r.score || 0) / 10), 0);
            const totalDuration = userResults.reduce((sum, r) => sum + (r.timeUsed || 0), 0);

            return {
                success: true,
                statistics: {
                    totalExams: userResults.length,
                    totalScore: totalScore,
                    averageScore: averageScore.toFixed(2),
                    highestScore: highestScore,
                    lowestScore: lowestScore,
                    passCount: passCount,
                    failCount: failCount,
                    passRate: passRate.toFixed(2),
                    totalQuestions: totalQuestions,
                    totalCorrect: totalCorrect,
                    totalDuration: totalDuration
                }
            };
        } catch (error) {
            console.error('获取用户统计失败:', error);
            return { success: false, error: error.message };
        }
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}小时${minutes}分${secs}秒`;
        } else if (minutes > 0) {
            return `${minutes}分${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    }
}

const examResult = new ExamResult();
export default examResult;
