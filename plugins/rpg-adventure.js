const { random, pickRandom, formatTime, checkCooldown, calculateDamage } = require('../lib/functions');
const { addExp, addCoins, addItem, getUser } = require('../lib/database');

module.exports = {
    command: ['adventure', 'explore', 'hunt'],
    description: 'Go on an adventure to find monsters and treasures',
    example: '.adventure',
    tags: ['rpg'],
    cooldown: 300000, // 5 minutes

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            
            // Check if user is registered
            if (!user.registered) {
                return m.reply('❌ You need to register first! Use: .register <name>');
            }

            // Check cooldown
            const cooldown = checkCooldown(m.sender, 'adventure', this.cooldown);
            if (cooldown.onCooldown) {
                return m.reply(`⏰ You're tired! Wait ${formatTime(cooldown.timeLeft)} before your next adventure.`);
            }

            // Check energy
            if (user.energy < 20) {
                return m.reply('⚡ Not enough energy! You need at least 20 energy for an adventure.');
            }

            // Consume energy
            user.energy -= 20;

            // Adventure outcomes
            const outcomes = [
                { type: 'monster', chance: 40 },
                { type: 'treasure', chance: 30 },
                { type: 'nothing', chance: 20 },
                { type: 'trap', chance: 10 }
            ];

            // Determine outcome
            let roll = random(1, 100);
            let outcome = null;
            
            for (const o of outcomes) {
                if (roll <= o.chance) {
                    outcome = o.type;
                    break;
                }
                roll -= o.chance;
            }

            let resultText = '🏕️ *Adventure Results:*\n\n';

            switch (outcome) {
                case 'monster':
                    // Encounter a monster
                    const monsters = Object.keys(global.db.rpg.monsters);
                    const suitableMonsters = monsters.filter(m => {
                        const monster = global.db.rpg.monsters[m];
                        return monster.level <= user.level + 2;
                    });
                    
                    const monsterKey = pickRandom(suitableMonsters);
                    const monster = global.db.rpg.monsters[monsterKey];
                    
                    // Simple battle calculation
                    const playerDamage = calculateDamage(user, monster);
                    const monsterDamage = calculateDamage(monster, user);
                    
                    if (playerDamage > monsterDamage) {
                        // Victory
                        const expGain = monster.exp + random(0, 10);
                        const coinGain = monster.coins + random(0, 20);
                        
                        addExp(m.sender, expGain);
                        addCoins(m.sender, coinGain);
                        
                        // Update stats
                        user.stats.monstersKilled[monsterKey] = (user.stats.monstersKilled[monsterKey] || 0) + 1;
                        user.stats.battlesWon++;
                        
                        // Possible item drop
                        if (monster.drops && monster.drops.length > 0 && random(1, 100) <= 30) {
                            const drop = pickRandom(monster.drops);
                            addItem(m.sender, drop, 1);
                            resultText += `🗡️ You defeated a **${monster.name}**!\n`;
                            resultText += `💰 Gained: ${coinGain} coins\n`;
                            resultText += `⭐ Gained: ${expGain} EXP\n`;
                            resultText += `🎁 Found: ${global.db.rpg.items[drop]?.name || drop}\n`;
                        } else {
                            resultText += `🗡️ You defeated a **${monster.name}**!\n`;
                            resultText += `💰 Gained: ${coinGain} coins\n`;
                            resultText += `⭐ Gained: ${expGain} EXP\n`;
                        }
                    } else {
                        // Defeat
                        const healthLoss = Math.min(monsterDamage, user.health - 1);
                        user.health -= healthLoss;
                        user.stats.battlesLost++;
                        
                        resultText += `💀 You were defeated by a **${monster.name}**!\n`;
                        resultText += `❤️ Lost: ${healthLoss} health\n`;
                        resultText += `💡 Tip: Level up or get better equipment!`;
                    }
                    break;

                case 'treasure':
                    // Find treasure
                    const treasureTypes = [
                        { type: 'coins', min: 50, max: 200 },
                        { type: 'exp', min: 25, max: 100 },
                        { type: 'item', items: ['health_potion', 'mana_potion'] }
                    ];
                    
                    const treasure = pickRandom(treasureTypes);
                    
                    if (treasure.type === 'coins') {
                        const amount = random(treasure.min, treasure.max);
                        addCoins(m.sender, amount);
                        resultText += `💰 You found a treasure chest!\n`;
                        resultText += `🪙 Gained: ${amount} coins`;
                    } else if (treasure.type === 'exp') {
                        const amount = random(treasure.min, treasure.max);
                        addExp(m.sender, amount);
                        resultText += `📚 You found an ancient scroll!\n`;
                        resultText += `⭐ Gained: ${amount} EXP`;
                    } else if (treasure.type === 'item') {
                        const item = pickRandom(treasure.items);
                        addItem(m.sender, item, 1);
                        resultText += `🎁 You found a mysterious box!\n`;
                        resultText += `📦 Found: ${global.db.rpg.items[item]?.name || item}`;
                    }
                    break;

                case 'trap':
                    // Fall into trap
                    const damage = random(10, 25);
                    user.health = Math.max(user.health - damage, 1);
                    
                    resultText += `🕳️ You fell into a trap!\n`;
                    resultText += `❤️ Lost: ${damage} health\n`;
                    resultText += `💡 Be more careful next time!`;
                    break;

                case 'nothing':
                default:
                    // Find nothing
                    const nothingMessages = [
                        '🌲 You explored the forest but found nothing interesting.',
                        '🏔️ You climbed a mountain but only found rocks.',
                        '🏜️ You wandered through the desert but found nothing.',
                        '🌊 You searched by the river but came back empty-handed.',
                        '🕳️ You explored a cave but it was empty.'
                    ];
                    
                    resultText += pickRandom(nothingMessages);
                    break;
            }

            resultText += `\n\n⚡ Energy: ${user.energy}/100`;
            resultText += `\n❤️ Health: ${user.health}/100`;

            await m.reply(resultText);

        } catch (error) {
            console.error('Error in adventure command:', error);
            await m.reply('❌ Error during adventure!');
        }
    }
};
