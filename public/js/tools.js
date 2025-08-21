// Tools JavaScript - Maps and Weather
// Created by Marwen Deiparine

let philippinesMap = null;
let weatherCities = [];
let currentWeatherCity = null;

// Initialize tools when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTools();
});

function initializeTools() {
    // Weather controls
    const getWeatherBtn = document.getElementById('get-weather');
    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', updateWeather);
    }

    const weatherCitySelect = document.getElementById('weather-city');
    if (weatherCitySelect) {
        weatherCitySelect.addEventListener('change', (e) => {
            if (e.target.value) {
                currentWeatherCity = e.target.value;
                updateWeather();
            }
        });
    }
}

// Initialize Philippines map
function initializeMap() {
    const mapContainer = document.getElementById('philippines-map');
    if (!mapContainer || typeof L === 'undefined') return;

    // Clear existing map
    if (philippinesMap) {
        philippinesMap.remove();
    }

    // Philippines center coordinates
    const philippinesCenter = [12.8797, 121.7740];
    
    // Initialize map
    philippinesMap = L.map('philippines-map', {
        center: philippinesCenter,
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(philippinesMap);

    // Philippine major cities with agricultural significance
    const agriculturalCities = [
        { name: 'Manila', lat: 14.5995, lon: 120.9842, description: 'National Capital Region - Agricultural trade hub' },
        { name: 'Cebu City', lat: 10.3157, lon: 123.8854, description: 'Central Visayas - Major agricultural center' },
        { name: 'Davao City', lat: 7.1907, lon: 125.4553, description: 'Mindanao - Fruit and flower capital' },
        { name: 'Baguio City', lat: 16.4023, lon: 120.5960, description: 'Cordillera - Vegetable farming region' },
        { name: 'Iloilo City', lat: 10.7202, lon: 122.5621, description: 'Western Visayas - Rice granary' },
        { name: 'Cagayan de Oro', lat: 8.4542, lon: 124.6319, description: 'Northern Mindanao - Pineapple region' },
        { name: 'Zamboanga City', lat: 6.9214, lon: 122.0790, description: 'Zamboanga Peninsula - Coconut area' },
        { name: 'Bacolod City', lat: 10.6767, lon: 122.9500, description: 'Negros - Sugar capital' },
        { name: 'General Santos', lat: 6.1164, lon: 125.1716, description: 'SOCCSKSARGEN - Tuna and corn' },
        { name: 'Butuan City', lat: 8.9470, lon: 125.5361, description: 'Caraga - Rice and coconut region' }
    ];

    // Add markers for agricultural cities
    agriculturalCities.forEach(city => {
        const marker = L.marker([city.lat, city.lon]).addTo(philippinesMap);
        
        marker.bindPopup(`
            <div class="map-popup">
                <h4>${city.name}</h4>
                <p>${city.description}</p>
                <button class="btn btn-sm btn-primary" onclick="getWeatherForCity('${city.name}')">
                    <i class="fas fa-cloud-sun"></i>
                    Get Weather
                </button>
            </div>
        `);
        
        // Add click event to get weather
        marker.on('click', () => {
            currentWeatherCity = city.name;
            const weatherSelect = document.getElementById('weather-city');
            if (weatherSelect) {
                weatherSelect.value = city.name;
            }
        });
    });

    // Add Philippine regions overlay (simplified)
    const philippinesBounds = [
        [4.2158, 114.0952], // Southwest
        [21.3069, 127.6444]  // Northeast
    ];

    // Add a subtle overlay to highlight Philippines
    L.rectangle(philippinesBounds, {
        color: 'var(--primary)',
        weight: 2,
        opacity: 0.3,
        fillOpacity: 0.1
    }).addTo(philippinesMap);

    // Store map globally
    window.philippinesMap = philippinesMap;

    console.log('🗺️ Philippines map initialized');
}

// Load weather cities
async function loadWeatherCities() {
    try {
        const response = await fetch('/api/weather/cities');
        if (!response.ok) return;

        weatherCities = await response.json();
        
        const weatherSelect = document.getElementById('weather-city');
        if (weatherSelect) {
            weatherSelect.innerHTML = '<option value="">Select a city...</option>' +
                weatherCities.map(city => `<option value="${city.name}">${city.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Load weather cities error:', error);
        showToast('Error', 'Failed to load weather cities.', 'error');
    }
}

// Update weather for selected city
async function updateWeather() {
    if (!currentWeatherCity) {
        showToast('No City Selected', 'Please select a city first.', 'warning');
        return;
    }

    const weatherDisplay = document.getElementById('weather-display');
    if (!weatherDisplay) return;

    try {
        // Show loading state
        weatherDisplay.innerHTML = `
            <div class="weather-loading">
                <div class="spinner" style="width: 30px; height: 30px; margin: 2rem auto;"></div>
                <p style="text-align: center; color: var(--text-muted);">Loading weather data...</p>
            </div>
        `;

        const response = await fetch(`/api/weather/${encodeURIComponent(currentWeatherCity)}`);
        
        if (!response.ok) {
            throw new Error('Failed to get weather data');
        }

        const weatherData = await response.json();
        displayWeatherData(weatherData);
        
    } catch (error) {
        console.error('Weather update error:', error);
        weatherDisplay.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <p style="color: var(--danger); text-align: center;">Failed to load weather data</p>
                <button class="btn btn-outline btn-sm" onclick="updateWeather()" style="margin-top: 1rem;">
                    <i class="fas fa-retry"></i>
                    Try Again
                </button>
            </div>
        `;
        showToast('Weather Error', 'Failed to load weather data. Please try again.', 'error');
    }
}

// Display weather data
function displayWeatherData(data) {
    const weatherDisplay = document.getElementById('weather-display');
    if (!weatherDisplay) return;

    const weatherIconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    
    weatherDisplay.innerHTML = `
        <div class="weather-info">
            <div class="weather-header">
                <h4>${escapeHtml(data.city)}</h4>
                ${data.cached ? '<span class="cached-indicator">📡 Cached data</span>' : '<span class="live-indicator">🔴 Live data</span>'}
            </div>
            
            <div class="weather-main">
                <div class="weather-temp">${data.temperature}°C</div>
                <img src="${weatherIconUrl}" alt="${data.description}" class="weather-icon">
            </div>
            
            <div class="weather-description">${data.description}</div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">Feels like</div>
                    <div class="weather-detail-value">${data.feelsLike}°C</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Humidity</div>
                    <div class="weather-detail-value">${data.humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Wind Speed</div>
                    <div class="weather-detail-value">${data.windSpeed} m/s</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Pressure</div>
                    <div class="weather-detail-value">${data.pressure} hPa</div>
                </div>
                ${data.visibility ? `
                    <div class="weather-detail">
                        <div class="weather-detail-label">Visibility</div>
                        <div class="weather-detail-value">${data.visibility} km</div>
                    </div>
                ` : ''}
                <div class="weather-detail">
                    <div class="weather-detail-label">Updated</div>
                    <div class="weather-detail-value">${formatRelativeTime(data.timestamp)}</div>
                </div>
            </div>
            
            <div class="weather-sun-times">
                <div class="sun-time">
                    <i class="fas fa-sun" style="color: var(--warning);"></i>
                    <span>Sunrise: ${new Date(data.sunrise).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="sun-time">
                    <i class="fas fa-moon" style="color: var(--secondary);"></i>
                    <span>Sunset: ${new Date(data.sunset).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
            
            <div class="weather-actions">
                <button class="btn btn-outline btn-sm" onclick="updateWeather()">
                    <i class="fas fa-sync"></i>
                    Refresh
                </button>
                <button class="btn btn-outline btn-sm" onclick="showWeatherForecast('${data.city}')">
                    <i class="fas fa-calendar"></i>
                    5-Day Forecast
                </button>
            </div>
        </div>
    `;

    // Update map marker if it exists
    if (philippinesMap && weatherCities.length > 0) {
        const city = weatherCities.find(c => c.name === data.city);
        if (city) {
            // Add weather marker or update existing one
            const weatherMarker = L.marker([city.coordinates.lat, city.coordinates.lon])
                .addTo(philippinesMap)
                .bindPopup(`
                    <div class="map-weather-popup">
                        <h4>${data.city}</h4>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0;">
                            <img src="${weatherIconUrl}" alt="${data.description}" style="width: 40px; height: 40px;">
                            <span style="font-size: 1.25rem; font-weight: 600;">${data.temperature}°C</span>
                        </div>
                        <p style="margin: 0; text-transform: capitalize;">${data.description}</p>
                    </div>
                `);
        }
    }
}

// Get weather for specific city (called from map popup)
function getWeatherForCity(cityName) {
    currentWeatherCity = cityName;
    
    const weatherSelect = document.getElementById('weather-city');
    if (weatherSelect) {
        weatherSelect.value = cityName;
    }
    
    updateWeather();
}

// Show weather forecast modal
async function showWeatherForecast(cityName) {
    try {
        showLoading();
        
        const response = await fetch(`/api/weather/${encodeURIComponent(cityName)}/forecast`);
        if (!response.ok) {
            throw new Error('Failed to get forecast data');
        }

        const forecastData = await response.json();
        
        // Group forecast by days
        const dailyForecast = groupForecastByDay(forecastData.forecast);
        
        const modalHTML = `
            <div class="modal-overlay" id="weather-forecast-modal">
                <div class="modal modal-large">
                    <div class="modal-header">
                        <h2>5-Day Weather Forecast - ${escapeHtml(cityName)}</h2>
                        <button class="modal-close" onclick="closeModal('weather-forecast-modal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="forecast-grid">
                            ${dailyForecast.map(day => `
                                <div class="forecast-day-card">
                                    <div class="forecast-date">
                                        ${new Date(day.date).toLocaleDateString('en-PH', { 
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                    <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" 
                                         alt="${day.description}" class="forecast-icon">
                                    <div class="forecast-temp">${day.temperature}°C</div>
                                    <div class="forecast-desc">${day.description}</div>
                                    <div class="forecast-details">
                                        <small><i class="fas fa-tint"></i> ${day.humidity}%</small>
                                        <small><i class="fas fa-wind"></i> ${day.windSpeed} m/s</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('weather-forecast-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        document.getElementById('weather-forecast-modal').classList.add('show');

        // Close modal when clicking overlay
        document.getElementById('weather-forecast-modal').addEventListener('click', (e) => {
            if (e.target.id === 'weather-forecast-modal') {
                closeModal('weather-forecast-modal');
            }
        });

    } catch (error) {
        console.error('Forecast error:', error);
        showToast('Forecast Error', 'Failed to load weather forecast.', 'error');
    } finally {
        hideLoading();
    }
}

// Group forecast data by day
function groupForecastByDay(forecast) {
    const grouped = {};
    
    forecast.forEach(item => {
        const date = new Date(item.date).toDateString();
        if (!grouped[date]) {
            grouped[date] = {
                date: date,
                items: []
            };
        }
        grouped[date].items.push(item);
    });

    // Get average data for each day
    return Object.values(grouped).slice(0, 5).map(day => {
        const items = day.items;
        const middleItem = items[Math.floor(items.length / 2)]; // Use middle item for representative data
        
        return {
            date: day.date,
            temperature: middleItem.temperature,
            description: middleItem.description,
            icon: middleItem.icon,
            humidity: middleItem.humidity,
            windSpeed: middleItem.windSpeed
        };
    });
}

// Add custom map controls
function addMapControls() {
    if (!philippinesMap) return;

    // Add custom control for agricultural regions
    const AgricultureControl = L.Control.extend({
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            
            container.style.backgroundColor = 'white';
            container.style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJMMTMgOEgxN0wxMiAxMkwxNSAxOEgxMEw3IDE4TDEwIDEyTDUgOEg5TDEwIDJaIiBmaWxsPSIjMTBCOTgxIi8+Cjwvc3ZnPgo=')";
            container.style.backgroundSize = '20px 20px';
            container.style.backgroundRepeat = 'no-repeat';
            container.style.backgroundPosition = 'center';
            container.style.width = '30px';
            container.style.height = '30px';
            container.style.cursor = 'pointer';
            container.title = 'Show Agricultural Regions';

            container.onclick = function() {
                showAgriculturalRegions();
            };

            return container;
        },

        onRemove: function(map) {
            // Nothing to do here
        }
    });

    // Add the control to the map
    philippinesMap.addControl(new AgricultureControl({ position: 'topright' }));
}

// Show agricultural regions information
function showAgriculturalRegions() {
    const modalHTML = `
        <div class="modal-overlay" id="agricultural-regions-modal">
            <div class="modal modal-large">
                <div class="modal-header">
                    <h2>Philippine Agricultural Regions</h2>
                    <button class="modal-close" onclick="closeModal('agricultural-regions-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="regions-grid">
                        <div class="region-card">
                            <h4><i class="fas fa-seedling"></i> Luzon</h4>
                            <p><strong>Major Crops:</strong> Rice, corn, sugarcane, vegetables</p>
                            <p><strong>Key Areas:</strong> Central Luzon (rice granary), Cordillera (vegetables), Ilocos (tobacco)</p>
                        </div>
                        <div class="region-card">
                            <h4><i class="fas fa-leaf"></i> Visayas</h4>
                            <p><strong>Major Crops:</strong> Sugarcane, coconut, rice, corn</p>
                            <p><strong>Key Areas:</strong> Negros (sugar), Bohol (rice), Leyte (coconut)</p>
                        </div>
                        <div class="region-card">
                            <h4><i class="fas fa-tree"></i> Mindanao</h4>
                            <p><strong>Major Crops:</strong> Fruits, coconut, corn, rice</p>
                            <p><strong>Key Areas:</strong> Davao (banana, durian), Bukidnon (pineapple), SOCCSKSARGEN (corn)</p>
                        </div>
                    </div>
                    
                    <div class="agricultural-tips">
                        <h4><i class="fas fa-lightbulb"></i> Agricultural Tips</h4>
                        <ul>
                            <li>Monitor weather patterns for optimal planting and harvesting times</li>
                            <li>Use the document center to access the latest agricultural forms and permits</li>
                            <li>Join our community forum to connect with other farmers and experts</li>
                            <li>Check weather forecasts regularly for irrigation and crop protection planning</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('agricultural-regions-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('agricultural-regions-modal').classList.add('show');

    // Close modal when clicking overlay
    document.getElementById('agricultural-regions-modal').addEventListener('click', (e) => {
        if (e.target.id === 'agricultural-regions-modal') {
            closeModal('agricultural-regions-modal');
        }
    });
}

// Get weather recommendations based on conditions
function getWeatherRecommendations(weatherData) {
    const recommendations = [];
    
    if (weatherData.temperature > 35) {
        recommendations.push('🌡️ Very hot conditions - ensure adequate irrigation and provide shade for livestock');
    }
    
    if (weatherData.temperature < 15) {
        recommendations.push('❄️ Cool weather - protect sensitive crops from cold damage');
    }
    
    if (weatherData.humidity > 80) {
        recommendations.push('💧 High humidity - monitor for fungal diseases and improve ventilation');
    }
    
    if (weatherData.windSpeed > 10) {
        recommendations.push('💨 Strong winds - secure greenhouse structures and protect tall crops');
    }
    
    if (weatherData.description.toLowerCase().includes('rain')) {
        recommendations.push('🌧️ Rainy conditions - ensure proper drainage and delay fertilizer application');
    }
    
    if (weatherData.description.toLowerCase().includes('clear') || weatherData.description.toLowerCase().includes('sunny')) {
        recommendations.push('☀️ Clear weather - ideal for harvesting and field work');
    }
    
    return recommendations;
}

// Show weather recommendations
function showWeatherRecommendations(weatherData) {
    const recommendations = getWeatherRecommendations(weatherData);
    
    if (recommendations.length === 0) return;

    const modalHTML = `
        <div class="modal-overlay" id="weather-recommendations-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Agricultural Recommendations</h2>
                    <button class="modal-close" onclick="closeModal('weather-recommendations-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                        Based on current weather conditions in ${weatherData.city}:
                    </p>
                    <div class="recommendations-list">
                        ${recommendations.map(rec => `
                            <div class="recommendation-item">
                                <p>${rec}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('weather-recommendations-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('weather-recommendations-modal').classList.add('show');

    // Close modal when clicking overlay
    document.getElementById('weather-recommendations-modal').addEventListener('click', (e) => {
        if (e.target.id === 'weather-recommendations-modal') {
            closeModal('weather-recommendations-modal');
        }
    });
}

// Initialize map when tools section is loaded
window.addEventListener('load', () => {
    // Add a delay to ensure Leaflet is fully loaded
    setTimeout(() => {
        if (document.getElementById('tools').classList.contains('active')) {
            initializeMap();
        }
    }, 500);
});

// Export tools functions
window.ToolsModule = {
    initializeMap,
    loadWeatherCities,
    updateWeather,
    getWeatherForCity,
    showWeatherForecast,
    showAgriculturalRegions,
    showWeatherRecommendations
};