const { downloadFile, getFileExtension } = require('../lib/functions');

module.exports = {
    command: ['sticker', 's', 'stiker'],
    description: 'Convert image/video to sticker',
    example: '.sticker (reply to image/video)',
    tags: ['utility'],

    handler: async (conn, m) => {
        try {
            let media = null;
            
            // Check if replying to media
            if (m.quoted && m.quoted.message) {
                const quotedType = Object.keys(m.quoted.message)[0];
                if (['imageMessage', 'videoMessage'].includes(quotedType)) {
                    media = m.quoted;
                }
            }
            // Check if message contains media
            else if (m.mtype === 'imageMessage' || m.mtype === 'videoMessage') {
                media = m;
            }
            // Check if URL provided
            else if (m.text) {
                const url = m.text.match(/(https?:\/\/[^\s]+)/)?.[0];
                if (url) {
                    try {
                        await m.reply('📥 Downloading from URL...');
                        const buffer = await downloadFile(url);
                        const ext = getFileExtension(url);
                        
                        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                            await m.sendSticker(buffer);
                            return;
                        } else {
                            return m.reply('❌ URL must point to an image file!');
                        }
                    } catch (error) {
                        return m.reply('❌ Failed to download from URL: ' + error.message);
                    }
                }
            }

            if (!media) {
                return m.reply('❌ Please reply to an image/video or send one with the command!\n\n💡 You can also provide a direct image URL.');
            }

            await m.reply('🔄 Converting to sticker...');

            try {
                const buffer = await media.download();
                
                if (!buffer) {
                    return m.reply('❌ Failed to download media!');
                }

                // Check file size
                if (buffer.length > 10 * 1024 * 1024) { // 10MB limit
                    return m.reply('❌ File too large! Maximum size is 10MB.');
                }

                // Send as sticker
                await m.sendSticker(buffer);
                await m.react('✅');

            } catch (error) {
                console.error('Error processing media:', error);
                await m.reply('❌ Failed to process media: ' + error.message);
            }

        } catch (error) {
            console.error('Error in sticker command:', error);
            await m.reply('❌ Error creating sticker!');
        }
    }
};
