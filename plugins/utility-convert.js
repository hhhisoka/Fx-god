module.exports = {
    command: ['convert', 'to'],
    description: 'Convert media between formats',
    example: '.convert sticker (reply to image)',
    tags: ['utility'],

    handler: async (conn, m) => {
        try {
            const convertType = m.text.toLowerCase();
            
            let media = null;
            if (m.quoted && m.quoted.message) {
                media = m.quoted;
            } else if (m.mtype === 'imageMessage' || m.mtype === 'videoMessage' || m.mtype === 'stickerMessage') {
                media = m;
            }

            if (!media) {
                return m.reply('❌ Please reply to an image, video, or sticker!\n\n🔄 Available conversions:\n• `sticker` - Convert to sticker\n• `image` - Convert sticker to image\n• `video` - Convert to video');
            }

            await m.reply('🔄 Converting media...');

            try {
                const buffer = await media.download();
                
                if (!buffer) {
                    return m.reply('❌ Failed to download media!');
                }

                switch (convertType) {
                    case 'sticker':
                    case 's':
                        await m.sendSticker(buffer);
                        break;
                        
                    case 'image':
                    case 'img':
                        if (media.mtype === 'stickerMessage') {
                            await m.sendImage(buffer, '🖼️ Converted to image');
                        } else {
                            await m.sendImage(buffer, '🖼️ Image format');
                        }
                        break;
                        
                    case 'video':
                    case 'vid':
                        await m.sendVideo(buffer, '🎥 Converted to video');
                        break;
                        
                    default:
                        return m.reply('❌ Unknown conversion type!\n\n🔄 Available conversions:\n• `sticker` - Convert to sticker\n• `image` - Convert to image\n• `video` - Convert to video');
                }

                await m.react('✅');

            } catch (error) {
                console.error('Conversion error:', error);
                await m.reply('❌ Failed to convert media: ' + error.message);
            }

        } catch (error) {
            console.error('Error in convert command:', error);
            await m.reply('❌ Error converting media!');
        }
    }
};
