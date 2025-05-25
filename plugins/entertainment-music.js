const axios = require('axios');

module.exports = {
    command: ['music', 'song', 'lyrics', 'spotify'],
    description: 'Search for music and song information',
    example: '.music Shape of You',
    tags: ['entertainment'],

    handler: async (conn, m) => {
        try {
            const query = m.text;
            
            if (!query) {
                return m.reply('❌ Please provide a song name!\n\n📝 Example: `.music Shape of You`');
            }

            await m.reply('🎵 Searching for music...');

            try {
                // Since we don't have a specific music API configured, we'll provide search links
                const searchQuery = encodeURIComponent(query);
                
                let musicText = `🎵 *Music Search Results*\n\n`;
                musicText += `🔍 *Query:* ${query}\n\n`;
                musicText += `🎧 *Listen on:*\n`;
                musicText += `• Spotify: https://open.spotify.com/search/${searchQuery}\n`;
                musicText += `• YouTube Music: https://music.youtube.com/search?q=${searchQuery}\n`;
                musicText += `• Apple Music: https://music.apple.com/search?term=${searchQuery}\n`;
                musicText += `• SoundCloud: https://soundcloud.com/search?q=${searchQuery}\n\n`;
                
                musicText += `📱 *Download Apps:*\n`;
                musicText += `• YouTube: https://www.youtube.com/results?search_query=${searchQuery}\n`;
                musicText += `• Amazon Music: https://music.amazon.com/search/${searchQuery}\n\n`;
                
                musicText += `🎤 *Lyrics:*\n`;
                musicText += `• Genius: https://genius.com/search?q=${searchQuery}\n`;
                musicText += `• AZLyrics: https://search.azlyrics.com/search.php?q=${searchQuery}\n\n`;
                
                musicText += `💡 *Tip:* Click the links above to listen to your favorite music!`;
                
                await m.reply(musicText);

            } catch (error) {
                console.error('Music search error:', error);
                await m.reply('❌ Failed to search for music! Please try again.');
            }

        } catch (error) {
            console.error('Error in music command:', error);
            await m.reply('❌ Error searching for music!');
        }
    }
};
