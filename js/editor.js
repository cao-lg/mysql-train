// SQL 编辑器实现
class SQLEditor {
    constructor(textarea) {
        this.textarea = textarea;
        this.init();
    }

    // 初始化编辑器
    init() {
        this.addEventListeners();
        this.setupSyntaxHighlighting();
    }

    // 添加事件监听器
    addEventListeners() {
        // 智能缩进
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabKey(e);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.handleEnterKey(e);
            }
        });

        // 实时语法高亮
        this.textarea.addEventListener('input', () => {
            this.highlightSyntax();
        });
    }

    // 处理 Tab 键
    handleTabKey(e) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const text = this.textarea.value;
        const newText = text.substring(0, start) + '    ' + text.substring(end);
        this.textarea.value = newText;
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
    }

    // 处理 Enter 键
    handleEnterKey(e) {
        const start = this.textarea.selectionStart;
        const text = this.textarea.value;
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const line = text.substring(lineStart, start);
        const indentMatch = line.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        
        // 检查当前行是否以某些关键词结尾，需要增加缩进
        const shouldIndent = /(CREATE|INSERT|UPDATE|DELETE|SELECT|FROM|WHERE|JOIN|GROUP|ORDER|HAVING|SET|VALUES|CASE|BEGIN|IF|FOR|WHILE)$/i.test(line.trim());
        
        let newLine = '\n' + indent;
        if (shouldIndent) {
            newLine += '    ';
        }
        
        const newText = text.substring(0, start) + newLine + text.substring(start);
        this.textarea.value = newText;
        this.textarea.selectionStart = this.textarea.selectionEnd = start + newLine.length;
    }

    // 设置语法高亮
    setupSyntaxHighlighting() {
        // 创建一个覆盖层用于显示语法高亮
        const overlay = document.createElement('pre');
        overlay.className = 'syntax-highlight-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.padding = window.getComputedStyle(this.textarea).padding;
        overlay.style.fontFamily = window.getComputedStyle(this.textarea).fontFamily;
        overlay.style.fontSize = window.getComputedStyle(this.textarea).fontSize;
        overlay.style.lineHeight = window.getComputedStyle(this.textarea).lineHeight;
        overlay.style.whiteSpace = 'pre-wrap';
        overlay.style.wordWrap = 'break-word';
        overlay.style.border = 'none';
        overlay.style.background = 'transparent';
        
        // 为 textarea 添加相对定位
        this.textarea.style.position = 'relative';
        this.textarea.style.zIndex = '1';
        this.textarea.style.background = 'transparent';
        
        // 将覆盖层添加到 textarea 的父容器
        this.textarea.parentNode.style.position = 'relative';
        this.textarea.parentNode.appendChild(overlay);
        
        this.overlay = overlay;
        this.highlightSyntax();
    }

    // 语法高亮
    highlightSyntax() {
        if (!this.overlay) return;
        
        let text = this.textarea.value;
        
        // 转义 HTML 特殊字符
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // 关键字高亮
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
            'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
            'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
            'TABLE', 'DATABASE', 'VIEW', 'INDEX', 'TRIGGER', 'PROCEDURE',
            'FUNCTION', 'IF', 'ELSE', 'CASE', 'WHEN', 'THEN', 'END',
            'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL',
            'AS', 'ON', 'USING', 'VALUES', 'SET', 'DISTINCT', 'ALL'
        ];
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
            text = text.replace(regex, '<span class="keyword">$1</span>');
        });
        
        // 字符串高亮
        text = text.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
        text = text.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');
        
        // 数字高亮
        text = text.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
        
        // 注释高亮
        text = text.replace(/--(.*)/g, '<span class="comment">--$1</span>');
        text = text.replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>');
        
        this.overlay.innerHTML = text;
    }

    // 格式化 SQL
    formatSQL() {
        let sql = this.textarea.value.trim();
        if (!sql) return;
        
        // 简单的 SQL 格式化
        sql = sql
            .replace(/CREATE TABLE/g, '\nCREATE TABLE')
            .replace(/SELECT/g, '\nSELECT')
            .replace(/FROM/g, '\nFROM')
            .replace(/WHERE/g, '\nWHERE')
            .replace(/JOIN/g, '\nJOIN')
            .replace(/GROUP BY/g, '\nGROUP BY')
            .replace(/ORDER BY/g, '\nORDER BY')
            .replace(/LIMIT/g, '\nLIMIT')
            .replace(/INSERT INTO/g, '\nINSERT INTO')
            .replace(/UPDATE/g, '\nUPDATE')
            .replace(/DELETE FROM/g, '\nDELETE FROM')
            .replace(/SET/g, '\nSET')
            .replace(/VALUES/g, '\nVALUES')
            .replace(/ON/g, '\nON')
            .replace(/AS/g, ' AS ');
        
        // 缩进处理
        const lines = sql.split('\n');
        let indentLevel = 0;
        const indentedLines = lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.endsWith(';')) {
                indentLevel = 0;
                return ' '.repeat(indentLevel * 4) + trimmedLine;
            } else if (trimmedLine.endsWith('(') || 
                       trimmedLine.match(/(CREATE|INSERT|UPDATE|DELETE|SELECT|FROM|WHERE|JOIN|GROUP|ORDER|HAVING|SET|VALUES|CASE|BEGIN|IF|FOR|WHILE)$/i)) {
                const result = ' '.repeat(indentLevel * 4) + trimmedLine;
                indentLevel++;
                return result;
            } else if (trimmedLine.startsWith(')') || 
                       trimmedLine.match(/^(END|ELSE)$/i)) {
                indentLevel--;
                return ' '.repeat(indentLevel * 4) + trimmedLine;
            } else {
                return ' '.repeat(indentLevel * 4) + trimmedLine;
            }
        });
        
        this.textarea.value = indentedLines.join('\n');
        this.highlightSyntax();
    }

    // 获取编辑器内容
    getValue() {
        return this.textarea.value;
    }

    // 设置编辑器内容
    setValue(value) {
        this.textarea.value = value;
        this.highlightSyntax();
    }

    // 清空编辑器
    clear() {
        this.textarea.value = '';
        this.highlightSyntax();
    }
}

// 导出类
export default SQLEditor;