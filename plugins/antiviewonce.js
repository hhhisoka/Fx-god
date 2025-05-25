import { getGroup } from '../lib/database.js';

export default {
    command: ['antiviewonce', 'antivo'],
    description: 'Reveal view-once messages automatically',
    example: 'Auto-trigger when view-once messages are received',
    tags: ['group'],
    
    // Auto-trigger function for view-once detection
    before: async (conn, m) => {
        try {
            const groupData = m.isGroup ? getGroup(m.chat) : { antiviewonce: true };
            if (!groupData.antiviewonce && m.isGroup) return false;
            
            // Check if message is view-once
            if (m.message && (m.message.viewOnceMessage || m.message.viewOnceMessageV2 || m.message.viewOnceMessageV2Extension)) {
                const viewOnceMsg = m.message.viewOnceMessage || m.message.viewOnceMessageV2 || m.message.viewOnceMessageV2Extension;
                
                if (viewOnceMsg.message) {
                    const content = viewOnceMsg.message;
                    const senderName = conn.getName(m.sender) || m.sender.split('@')[0];
                    
                    let revealText = `👁️ *Message Vue Unique Révélé*\n\n` +
                        `👤 *Expéditeur:* ${senderName}\n` +
                        `📅 *Date:* ${new Date().toLocaleString()}\n` +
                        `🔓 *Type:* Message à vue unique\n\n`;
                    
                    // Handle different message types
                    if (content.imageMessage) {
                        const caption = content.imageMessage.caption || '';
                        revealText += `📷 *Type:* Image\n`;
                        if (caption) revealText += `📝 *Légende:* ${caption}\n`;
                        
                        // Forward the image without view-once
                        await conn.sendMessage(m.chat, {
                            image: await conn.downloadMediaMessage(m),
                            caption: revealText + (caption ? `\n\n*Légende originale:* ${caption}` : '')
                        });
                        
                    } else if (content.videoMessage) {
                        const caption = content.videoMessage.caption || '';
                        revealText += `🎥 *Type:* Vidéo\n`;
                        if (caption) revealText += `📝 *Légende:* ${caption}\n`;
                        
                        // Forward the video without view-once
                        await conn.sendMessage(m.chat, {
                            video: await conn.downloadMediaMessage(m),
                            caption: revealText + (caption ? `\n\n*Légende originale:* ${caption}` : '')
                        });
                        
                    } else if (content.audioMessage) {
                        revealText += `🎵 *Type:* Audio/Vocal\n`;
                        
                        // Forward the audio without view-once
                        await conn.sendMessage(m.chat, {
                            audio: await conn.downloadMediaMessage(m),
                            mimetype: content.audioMessage.mimetype || 'audio/mp4',
                            ptt: content.audioMessage.ptt || false
                        });
                        
                        await conn.sendMessage(m.chat, { text: revealText });
                    }
                    
                    console.log(`👁️ View-once message revealed from ${m.sender}`);
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error in antiviewonce:', error);
            return false;
        }
    },

    handler: async (conn, m) => {
        try {
            const groupData = m.isGroup ? getGroup(m.chat) : null;
            const status = groupData ? (groupData.antiviewonce ? '✅ Activé' : '❌ Désactivé') : '✅ Toujours actif en privé';
            
            return m.reply(`👁️ *Système Anti-Vue Unique*\n\n` +
                `📋 *Description:* Révèle automatiquement les messages à vue unique\n` +
                `📊 *Statut:* ${status}\n` +
                `⚙️ *Configuration:* ${m.isGroup ? 'Utilisez `.gsettings antiviewonce on/off`' : 'Actif automatiquement'}\n` +
                `🛡️ *Protection:* Messages révélés sans possibilité de suppression\n\n` +
                `💡 *Types supportés:*\n` +
                `• 📷 Images à vue unique\n` +
                `• 🎥 Vidéos à vue unique\n` +
                `• 🎵 Messages vocaux à vue unique\n\n` +
                `⚠️ *Note:* Cette fonctionnalité permet de préserver le contenu partagé`);
        } catch (error) {
            console.error('Error in antiviewonce command:', error);
            await m.reply('❌ Erreur lors de l\'affichage des informations anti-vue unique !');
        }
    }
};