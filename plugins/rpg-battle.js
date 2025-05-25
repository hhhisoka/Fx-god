const { random, pickRandom, formatTime, checkCooldown, calculateDamage } = require('../lib/functions');
const { addExp, addCoins, addItem, getUser } = require('../lib/database');

module.exports = {
    command: ['battle', 'fight', 'attack'],
    description: 'Battle monsters to gain experience and rewards',
    example: '.battle [monster_name]',
    tags: ['rpg'],
    cooldown: 60000, // 1 minute

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            
            // Check if user is registered
            if (!user.registered) {
                return m.reply('❌ You need to register first! Use: .register <name>');
            }

            // Check cooldown
            const cooldown = checkCooldown(m.sender, 'battle', this.cooldown);
            if (cooldown.onCooldown) {
                return m.reply(`⏰ You're still recovering! Wait ${formatTime(cooldown.timeLeft)} before your next battle.`);
            }

            // Check health
            if (user.health < 20) {
                return m.reply('❤️ Your health is too low! Use a health potion or rest.');
            }

            // Check energy
            if (user.energy < 10) {
                return m.reply('⚡ Not enough energy! You need at least 10 energy to battle.');
            }

            const monsterName = m.text.toLowerCase();
            let selectedMonster = null;
            let monsterKey = null;

            // If no monster specified, pick a random suitable one
            if (!monsterName) {
                const suitableMonsters = Object.entries(global.db.rpg.monsters).filter(([key, monster]) => {
                    return monster.level <= user.level + 3;
                });
                
                if (suitableMonsters.length === 0) {
                    return m.reply('❌ No suitable monsters found for your level!');
                }
                
                [monsterKey, selectedMonster] = pickRandom(suitableMonsters);
            } else {
                // Find specific monster
                const found = Object.entries(global.db.rpg.monsters).find(([key, monster]) => {
                    return monster.name.toLowerCase().includes(monsterName);
                });
                
                if (!found) {
                    const availableMonsters = Object.values(global.db.rpg.monsters)
                        .map(m => m.name)
                        .join(', ');
                    return m.reply(`❌ Monster not found!\n\n🐲 Available monsters: ${availableMonsters}`);
                }
                
                [monsterKey, selectedMonster] = found;
                
                // Check if monster is too strong
                if (selectedMonster.level > user.level + 5) {
                    return m.reply(`❌ **${selectedMonster.name}** is too strong for you! (Level ${selectedMonster.level})\n\n💡 Try battling weaker monsters first.`);
                }
            }

            // Consume energy
            user.energy -= 10;

            // Initialize battle
            let playerHealth = user.health;
            let monsterHealth = selectedMonster.health;
            let battleLog = [];
            let round = 1;

            battleLog.push(`⚔️ **BATTLE START!**`);
            battleLog.push(`👤 ${user.name} (Level ${user.level}) vs 👹 ${selectedMonster.name} (Level ${selectedMonster.level})`);
            battleLog.push(`❤️ HP: ${playerHealth} vs ${monsterHealth}`);
            battleLog.push('');

            // Battle simulation
            while (playerHealth > 0 && monsterHealth > 0 && round <= 10) {
                battleLog.push(`🔥 **Round ${round}:**`);
                
                // Player attacks first (based on agility)
                const playerFirst = user.agility >= selectedMonster.agility || random(1, 100) <= 60;
                
                if (playerFirst) {
                    // Player attack
                    const playerDamage = calculatePlayerDamage(user);
                    const actualDamage = Math.max(playerDamage - Math.floor(selectedMonster.defense / 2), 1);
                    monsterHealth -= actualDamage;
                    
                    battleLog.push(`⚔️ You attack for ${actualDamage} damage!`);
                    
                    if (monsterHealth <= 0) {
                        battleLog.push(`💀 ${selectedMonster.name} is defeated!`);
                        break;
                    }
                    
                    // Monster counter-attack
                    const monsterDamage = calculateDamage(selectedMonster, user);
                    playerHealth -= monsterDamage;
                    
                    battleLog.push(`👹 ${selectedMonster.name} attacks for ${monsterDamage} damage!`);
                    
                    if (playerHealth <= 0) {
                        battleLog.push(`💀 You have been defeated!`);
                        break;
                    }
                } else {
                    // Monster attacks first
                    const monsterDamage = calculateDamage(selectedMonster, user);
                    playerHealth -= monsterDamage;
                    
                    battleLog.push(`👹 ${selectedMonster.name} attacks for ${monsterDamage} damage!`);
                    
                    if (playerHealth <= 0) {
                        battleLog.push(`💀 You have been defeated!`);
                        break;
                    }
                    
                    // Player counter-attack
                    const playerDamage = calculatePlayerDamage(user);
                    const actualDamage = Math.max(playerDamage - Math.floor(selectedMonster.defense / 2), 1);
                    monsterHealth -= actualDamage;
                    
                    battleLog.push(`⚔️ You attack for ${actualDamage} damage!`);
                    
                    if (monsterHealth <= 0) {
                        battleLog.push(`💀 ${selectedMonster.name} is defeated!`);
                        break;
                    }
                }
                
                battleLog.push(`❤️ HP: ${Math.max(playerHealth, 0)} vs ${Math.max(monsterHealth, 0)}`);
                battleLog.push('');
                round++;
            }

            // Battle results
            battleLog.push('🏁 **BATTLE END!**');
            
            if (playerHealth > 0 && monsterHealth <= 0) {
                // Victory!
                const expGain = selectedMonster.exp + random(0, 20);
                const coinGain = selectedMonster.coins + random(0, 30);
                
                addExp(m.sender, expGain);
                addCoins(m.sender, coinGain);
                
                // Update stats
                user.stats.monstersKilled[monsterKey] = (user.stats.monstersKilled[monsterKey] || 0) + 1;
                user.stats.battlesWon++;
                user.health = Math.max(playerHealth, 1); // Don't let health go to 0
                
                battleLog.push(`🎉 **VICTORY!**`);
                battleLog.push(`💰 Gained: ${coinGain} coins`);
                battleLog.push(`⭐ Gained: ${expGain} EXP`);
                
                // Item drops
                if (selectedMonster.drops && selectedMonster.drops.length > 0) {
                    const dropChance = 25 + (user.level * 2); // Higher level = better drop chance
                    if (random(1, 100) <= dropChance) {
                        const drop = pickRandom(selectedMonster.drops);
                        addItem(m.sender, drop, 1);
                        const itemName = global.db.rpg.items[drop]?.name || drop;
                        battleLog.push(`🎁 **${itemName}** dropped!`);
                    }
                }
                
                // Check for level up
                const requiredExp = user.level * 1000;
                if (user.exp >= requiredExp && user.level < 100) {
                    battleLog.push(`🎊 **LEVEL UP!** You are now level ${user.level + 1}!`);
                }
                
            } else if (round > 10) {
                // Draw
                user.health = Math.max(playerHealth, 1);
                user.stats.battlesLost++;
                
                battleLog.push(`🤝 **DRAW!** The battle lasted too long.`);
                battleLog.push(`💰 Gained: 10 coins (participation reward)`);
                addCoins(m.sender, 10);
                
            } else {
                // Defeat
                user.health = Math.max(playerHealth, 1);
                user.stats.battlesLost++;
                
                battleLog.push(`💀 **DEFEAT!** You were overpowered.`);
                battleLog.push(`💡 Train harder and get better equipment!`);
                
                // Small consolation prize
                if (random(1, 100) <= 20) {
                    addCoins(m.sender, 5);
                    battleLog.push(`💰 Gained: 5 coins (consolation prize)`);
                }
            }

            battleLog.push('');
            battleLog.push(`❤️ Health: ${user.health}/100`);
            battleLog.push(`⚡ Energy: ${user.energy}/100`);

            await m.reply(battleLog.join('\n'));

        } catch (error) {
            console.error('Error in battle command:', error);
            await m.reply('❌ Error during battle!');
        }
    }
};

function calculatePlayerDamage(user) {
    let baseDamage = user.strength;
    
    // Add weapon damage
    if (user.equipment.weapon) {
        const weapon = global.db.rpg.items[user.equipment.weapon];
        if (weapon && weapon.damage) {
            baseDamage += weapon.damage;
        }
    }
    
    // Add random factor
    const randomFactor = random(80, 120) / 100;
    return Math.floor(baseDamage * randomFactor);
}
