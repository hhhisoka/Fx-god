const axios = require('axios');

module.exports = {
    command: ['anime', 'manga', 'otaku'],
    description: 'Get anime/manga information',
    example: '.anime Naruto',
    tags: ['entertainment'],

    handler: async (conn, m) => {
        try {
            const query = m.text;
            
            if (!query) {
                return m.reply('❌ Please provide an anime name!\n\n📝 Example: `.anime Naruto`');
            }

            await m.reply('🔍 Searching anime database...');

            try {
                // Search for anime using Jikan API (MyAnimeList unofficial API)
                const searchUrl = `${global.config.apis.anime}/anime?q=${encodeURIComponent(query)}&limit=1`;
                const response = await axios.get(searchUrl, { timeout: 15000 });
                
                if (response.data && response.data.data && response.data.data.length > 0) {
                    const anime = response.data.data[0];
                    
                    let animeText = `🎌 *Anime Information*\n\n`;
                    animeText += `📺 *Title:* ${anime.title}\n`;
                    if (anime.title_english) animeText += `🌐 *English:* ${anime.title_english}\n`;
                    if (anime.title_japanese) animeText += `🇯🇵 *Japanese:* ${anime.title_japanese}\n`;
                    animeText += `🎭 *Type:* ${anime.type || 'Unknown'}\n`;
                    animeText += `📊 *Status:* ${anime.status || 'Unknown'}\n`;
                    animeText += `📅 *Year:* ${anime.year || 'Unknown'}\n`;
                    if (anime.episodes) animeText += `📺 *Episodes:* ${anime.episodes}\n`;
                    if (anime.duration) animeText += `⏱️ *Duration:* ${anime.duration}\n`;
                    if (anime.rating) animeText += `🔞 *Rating:* ${anime.rating}\n`;
                    if (anime.score) animeText += `⭐ *Score:* ${anime.score}/10\n`;
                    if (anime.scored_by) animeText += `👥 *Scored by:* ${anime.scored_by.toLocaleString()} users\n`;
                    if (anime.rank) animeText += `🏆 *Rank:* #${anime.rank}\n`;
                    if (anime.popularity) animeText += `📈 *Popularity:* #${anime.popularity}\n`;
                    
                    if (anime.genres && anime.genres.length > 0) {
                        animeText += `🏷️ *Genres:* ${anime.genres.map(g => g.name).join(', ')}\n`;
                    }
                    
                    if (anime.studios && anime.studios.length > 0) {
                        animeText += `🎨 *Studio:* ${anime.studios.map(s => s.name).join(', ')}\n`;
                    }
                    
                    if (anime.synopsis) {
                        const synopsis = anime.synopsis.length > 300 
                            ? anime.synopsis.substring(0, 300) + '...' 
                            : anime.synopsis;
                        animeText += `\n📖 *Synopsis:*\n${synopsis}\n`;
                    }
                    
                    if (anime.url) {
                        animeText += `\n🔗 *MyAnimeList:* ${anime.url}`;
                    }
                    
                    // If there's an image, send it with the text
                    if (anime.images && anime.images.jpg && anime.images.jpg.image_url) {
                        try {
                            const imageResponse = await axios.get(anime.images.jpg.image_url, { 
                                responseType: 'arraybuffer',
                                timeout: 10000 
                            });
                            const imageBuffer = Buffer.from(imageResponse.data);
                            await m.sendImage(imageBuffer, animeText);
                        } catch (imageError) {
                            await m.reply(animeText);
                        }
                    } else {
                        await m.reply(animeText);
                    }
                    
                } else {
                    await m.reply(`❌ No anime found with the name "${query}"!\n\n💡 Try using the exact title or alternative spellings.`);
                }

            } catch (apiError) {
                console.error('Anime API error:', apiError);
                await m.reply('❌ Failed to fetch anime information! The anime database might be temporarily unavailable.');
            }

        } catch (error) {
            console.error('Error in anime command:', error);
            await m.reply('❌ Error searching for anime!');
        }
    }
};
