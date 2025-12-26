-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    total_games INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host_user_id INT REFERENCES users(id),
    max_players INT DEFAULT 12,
    status VARCHAR(50) DEFAULT 'waiting',
    current_phase VARCHAR(50) DEFAULT 'lobby',
    phase_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP
);

-- Room players table
CREATE TABLE IF NOT EXISTS room_players (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id),
    user_id INT REFERENCES users(id),
    role VARCHAR(50),
    is_alive BOOLEAN DEFAULT true,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- Game actions table (votes, kills, etc)
CREATE TABLE IF NOT EXISTS game_actions (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id),
    actor_user_id INT REFERENCES users(id),
    target_user_id INT REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    game_phase VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    requirement_type VARCHAR(100),
    requirement_value INT
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    achievement_id INT REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
('Первая кровь', 'Убей первого игрока', '🩸', 'first_kill', 1),
('Выживальщик', 'Выживи 10 раз подряд', '🛡️', 'survive_streak', 10),
('Маэстро', 'Выиграй 50 игр', '🏆', 'total_wins', 50),
('Детектив', 'Раскрой мафию 20 раз', '🔍', 'catch_mafia', 20),
('Легенда', 'Выиграй 100 игр', '👑', 'total_wins', 100)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_room ON game_actions(room_id);
