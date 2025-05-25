const util = require('util');
const { getUser } = require('../lib/database');

module.exports = {
    command: ['eval', 'ev', '>'],
    description: 'Execute JavaScript code (Owner only)',
    example: '.eval console.log("Hello World")',
    tags: ['owner'],
    owner: true,

    handler: async (conn, m) => {
        try {
            const code = m.text;
            
            if (!code) {
                return m.reply('❌ Please provide JavaScript code to execute!\n\n📝 Example: `.eval console.log("Hello World")`');
            }

            await m.reply('⚡ Executing code...');

            try {
                // Create execution context
                const user = getUser(m.sender);
                const db = global.db;
                const config = global.config;
                const plugins = global.plugins;
                
                // Execute code
                let result = eval(code);
                
                // Handle promises
                if (result instanceof Promise) {
                    result = await result;
                }

                // Format result
                let output = '';
                if (typeof result === 'object') {
                    output = util.inspect(result, { depth: 2, colors: false });
                } else {
                    output = String(result);
                }

                // Limit output length
                if (output.length > 4000) {
                    output = output.substring(0, 4000) + '\n... (truncated)';
                }

                const responseText = `✅ *Code Executed Successfully*\n\n` +
                    `📝 *Input:*\n\`\`\`javascript\n${code}\n\`\`\`\n\n` +
                    `📤 *Output:*\n\`\`\`\n${output}\n\`\`\``;

                await m.reply(responseText);

            } catch (error) {
                const errorText = `❌ *Execution Error*\n\n` +
                    `📝 *Input:*\n\`\`\`javascript\n${code}\n\`\`\`\n\n` +
                    `💥 *Error:*\n\`\`\`\n${error.message}\n\`\`\`\n\n` +
                    `📍 *Stack:*\n\`\`\`\n${error.stack}\n\`\`\``;

                await m.reply(errorText);
            }

        } catch (error) {
            console.error('Error in eval command:', error);
            await m.reply('❌ Error executing code!');
        }
    }
};
