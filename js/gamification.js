// Core Gamification Engine
class Gamification {
    constructor() {
        this.data = this.loadProgress();
        this.initSchedule();
    }

    loadProgress() {
        const saved = localStorage.getItem('redSealProgress');
        return saved ? JSON.parse(saved) : {
            currentStreak: 0,
            longestStreak: 0,
            totalPoints: 0,
            level: 1,
            dailyCompleted: false,
            weeklyCompleted: false,
            lastDailyDate: null,
            lastWeeklyDate: null,
            achievements: [],
            questionsAnswered: 0,
            correctAnswers: 0
        };
    }

    saveProgress() {
        localStorage.setItem('redSealProgress', JSON.stringify(this.data));
    }

    initSchedule() {
        const now = new Date();
        const today = now.toDateString();
        
        // Reset daily if new day
        if (this.data.lastDailyDate !== today) {
            this.data.dailyCompleted = false;
            this.data.dailyCount = 0;
        }

        // Reset weekly on Sunday
        if (now.getDay() === 0) {
            this.data.weeklyCompleted = false;
        }
    }

    canPlayDaily() {
        const now = new Date();
        const day = now.getDay();
        return day >= 1 && day <= 5 && !this.data.dailyCompleted; // Mon-Fri
    }

    canPlayWeekly() {
        const now = new Date();
        return now.getDay() === 6 && !this.data.weeklyCompleted; // Saturday
    }

    completeDaily(correct, total) {
        const now = new Date();
        this.data.dailyCompleted = true;
        this.data.lastDailyDate = now.toDateString();
        
        // Update streak
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (this.data.lastDailyDate === yesterday.toDateString() || this.data.currentStreak === 0) {
            this.data.currentStreak++;
        } else {
            this.data.currentStreak = 1;
        }
        
        this.data.longestStreak = Math.max(this.data.longestStreak, this.data.currentStreak);
        
        // Award points
        const basePoints = 10;
        const streakBonus = this.data.currentStreak * 2;
        const accuracyBonus = Math.floor((correct / total) * 10);
        const points = basePoints + streakBonus + accuracyBonus;
        
        this.data.totalPoints += points;
        this.data.questionsAnswered += total;
        this.data.correctAnswers += correct;
        
        // Level up
        const newLevel = Math.floor(this.data.totalPoints / 100) + 1;
        if (newLevel > this.data.level) {
            this.data.level = newLevel;
            this.checkAchievements();
        }
        
        this.saveProgress();
        return { points, streakBonus, accuracyBonus };
    }

    completeWeekly(correct, total) {
        this.data.weeklyCompleted = true;
        this.data.lastWeeklyDate = new Date().toDateString();
        
        const basePoints = 50;
        const accuracyBonus = Math.floor((correct / total) * 25);
        const points = basePoints + accuracyBonus;
        
        this.data.totalPoints += points;
        this.data.questionsAnswered += total;
        this.data.correctAnswers += correct;
        
        this.saveProgress();
        return { points, accuracyBonus };
    }

    checkAchievements() {
        const newAchievements = [];
        
        // Streak achievements
        if (this.data.currentStreak >= 7 && !this.data.achievements.includes('week_warrior')) {
            newAchievements.push({ id: 'week_warrior', name: 'Week Warrior', desc: '7-day streak!' });
        }
        if (this.data.currentStreak >= 30 && !this.data.achievements.includes('champion')) {
            newAchievements.push({ id: 'champion', name: 'Champion', desc: '30-day streak!' });
        }
        
        // Level achievements
        if (this.data.level >= 5 && !this.data.achievements.includes('apprentice')) {
            newAchievements.push({ id: 'apprentice', name: 'Apprentice', desc: 'Reached level 5!' });
        }
        
        // Accuracy achievements
        const accuracy = this.data.correctAnswers / this.data.questionsAnswered;
        if (accuracy >= 0.9 && this.data.questionsAnswered >= 50 && !this.data.achievements.includes('ace')) {
            newAchievements.push({ id: 'ace', name: 'Ace', desc: '90% accuracy over 50 questions!' });
        }
        
        newAchievements.forEach(achievement => {
            this.data.achievements.push(achievement.id);
        });
        
        return newAchievements;
    }

    getStats() {
        const accuracy = this.data.questionsAnswered > 0 ? 
            Math.round((this.data.correctAnswers / this.data.questionsAnswered) * 100) : 0;
            
        return {
            level: this.data.level,
            points: this.data.totalPoints,
            streak: this.data.currentStreak,
            longestStreak: this.data.longestStreak,
            accuracy: accuracy,
            canDaily: this.canPlayDaily(),
            canWeekly: this.canPlayWeekly(),
            dailyDone: this.data.dailyCompleted,
            weeklyDone: this.data.weeklyCompleted
        };
    }
}

// Initialize gamification
window.gamification = new Gamification();