const express = require('express');
const axios = require('axios');
const { query } = require('../config/database');

const router = express.Router();

// Philippine major cities with coordinates
const philippineCities = {
    'Manila': { lat: 14.5995, lon: 120.9842 },
    'Cebu': { lat: 10.3157, lon: 123.8854 },
    'Davao': { lat: 7.1907, lon: 125.4553 },
    'Quezon City': { lat: 14.6760, lon: 121.0437 },
    'Caloocan': { lat: 14.6507, lon: 120.9668 },
    'Zamboanga': { lat: 6.9214, lon: 122.0790 },
    'Antipolo': { lat: 14.5833, lon: 121.1833 },
    'Pasig': { lat: 14.5764, lon: 121.0851 },
    'Taguig': { lat: 14.5176, lon: 121.0509 },
    'Valenzuela': { lat: 14.7000, lon: 120.9833 },
    'Makati': { lat: 14.5547, lon: 121.0244 },
    'Parañaque': { lat: 14.4793, lon: 121.0198 },
    'Las Piñas': { lat: 14.4378, lon: 120.9947 },
    'Muntinlupa': { lat: 14.3832, lon: 121.0409 },
    'Baguio': { lat: 16.4023, lon: 120.5960 },
    'Iloilo': { lat: 10.7202, lon: 122.5621 },
    'Bacolod': { lat: 10.6767, lon: 122.9500 },
    'Cagayan de Oro': { lat: 8.4542, lon: 124.6319 },
    'General Santos': { lat: 6.1164, lon: 125.1716 },
    'Butuan': { lat: 8.9470, lon: 125.5361 }
};

// Get list of available cities
router.get('/cities', (req, res) => {
    try {
        const cities = Object.keys(philippineCities).map(city => ({
            name: city,
            coordinates: philippineCities[city]
        }));
        res.json(cities);
    } catch (error) {
        console.error('Get cities error:', error);
        res.status(500).json({ error: 'Failed to get cities' });
    }
});

// Get weather for specific city
router.get('/:city', async (req, res) => {
    try {
        const cityName = req.params.city;
        const city = philippineCities[cityName];

        if (!city) {
            return res.status(404).json({ error: 'City not found' });
        }

        // Check cache first (cache for 10 minutes)
        const cacheResult = await query(
            'SELECT weather_data FROM weather_cache WHERE location = $1 AND cached_at > NOW() - INTERVAL \'10 minutes\'',
            [cityName]
        );

        if (cacheResult.rows.length > 0) {
            return res.json({
                city: cityName,
                cached: true,
                ...cacheResult.rows[0].weather_data
            });
        }

        // Fetch from OpenWeatherMap API
        const apiKey = process.env.WEATHER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Weather API key not configured' });
        }

        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`
        );

        const weatherData = {
            temperature: Math.round(weatherResponse.data.main.temp),
            feelsLike: Math.round(weatherResponse.data.main.feels_like),
            humidity: weatherResponse.data.main.humidity,
            pressure: weatherResponse.data.main.pressure,
            description: weatherResponse.data.weather[0].description,
            icon: weatherResponse.data.weather[0].icon,
            windSpeed: weatherResponse.data.wind?.speed || 0,
            windDirection: weatherResponse.data.wind?.deg || 0,
            visibility: weatherResponse.data.visibility ? Math.round(weatherResponse.data.visibility / 1000) : null,
            uvIndex: null, // Would need additional API call
            sunrise: new Date(weatherResponse.data.sys.sunrise * 1000).toISOString(),
            sunset: new Date(weatherResponse.data.sys.sunset * 1000).toISOString(),
            timestamp: new Date().toISOString()
        };

        // Cache the result
        await query(
            'INSERT INTO weather_cache (location, weather_data) VALUES ($1, $2) ON CONFLICT (location) DO UPDATE SET weather_data = $2, cached_at = CURRENT_TIMESTAMP',
            [cityName, JSON.stringify(weatherData)]
        );

        res.json({
            city: cityName,
            cached: false,
            ...weatherData
        });

    } catch (error) {
        console.error('Weather API error:', error);
        if (error.response && error.response.status === 401) {
            res.status(500).json({ error: 'Invalid weather API key' });
        } else {
            res.status(500).json({ error: 'Failed to get weather data' });
        }
    }
});

// Get weather forecast (5-day forecast)
router.get('/:city/forecast', async (req, res) => {
    try {
        const cityName = req.params.city;
        const city = philippineCities[cityName];

        if (!city) {
            return res.status(404).json({ error: 'City not found' });
        }

        const apiKey = process.env.WEATHER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Weather API key not configured' });
        }

        const forecastResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`
        );

        const forecast = forecastResponse.data.list.map(item => ({
            date: new Date(item.dt * 1000).toISOString(),
            temperature: Math.round(item.main.temp),
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            humidity: item.main.humidity,
            windSpeed: item.wind?.speed || 0
        }));

        res.json({
            city: cityName,
            forecast: forecast
        });

    } catch (error) {
        console.error('Forecast API error:', error);
        res.status(500).json({ error: 'Failed to get weather forecast' });
    }
});

module.exports = router;