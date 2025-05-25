const axios = require('axios');

module.exports = {
    command: ['search', 'google', 'find'],
    description: 'Search the internet for information',
    example: '.search JavaScript tutorial',
    tags: ['utility'],

    handler: async (conn, m) => {
        try {
            const query = m.text;
            
            if (!query) {
                return m.reply('❌ Please provide a search query!\n\n📝 Example: `.search JavaScript tutorial`');
            }

            await m.reply('🔍 Searching...');

            try {
                // Use a simple search API or scraping service
                const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;
                const response = await axios.get(searchUrl, { timeout: 10000 });
                
                let resultText = `🔍 *Search Results for:* "${query}"\n\n`;
                
                if (response.data.AbstractText) {
                    resultText += `📝 *Summary:*\n${response.data.AbstractText}\n\n`;
                }
                
                if (response.data.AbstractURL) {
                    resultText += `🔗 *Source:* ${response.data.AbstractURL}\n\n`;
                }
                
                if (response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
                    resultText += `📚 *Related Topics:*\n`;
                    response.data.RelatedTopics.slice(0, 5).forEach((topic, index) => {
                        if (topic.Text) {
                            resultText += `${index + 1}. ${topic.Text.substring(0, 100)}...\n`;
                            if (topic.FirstURL) {
                                resultText += `   🔗 ${topic.FirstURL}\n`;
                            }
                        }
                    });
                }
                
                if (resultText === `🔍 *Search Results for:* "${query}"\n\n`) {
                    resultText += '❌ No results found for your query.\n\n💡 Try using different keywords or check your spelling.';
                }
                
                await m.reply(resultText);

            } catch (error) {
                console.error('Search error:', error);
                
                // Fallback: provide search links
                const fallbackText = `🔍 *Search Links for:* "${query}"\n\n` +
                    `🌐 Google: https://www.google.com/search?q=${encodeURIComponent(query)}\n` +
                    `🦆 DuckDuckGo: https://duckduckgo.com/?q=${encodeURIComponent(query)}\n` +
                    `📖 Wikipedia: https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}\n` +
                    `🎥 YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                
                await m.reply(fallbackText);
            }

        } catch (error) {
            console.error('Error in search command:', error);
            await m.reply('❌ Error performing search!');
        }
    }
};
