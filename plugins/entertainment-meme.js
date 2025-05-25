const axios = require('axios');
const { pickRandom } = require('../lib/functions');

module.exports = {
    command: ['meme', 'memes', 'funny'],
    description: 'Get random memes',
    example: '.meme',
    tags: ['entertainment'],

    handler: async (conn, m) => {
        try {
            await m.reply('😂 Getting a fresh meme...');

            try {
                // Try to get meme from API
                const response = await axios.get(global.config.apis.meme, { timeout: 10000 });
                
                if (response.data && response.data.data && response.data.data.memes) {
                    const memes = response.data.data.memes;
                    const randomMeme = pickRandom(memes);
                    
                    const caption = `😂 *${randomMeme.name}*\n\n` +
                                  `👆 Upvotes: ${randomMeme.box_count || 0}\n` +
                                  `🔗 Source: Reddit Memes`;
                    
                    await m.sendImage(Buffer.from(await axios.get(randomMeme.url, { responseType: 'arraybuffer' }).then(r => r.data)), caption);
                } else {
                    throw new Error('No memes found in API response');
                }

            } catch (apiError) {
                console.error('Meme API error:', apiError);
                
                // Fallback: text-based jokes
                const fallbackMemes = [
                    "😂 Why don't scientists trust atoms?\nBecause they make up everything!",
                    "😂 I told my wife she was drawing her eyebrows too high.\nShe looked surprised.",
                    "😂 Why don't programmers like nature?\nIt has too many bugs.",
                    "😂 I'm reading a book about anti-gravity.\nIt's impossible to put down!",
                    "😂 Why did the scarecrow win an award?\nHe was outstanding in his field!",
                    "😂 I used to hate facial hair...\nBut then it grew on me.",
                    "😂 What do you call a fake noodle?\nAn impasta!",
                    "😂 Why don't eggs tell jokes?\nThey'd crack each other up!",
                    "😂 I invented a new word: Plagiarism!",
                    "😂 Why don't scientists trust stairs?\nBecause they're always up to something!"
                ];
                
                const randomJoke = pickRandom(fallbackMemes);
                await m.reply(randomJoke + '\n\n💡 Tip: Try again for more memes!');
            }

        } catch (error) {
            console.error('Error in meme command:', error);
            await m.reply('❌ Error getting meme! Try again later.');
        }
    }
};
