const { formatTime, formatCurrency, random, pickRandom } = require('../lib/functions');
const { getUser, addCoins, addExp } = require('../lib/database');

module.exports = {
    command: ['work', 'job'],
    description: 'Work to earn coins',
    example: '.work',
    tags: ['economy'],

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            
            // Check if user is registered
            if (!user.registered) {
                return m.reply('❌ You need to register first! Use: .register <name>');
            }

            const now = Date.now();
            const lastWork = user.lastWork || 0;
            const workCooldown = global.config.rpg.workReward.cooldown; // 1 hour
            const timeLeft = (lastWork + workCooldown) - now;

            if (timeLeft > 0) {
                return m.reply(`⏰ You're tired from your last job!\n\n🕐 You can work again in: ${formatTime(timeLeft)}\n\n💡 Work cooldown is 1 hour.`);
            }

            // Check energy
            if (user.energy < 25) {
                return m.reply('⚡ You don\'t have enough energy to work! You need at least 25 energy.\n\n💡 Rest or use energy potions to restore energy.');
            }

            // Consume energy
            user.energy -= 25;

            // Work scenarios
            const workScenarios = [
                {
                    job: 'Pizza Delivery',
                    description: 'delivered pizzas around town',
                    emoji: '🍕',
                    minPay: 80,
                    maxPay: 150
                },
                {
                    job: 'Freelance Programming',
                    description: 'wrote code for a client',
                    emoji: '💻',
                    minPay: 200,
                    maxPay: 400
                },
                {
                    job: 'Dog Walking',
                    description: 'walked dogs in the park',
                    emoji: '🐕',
                    minPay: 50,
                    maxPay: 120
                },
                {
                    job: 'Grocery Shopping',
                    description: 'helped customers with grocery shopping',
                    emoji: '🛒',
                    minPay: 60,
                    maxPay: 140
                },
                {
                    job: 'Garden Maintenance',
                    description: 'maintained beautiful gardens',
                    emoji: '🌿',
                    minPay: 90,
                    maxPay: 180
                },
                {
                    job: 'Taxi Driving',
                    description: 'drove passengers safely to their destinations',
                    emoji: '🚕',
                    minPay: 100,
                    maxPay: 200
                },
                {
                    job: 'Content Creation',
                    description: 'created engaging content for social media',
                    emoji: '📱',
                    minPay: 150,
                    maxPay: 300
                },
                {
                    job: 'Tutoring',
                    description: 'taught students various subjects',
                    emoji: '📚',
                    minPay: 120,
                    maxPay: 250
                },
                {
                    job: 'Food Truck Service',
                    description: 'served delicious food from a food truck',
                    emoji: '🚚',
                    minPay: 110,
                    maxPay: 220
                },
                {
                    job: 'Cleaning Service',
                    description: 'cleaned offices and homes',
                    emoji: '🧹',
                    minPay: 70,
                    maxPay: 160
                }
            ];

            // Select random work scenario
            const scenario = pickRandom(workScenarios);
            
            // Calculate earnings based on level
            const baseMin = scenario.minPay;
            const baseMax = scenario.maxPay;
            const levelBonus = user.level * 0.1; // 10% bonus per level
            
            const minEarnings = Math.floor(baseMin * (1 + levelBonus));
            const maxEarnings = Math.floor(baseMax * (1 + levelBonus));
            
            const earnings = random(minEarnings, maxEarnings);
            const expGain = Math.floor(earnings / 10); // 1 EXP per 10 coins earned

            // Random work outcome
            const outcomes = [
                { type: 'success', chance: 70, multiplier: 1.0 },
                { type: 'excellent', chance: 20, multiplier: 1.5 },
                { type: 'poor', chance: 10, multiplier: 0.7 }
            ];

            let roll = random(1, 100);
            let outcome = null;
            
            for (const o of outcomes) {
                if (roll <= o.chance) {
                    outcome = o;
                    break;
                }
                roll -= o.chance;
            }

            const finalEarnings = Math.floor(earnings * outcome.multiplier);
            const finalExp = Math.floor(expGain * outcome.multiplier);

            // Give rewards
            addCoins(m.sender, finalEarnings);
            const leveledUp = addExp(m.sender, finalExp);
            user.lastWork = now;

            // Prepare work result text
            let workText = `💼 *Work Complete!*\n\n`;
            workText += `${scenario.emoji} *Job:* ${scenario.job}\n`;
            workText += `📝 *Task:* You ${scenario.description}\n\n`;

            // Outcome description
            if (outcome.type === 'excellent') {
                workText += `🌟 *Excellent Performance!* Your employer was very impressed!\n`;
            } else if (outcome.type === 'poor') {
                workText += `😐 *Average Performance.* You completed the job but could do better.\n`;
            } else {
                workText += `✅ *Good Job!* You completed the work successfully.\n`;
            }

            workText += `\n💰 *Earned:* ${formatCurrency(finalEarnings)}\n`;
            workText += `⭐ *EXP:* +${finalExp}\n`;
            workText += `⚡ *Energy:* -25 (${user.energy}/100)\n`;
            workText += `💳 *Balance:* ${formatCurrency(user.coins)}\n`;

            if (leveledUp) {
                workText += `\n🎊 *LEVEL UP!* You are now level ${user.level}!`;
            }

            workText += `\n\n⏰ You can work again in 1 hour`;

            await m.reply(workText);

        } catch (error) {
            console.error('Error in work command:', error);
            await m.reply('❌ Error processing work request!');
        }
    }
};
