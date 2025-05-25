const { formatNumber, sleep } = require('../lib/functions');

module.exports = {
    command: ['broadcast', 'bc', 'announce'],
    description: 'Broadcast message to all groups (Owner only)',
    example: '.broadcast Hello everyone!',
    tags: ['owner'],
    owner: true,

    handler: async (conn, m) => {
        try {
            const message = m.text;
            
            if (!message) {
                return m.reply('❌ Please provide a message to broadcast!\n\n📝 Example: `.broadcast Hello everyone!`');
            }

            // Get all groups
            const groups = Object.keys(global.db.groups || {});
            
            if (groups.length === 0) {
                return m.reply('❌ No groups found in database!');
            }

            await m.reply(`📡 Starting broadcast to ${formatNumber(groups.length)} groups...\n\n⏳ This may take a while.`);

            let successCount = 0;
            let failCount = 0;
            const startTime = Date.now();

            // Prepare broadcast message
            const broadcastMessage = `📢 *Bot Announcement*\n\n${message}\n\n━━━━━━━━━━━━━━━━\n🤖 Message from ${global.botName}\n📅 ${new Date().toLocaleString()}`;

            // Send to all groups with delay to avoid spam
            for (let i = 0; i < groups.length; i++) {
                const groupId = groups[i];
                
                try {
                    await conn.sendMessage(groupId, { text: broadcastMessage });
                    successCount++;
                    
                    // Progress update every 10 groups
                    if ((i + 1) % 10 === 0) {
                        const progress = Math.round(((i + 1) / groups.length) * 100);
                        await m.reply(`📡 Progress: ${progress}% (${i + 1}/${groups.length})\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
                    }
                    
                    // Delay to prevent spam
                    await sleep(1000); // 1 second delay
                    
                } catch (error) {
                    console.error(`Failed to broadcast to group ${groupId}:`, error);
                    failCount++;
                }
            }

            const endTime = Date.now();
            const duration = Math.round((endTime - startTime) / 1000);

            const resultText = `📡 *Broadcast Complete!*\n\n` +
                `📊 *Results:*\n` +
                `✅ Success: ${formatNumber(successCount)}\n` +
                `❌ Failed: ${formatNumber(failCount)}\n` +
                `📈 Success Rate: ${((successCount / groups.length) * 100).toFixed(1)}%\n\n` +
                `⏱️ *Time Taken:* ${duration} seconds\n` +
                `📅 *Completed:* ${new Date().toLocaleString()}`;

            await m.reply(resultText);

        } catch (error) {
            console.error('Error in broadcast command:', error);
            await m.reply('❌ Error broadcasting message!');
        }
    }
};
