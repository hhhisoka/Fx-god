export default {
    command: ['autotyping', 'typing'],
    description: 'Auto-typing indicator when processing commands',
    example: 'Auto-trigger when processing messages',
    tags: ['owner'],
    owner: true,
    
    // Auto-trigger function for typing indicator
    before: async (conn, m) => {
        try {
            if (global.config.autoTyping && m.text && m.text.startsWith(global.prefix)) {
                // Show typing indicator
                await conn.sendPresenceUpdate('composing', m.chat);
                
                // Stop typing after a delay
                setTimeout(async () => {
                    try {
                        await conn.sendPresenceUpdate('paused', m.chat);
                    } catch (error) {
                        console.error('Error stopping typing:', error);
                    }
                }, 3000);
            }
            return false;
        } catch (error) {
            console.error('Error in auto typing:', error);
            return false;
        }
    },

    handler: async (conn, m) => {
        try {
            const args = m.text.split(' ');
            const action = args[0]?.toLowerCase();
            
            if (!action) {
                const status = global.config.autoTyping ? '✅ Activé' : '❌ Désactivé';
                
                return m.reply(`⌨️ *Indicateur de Frappe Automatique*\n\n` +
                    `📊 *Statut:* ${status}\n` +
                    `📋 *Description:* Affiche l'indicateur "en train d'écrire" lors du traitement\n` +
                    `⚙️ *Commandes:*\n` +
                    `• \`.autotyping on\` - Activer\n` +
                    `• \`.autotyping off\` - Désactiver\n\n` +
                    `💡 *Effet:* Rend le bot plus naturel et interactif`);
            }
            
            switch (action) {
                case 'on':
                case 'enable':
                    global.config.autoTyping = true;
                    return m.reply('⌨️ Indicateur de frappe automatique activé !\n\n✅ Le bot affichera "en train d\'écrire" lors du traitement des commandes.');
                    
                case 'off':
                case 'disable':
                    global.config.autoTyping = false;
                    return m.reply('⌨️ Indicateur de frappe automatique désactivé !\n\n❌ Le bot ne montrera plus l\'indicateur de frappe.');
                    
                default:
                    return m.reply('❌ Action non reconnue !\n\n📝 Utilisez: on ou off');
            }
            
        } catch (error) {
            console.error('Error in auto typing command:', error);
            await m.reply('❌ Erreur lors de la gestion de l\'indicateur de frappe !');
        }
    }
};