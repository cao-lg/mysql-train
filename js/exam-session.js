class ExamSession {
    constructor() {
        this.currentSession = null;
        this.timer = null;
        this.remainingTime = 0;
        this.timeUpCallbacks = [];
        this.autoSaveInterval = null;
        this.lastSaveTime = null;
        this.isSubmitting = false;
        this.init();
    }

    async init() {
        await this.loadSession();
    }

    async loadSession() {
        try {
            const storedSession = localStorage.getItem('currentExamSession');
            if (storedSession) {
                this.currentSession = JSON.parse(storedSession);
                this.remainingTime = this.currentSession.remainingTime;
                
                if (this.currentSession.status === 'in_progress' && this.remainingTime > 0) {
                    this.startTimer();
                } else if (this.currentSession.status === 'in_progress' && this.remainingTime <= 0) {
                    await this.endExam();
                }
            }
        } catch (error) {
            console.error('加载考试会话失败:', error);
            this.currentSession = null;
            this.remainingTime = 0;
        }
    }

    async saveSession() {
        try {
            if (this.currentSession) {
                this.currentSession.lastSavedAt = new Date().toISOString();
                localStorage.setItem('currentExamSession', JSON.stringify(this.currentSession));
                this.lastSaveTime = new Date();
                return { success: true };
            }
            return { success: false, error: '没有活跃的考试会话' };
        } catch (error) {
            console.error('保存考试会话失败:', error);
            return { success: false, error: error.message };
        }
    }

    async startExam(examId, questions) {
        try {
            const examManager = await import('./exam-manager.js').then(module => module.default);
            const exam = await examManager.getExamById(examId);
            
            if (!exam) {
                return { success: false, error: '考试不存在' };
            }

            const existingSession = localStorage.getItem('currentExamSession');
            if (existingSession) {
                const session = JSON.parse(existingSession);
                if (session.examId === examId && session.status === 'in_progress') {
                    this.currentSession = session;
                    this.remainingTime = session.remainingTime;
                    this.startTimer();
                    return { success: true, session: this.currentSession, resumed: true };
                }
            }

            this.currentSession = {
                id: Date.now().toString(),
                examId: exam.id,
                examName: exam.name,
                userId: this.getCurrentUserId(),
                startTime: new Date().toISOString(),
                endTime: null,
                status: 'in_progress',
                remainingTime: exam.duration * 60,
                totalDuration: exam.duration * 60,
                currentQuestion: 0,
                questions: questions,
                answers: {},
                score: 0,
                autoSaveCount: 0,
                lastAutoSave: null
            };

            this.remainingTime = this.currentSession.remainingTime;
            await this.saveSession();

            this.startTimer();

            return { success: true, session: this.currentSession, resumed: false };
        } catch (error) {
            console.error('开始考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
                if (this.currentSession) {
                    this.currentSession.remainingTime = this.remainingTime;
                }
                
                if (this.remainingTime % 30 === 0) {
                    this.saveSession();
                }
            } else {
                this.handleTimeUp();
            }
        }, 1000);
    }

    handleTimeUp() {
        this.pauseTimer();
        
        if (this.currentSession && this.currentSession.status === 'in_progress') {
            this.currentSession.remainingTime = 0;
            this.saveSession();
            
            this.timeUpCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('时间结束回调执行失败:', error);
                }
            });
        }
    }

    onTimeUp(callback) {
        if (typeof callback === 'function') {
            this.timeUpCallbacks.push(callback);
        }
    }

    removeTimeUpCallback(callback) {
        const index = this.timeUpCallbacks.indexOf(callback);
        if (index > -1) {
            this.timeUpCallbacks.splice(index, 1);
        }
    }

    pauseTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    resumeTimer() {
        if (!this.timer && this.currentSession && this.currentSession.status === 'in_progress') {
            this.startTimer();
        }
    }

    async saveAnswer(questionIndex, answer) {
        try {
            if (!this.currentSession) {
                return { success: false, error: '没有活跃的考试会话' };
            }

            if (this.currentSession.status !== 'in_progress') {
                return { success: false, error: '考试已结束' };
            }

            this.currentSession.answers[questionIndex] = answer;
            this.currentSession.currentQuestion = questionIndex;
            
            const result = await this.saveSession();
            
            return result;
        } catch (error) {
            console.error('保存答案失败:', error);
            return { success: false, error: error.message };
        }
    }

    async autoSaveAnswers(getCurrentAnswer) {
        if (!this.currentSession || this.currentSession.status !== 'in_progress') {
            return { success: false, error: '没有活跃的考试会话' };
        }

        try {
            if (typeof getCurrentAnswer === 'function') {
                const currentAnswer = getCurrentAnswer();
                const currentIndex = this.currentSession.currentQuestion;
                if (currentAnswer !== undefined && currentAnswer !== null) {
                    await this.saveAnswer(currentIndex, currentAnswer);
                }
            }
            
            this.currentSession.autoSaveCount++;
            this.currentSession.lastAutoSave = new Date().toISOString();
            await this.saveSession();
            
            return { success: true };
        } catch (error) {
            console.error('自动保存失败:', error);
            return { success: false, error: error.message };
        }
    }

    async endExam() {
        try {
            if (!this.currentSession) {
                return { success: false, error: '没有活跃的考试会话' };
            }

            if (this.isSubmitting) {
                return { success: false, error: '正在提交中，请勿重复操作' };
            }

            this.isSubmitting = true;

            this.pauseTimer();

            this.currentSession.endTime = new Date().toISOString();
            this.currentSession.status = 'completed';

            await this.calculateScore();

            const sessionId = this.currentSession.id;
            await this.saveToHistory();

            const finalScore = this.currentSession.score;
            const sessionData = { ...this.currentSession };

            this.currentSession = null;
            this.remainingTime = 0;
            this.timeUpCallbacks = [];
            localStorage.removeItem('currentExamSession');

            this.isSubmitting = false;

            return { success: true, score: finalScore, sessionId: sessionId, session: sessionData };
        } catch (error) {
            console.error('结束考试失败:', error);
            this.isSubmitting = false;
            return { success: false, error: error.message };
        }
    }

    async calculateScore() {
        try {
            const judgeEngine = await import('./judge-engine.js').then(module => module.default);
            let totalScore = 0;
            const results = [];

            for (let i = 0; i < this.currentSession.questions.length; i++) {
                const question = this.currentSession.questions[i];
                const answer = this.currentSession.answers[i];

                let questionResult = { index: i, result: 'NA', score: 0 };
                
                if (answer && answer.trim() !== '') {
                    try {
                        const result = await judgeEngine.judge(question, answer);
                        questionResult.result = result.result;
                        if (result.result === 'AC') {
                            questionResult.score = 10;
                            totalScore += 10;
                        }
                    } catch (judgeError) {
                        console.error(`题目 ${i + 1} 判题失败:`, judgeError);
                        questionResult.result = 'ERROR';
                    }
                }
                
                results.push(questionResult);
            }

            this.currentSession.score = totalScore;
            this.currentSession.questionResults = results;
        } catch (error) {
            console.error('计算得分失败:', error);
            this.currentSession.score = 0;
        }
    }

    async saveToHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('examHistory') || '[]');
            
            const historyEntry = {
                id: this.currentSession.id,
                examId: this.currentSession.examId,
                examName: this.currentSession.examName,
                userId: this.currentSession.userId,
                startTime: this.currentSession.startTime,
                endTime: this.currentSession.endTime,
                score: this.currentSession.score,
                questionCount: this.currentSession.questions.length,
                answeredCount: Object.values(this.currentSession.answers).filter(a => a && a.trim() !== '').length,
                timeUsed: this.currentSession.totalDuration - this.currentSession.remainingTime,
                status: 'completed'
            };

            history.push(historyEntry);

            const recentHistory = history.slice(-100);
            localStorage.setItem('examHistory', JSON.stringify(recentHistory));

            const sessionData = {
                id: this.currentSession.id,
                examId: this.currentSession.examId,
                examName: this.currentSession.examName,
                questions: this.currentSession.questions,
                answers: this.currentSession.answers,
                questionResults: this.currentSession.questionResults || [],
                score: this.currentSession.score,
                startTime: this.currentSession.startTime,
                endTime: this.currentSession.endTime
            };
            localStorage.setItem('completedExamSession_' + this.currentSession.id, JSON.stringify(sessionData));
            
            return { success: true };
        } catch (error) {
            console.error('保存历史记录失败:', error);
            return { success: false, error: error.message };
        }
    }

    getCurrentSession() {
        return this.currentSession;
    }

    getRemainingTime() {
        return Math.max(0, this.remainingTime);
    }

    getProgress() {
        if (!this.currentSession) {
            return { answered: 0, total: 0, percentage: 0 };
        }

        const total = this.currentSession.questions.length;
        const answered = Object.values(this.currentSession.answers).filter(a => a && a.trim() !== '').length;
        const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

        return { answered, total, percentage };
    }

    getCurrentUserId() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                return user.username || 'anonymous';
            }
            return 'anonymous';
        } catch (error) {
            return 'anonymous';
        }
    }

    clearSession() {
        this.currentSession = null;
        this.remainingTime = 0;
        this.timeUpCallbacks = [];
        this.pauseTimer();
        localStorage.removeItem('currentExamSession');
    }

    isSessionActive() {
        return this.currentSession !== null && this.currentSession.status === 'in_progress';
    }

    getSessionInfo() {
        if (!this.currentSession) {
            return null;
        }

        return {
            id: this.currentSession.id,
            examId: this.currentSession.examId,
            examName: this.currentSession.examName,
            status: this.currentSession.status,
            remainingTime: this.remainingTime,
            totalDuration: this.currentSession.totalDuration,
            startTime: this.currentSession.startTime,
            progress: this.getProgress()
        };
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getTimeWarning() {
        if (this.remainingTime <= 300) {
            return 'danger';
        } else if (this.remainingTime <= 600) {
            return 'warning';
        }
        return 'normal';
    }
}

const examSession = new ExamSession();
export default examSession;
