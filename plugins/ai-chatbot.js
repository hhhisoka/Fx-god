const axios = require('axios');

module.exports = {
    command: ['chat', 'ai', 'ask', 'gpt'],
    description: 'Chat with AI assistant',
    example: '.chat How are you?',
    tags: ['ai'],

    handler: async (conn, m) => {
        try {
            const question = m.text || m.quoted?.text;
            
            if (!question) {
                return m.reply('❌ Please provide a question or text to chat with AI!\n\n📝 Example: `.chat How are you?`');
            }

            await m.reply('🤖 AI is thinking...');

            const apiKey = global.config.apiKeys.openai;
            
            try {
                if (apiKey) {
                    // Use OpenAI API if available
                    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'system',
                                content: `You are ${global.botName}, a helpful WhatsApp bot assistant. Be friendly, concise, and helpful. Answer in the same language as the user's question.`
                            },
                            {
                                role: 'user',
                                content: question
                            }
                        ],
                        max_tokens: 500,
                        temperature: 0.7
                    }, {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    });

                    if (response.data.choices && response.data.choices[0]) {
                        const aiResponse = response.data.choices[0].message.content.trim();
                        
                        let replyText = `🤖 *AI Assistant*\n\n`;
                        replyText += `❓ *Your question:* ${question}\n\n`;
                        replyText += `💭 *AI Response:*\n${aiResponse}`;
                        
                        await m.reply(replyText);
                    } else {
                        throw new Error('Invalid response from AI service');
                    }
                } else {
                    // Fallback: Simple rule-based responses
                    const aiResponse = getSimpleResponse(question.toLowerCase());
                    
                    let replyText = `🤖 *AI Assistant*\n\n`;
                    replyText += `❓ *Your question:* ${question}\n\n`;
                    replyText += `💭 *AI Response:*\n${aiResponse}\n\n`;
                    replyText += `💡 *Note:* This is a basic response. For advanced AI, an API key is needed.`;
                    
                    await m.reply(replyText);
                }

            } catch (error) {
                console.error('AI API error:', error);
                
                // Fallback response
                const fallbackResponse = getSimpleResponse(question.toLowerCase());
                
                let errorText = `🤖 *AI Assistant* (Fallback Mode)\n\n`;
                errorText += `❓ *Your question:* ${question}\n\n`;
                errorText += `💭 *Response:* ${fallbackResponse}\n\n`;
                errorText += `⚠️ *Note:* AI service is currently unavailable. This is a basic response.`;
                
                await m.reply(errorText);
            }

        } catch (error) {
            console.error('Error in chat command:', error);
            await m.reply('❌ Error processing AI request!');
        }
    }
};

function getSimpleResponse(question) {
    // Simple rule-based responses
    const responses = {
        'hello': 'Hello! How can I help you today?',
        'hi': 'Hi there! What can I do for you?',
        'how are you': 'I\'m doing great! Thanks for asking. How are you?',
        'what is your name': `I'm ${global.botName}, your friendly WhatsApp assistant!`,
        'who are you': `I'm ${global.botName}, a WhatsApp bot created to help and entertain users.`,
        'help': 'I can help you with various tasks! Type `.menu` to see all available commands.',
        'thanks': 'You\'re welcome! Happy to help!',
        'thank you': 'You\'re very welcome! Is there anything else I can help you with?',
        'bye': 'Goodbye! Have a great day!',
        'good morning': 'Good morning! Hope you have a wonderful day ahead!',
        'good afternoon': 'Good afternoon! How\'s your day going?',
        'good evening': 'Good evening! How was your day?',
        'good night': 'Good night! Sweet dreams!',
        'what can you do': 'I can help with many things! I can play games, provide information, manage groups, and much more. Type `.menu` to see all my features!',
        'time': `The current time is ${new Date().toLocaleTimeString()}`,
        'date': `Today's date is ${new Date().toLocaleDateString()}`,
        'weather': 'You can check the weather using `.weather <city>` command!',
        'joke': 'Want to hear a joke? Use the `.joke` command!',
        'music': 'Looking for music? Try the `.music <song name>` command!',
        'game': 'Want to play a game? Use `.game` to see available games!'
    };

    // Find matching response
    for (const [key, response] of Object.entries(responses)) {
        if (question.includes(key)) {
            return response;
        }
    }

    // Default responses for common question patterns
    if (question.includes('?')) {
        return 'That\'s an interesting question! I\'d love to help you find the answer. For complex questions, you might want to search online or consult relevant experts.';
    }
    
    if (question.includes('love') || question.includes('like')) {
        return 'That sounds wonderful! I\'m glad you\'re sharing positive feelings.';
    }
    
    if (question.includes('problem') || question.includes('issue')) {
        return 'I understand you\'re facing a challenge. While I can\'t solve everything, I\'m here to help where I can. Have you tried breaking the problem down into smaller parts?';
    }

    // Default response
    return 'I understand what you\'re saying! While I\'m still learning, I\'m here to help. Feel free to ask me anything or use `.menu` to see what I can do!';
}
