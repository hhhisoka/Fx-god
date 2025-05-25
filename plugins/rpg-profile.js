const { formatNumber, getProgressBar } = require('../lib/functions');
const { getUser } = require('../lib/database');

module.exports = {
    command: ['profile', 'me', 'stats'],
    description: 'View your RPG profile and stats',
    example: '.profile [@user]',
    tags: ['rpg'],

    handler: async (conn, m) => {
        try {
            // Determine target user
            let target = m.sender;
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            }

            const user = getUser(target);
            const isOwnProfile = target === m.sender;

            // Check if user is registered
            if (!user.registered) {
                if (isOwnProfile) {
                    return m.reply('❌ You need to register first! Use: .register <name>');
                } else {
                    return m.reply('❌ That user is not registered yet!');
                }
            }

            // Calculate level progression
            const currentLevelExp = user.level * 1000;
            const nextLevelExp = (user.level + 1) * 1000;
            const expProgress = (user.exp / nextLevelExp) * 100;
            const expBar = getProgressBar(user.exp, nextLevelExp, 10);

            // Calculate total stats with equipment
            let totalStrength = user.strength;
            let totalDefense = user.defense;
            let totalAgility = user.agility;
            let totalIntelligence = user.intelligence;

            // Add equipment bonuses
            if (user.equipment.weapon) {
                const weapon = global.db.rpg.items[user.equipment.weapon];
                if (weapon && weapon.damage) {
                    totalStrength += weapon.damage;
                }
            }

            if (user.equipment.armor) {
                const armor = global.db.rpg.items[user.equipment.armor];
                if (armor && armor.defense) {
                    totalDefense += armor.defense;
                }
            }

            // Create profile text
            let profileText = `
╭─────[ 👤 *PROFILE* ]─────
│ 🏷️ Name: ${user.name}
│ 🆔 Level: ${user.level}
│ ⭐ EXP: ${formatNumber(user.exp)}/${formatNumber(nextLevelExp)}
│ 📊 Progress: ${expBar} ${expProgress.toFixed(1)}%
│ 💰 Coins: ${formatNumber(user.coins)}
╰──────────────────────────

╭─────[ ❤️ *HEALTH & ENERGY* ]─────
│ ❤️ Health: ${user.health}/100
│ 💙 Mana: ${user.mana}/${50 + (user.level * 5)}
│ ⚡ Energy: ${user.energy}/100
╰──────────────────────────

╭─────[ 💪 *STATS* ]─────
│ ⚔️ Strength: ${totalStrength}${user.equipment.weapon ? ` (+${totalStrength - user.strength})` : ''}
│ 🛡️ Defense: ${totalDefense}${user.equipment.armor ? ` (+${totalDefense - user.defense})` : ''}
│ 💨 Agility: ${totalAgility}
│ 🧠 Intelligence: ${totalIntelligence}
╰──────────────────────────

╭─────[ 🎒 *EQUIPMENT* ]─────
│ 🗡️ Weapon: ${user.equipment.weapon ? global.db.rpg.items[user.equipment.weapon]?.name || 'Unknown' : 'None'}
│ 🛡️ Armor: ${user.equipment.armor ? global.db.rpg.items[user.equipment.armor]?.name || 'Unknown' : 'None'}
│ 💍 Accessory: ${user.equipment.accessory ? global.db.rpg.items[user.equipment.accessory]?.name || 'Unknown' : 'None'}
╰──────────────────────────

╭─────[ 📊 *STATISTICS* ]─────
│ 🏆 Quests Completed: ${user.stats.questsCompleted}
│ ⚔️ Battles Won: ${user.stats.battlesWon}
│ 💀 Battles Lost: ${user.stats.battlesLost}
│ 🎯 Win Rate: ${user.stats.battlesWon + user.stats.battlesLost > 0 ? ((user.stats.battlesWon / (user.stats.battlesWon + user.stats.battlesLost)) * 100).toFixed(1) : 0}%
│ 💊 Items Used: ${user.stats.itemsUsed}
│ 💸 Coins Spent: ${formatNumber(user.stats.coinsSpent)}
│ 💰 Coins Earned: ${formatNumber(user.stats.coinsEarned)}
╰──────────────────────────

╭─────[ 👹 *MONSTERS KILLED* ]─────`;

            // Show monster kill stats
            const monsterKills = Object.entries(user.stats.monstersKilled || {});
            if (monsterKills.length > 0) {
                monsterKills.slice(0, 5).forEach(([monster, count]) => {
                    const monsterData = global.db.rpg.monsters[monster];
                    const name = monsterData ? monsterData.name : monster;
                    profileText += `\n│ ${name}: ${count}`;
                });
                
                if (monsterKills.length > 5) {
                    profileText += `\n│ ... and ${monsterKills.length - 5} more`;
                }
            } else {
                profileText += '\n│ No monsters killed yet';
            }

            profileText += '\n╰──────────────────────────';

            // Show achievements
            if (user.achievements && user.achievements.length > 0) {
                profileText += '\n\n╭─────[ 🏅 *ACHIEVEMENTS* ]─────';
                user.achievements.slice(0, 3).forEach(achievement => {
                    profileText += `\n│ 🏅 ${achievement}`;
                });
                if (user.achievements.length > 3) {
                    profileText += `\n│ ... and ${user.achievements.length - 3} more`;
                }
                profileText += '\n╰──────────────────────────';
            }

            // Show registration date
            if (user.joinedAt) {
                const joinDate = new Date(user.joinedAt).toLocaleDateString();
                profileText += `\n\n📅 Joined: ${joinDate}`;
            }

            if (user.premium && user.premiumTime > Date.now()) {
                const premiumEnd = new Date(user.premiumTime).toLocaleDateString();
                profileText += `\n👑 Premium until: ${premiumEnd}`;
            }

            await m.reply(profileText.trim());

        } catch (error) {
            console.error('Error in profile command:', error);
            await m.reply('❌ Error displaying profile!');
        }
    }
};
