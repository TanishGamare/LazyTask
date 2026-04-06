"""
Lazytask - Flask Backend
A cozy todo + pomodoro application
"""
import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__, 
            template_folder='../templates',
            static_folder='../static')
CORS(app)

DATABASE = os.path.join(os.path.dirname(__file__), 'lazytask.db')

def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with schema."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'todo',
            priority TEXT DEFAULT 'medium',
            due_date TEXT,
            tags TEXT DEFAULT '[]',
            subtasks TEXT DEFAULT '[]',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tags table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Settings table for pomodoro and theme preferences
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')
    
    # Insert default settings if not exist
    defaults = {
        'theme': 'earth',
        'focus_min': '25',
        'short_break': '5',
        'long_break': '15',
        'sessions_before_long': '4',
        'sessions_done': '0',
        'total_sessions': '0',  # Lifetime sessions for garden growth
        'linked_task_id': '',
        'compact_sidebar': 'false',
        'notifications_enabled': 'true',
        'sounds_enabled': 'false',
        'auto_start_break': 'false',
        'auto_start_focus': 'false',
        'garden_enabled': 'true',
        'garden_clouds': 'true',
        'garden_animals': 'true'
    }
    for key, value in defaults.items():
        cursor.execute('''
            INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
        ''', (key, value))
    
    # Insert default tags if empty
    cursor.execute('SELECT COUNT(*) FROM tags')
    if cursor.fetchone()[0] == 0:
        default_tags = ['work', 'personal', 'urgent', 'learning', 'health']
        for tag in default_tags:
            cursor.execute('INSERT INTO tags (name) VALUES (?)', (tag,))
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# ============= ROUTES =============

@app.route('/')
def index():
    """Serve the main application."""
    return render_template('index.html')

# ----------- TASKS API -----------

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    tasks = []
    for row in rows:
        task = dict(row)
        task['tags'] = json.loads(task['tags'])
        task['subtasks'] = json.loads(task['subtasks'])
        tasks.append(task)
    
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task."""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO tasks (title, description, status, priority, due_date, tags, subtasks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('title', ''),
        data.get('description', ''),
        data.get('status', 'todo'),
        data.get('priority', 'medium'),
        data.get('due_date', ''),
        json.dumps(data.get('tags', [])),
        json.dumps(data.get('subtasks', []))
    ))
    
    task_id = cursor.lastrowid
    conn.commit()
    
    # Fetch and return the created task
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    row = cursor.fetchone()
    conn.close()
    
    task = dict(row)
    task['tags'] = json.loads(task['tags'])
    task['subtasks'] = json.loads(task['subtasks'])
    
    return jsonify(task), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task."""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE tasks SET
            title = ?,
            description = ?,
            status = ?,
            priority = ?,
            due_date = ?,
            tags = ?,
            subtasks = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('title', ''),
        data.get('description', ''),
        data.get('status', 'todo'),
        data.get('priority', 'medium'),
        data.get('due_date', ''),
        json.dumps(data.get('tags', [])),
        json.dumps(data.get('subtasks', [])),
        task_id
    ))
    
    conn.commit()
    
    # Fetch and return the updated task
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        return jsonify({'error': 'Task not found'}), 404
    
    task = dict(row)
    task['tags'] = json.loads(task['tags'])
    task['subtasks'] = json.loads(task['subtasks'])
    
    return jsonify(task)

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tasks/<int:task_id>/status', methods=['PATCH'])
def update_task_status(task_id):
    """Update just the status of a task (for drag & drop)."""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    ''', (data.get('status', 'todo'), task_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tasks/<int:task_id>/subtasks/<int:subtask_id>/toggle', methods=['PATCH'])
def toggle_subtask(task_id, subtask_id):
    """Toggle a subtask's done status."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT subtasks FROM tasks WHERE id = ?', (task_id,))
    row = cursor.fetchone()
    
    if row is None:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    
    subtasks = json.loads(row['subtasks'])
    for sub in subtasks:
        if sub.get('id') == subtask_id:
            sub['done'] = not sub.get('done', False)
            break
    
    cursor.execute('UPDATE tasks SET subtasks = ? WHERE id = ?', (json.dumps(subtasks), task_id))
    conn.commit()
    conn.close()
    
    return jsonify({'subtasks': subtasks})

# ----------- TAGS API -----------

@app.route('/api/tags', methods=['GET'])
def get_tags():
    """Get all tags."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM tags ORDER BY name')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([row['name'] for row in rows])

@app.route('/api/tags', methods=['POST'])
def create_tag():
    """Create a new tag."""
    data = request.json
    name = data.get('name', '').strip().lower()
    if not name:
        return jsonify({'error': 'Tag name required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO tags (name) VALUES (?)', (name,))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Tag already exists'}), 400
    conn.close()
    return jsonify({'name': name}), 201

@app.route('/api/tags/<string:name>', methods=['DELETE'])
def delete_tag(name):
    """Delete a tag."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tags WHERE name = ?', (name,))
    
    # Also remove from all tasks
    cursor.execute('SELECT id, tags FROM tasks')
    for row in cursor.fetchall():
        tags = json.loads(row['tags'])
        if name in tags:
            tags.remove(name)
            cursor.execute('UPDATE tasks SET tags = ? WHERE id = ?', (json.dumps(tags), row['id']))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ----------- SETTINGS API -----------

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get all settings."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM settings')
    rows = cursor.fetchall()
    conn.close()
    return jsonify({row['key']: row['value'] for row in rows})

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update settings."""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    for key, value in data.items():
        cursor.execute('''
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        ''', (key, str(value)))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    print("\n🍵 Lazytask is running!")
    print("   Open http://localhost:5000 in your browser\n")
    app.run(debug=True, port=5000)
