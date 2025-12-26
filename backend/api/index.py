import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from utils import assign_roles

def get_db():
    """Подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def handler(event: dict, context) -> dict:
    """API для игры Мафия - управление пользователями, комнатами и игровым процессом"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    path = event.get('queryStringParameters', {}).get('path', '')
    
    try:
        if path == 'register' and method == 'POST':
            return register_user(event)
        elif path == 'user' and method == 'GET':
            return get_user(event)
        elif path == 'rooms' and method == 'GET':
            return list_rooms(event)
        elif path == 'room/create' and method == 'POST':
            return create_room(event)
        elif path == 'room/join' and method == 'POST':
            return join_room(event)
        elif path == 'room/info' and method == 'GET':
            return get_room_info(event)
        elif path == 'leaderboard' and method == 'GET':
            return get_leaderboard(event)
        elif path == 'achievements' and method == 'GET':
            return get_user_achievements(event)
        elif path == 'game/vote' and method == 'POST':
            return vote_player(event)
        elif path == 'room/add-bot' and method == 'POST':
            return add_bot_to_room(event)
        elif path == 'game/start' and method == 'POST':
            return start_game(event)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Endpoint not found'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def register_user(event: dict) -> dict:
    """Регистрация нового пользователя"""
    body = json.loads(event.get('body', '{}'))
    username = body.get('username')
    telegram_id = body.get('telegram_id')
    
    if not username:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO users (username, telegram_id) VALUES (%s, %s) RETURNING id, username, total_games, total_wins",
        (username, telegram_id)
    )
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(user))
    }

def get_user(event: dict) -> dict:
    """Получение информации о пользователе"""
    user_id = event.get('queryStringParameters', {}).get('id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT id, username, total_games, total_wins, created_at FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(user), default=str)
    }

def list_rooms(event: dict) -> dict:
    """Список доступных комнат"""
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT r.id, r.name, r.status, r.max_players, r.created_at,
               COUNT(rp.id) as player_count
        FROM rooms r
        LEFT JOIN room_players rp ON r.id = rp.room_id
        WHERE r.status IN ('waiting', 'playing')
        GROUP BY r.id
        ORDER BY r.created_at DESC
    """)
    rooms = cur.fetchall()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps([dict(r) for r in rooms], default=str)
    }

def create_room(event: dict) -> dict:
    """Создание новой комнаты"""
    body = json.loads(event.get('body', '{}'))
    name = body.get('name')
    host_user_id = body.get('host_user_id')
    max_players = body.get('max_players', 12)
    
    if not name or not host_user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Name and host_user_id required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO rooms (name, host_user_id, max_players) VALUES (%s, %s, %s) RETURNING id, name, status, max_players",
        (name, host_user_id, max_players)
    )
    room = cur.fetchone()
    
    cur.execute(
        "INSERT INTO room_players (room_id, user_id) VALUES (%s, %s)",
        (room['id'], host_user_id)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(room))
    }

def join_room(event: dict) -> dict:
    """Присоединение к комнате"""
    body = json.loads(event.get('body', '{}'))
    room_id = body.get('room_id')
    user_id = body.get('user_id')
    
    if not room_id or not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'room_id and user_id required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT status, max_players FROM rooms WHERE id = %s", (room_id,))
    room = cur.fetchone()
    
    if not room:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Room not found'})
        }
    
    if room['status'] == 'playing':
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Game already started'})
        }
    
    cur.execute("SELECT COUNT(*) as count FROM room_players WHERE room_id = %s", (room_id,))
    player_count = cur.fetchone()['count']
    
    if player_count >= room['max_players']:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Room is full'})
        }
    
    cur.execute(
        "INSERT INTO room_players (room_id, user_id) VALUES (%s, %s) ON CONFLICT (room_id, user_id) DO NOTHING RETURNING id",
        (room_id, user_id)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'joined': result is not None})
    }

def get_room_info(event: dict) -> dict:
    """Получение информации о комнате и игроках"""
    room_id = event.get('queryStringParameters', {}).get('id')
    
    if not room_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Room ID required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, status, max_players, current_phase, phase_ends_at FROM rooms WHERE id = %s", (room_id,))
    room = cur.fetchone()
    
    if not room:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Room not found'})
        }
    
    cur.execute("""
        SELECT u.id, u.username, rp.role, rp.is_alive
        FROM room_players rp
        JOIN users u ON rp.user_id = u.id
        WHERE rp.room_id = %s
        ORDER BY rp.joined_at
    """, (room_id,))
    players = cur.fetchall()
    
    cur.close()
    conn.close()
    
    result = dict(room)
    result['players'] = [dict(p) for p in players]
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result, default=str)
    }

def get_leaderboard(event: dict) -> dict:
    """Получение таблицы лидеров"""
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, username, total_games, total_wins,
               CASE WHEN total_games > 0 THEN ROUND((total_wins::numeric / total_games) * 100) ELSE 0 END as win_rate
        FROM users
        WHERE total_games > 0
        ORDER BY total_wins DESC, win_rate DESC
        LIMIT 50
    """)
    leaderboard = cur.fetchall()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps([dict(l) for l in leaderboard])
    }

