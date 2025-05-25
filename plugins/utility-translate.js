const axios = require('axios');

module.exports = {
    command: ['translate', 'tr', 'lang'],
    description: 'Translate text to different languages',
    example: '.translate en Hello world',
    tags: ['utility'],

    handler: async (conn, m) => {
        try {
            const args = m.text.split(' ');
            let targetLang = 'en';
            let text = '';

            if (args.length >= 2) {
                targetLang = args[0].toLowerCase();
                text = args.slice(1).join(' ');
            } else if (m.quoted) {
                targetLang = args[0] || 'en';
                text = m.quoted.body || m.quoted.text || '';
            } else {
                return m.reply('❌ Please provide text to translate!\n\n📝 Usage:\n• `.translate en Hello world`\n• `.translate es` (reply to message)\n\n🌐 Language codes: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi');
            }

            if (!text) {
                return m.reply('❌ No text to translate found!');
            }

            await m.reply('🔄 Translating...');

            try {
                // Use MyMemory Translation API (free)
                const url = `${global.config.apis.translate}?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
                const response = await axios.get(url, { timeout: 10000 });

                if (response.data && response.data.responseData) {
                    const translatedText = response.data.responseData.translatedText;
                    const detectedLang = response.data.matches?.[0]?.segment || 'auto';
                    
                    let resultText = `🌐 *Translation Result:*\n\n`;
                    resultText += `📝 *Original:* ${text}\n`;
                    resultText += `🔤 *From:* ${getLanguageName(detectedLang)} (${detectedLang})\n`;
                    resultText += `🎯 *To:* ${getLanguageName(targetLang)} (${targetLang})\n\n`;
                    resultText += `✅ *Translated:*\n${translatedText}`;
                    
                    await m.reply(resultText);
                } else {
                    throw new Error('Invalid response from translation service');
                }

            } catch (error) {
                console.error('Translation error:', error);
                await m.reply('❌ Translation failed! Please try again or check if the language code is valid.\n\n🌐 Common codes: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi');
            }

        } catch (error) {
            console.error('Error in translate command:', error);
            await m.reply('❌ Error processing translation!');
        }
    }
};

function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'auto': 'Auto-detected'
    };
    return languages[code] || code.toUpperCase();
}
