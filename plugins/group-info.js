const { formatNumber } = require('../lib/functions');

module.exports = {
    command: ['groupinfo', 'groupdetails', 'ginfo'],
    description: 'Get detailed group information',
    example: '.groupinfo',
    tags: ['group'],
    group: true,

    handler: async (conn, m) => {
        try {
            // Get group metadata
            const groupMetadata = await conn.groupMetadata(m.chat);
            const groupData = global.db.groups[m.chat];

            let infoText = `🏘️ *Group Information*\n\n`;
            infoText += `📝 *Name:* ${groupMetadata.subject}\n`;
            infoText += `🆔 *ID:* ${m.chat.split('@')[0]}\n`;
            
            if (groupMetadata.desc) {
                const description = groupMetadata.desc.length > 100 
                    ? groupMetadata.desc.substring(0, 100) + '...' 
                    : groupMetadata.desc;
                infoText += `📖 *Description:* ${description}\n`;
            }
            
            infoText += `👥 *Members:* ${formatNumber(groupMetadata.participants.length)}\n`;
            infoText += `📅 *Created:* ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}\n`;
            
            // Count admins
            const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            infoText += `👑 *Admins:* ${formatNumber(admins.length)}\n`;
            
            // Group creator
            const creator = groupMetadata.participants.find(p => p.admin === 'superadmin');
            if (creator) {
                const creatorName = conn.getName(creator.id) || creator.id.split('@')[0];
                infoText += `👨‍💻 *Creator:* ${creatorName}\n`;
            }

            infoText += `\n🤖 *Bot Settings:*\n`;
            if (groupData) {
                infoText += `👋 Welcome: ${groupData.welcome ? '✅' : '❌'}\n`;
                infoText += `🔗 Anti-link: ${groupData.antilink ? '✅' : '❌'}\n`;
                infoText += `🚫 Anti-spam: ${groupData.antispam ? '✅' : '❌'}\n`;
                infoText += `💰 Economy: ${groupData.economy ? '✅' : '❌'}\n`;
                infoText += `🎮 RPG: ${groupData.rpg ? '✅' : '❌'}\n`;
                infoText += `🔇 Muted: ${groupData.mute ? '✅' : '❌'}\n`;
                infoText += `🔞 NSFW: ${groupData.nsfw ? '✅' : '❌'}\n`;
            } else {
                infoText += `⚠️ No bot settings configured`;
            }

            // Group restrictions
            infoText += `\n🛡️ *Group Restrictions:*\n`;
            infoText += `✉️ Send messages: ${groupMetadata.restrict ? '👑 Admins only' : '👥 All members'}\n`;
            infoText += `📝 Edit info: ${groupMetadata.announce ? '👑 Admins only' : '👥 All members'}\n`;

            // Invite link info
            if (m.isAdmin || m.isOwner) {
                try {
                    const inviteCode = await conn.groupInviteCode(m.chat);
                    infoText += `\n🔗 *Invite Link:*\nhttps://chat.whatsapp.com/${inviteCode}`;
                } catch (error) {
                    infoText += `\n🔗 *Invite Link:* Not available`;
                }
            }

            // List admins
            if (admins.length > 0) {
                infoText += `\n\n👑 *Administrators:*\n`;
                admins.forEach((admin, index) => {
                    const adminName = conn.getName(admin.id) || admin.id.split('@')[0];
                    const role = admin.admin === 'superadmin' ? '👨‍💻 Creator' : '👑 Admin';
                    infoText += `${index + 1}. ${adminName} (${role})\n`;
                });
            }

            await m.reply(infoText);

        } catch (error) {
            console.error('Error in groupinfo command:', error);
            await m.reply('❌ Error getting group information!');
        }
    }
};
