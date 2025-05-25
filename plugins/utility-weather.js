const axios = require('axios');

module.exports = {
    command: ['weather', 'cuaca', 'clima'],
    description: 'Get current weather information',
    example: '.weather London',
    tags: ['utility'],

    handler: async (conn, m) => {
        try {
            const city = m.text;
            
            if (!city) {
                return m.reply('❌ Please provide a city name!\n\n📝 Example: `.weather London`');
            }

            const apiKey = global.config.apiKeys.weather;
            if (!apiKey) {
                return m.reply('❌ Weather service is not configured. Please contact the bot owner.');
            }

            await m.reply('🌤️ Getting weather information...');

            try {
                const url = `${global.config.apis.weather}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
                const response = await axios.get(url, { timeout: 10000 });

                if (response.data && response.data.main) {
                    const weather = response.data;
                    const temp = Math.round(weather.main.temp);
                    const feelsLike = Math.round(weather.main.feels_like);
                    const humidity = weather.main.humidity;
                    const pressure = weather.main.pressure;
                    const windSpeed = weather.wind?.speed || 0;
                    const windDeg = weather.wind?.deg || 0;
                    const visibility = weather.visibility ? (weather.visibility / 1000).toFixed(1) : 'N/A';
                    
                    const condition = weather.weather[0];
                    const description = condition.description;
                    const icon = getWeatherIcon(condition.main);
                    
                    const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString();
                    const sunset = new Date(weather.sys.sunset * 1000).toLocaleTimeString();
                    
                    let weatherText = `${icon} *Weather in ${weather.name}, ${weather.sys.country}*\n\n`;
                    weatherText += `🌡️ *Temperature:* ${temp}°C (feels like ${feelsLike}°C)\n`;
                    weatherText += `☁️ *Condition:* ${description.charAt(0).toUpperCase() + description.slice(1)}\n`;
                    weatherText += `💧 *Humidity:* ${humidity}%\n`;
                    weatherText += `🌪️ *Pressure:* ${pressure} hPa\n`;
                    weatherText += `💨 *Wind:* ${windSpeed} m/s, ${getWindDirection(windDeg)}\n`;
                    weatherText += `👁️ *Visibility:* ${visibility} km\n\n`;
                    weatherText += `🌅 *Sunrise:* ${sunrise}\n`;
                    weatherText += `🌇 *Sunset:* ${sunset}\n\n`;
                    weatherText += `📍 *Coordinates:* ${weather.coord.lat}, ${weather.coord.lon}`;
                    
                    await m.reply(weatherText);
                } else {
                    throw new Error('Invalid weather data received');
                }

            } catch (error) {
                console.error('Weather API error:', error);
                
                if (error.response?.status === 404) {
                    await m.reply('❌ City not found! Please check the spelling and try again.');
                } else if (error.response?.status === 401) {
                    await m.reply('❌ Weather service authentication failed. Please contact the bot owner.');
                } else {
                    await m.reply('❌ Failed to get weather information. Please try again later.');
                }
            }

        } catch (error) {
            console.error('Error in weather command:', error);
            await m.reply('❌ Error getting weather information!');
        }
    }
};

function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️',
        'Dust': '🌪️',
        'Sand': '🌪️',
        'Smoke': '🌫️'
    };
    return icons[condition] || '🌤️';
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}
