-- AgroPH Database Schema
-- Created by Marwen Deiparine

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url VARCHAR(255),
    location VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Document categories
CREATE TABLE IF NOT EXISTS document_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    category_id INTEGER REFERENCES document_categories(id) ON DELETE SET NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    download_count INTEGER DEFAULT 0,
    tags TEXT[], -- PostgreSQL array for tags
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum categories
CREATE TABLE IF NOT EXISTS forum_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#10B981',
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum posts
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES forum_categories(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP,
    last_reply_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum replies
CREATE TABLE IF NOT EXISTS forum_replies (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    parent_reply_id INTEGER REFERENCES forum_replies(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'admin', 'system')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather cache (to reduce API calls)
CREATE TABLE IF NOT EXISTS weather_cache (
    id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    weather_data JSONB NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_weather_cache_location ON weather_cache(location);

-- Insert default data
INSERT INTO document_categories (name, description, icon, color) VALUES
('Agricultural Forms', 'Official forms for farming and agriculture', 'fas fa-seedling', '#10B981'),
('Business Registration', 'Business and cooperative registration documents', 'fas fa-building', '#3B82F6'),
('Permits & Licenses', 'Various permits and licensing forms', 'fas fa-certificate', '#F59E0B'),
('Financial Aid', 'Loan applications and financial assistance forms', 'fas fa-coins', '#EF4444'),
('Training Materials', 'Educational and training resources', 'fas fa-graduation-cap', '#8B5CF6'),
('Government Forms', 'General government forms and applications', 'fas fa-landmark', '#6B7280')
ON CONFLICT DO NOTHING;

INSERT INTO forum_categories (name, description, icon, color) VALUES
('General Discussion', 'General topics about agriculture in the Philippines', 'fas fa-comments', '#10B981'),
('Crop Management', 'Discussions about crop cultivation and management', 'fas fa-leaf', '#22C55E'),
('Livestock & Poultry', 'Topics about animal husbandry and livestock', 'fas fa-horse', '#F97316'),
('Technology & Innovation', 'Agricultural technology and innovations', 'fas fa-cogs', '#3B82F6'),
('Market & Trading', 'Agricultural market trends and trading', 'fas fa-chart-line', '#EF4444'),
('Government Programs', 'Information about government agricultural programs', 'fas fa-flag', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- Create admin user (password: admin123 - should be changed in production)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@agroph.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin')
ON CONFLICT DO NOTHING;