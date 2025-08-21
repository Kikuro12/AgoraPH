import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/weather', async (req, res) => {
  try {
    const { q = 'Manila,PH' } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENWEATHER_API_KEY' });
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('q', q);
    url.searchParams.set('appid', apiKey);
    url.searchParams.set('units', 'metric');
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Weather fetch failed' });
  }
});

export default router;

