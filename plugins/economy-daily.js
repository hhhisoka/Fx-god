const { formatTime, formatCurrency } = require('../lib/functions');
const { getUser, addCoins, addExp } = require('../lib/database');

module.exports = {
    command: ['daily', 'claim', 'reward'],
    description: 'Claim your daily reward',
    example: '.daily',
    tags: ['economy'],

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            
            // Check if user is registered
            if (!user.registered) {
                return m.reply('❌ You need to register first! Use: .register <name>');
            }

            const now = Date.now();
            const lastDaily = user.lastDaily || 0;
            const dailyCooldown = 24 * 60 * 60 * 1000; // 24 hours
            const timeLeft = (lastDaily + dailyCooldown) - now;

            if (timeLeft > 0) {
                return m.reply(`⏰ You've already claimed your daily reward!\n\n🕐 Come back in: ${formatTime(timeLeft)}\n\n💡 Daily rewards reset every 24 hours.`);
            }

            // Calculate rewards
            const baseCoins = global.config.rpg.dailyReward.coins;
            const baseExp = global.config.rpg.dailyReward.exp;
            
            // Level bonus (5% per level)
            const levelBonus = user.level * 0.05;
            const totalCoins = Math.floor(baseCoins * (1 + levelBonus));
            const totalExp = Math.floor(baseExp * (1 + levelBonus));
            
            // Streak bonus calculation
            const daysPassed = Math.floor((now - lastDaily) / dailyCooldown);
            let streak = user.dailyStreak || 0;
            
            if (daysPassed === 1) {
                // Consecutive day
                streak++;
            } else if (daysPassed > 1) {
                // Streak broken
                streak = 1;
            } else {
                // Same day (shouldn't happen due to cooldown check)
                streak = 1;
            }
            
            user.dailyStreak = streak;
            
            // Streak bonus (10% per day, max 100%)
            const streakBonus = Math.min(streak * 0.1, 1.0);
            const streakCoins = Math.floor(totalCoins * streakBonus);
            const streakExp = Math.floor(totalExp * streakBonus);
            
            const finalCoins = totalCoins + streakCoins;
            const finalExp = totalExp + streakExp;

            // Give rewards
            addCoins(m.sender, finalCoins);
            const leveledUp = addExp(m.sender, finalExp);
            user.lastDaily = now;

            // Prepare reward text
            let rewardText = `🎁 *Daily Reward Claimed!*\n\n`;
            rewardText += `💰 *Base Reward:* ${formatCurrency(baseCoins)}\n`;
            
            if (levelBonus > 0) {
                rewardText += `📈 *Level Bonus:* ${formatCurrency(totalCoins - baseCoins)} (+${(levelBonus * 100).toFixed(0)}%)\n`;
            }
            
            if (streakBonus > 0) {
                rewardText += `🔥 *Streak Bonus:* ${formatCurrency(streakCoins)} (+${(streakBonus * 100).toFixed(0)}%)\n`;
            }
            
            rewardText += `\n💎 *Total Received:*\n`;
            rewardText += `💰 ${formatCurrency(finalCoins)}\n`;
            rewardText += `⭐ ${finalExp} EXP\n\n`;
            
            rewardText += `🔥 *Daily Streak:* ${streak} day${streak > 1 ? 's' : ''}\n`;
            rewardText += `💳 *New Balance:* ${formatCurrency(user.coins)}\n`;
            
            if (leveledUp) {
                rewardText += `\n🎊 *LEVEL UP!* You are now level ${user.level}!`;
            }
            
            rewardText += `\n\n⏰ Next reward available in 24 hours`;

            await m.reply(rewardText);

        } catch (error) {
            console.error('Error in daily command:', error);
            await m.reply('❌ Error claiming daily reward!');
        }
    }
};
