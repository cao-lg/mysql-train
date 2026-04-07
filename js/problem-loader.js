// 题目懒加载器
class ProblemLoader {
    constructor() {
        this.problems = [];
        this.loadedChapters = new Set();
        this.basePath = this.getBasePath();
    }

    // 获取基础路径
    getBasePath() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            return '../data/mysql/';
        }
        return 'data/mysql/';
    }

    // 加载指定章节的题目
    async loadChapter(chapter) {
        if (this.loadedChapters.has(chapter)) {
            console.log(`章节 ${chapter} 已经加载过`);
            return;
        }

        try {
            const response = await fetch(`${this.basePath}${chapter}.json`);
            if (!response.ok) {
                console.warn(`加载章节 ${chapter} 失败，跳过`);
                return;
            }
            
            const data = await response.json();
            this.problems.push(...data.problems);
            this.loadedChapters.add(chapter);
            console.log(`章节 ${chapter} 加载成功，共 ${data.problems.length} 道题目`);
        } catch (error) {
            console.error('加载题目失败:', error);
        }
    }

    // 加载所有章节的题目
    async loadAllChapters() {
        const chapters = [
            'chapter1-database',
            'chapter2-table',
            'chapter3-select',
            'chapter4-where',
            'chapter5-order-limit',
            'chapter6-group',
            'chapter7-join',
            'chapter8-subquery',
            'chapter9-insert-update-delete',
            'chapter10-view'
        ];

        for (const chapter of chapters) {
            await this.loadChapter(chapter);
        }
    }

    // 获取所有题目
    async getAllProblems() {
        if (this.problems.length === 0) {
            await this.loadAllChapters();
        }
        return this.problems;
    }

    // 根据章节获取题目
    async getProblemsByChapter(chapter) {
        if (!this.loadedChapters.has(chapter)) {
            await this.loadChapter(chapter);
        }
        return this.problems.filter(problem => {
            // 这里需要根据题目数据中的章节信息进行过滤
            // 暂时返回所有题目，实际项目中需要根据数据结构调整
            return true;
        });
    }

    // 根据ID获取题目
    async getProblemById(id) {
        if (this.problems.length === 0) {
            await this.loadAllChapters();
        }
        return this.problems.find(problem => problem.id === id);
    }

    // 搜索题目
    async searchProblems(keyword) {
        if (this.problems.length === 0) {
            await this.loadAllChapters();
        }
        return this.problems.filter(problem => 
            problem.title.includes(keyword) || 
            problem.description.includes(keyword)
        );
    }

    // 根据难度筛选题目
    async filterProblemsByDifficulty(difficulty) {
        if (this.problems.length === 0) {
            await this.loadAllChapters();
        }
        return this.problems.filter(problem => problem.difficulty === difficulty);
    }

    // 分页获取题目
    async getProblemsByPage(page, pageSize = 10) {
        if (this.problems.length === 0) {
            await this.loadAllChapters();
        }
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return this.problems.slice(start, end);
    }

    // 获取题目总数
    async getProblemCount() {
        if (this.problems.length === 0) {
            await this.loadAllChapters();
        }
        return this.problems.length;
    }
}

// 导出单例实例
const problemLoader = new ProblemLoader();
export default problemLoader;