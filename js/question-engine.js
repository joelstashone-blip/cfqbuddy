// Enhanced Question Engine - Real 309A/306A Content
class QuestionEngine {
    constructor() {
        this.questionPools = null;
        this.currentTrade = '309A';
        this.loadQuestions();
    }
    
    async loadQuestions() {
        try {
            const response = await fetch('data/complete-question-pools.json');
            this.questionPools = await response.json();
            console.log(`Loaded complete question pools:`);
            Object.keys(this.questionPools).forEach(trade => {
                console.log(`  ${trade}: ${this.questionPools[trade].length} questions`);
            });
        } catch (error) {
            console.error('Failed to load questions:', error);
            this.questionPools = this.getFallbackQuestions();
        }
    }
    
    setTrade(trade) {
        this.currentTrade = trade;
    }
    
    getQuestionsForDaily() {
        return this.selectQuestions(5, 'mixed');
    }
    
    getQuestionsForWeekly() {
        return this.selectQuestions(20, 'mixed');
    }
    
    selectQuestions(count, difficultyMix = 'mixed') {
        if (!this.questionPools || !this.questionPools[this.currentTrade]) {
            return this.getFallbackQuestions()[this.currentTrade] || [];
        }
        
        const pool = this.questionPools[this.currentTrade];
        const selected = [];
        
        // Difficulty distribution for mixed selection
        const difficulties = {
            'easy': Math.floor(count * 0.3),
            'medium': Math.floor(count * 0.5), 
            'hard': Math.floor(count * 0.2)
        };
        
        // Group questions by difficulty
        const byDifficulty = {
            easy: pool.filter(q => q.difficulty === 'easy'),
            medium: pool.filter(q => q.difficulty === 'medium'),
            hard: pool.filter(q => q.difficulty === 'hard')
        };
        
        // Select from each difficulty level
        for (const [diff, targetCount] of Object.entries(difficulties)) {
            const available = byDifficulty[diff] || [];
            const shuffled = [...available].sort(() => 0.5 - Math.random());
            selected.push(...shuffled.slice(0, targetCount));
        }
        
        // Fill remaining spots with random questions
        const remaining = count - selected.length;
        if (remaining > 0) {
            const allRemaining = pool.filter(q => !selected.includes(q));
            const shuffled = allRemaining.sort(() => 0.5 - Math.random());
            selected.push(...shuffled.slice(0, remaining));
        }
        
        return selected.slice(0, count).sort(() => 0.5 - Math.random());
    }
    
    getQuestionsBySection(section, count = 10) {
        if (!this.questionPools) return [];
        
        const pool = this.questionPools[this.currentTrade] || [];
        const sectionQuestions = pool.filter(q => 
            q.section.toLowerCase().includes(section.toLowerCase())
        );
        
        return sectionQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
    }
    
    getAvailableSections() {
        if (!this.questionPools) return [];
        
        const pool = this.questionPools[this.currentTrade] || [];
        const sections = [...new Set(pool.map(q => q.section))];
        return sections.sort();
    }
    
    getStats() {
        if (!this.questionPools) return { total: 0, sections: 0, trades: 0 };
        
        return {
            total: Object.values(this.questionPools).reduce((sum, pool) => sum + pool.length, 0),
            sections: this.getAvailableSections().length,
            trades: Object.keys(this.questionPools).length,
            currentTrade: this.currentTrade,
            currentTradeTotal: this.questionPools[this.currentTrade]?.length || 0
        };
    }
    
    getFallbackQuestions() {
        return {
            '309A': [
                {
                    id: 1,
                    trade: '309A',
                    section: 'Motor Controls',
                    difficulty: 'medium',
                    text: "What is the maximum voltage for a residential lighting circuit?",
                    options: ["120V", "240V", "347V", "600V"],
                    correct: 0,
                    explanation: "Residential lighting circuits are limited to 120V under the CEC.",
                    reference: "CEC Rule 30-302"
                }
            ],
            '306A': [
                {
                    id: 1,
                    trade: '306A', 
                    section: 'Drainage Systems',
                    difficulty: 'medium',
                    text: "What is the minimum pipe size for a building drain?",
                    options: ["2 inches", "3 inches", "4 inches", "6 inches"],
                    correct: 1,
                    explanation: "Building drains must be minimum 3 inches under NPC 2025.",
                    reference: "NPC 7.4.2.1"
                }
            ]
        };
    }
}

// Enhanced Gamification with Real Content
class EnhancedGamification extends Gamification {
    constructor() {
        super();
        this.questionEngine = new QuestionEngine();
        this.currentTrade = '309A';
    }
    
    setTrade(trade) {
        this.currentTrade = trade;
        this.questionEngine.setTrade(trade);
        this.save();
    }
    
    getDailyQuestions() {
        return this.questionEngine.getQuestionsForDaily();
    }
    
    getWeeklyQuestions() {
        return this.questionEngine.getQuestionsForWeekly();
    }
    
    completeDaily(correct, total) {
        const result = super.completeDaily(correct, total);
        
        // Trade-specific bonuses
        const accuracy = (correct / total) * 100;
        if (accuracy >= 80) {
            result.tradeBonus = 5;
            this.data.points += 5;
        }
        
        this.save();
        return result;
    }
    
    getTradeProgress() {
        const stats = this.questionEngine.getStats();
        return {
            currentTrade: this.currentTrade,
            totalQuestions: stats.currentTradeTotal,
            sections: this.questionEngine.getAvailableSections(),
            progress: this.data.questionsAnswered || 0
        };
    }
}