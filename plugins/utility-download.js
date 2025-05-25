const { downloadFile, getFileExtension, isValidUrl, bytesToSize } = require('../lib/functions');
const config = require('../config');

module.exports = {
    command: ['download', 'dl', 'get'],
    description: 'Download media from URL',
    example: '.download <url>',
    tags: ['utility'],

    handler: async (conn, m) => {
        try {
            const url = m.text || m.quoted?.text;
            
            if (!url) {
                return m.reply('❌ Please provide a URL to download!\n\n📝 Example: `.download https://example.com/image.jpg`');
            }

            if (!isValidUrl(url)) {
                return m.reply('❌ Please provide a valid URL!');
            }

            await m.reply('📥 Downloading file...');

            try {
                const buffer = await downloadFile(url, config.limits.downloadSize);
                const extension = getFileExtension(url);
                const size = bytesToSize(buffer.length);

                // Determine file type and send accordingly
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
                    await m.sendImage(buffer, `📁 Downloaded image\n📏 Size: ${size}`);
                } else if (['.mp4', '.avi', '.mov', '.mkv'].includes(extension)) {
                    await m.sendVideo(buffer, `📁 Downloaded video\n📏 Size: ${size}`);
                } else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(extension)) {
                    await m.sendAudio(buffer);
                } else if (['.pdf', '.doc', '.docx', '.txt'].includes(extension)) {
                    const filename = url.split('/').pop() || `download${extension}`;
                    await m.sendDocument(buffer, filename, getMimeType(extension));
                } else {
                    const filename = url.split('/').pop() || 'download';
                    await m.sendDocument(buffer, filename, 'application/octet-stream');
                }

                await m.react('✅');

            } catch (error) {
                console.error('Download error:', error);
                await m.reply(`❌ Download failed: ${error.message}\n\n💡 Make sure the URL is accessible and file size is under ${bytesToSize(config.limits.downloadSize)}`);
            }

        } catch (error) {
            console.error('Error in download command:', error);
            await m.reply('❌ Error processing download request!');
        }
    }
};

function getMimeType(extension) {
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed'
    };
    return mimeTypes[extension] || 'application/octet-stream';
}
