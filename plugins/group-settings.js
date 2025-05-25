const { getGroup, updateGroup } = require('../lib/database');

module.exports = {
    command: ['groupsettings', 'gsettings', 'groupconfig'],
    description: 'Configure group bot settings',
    example: '.groupsettings welcome on',
    tags: ['group'],
    group: true,
    admin: true,

    handler: async (conn, m) => {
        try {
            const args = m.text.split(' ');
            const setting = args[0]?.toLowerCase();
            const value = args[1]?.toLowerCase();

            const groupData = getGroup(m.chat);

            if (!setting) {
                // Show current settings
                let settingsText = `⚙️ *Group Bot Settings*\n\n`;
                settingsText += `👋 *Welcome Messages:* ${groupData.welcome ? '✅ ON' : '❌ OFF'}\n`;
                settingsText += `🔗 *Anti-Link:* ${groupData.antilink ? '✅ ON' : '❌ OFF'}\n`;
                settingsText += `🚫 *Anti-Spam:* ${groupData.antispam ? '✅ ON' : '❌ OFF'}\n`;
                settingsText += `💰 *Economy System:* ${groupData.economy ? '✅ ON' : '❌ OFF'}\n`;
                settingsText += `🎮 *RPG System:* ${groupData.rpg ? '✅ ON' : '❌ OFF'}\n`;
                settingsText += `🔞 *NSFW Content:* ${groupData.nsfw ? '✅ ON' : '❌ OFF'}\n`;
                settingsText += `🔇 *Bot Muted:* ${groupData.mute ? '✅ YES' : '❌ NO'}\n\n`;
                
                settingsText += `🛠️ *Usage:*\n`;
                settingsText += `• \`.gsettings welcome on/off\`\n`;
                settingsText += `• \`.gsettings antilink on/off\`\n`;
                settingsText += `• \`.gsettings antispam on/off\`\n`;
                settingsText += `• \`.gsettings economy on/off\`\n`;
                settingsText += `• \`.gsettings rpg on/off\`\n`;
                settingsText += `• \`.gsettings nsfw on/off\`\n`;
                settingsText += `• \`.gsettings mute on/off\``;
                
                return m.reply(settingsText);
            }

            if (!value || !['on', 'off', 'enable', 'disable', 'true', 'false', '1', '0'].includes(value)) {
                return m.reply(`❌ Please specify on/off for the setting!\n\n📝 Example: \`.gsettings ${setting} on\``);
            }

            const enable = ['on', 'enable', 'true', '1'].includes(value);

            // Apply setting changes
            switch (setting) {
                case 'welcome':
                case 'wel':
                    groupData.welcome = enable;
                    await m.reply(`${enable ? '✅' : '❌'} Welcome messages ${enable ? 'enabled' : 'disabled'}!`);
                    break;

                case 'antilink':
                case 'link':
                    groupData.antilink = enable;
                    await m.reply(`${enable ? '✅' : '❌'} Anti-link protection ${enable ? 'enabled' : 'disabled'}!${enable ? '\n\n⚠️ Links will be automatically deleted.' : ''}`);
                    break;

                case 'antispam':
                case 'spam':
                    groupData.antispam = enable;
                    await m.reply(`${enable ? '✅' : '❌'} Anti-spam protection ${enable ? 'enabled' : 'disabled'}!${enable ? '\n\n⚠️ Spam messages will be detected and deleted.' : ''}`);
                    break;

                case 'economy':
                case 'eco':
                    groupData.economy = enable;
                    await m.reply(`${enable ? '✅' : '❌'} Economy system ${enable ? 'enabled' : 'disabled'}!${enable ? '\n\n💰 Users can now earn and spend coins in this group.' : ''}`);
                    break;

                case 'rpg':
                case 'game':
                    groupData.rpg = enable;
                    await m.reply(`${enable ? '✅' : '❌'} RPG system ${enable ? 'enabled' : 'disabled'}!${enable ? '\n\n🎮 Users can now play RPG games in this group.' : ''}`);
                    break;

                case 'nsfw':
                case 'adult':
                    groupData.nsfw = enable;
                    await m.reply(`${enable ? '✅' : '❌'} NSFW content ${enable ? 'enabled' : 'disabled'}!${enable ? '\n\n🔞 Adult content commands are now available.' : '\n\n🔒 Adult content commands are now restricted.'}`);
                    break;

                case 'mute':
                case 'silent':
                    groupData.mute = enable;
                    await m.reply(`${enable ? '🔇' : '🔊'} Bot ${enable ? 'muted' : 'unmuted'} in this group!${enable ? '\n\n🤫 Bot will not respond to commands except for admins.' : '\n\n📢 Bot is now active for all members.'}`);
                    break;

                default:
                    return m.reply(`❌ Unknown setting: "${setting}"\n\n⚙️ Available settings:\n• welcome\n• antilink\n• antispam\n• economy\n• rpg\n• nsfw\n• mute`);
            }

            // Save changes to database
            updateGroup(m.chat, groupData);

        } catch (error) {
            console.error('Error in groupsettings command:', error);
            await m.reply('❌ Error updating group settings!');
        }
    }
};
