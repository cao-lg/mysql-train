// 考试结果分析模块
class ExamResult {
    constructor() {
        this.results = [];
        this.init();
    }

    // 初始化
    async init() {
        await this.loadResults();
    }

    // 从本地存储加载结果
    async loadResults() {
        try {
            const storedResults = localStorage.getItem('examHistory');
            if (storedResults) {
                this.results = JSON.parse(storedResults);
            }
        } catch (error) {
            console.error('加载考试结果失败:', error);
            this.results = [];
        }
    }

    // 获取所有考试结果
    async getAllResults() {
        return this.results;
    }

    // 根据用户获取考试结果
    async getResultsByUser(userId) {
        return this.results.filter(result => result.userId === userId);
    }

    // 根据考试获取结果
    async getResultsByExam(examId) {
        return this.results.filter(result => result.examId === examId);
    }

    // 根据ID获取结果
    async getResultById(resultId) {
        return this.results.find(result => result.id === resultId);
    }

    // 生成考试分析报告
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

            // 计算各项指标
            const totalQuestions = result.questionCount;
            const correctAnswers = Math.floor(result.score / 10);
            const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
            const duration = this.calculateDuration(result.startTime, result.endTime);

            // 生成分析报告
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

    // 计算考试时长
    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = end - start;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}分${seconds}秒`;
    }

    // 获取成绩统计
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

    // 导出考试结果
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

    // 转换为CSV格式
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
}

// 导出单例实例
const examResult = new ExamResult();
export default examResult;