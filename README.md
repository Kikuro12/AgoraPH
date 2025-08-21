## AletheiaDocs

Filipino professional document center with tools, forum, and chat. Built with Node.js, Express, PostgreSQL, and React (Vite). Railway-ready deployment.

### Features
- Document Center: upload, categorize, search, and one-click PDF download
- Tools: PH map (Leaflet + OSM), Weather via OpenWeather (server proxy)
- User Interaction: Socket.io chat widget, basic forum (posts and replies)
- Admin Panel: announcements, document management, basic chat moderation
- Responsive, Filipino-inspired UI

### Monorepo Structure
- `server/` Express API + Socket.io + PostgreSQL
- `client/` Vite React SPA

### Environment Variables
Set these in Railway project variables:
- `PORT` = 8080 (Railway provides automatically)
- `DATABASE_URL` = your PostgreSQL connection string
- `JWT_SECRET` = strong random string
- `OPENWEATHER_API_KEY` = your OpenWeather key

For your case:
- `DATABASE_URL` = postgresql://postgres:gxktwnRqVANotrTJuirVJWemzHMAMLqh@centerbeam.proxy.rlwy.net:56197/railway
- `OPENWEATHER_API_KEY` = e0bb86759c765d450532d992831a630d

### Local Development
```bash
npm install
npm run dev
```
Client at http://localhost:5173, API at http://localhost:8080

### Deploy to Railway
1. Create a new Railway project and attach a PostgreSQL database (or set `DATABASE_URL`).
2. Add variables: `DATABASE_URL`, `JWT_SECRET`, `OPENWEATHER_API_KEY`.
3. Deploy from GitHub repo or upload.
4. Railway will run `npm install` (root), trigger `postinstall` to build client and install server, then `npm start`.

### API Overview
- `POST /api/auth/register` { email, password, displayName }
- `POST /api/auth/login` { email, password }
- `GET /api/documents?q=&category=`
- `POST /api/documents` (multipart: file, title, category) [auth]
- `GET /api/documents/:id/download`
- `GET /api/forum/posts`
- `GET /api/forum/posts/:id`
- `POST /api/forum/posts` { title, content } [auth]
- `POST /api/forum/posts/:id/replies` { content } [auth]
- `GET /api/tools/weather?q=Manila,PH`
- `GET/POST/DELETE /api/admin/announcements` [admin]
- `GET/DELETE /api/admin/chat` [admin]

### Notes
- Uses `pgcrypto` for UUID `gen_random_uuid()`; enabled at startup.
- File uploads stored at `server/uploads/`.
- Client served by Express in production.

# AgroPH - Philippine Agricultural Hub

![AgroPH Logo](./public/assets/logo.svg)

A professional Filipino website that serves as a comprehensive hub for Philippine agricultural resources, documentation, weather updates, and community discussions.

**Created by Marwen Deiparine**

## 🌟 Features

### 📁 Document Center
- Library of downloadable and printable agricultural forms and documents
- Organized categories with search and filter functionality
- One-click PDF download with print-ready formatting
- Document statistics and download tracking

### 🗺️ Built-in Tools
- **Interactive Philippines Map** using Leaflet with OpenStreetMap
- **Live Weather System** with real-time data for Philippine locations
- Agricultural recommendations based on weather conditions
- 5-day weather forecasts for planning

### 💬 User Interaction
- **Real-time Chat Widget** for instant support using Socket.io
- **Community Forum** with user registration, posts, and replies
- User profiles and authentication system
- Mobile-responsive design

### ⚙️ Admin Panel
- Comprehensive dashboard with statistics and analytics
- Document upload and management system
- User management and moderation tools
- Forum post moderation (pin, lock, delete)
- Announcements management
- Chat administration and history export

### 🎨 Design & Branding
- Modern Filipino-inspired design with cultural elements
- Tropical color palette with Philippine flag colors
- Baybayin pattern influences and jeepney-inspired accents
- Mobile-first responsive design
- Clean, professional UI that feels unique

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenWeatherMap API key (free tier available)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd agroph
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/agroph_db
   JWT_SECRET=your_super_secret_jwt_key_here
   WEATHER_API_KEY=your_openweathermap_api_key
   PORT=3000
   NODE_ENV=development
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb agroph_db
   
   # Database will be automatically initialized on first run
   ```

4. **Get Weather API Key**
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Get your free API key
   - Add it to your `.env` file

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Open http://localhost:3000
   - Default admin login: `admin` / `admin123` (change in production!)

## 🚂 Railway Deployment

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Manual Deployment

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Create new project
   railway init
   ```

