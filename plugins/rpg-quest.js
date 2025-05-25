const { formatNumber } = require('../lib/functions');
const { getUser, addExp, addCoins, addItem } = require('../lib/database');

module.exports = {
    command: ['quest', 'quests', 'missions'],
    description: 'View and manage your quests',
    example: '.quest [accept|complete] [quest_name]',
    tags: ['rpg'],

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            
            // Check if user is registered
            if (!user.registered) {
                return m.reply('❌ You need to register first! Use: .register <name>');
            }

            const args = m.text.split(' ');
            const action = args[1]?.toLowerCase();
            const questName = args.slice(2).join(' ').toLowerCase();

            if (action === 'accept' && questName) {
                return await acceptQuest(m, user, questName);
            } else if (action === 'complete' && questName) {
                return await completeQuest(m, user, questName);
            }

            // Show quests
            await showQuests(m, user);

        } catch (error) {
            console.error('Error in quest command:', error);
            await m.reply('❌ Error accessing quests!');
        }
    }
};

async function showQuests(m, user) {
    try {
        let questText = `
╭─────[ 📜 *QUEST BOARD* ]─────
│ 🏆 Completed Quests: ${user.stats.questsCompleted}
│ 📋 Active Quests: ${user.quests.length}
│ 
│ 🎯 Complete quests for rewards!
╰──────────────────────────

╭─────[ 📋 *ACTIVE QUESTS* ]─────`;

        // Show active quests
        if (user.quests.length > 0) {
            user.quests.forEach(userQuest => {
                const quest = global.db.rpg.quests[userQuest.id];
                if (quest) {
                    const progress = userQuest.progress || 0;
                    const target = quest.amount || 1;
                    const percentage = Math.min((progress / target) * 100, 100);
                    const progressBar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
                    
                    questText += `\n│ 🎯 **${quest.name}**`;
                    questText += `\n│   📝 ${quest.description}`;
                    questText += `\n│   📊 Progress: ${progress}/${target}`;
                    questText += `\n│   ${progressBar} ${percentage.toFixed(1)}%`;
                    
                    if (quest.reward) {
                        questText += `\n│   🎁 Rewards:`;
                        if (quest.reward.exp) questText += ` ${quest.reward.exp} EXP`;
                        if (quest.reward.coins) questText += ` ${quest.reward.coins} coins`;
                        if (quest.reward.items) {
                            quest.reward.items.forEach(itemId => {
                                const item = global.db.rpg.items[itemId];
                                questText += ` ${item?.name || itemId}`;
                            });
                        }
                    }
                    
                    if (progress >= target) {
                        questText += `\n│   ✅ **READY TO COMPLETE!**`;
                    }
                    questText += `\n│`;
                }
            });
        } else {
            questText += '\n│ No active quests';
        }

        questText += '\n╰──────────────────────────';
        questText += '\n\n╭─────[ 🆕 *AVAILABLE QUESTS* ]─────';

        // Show available quests
        const availableQuests = Object.entries(global.db.rpg.quests).filter(([questId, quest]) => {
            // Check if quest is not already active
            const isActive = user.quests.some(uq => uq.id === questId);
            if (isActive) return false;
            
            // Check if quest has requirements
            if (quest.requirement) {
                const hasCompleted = user.completedQuests?.includes(quest.requirement);
                return hasCompleted;
            }
            
            return true;
        });

        if (availableQuests.length > 0) {
            availableQuests.slice(0, 5).forEach(([questId, quest]) => {
                questText += `\n│ 📜 **${quest.name}**`;
                questText += `\n│   📝 ${quest.description}`;
                questText += `\n│   🎯 Goal: ${quest.type} ${quest.amount} ${quest.target || ''}`;
                
                if (quest.requirement) {
                    const reqQuest = global.db.rpg.quests[quest.requirement];
                    questText += `\n│   ⚠️ Requires: ${reqQuest?.name || quest.requirement}`;
                }
                
                if (quest.reward) {
                    questText += `\n│   🎁 Rewards:`;
                    if (quest.reward.exp) questText += ` ${quest.reward.exp} EXP`;
                    if (quest.reward.coins) questText += ` ${quest.reward.coins} coins`;
                    if (quest.reward.items) {
                        quest.reward.items.forEach(itemId => {
                            const item = global.db.rpg.items[itemId];
                            questText += ` ${item?.name || itemId}`;
                        });
                    }
                }
                questText += `\n│`;
            });
        } else {
            questText += '\n│ No available quests';
            questText += '\n│ Complete current quests to unlock more!';
        }

        questText += '\n╰──────────────────────────';
        questText += '\n\n💡 **Usage:**';
        questText += `\n• ${global.prefix}quest accept <quest> - Accept quest`;
        questText += `\n• ${global.prefix}quest complete <quest> - Complete quest`;

        await m.reply(questText);

    } catch (error) {
        console.error('Error showing quests:', error);
        await m.reply('❌ Error displaying quests!');
    }
}

