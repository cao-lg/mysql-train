// 考试会话管理模块
class ExamSession {
    constructor() {
        this.currentSession = null;
        this.timer = null;
        this.remainingTime = 0;
        this.init();
    }

    // 初始化
    async init() {
        await this.loadSession();
    }

    // 从本地存储加载会话
    async loadSession() {
        try {
            const storedSession = localStorage.getItem('currentExamSession');
            if (storedSession) {
                this.currentSession = JSON.parse(storedSession);
                this.remainingTime = this.currentSession.remainingTime;
            }
        } catch (error) {
            console.error('加载考试会话失败:', error);
            this.currentSession = null;
            this.remainingTime = 0;
        }
    }

    // 保存会话到本地存储
    async saveSession() {
        try {
            if (this.currentSession) {
                localStorage.setItem('currentExamSession', JSON.stringify(this.currentSession));
            }
        } catch (error) {
            console.error('保存考试会话失败:', error);
        }
    }

    // 开始考试
    async startExam(examId, questions) {
        try {
            const examManager = await import('./exam-manager.js').then(module => module.default);
            const exam = await examManager.getExamById(examId);
            
            if (!exam) {
                return { success: false, error: '考试不存在' };
            }

            // 创建考试会话
            this.currentSession = {
                id: Date.now().toString(),
                examId: exam.id,
                userId: this.getCurrentUserId(),
                startTime: new Date().toISOString(),
                endTime: null,
                status: 'in_progress',
                remainingTime: exam.duration * 60, // 转换为秒
                currentQuestion: 0,
                questions: questions,
                answers: {},
                score: 0
            };

            this.remainingTime = this.currentSession.remainingTime;
            await this.saveSession();

            // 开始倒计时
            this.startTimer();

            return { success: true, session: this.currentSession };
        } catch (error) {
            console.error('开始考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 开始倒计时
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
                this.currentSession.remainingTime = this.remainingTime;
                this.saveSession();
            } else {
                this.endExam();
            }
        }, 1000);
    }

    // 暂停倒计时
    pauseTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // 恢复倒计时
    resumeTimer() {
        if (!this.timer && this.currentSession && this.currentSession.status === 'in_progress') {
            this.startTimer();
        }
    }

    // 保存答案
    async saveAnswer(questionIndex, answer) {
        try {
            if (!this.currentSession) {
                return { success: false, error: '没有活跃的考试会话' };
            }

            this.currentSession.answers[questionIndex] = answer;
            this.currentSession.currentQuestion = questionIndex;
            await this.saveSession();

            return { success: true };
        } catch (error) {
            console.error('保存答案失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 结束考试
    async endExam() {
        try {
            if (!this.currentSession) {
                return { success: false, error: '没有活跃的考试会话' };
            }

            // 停止倒计时
            this.pauseTimer();

            // 更新会话状态
            this.currentSession.endTime = new Date().toISOString();
            this.currentSession.status = 'completed';

            // 计算得分
            await this.calculateScore();

            // 保存会话
            await this.saveSession();

            // 保存到历史记录
            await this.saveToHistory();

            // 清除当前会话
            this.currentSession = null;
            this.remainingTime = 0;
            localStorage.removeItem('currentExamSession');

            return { success: true, score: this.currentSession.score };
        } catch (error) {
            console.error('结束考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 计算得分
    async calculateScore() {
        try {
            const judgeEngine = await import('./judge-engine.js').then(module => module.default);
            let totalScore = 0;

            for (let i = 0; i < this.currentSession.questions.length; i++) {
                const question = this.currentSession.questions[i];
                const answer = this.currentSession.answers[i];

                if (answer) {
                    const result = await judgeEngine.judge(question, answer);
                    if (result.result === 'AC') {
                        totalScore += 10; // 每题10分
                    }
                }
            }

            this.currentSession.score = totalScore;
        } catch (error) {
            console.error('计算得分失败:', error);
            this.currentSession.score = 0;
        }
    }

    // 保存到历史记录
    async saveToHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('examHistory') || '[]');
            history.push({
                id: this.currentSession.id,
                examId: this.currentSession.examId,
                userId: this.currentSession.userId,
                startTime: this.currentSession.startTime,
                endTime: this.currentSession.endTime,
                score: this.currentSession.score,
                questionCount: this.currentSession.questions.length
            });

            // 只保留最近100条记录
            const recentHistory = history.slice(-100);
            localStorage.setItem('examHistory', JSON.stringify(recentHistory));
        } catch (error) {
            console.error('保存历史记录失败:', error);
        }
    }

    // 获取当前会话
    getCurrentSession() {
        return this.currentSession;
    }

    // 获取剩余时间
    getRemainingTime() {
        return this.remainingTime;
    }

    // 获取当前用户ID
    getCurrentUserId() {
        const userSystem = require('./user-system.js').default;
        const currentUser = userSystem.getCurrentUser();
        return currentUser ? currentUser.username : 'anonymous';
    }

    // 清除会话
    clearSession() {
        this.currentSession = null;
        this.remainingTime = 0;
        this.pauseTimer();
        localStorage.removeItem('currentExamSession');
    }
}

// 导出单例实例
const examSession = new ExamSession();
export default examSession;