2. **Add PostgreSQL Database**
   ```bash
   # Add PostgreSQL plugin
   railway add postgresql
   ```

3. **Set Environment Variables**
   ```bash
   # Set required environment variables
   railway variables set JWT_SECRET=your_super_secret_jwt_key_here
   railway variables set WEATHER_API_KEY=your_openweathermap_api_key
   railway variables set NODE_ENV=production
   railway variables set ADMIN_EMAIL=admin@agroph.com
   railway variables set ADMIN_PASSWORD=change_this_password
   ```

4. **Deploy**
   ```bash
   # Deploy to Railway
   railway up
   ```

5. **Access Your Deployed App**
   - Railway will provide you with a URL
   - The database will be automatically initialized
   - Default admin credentials can be found in your environment variables

### Environment Variables for Railway

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | Auto-generated by Railway |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `WEATHER_API_KEY` | OpenWeatherMap API key | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment mode | No | production |
| `ADMIN_EMAIL` | Admin email | No | admin@agroph.com |
| `ADMIN_PASSWORD` | Admin password | No | admin123 |
| `MAX_FILE_SIZE` | Max upload size in bytes | No | 10485760 (10MB) |
| `SOCKET_CORS_ORIGIN` | Socket.io CORS origin | No | * |

## 🏗️ Architecture

### Backend Stack
- **Node.js** with Express.js framework
- **PostgreSQL** database with connection pooling
- **Socket.io** for real-time chat functionality
- **JWT** authentication with bcrypt password hashing
- **Multer** for file uploads
- **Helmet** for security headers
- **Rate limiting** for API protection

### Frontend Stack
- **Vanilla JavaScript** with modern ES6+ features
- **CSS3** with custom properties and grid/flexbox
- **Leaflet.js** for interactive maps
- **Socket.io Client** for real-time features
- **Font Awesome** for icons
- **Google Fonts** (Inter & Poppins)

### Database Schema
- **Users** - Authentication and profiles
- **Documents** - File storage and metadata
- **Document Categories** - Organization system
- **Forum Posts & Replies** - Community discussions
- **Chat Messages** - Real-time chat history
- **Announcements** - Admin notifications
- **Weather Cache** - API response caching

## 📱 Mobile Responsiveness

The application is built with a mobile-first approach:
- Responsive navigation with hamburger menu
- Touch-friendly interface elements
- Optimized chat widget for mobile devices
- Adaptive grid layouts for all screen sizes
- Swipe gestures support (where applicable)

## 🎨 Filipino Cultural Design Elements