async function acceptQuest(m, user, questName) {
    try {
        // Find quest
        const foundQuest = Object.entries(global.db.rpg.quests).find(([id, quest]) => {
            return quest.name.toLowerCase().includes(questName);
        });

        if (!foundQuest) {
            return m.reply('❌ Quest not found!\n\n💡 Use `.quest` to see available quests.');
        }

        const [questId, quest] = foundQuest;

        // Check if already active
        const isActive = user.quests.some(uq => uq.id === questId);
        if (isActive) {
            return m.reply('❌ You already have this quest active!');
        }

        // Check if already completed
        if (user.completedQuests?.includes(questId)) {
            return m.reply('❌ You have already completed this quest!');
        }

        // Check requirements
        if (quest.requirement) {
            const hasCompleted = user.completedQuests?.includes(quest.requirement);
            if (!hasCompleted) {
                const reqQuest = global.db.rpg.quests[quest.requirement];
                return m.reply(`❌ You must complete **${reqQuest?.name || quest.requirement}** first!`);
            }
        }

        // Check quest limit
        if (user.quests.length >= 5) {
            return m.reply('❌ You can only have 5 active quests at a time!\n\n💡 Complete some quests first.');
        }

        // Accept quest
        user.quests.push({
            id: questId,
            progress: 0,
            acceptedAt: Date.now()
        });

        let resultText = `✅ **Quest Accepted!**\n\n`;
        resultText += `📜 **${quest.name}**\n`;
        resultText += `📝 ${quest.description}\n`;
        resultText += `🎯 Goal: ${quest.type} ${quest.amount} ${quest.target || ''}\n\n`;
        
        if (quest.reward) {
            resultText += `🎁 **Rewards:**\n`;
            if (quest.reward.exp) resultText += `⭐ ${quest.reward.exp} EXP\n`;
            if (quest.reward.coins) resultText += `💰 ${quest.reward.coins} coins\n`;
            if (quest.reward.items) {
                quest.reward.items.forEach(itemId => {
                    const item = global.db.rpg.items[itemId];
                    resultText += `📦 ${item?.name || itemId}\n`;
                });
            }
        }

        resultText += '\n💡 Progress is tracked automatically!';

        await m.reply(resultText);

    } catch (error) {
        console.error('Error accepting quest:', error);
        await m.reply('❌ Error accepting quest!');
    }
}

async function completeQuest(m, user, questName) {
    try {
        // Find active quest
        const userQuest = user.quests.find(uq => {
            const quest = global.db.rpg.quests[uq.id];
            return quest && quest.name.toLowerCase().includes(questName);
        });

        if (!userQuest) {
            return m.reply('❌ Active quest not found!\n\n💡 Use `.quest` to see your active quests.');
        }

        const quest = global.db.rpg.quests[userQuest.id];
        const progress = userQuest.progress || 0;
        const target = quest.amount || 1;

        // Check if quest is completed
        if (progress < target) {
            return m.reply(`❌ Quest not completed yet!\n\n📊 Progress: ${progress}/${target}\n💡 Continue working towards your goal!`);
        }

        // Complete quest
        const questIndex = user.quests.findIndex(uq => uq.id === userQuest.id);
        user.quests.splice(questIndex, 1);

        // Add to completed quests
        if (!user.completedQuests) user.completedQuests = [];
        user.completedQuests.push(userQuest.id);
        user.stats.questsCompleted++;

        let resultText = `🎉 **Quest Completed!**\n\n`;
        resultText += `📜 **${quest.name}**\n`;
        resultText += `✅ ${quest.description}\n\n`;
        resultText += `🎁 **Rewards Received:**\n`;

        // Give rewards
        if (quest.reward) {
            if (quest.reward.exp) {
                addExp(m.sender, quest.reward.exp);
                resultText += `⭐ ${quest.reward.exp} EXP\n`;
            }
            
            if (quest.reward.coins) {
                addCoins(m.sender, quest.reward.coins);
                resultText += `💰 ${quest.reward.coins} coins\n`;
            }
            
            if (quest.reward.items) {
                quest.reward.items.forEach(itemId => {
                    addItem(m.sender, itemId, 1);
                    const item = global.db.rpg.items[itemId];
                    resultText += `📦 ${item?.name || itemId}\n`;
                });
            }
        }

        resultText += `\n🏆 Total Quests Completed: ${user.stats.questsCompleted}`;
        resultText += `\n💡 Check for new available quests!`;

        await m.reply(resultText);

    } catch (error) {
        console.error('Error completing quest:', error);
        await m.reply('❌ Error completing quest!');
    }
}

// Auto-update quest progress
function updateQuestProgress(userId, questType, target, amount = 1) {
    try {
        const user = global.db.users[userId];
        if (!user || !user.quests) return;

        user.quests.forEach(userQuest => {
            const quest = global.db.rpg.quests[userQuest.id];
            if (quest && quest.type === questType && quest.target === target) {
                userQuest.progress = (userQuest.progress || 0) + amount;
            }
        });
    } catch (error) {
        console.error('Error updating quest progress:', error);
    }
}

// Export the update function for use in other plugins
module.exports.updateQuestProgress = updateQuestProgress;
