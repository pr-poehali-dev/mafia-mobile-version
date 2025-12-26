import json
import os
import hmac
import hashlib
from urllib.parse import unquote
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db():
    """Подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def handler(event: dict, context) -> dict:
    """Telegram авторизация через Telegram Login Widget"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        return verify_telegram_auth(body)
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def verify_telegram_auth(data: dict) -> dict:
    """Проверка подлинности данных от Telegram"""
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot token not configured'})
        }
    
    received_hash = data.pop('hash', None)
    if not received_hash:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Hash missing'})
        }
    
    data_check_string = '\n'.join([f'{k}={v}' for k, v in sorted(data.items())])
    
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    if calculated_hash != received_hash:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid authentication'})
        }
    
    telegram_id = data.get('id')
    username = data.get('username') or data.get('first_name', 'User')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    photo_url = data.get('photo_url')
    
    full_name = f"{first_name} {last_name}".strip() or username
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT id, username, total_games, total_wins FROM users WHERE telegram_id = %s", (telegram_id,))
    user = cur.fetchone()
    
    if user:
        cur.execute(
            "UPDATE users SET username = %s, avatar_url = %s, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = %s RETURNING id, username, total_games, total_wins",
            (full_name, photo_url, telegram_id)
        )
        user = cur.fetchone()
    else:
        cur.execute(
            "INSERT INTO users (telegram_id, username, avatar_url) VALUES (%s, %s, %s) RETURNING id, username, total_games, total_wins",
            (telegram_id, full_name, photo_url)
        )
        user = cur.fetchone()
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(user))
    }