### Color Palette
- **Philippine Flag Colors**: Blue (#0038A8), Red (#CE1126), Yellow (#FCD116)
- **Tropical Nature**: Emerald Green (#10B981), Ocean Blue (#0EA5E9), Sunset Orange (#F97316)
- **Cultural Festivals**: Sinulog, Ati-Atihan, and Pahiyas inspired gradients

### Visual Elements
- Baybayin script-inspired decorative patterns
- Jeepney-style colorful accents and animations
- Rice grain and agricultural iconography
- Philippine sun rays in the logo design
- Tropical pattern backgrounds

### Typography
- **Poppins** for headings (modern Filipino preference)
- **Inter** for body text (excellent readability)
- Appropriate font weights for hierarchy

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/verify` - Verify JWT token

### Document Endpoints
- `GET /api/documents` - List documents with pagination and filters
- `GET /api/documents/categories` - Get document categories
- `GET /api/documents/:id` - Get single document
- `GET /api/documents/:id/download` - Download document
- `POST /api/documents/upload` - Upload document (admin only)
- `PUT /api/documents/:id` - Update document (admin only)
- `DELETE /api/documents/:id` - Delete document (admin only)

### Forum Endpoints
- `GET /api/forum/categories` - Get forum categories
- `GET /api/forum/posts` - List posts with pagination and filters
- `GET /api/forum/posts/:id` - Get post with replies
- `POST /api/forum/posts` - Create new post
- `POST /api/forum/posts/:id/replies` - Create reply
- `PATCH /api/forum/posts/:id/pin` - Pin/unpin post (admin only)
- `PATCH /api/forum/posts/:id/lock` - Lock/unlock post (admin only)

### Weather Endpoints
- `GET /api/weather/cities` - Get available cities
- `GET /api/weather/:city` - Get current weather
- `GET /api/weather/:city/forecast` - Get 5-day forecast

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/announcements` - Announcements management
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

### Chat Endpoints
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/unread-count` - Get unread message count (admin)
- `PATCH /api/chat/mark-read` - Mark messages as read (admin)

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** on API endpoints
- **JWT token** authentication
- **bcrypt** password hashing
- **Input validation** and sanitization
- **File upload restrictions** and validation
- **SQL injection** protection with parameterized queries

## 🌐 Performance Optimizations

- **Database indexing** for fast queries
- **Weather data caching** to reduce API calls
- **Image optimization** with Sharp.js
- **Gzip compression** for static assets
- **CDN-ready** static file serving
- **Connection pooling** for database
- **Lazy loading** for images and components

## 📊 Monitoring and Analytics

- **Server-side logging** with detailed error tracking
- **Performance monitoring** for database queries
- **User activity tracking** in admin dashboard
- **Download statistics** for documents
- **Forum engagement metrics**
- **Chat activity monitoring**

## 🛠️ Development

### Project Structure
```
agroph/
├── config/           # Database and app configuration
├── database/         # Database schema and migrations
├── middleware/       # Express middleware (auth, validation)
├── routes/          # API route handlers
├── public/          # Frontend static files
│   ├── css/         # Stylesheets
│   ├── js/          # JavaScript modules
│   └── assets/      # Images, icons, fonts
├── uploads/         # User uploaded files
├── server.js        # Main server file
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build assets (placeholder)

### Code Style
- **ES6+** JavaScript features
- **Async/await** for asynchronous operations
- **Modular architecture** with separated concerns
- **RESTful API** design patterns
- **Progressive enhancement** for frontend features

## 🔧 Customization

### Adding New Document Categories
1. Insert into `document_categories` table
2. Update the default data in `database/schema.sql`
3. Restart the application

### Adding New Weather Locations
1. Update `philippineCities` object in `routes/weather.js`
2. Add coordinates for the new location
3. Restart the application

### Customizing Colors and Themes
1. Edit CSS custom properties in `public/css/filipino-theme.css`
2. Update gradient definitions
3. Modify cultural pattern colors

### Adding New Forum Categories
1. Insert into `forum_categories` table
2. Update the default data in `database/schema.sql`
3. Restart the application

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify `DATABASE_URL` is correctly set
- Ensure PostgreSQL service is running
- Check database credentials and permissions

**Weather API Not Working**
- Verify `WEATHER_API_KEY` is set correctly
- Check OpenWeatherMap API key validity
- Ensure API key has sufficient quota

**File Upload Issues**
- Check `uploads/` directory permissions
- Verify `MAX_FILE_SIZE` environment variable
- Ensure disk space is available

**Socket.io Connection Issues**
- Check firewall settings
- Verify WebSocket support
- Check CORS configuration

### Railway-Specific Issues

**Build Failures**
- Check Node.js version compatibility (18+)
- Verify all dependencies are in `package.json`
- Check for any missing environment variables

**Database Issues**
- Ensure PostgreSQL plugin is added to Railway project
- Verify `DATABASE_URL` is automatically set
- Check database connection limits

## 📞 Support

For technical support or questions:
- **Email**: support@agroph.com
- **Forum**: Use the community forum within the application
- **Chat**: Use the live chat widget for real-time support

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **OpenWeatherMap** for weather data API
- **Leaflet** for interactive mapping
- **OpenStreetMap** contributors for map tiles
- **Font Awesome** for icons
- **Google Fonts** for typography
- **Railway** for hosting platform

---

**Created with ❤️ by Marwen Deiparine**

*Empowering Philippine agriculture through technology and community.*