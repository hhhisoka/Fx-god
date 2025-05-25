const { saveDatabase } = require('../lib/database');

module.exports = {
    command: ['restart', 'reboot'],
    description: 'Restart the bot (Owner only)',
    example: '.restart',
    tags: ['owner'],
    owner: true,

    handler: async (conn, m) => {
        try {
            await m.reply('🔄 Restarting bot...\n\n💾 Saving data and shutting down...');

            // Save database before restart
            saveDatabase();
            
            // Give time for the message to be sent
            setTimeout(() => {
                console.log('🔄 Bot restart requested by owner');
                process.exit(0);
            }, 2000);

        } catch (error) {
            console.error('Error in restart command:', error);
            await m.reply('❌ Error restarting bot!');
        }
    }
};
