// 考试管理模块
class ExamManager {
    constructor() {
        this.exams = [];
        this.init();
    }

    // 初始化
    async init() {
        await this.loadExams();
    }

    // 从本地存储加载考试
    async loadExams() {
        try {
            const storedExams = localStorage.getItem('exams');
            if (storedExams) {
                this.exams = JSON.parse(storedExams);
            }
        } catch (error) {
            console.error('加载考试失败:', error);
            this.exams = [];
        }
    }

    // 保存考试到本地存储
    async saveExams() {
        try {
            localStorage.setItem('exams', JSON.stringify(this.exams));
        } catch (error) {
            console.error('保存考试失败:', error);
        }
    }

    // 创建新考试
    async createExam(examData) {
        try {
            const exam = {
                id: Date.now().toString(),
                name: examData.name,
                duration: examData.duration, // 分钟
                questionCount: examData.questionCount,
                difficulty: examData.difficulty,
                chapters: examData.chapters,
                createdAt: new Date().toISOString(),
                createdBy: examData.createdBy
            };

            this.exams.push(exam);
            await this.saveExams();
            return { success: true, exam };
        } catch (error) {
            console.error('创建考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新考试
    async updateExam(examId, examData) {
        try {
            const index = this.exams.findIndex(exam => exam.id === examId);
            if (index === -1) {
                return { success: false, error: '考试不存在' };
            }

            this.exams[index] = {
                ...this.exams[index],
                ...examData,
                updatedAt: new Date().toISOString()
            };

            await this.saveExams();
            return { success: true, exam: this.exams[index] };
        } catch (error) {
            console.error('更新考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除考试
    async deleteExam(examId) {
        try {
            const index = this.exams.findIndex(exam => exam.id === examId);
            if (index === -1) {
                return { success: false, error: '考试不存在' };
            }

            this.exams.splice(index, 1);
            await this.saveExams();
            return { success: true };
        } catch (error) {
            console.error('删除考试失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取所有考试
    async getAllExams() {
        return this.exams;
    }

    // 根据ID获取考试
    async getExamById(examId) {
        return this.exams.find(exam => exam.id === examId);
    }

    // 根据创建者获取考试
    async getExamsByCreator(creator) {
        return this.exams.filter(exam => exam.createdBy === creator);
    }

    // 随机生成考试题目
    async generateExamQuestions(examId) {
        try {
            const exam = await this.getExamById(examId);
            if (!exam) {
                return { success: false, error: '考试不存在' };
            }

            // 加载题目
            const problemLoader = await import('./problem-loader.js').then(module => module.default);
            const allProblems = await problemLoader.getAllProblems();

            // 筛选符合条件的题目
            let filteredProblems = allProblems;

            // 按章节筛选
            if (exam.chapters && exam.chapters.length > 0) {
                filteredProblems = filteredProblems.filter(problem => 
                    exam.chapters.includes(problem.chapter)
                );
            }

            // 按难度筛选
            if (exam.difficulty && exam.difficulty !== 'all') {
                filteredProblems = filteredProblems.filter(problem => 
                    problem.difficulty === exam.difficulty
                );
            }

            // 随机选择题目
            const shuffled = filteredProblems.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, exam.questionCount);

            return { success: true, questions: selected };
        } catch (error) {
            console.error('生成考试题目失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 导出单例实例
const examManager = new ExamManager();
export default examManager;