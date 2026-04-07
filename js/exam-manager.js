// 考试管理模块
import storage from './storage.js';

class ExamManager {
    constructor() {
        this.exams = [];
        this.examResults = [];
        this.init();
    }

    async init() {
        await this.loadExams();
        await this.loadExamResults();
    }

    async loadExams() {
        try {
            this.exams = await storage.getAllExams();
        } catch (error) {
            console.error('加载考试失败:', error);
            this.exams = [];
        }
    }

    async saveExams() {
        try {
            for (const exam of this.exams) {
                await storage.storeExam(exam);
            }
        } catch (error) {
            console.error('保存考试失败:', error);
        }
    }

    async loadExamResults() {
        try {
            this.examResults = await storage.getAll('examResults');
        } catch (error) {
            console.error('加载考试结果失败:', error);
            this.examResults = [];
        }
    }

    async saveExamResults() {
        try {
            for (const result of this.examResults) {
                await storage.storeExamResult(result);
            }
        } catch (error) {
            console.error('保存考试结果失败:', error);
        }
    }

    async createExam(examData) {
        try {
            const exam = {
                id: Date.now().toString(),
                name: examData.name,
                duration: examData.duration,
                questionCount: examData.questionCount,
                difficulty: examData.difficulty,
                chapters: examData.chapters || [],
                createdAt: new Date().toISOString(),
                createdBy: examData.createdBy,
                participantCount: 0,
                avgScore: undefined,
                totalScore: examData.questionCount * 10
            };

            this.exams.push(exam);
            await storage.storeExam(exam);
            return { success: true, exam };
        } catch (error) {
            console.error('创建考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    async updateExam(examId, examData) {
        try {
            const index = this.exams.findIndex(exam => exam.id === examId);
            if (index === -1) {
                return { success: false, error: '考试不存在' };
            }

            const existingExam = this.exams[index];
            this.exams[index] = {
                ...existingExam,
                name: examData.name,
                duration: examData.duration,
                questionCount: examData.questionCount,
                difficulty: examData.difficulty,
                chapters: examData.chapters || [],
                updatedAt: new Date().toISOString(),
                totalScore: examData.questionCount * 10
            };

            await storage.storeExam(this.exams[index]);
            return { success: true, exam: this.exams[index] };
        } catch (error) {
            console.error('更新考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteExam(examId) {
        try {
            const index = this.exams.findIndex(exam => exam.id === examId);
            if (index === -1) {
                return { success: false, error: '考试不存在' };
            }

            this.exams.splice(index, 1);
            
            this.examResults = this.examResults.filter(result => result.examId !== examId);
            
            await storage.deleteExam(examId);
            return { success: true };
        } catch (error) {
            console.error('删除考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllExams() {
        await this.loadExams(); // 重新从存储中加载数据，确保数据最新
        return this.exams.map(exam => {
            const stats = this.calculateExamStats(exam.id);
            return {
                ...exam,
                participantCount: stats.participantCount,
                avgScore: stats.avgScore
            };
        });
    }

    async getExamById(examId) {
        await this.loadExams(); // 重新从存储中加载数据，确保数据最新
        const exam = this.exams.find(exam => exam.id === examId);
        if (exam) {
            const stats = this.calculateExamStats(examId);
            return {
                ...exam,
                participantCount: stats.participantCount,
                avgScore: stats.avgScore
            };
        }
        return null;
    }

    async getExamsByCreator(creator) {
        await this.loadExams(); // 重新从存储中加载数据，确保数据最新
        return this.exams.filter(exam => exam.createdBy === creator);
    }

    calculateExamStats(examId) {
        const examResults = this.examResults.filter(result => result.examId === examId);
        const participantCount = examResults.length;
        
        if (participantCount === 0) {
            return { participantCount: 0, avgScore: undefined };
        }
        
        const totalScore = examResults.reduce((sum, result) => sum + (result.score || 0), 0);
        const avgScore = totalScore / participantCount;
        
        return { participantCount, avgScore };
    }

    async getExamStats() {
        const totalExams = this.exams.length;
        const totalParticipants = this.examResults.length;
        
        if (totalParticipants === 0) {
            return {
                totalExams,
                totalParticipants: 0,
                avgScore: null,
                passRate: null
            };
        }
        
        const totalScore = this.examResults.reduce((sum, result) => sum + (result.score || 0), 0);
        const avgScore = totalScore / totalParticipants;
        
        const passingResults = this.examResults.filter(result => {
            const exam = this.exams.find(e => e.id === result.examId);
            if (!exam) return false;
            const passThreshold = (exam.totalScore || 100) * 0.6;
            return result.score >= passThreshold;
        });
        const passRate = (passingResults.length / totalParticipants) * 100;
        
        return {
            totalExams,
            totalParticipants,
            avgScore,
            passRate
        };
    }

    async saveExamResult(examId, username, score, answers) {
        try {
            const result = {
                id: Date.now().toString(),
                examId,
                username,
                score,
                answers,
                completedAt: new Date().toISOString()
            };
            
            this.examResults.push(result);
            await storage.storeExamResult(result);
            
            return { success: true, result };
        } catch (error) {
            console.error('保存考试结果失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getExamResults(examId) {
        return this.examResults.filter(result => result.examId === examId);
    }

    async getUserExamResults(username) {
        return this.examResults.filter(result => result.username === username);
    }

    async generateExamQuestions(examId) {
        try {
            const exam = await this.getExamById(examId);
            if (!exam) {
                return { success: false, error: '考试不存在' };
            }

            const problemLoader = await import('./problem-loader.js').then(module => module.default);
            const allProblems = await problemLoader.getAllProblems();

            let filteredProblems = allProblems;

            if (exam.chapters && exam.chapters.length > 0) {
                filteredProblems = filteredProblems.filter(problem => 
                    exam.chapters.includes(problem.chapter)
                );
            }

            if (exam.difficulty && exam.difficulty !== 'all') {
                filteredProblems = filteredProblems.filter(problem => 
                    problem.difficulty === exam.difficulty
                );
            }

            const shuffled = filteredProblems.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, exam.questionCount);

            return { success: true, questions: selected };
        } catch (error) {
            console.error('生成考试题目失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getExamLeaderboard(examId, limit = 10) {
        const results = await this.getExamResults(examId);
        
        const sortedResults = results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        
        return sortedResults.map((result, index) => ({
            rank: index + 1,
            username: result.username,
            score: result.score,
            completedAt: result.completedAt
        }));
    }
}

const examManager = new ExamManager();
export default examManager;