def get_user_achievements(event: dict) -> dict:
    """Получение достижений пользователя"""
    user_id = event.get('queryStringParameters', {}).get('user_id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT a.id, a.name, a.description, a.icon,
               ua.unlocked_at IS NOT NULL as unlocked
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = %s
        ORDER BY a.id
    """, (user_id,))
    achievements = cur.fetchall()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps([dict(a) for a in achievements], default=str)
    }

def vote_player(event: dict) -> dict:
    """Голосование за игрока"""
    body = json.loads(event.get('body', '{}'))
    room_id = body.get('room_id')
    actor_id = body.get('actor_id')
    target_id = body.get('target_id')
    
    if not all([room_id, actor_id, target_id]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'room_id, actor_id and target_id required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO game_actions (room_id, actor_user_id, target_user_id, action_type, game_phase) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (room_id, actor_id, target_id, 'vote', 'voting')
    )
    action = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'action_id': action['id']})
    }

def add_bot_to_room(event: dict) -> dict:
    """Добавление бота в комнату (только для создателя)"""
    body = json.loads(event.get('body', '{}'))
    room_id = body.get('room_id')
    
    if not room_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'room_id required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT status, max_players FROM rooms WHERE id = %s", (room_id,))
    room = cur.fetchone()
    
    if not room:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Room not found'})
        }
    
    if room['status'] == 'playing':
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Cannot add bots during game'})
        }
    
    cur.execute("SELECT COUNT(*) as count FROM room_players WHERE room_id = %s", (room_id,))
    player_count = cur.fetchone()['count']
    
    if player_count >= 20:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Maximum 20 players reached'})
        }
    
    cur.execute("SELECT COUNT(*) as count FROM room_players WHERE room_id = %s AND is_bot = true", (room_id,))
    bot_count = cur.fetchone()['count']
    bot_number = bot_count + 1
    
    bot_names = ['Джонни', 'Винни', 'Тони', 'Рокки', 'Макс', 'Дюк', 'Спайк', 'Блейд', 'Рейдер', 'Вайпер', 
                 'Харли', 'Чоппер', 'Револьвер', 'Дизель', 'Циклон', 'Гром', 'Стиль', 'Драйв', 'Буст', 'Нитро']
    bot_username = bot_names[bot_number - 1] if bot_number <= len(bot_names) else f'Бот-{bot_number}'
    
    cur.execute(
        "INSERT INTO users (username, telegram_id) VALUES (%s, %s) RETURNING id",
        (bot_username, None)
    )
    bot_user = cur.fetchone()
    
    cur.execute(
        "INSERT INTO room_players (room_id, user_id, is_bot) VALUES (%s, %s, true)",
        (room_id, bot_user['id'])
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'bot_username': bot_username})
    }

def start_game(event: dict) -> dict:
    """Начало игры с распределением ролей"""
    body = json.loads(event.get('body', '{}'))
    room_id = body.get('room_id')
    
    if not room_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'room_id required'})
        }
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT id, status FROM rooms WHERE id = %s", (room_id,))
    room = cur.fetchone()
    
    if not room:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Room not found'})
        }
    
    if room['status'] != 'waiting':
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Game already started or finished'})
        }
    
    cur.execute("SELECT id FROM room_players WHERE room_id = %s ORDER BY joined_at", (room_id,))
    players = cur.fetchall()
    player_count = len(players)
    
    if player_count < 4:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Minimum 4 players required'})
        }
    
    try:
        roles = assign_roles(player_count)
    except ValueError as e:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    
    for i, player in enumerate(players):
        cur.execute(
            "UPDATE room_players SET role = %s WHERE id = %s",
            (roles[i], player['id'])
        )
    
    cur.execute(
        "UPDATE rooms SET status = 'playing', current_phase = 'night' WHERE id = %s",
        (room_id,)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'message': f'Game started with {player_count} players'})
    }