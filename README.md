# 💤 LAZYTASK

## This is an vibe-coded todo site ✨
## Its build around my need in an Todo App but since i don't really like the idea of downloading a seperate application i just vibe-coded one for me 😌
## It contains a pomodoro timer 🍅 where you can link a specific task to the timer
## It automatically creates a progressbar 📊 for task and subtask which comes in handy to quickly see the progress you have made.

---

## 🖥️ Preview

![Main View](./assets/main.png)
![Focus Mode](./assets/focus.png)

---

## ⚡ Features

- 📝 **Kanban Board** – Drag-and-drop tasks across columns: Todo, In Progress, Done
- 🍅 **Pomodoro Timer** – Focus sessions with automatic break management
- 🌱 **Growing Garden Village** – Watch your village grow with each completed session!
- 🎨 **4 Soothing Themes** – Earth, Ocean, Coffee, and Twilight palettes
- ✅ **Subtask Tracking** – Break tasks into subtasks with progress indicators
- 📅 **Due Dates & Alerts** – Visual indicators for upcoming and overdue tasks
- 🏷️ **Tag System** – Organize tasks with custom tags
- 🔍 **Search & Sort** – Find tasks quickly with real-time search
- 📋 **List/Kanban Views** – Switch between board and list layouts
- 🎯 **Linked Focus** – Link tasks to your pomodoro sessions
- 🔔 **Desktop Notifications** – Get notified when timer phases end
- 💾 **Persistent Backend** – SQLite database stores all your data
- ⌨️ **Keyboard Shortcuts** – `Ctrl+N` new task, `Space` play/pause, `Esc` close

---

## 🌱 Garden Village Progression

Your garden grows as you complete focus sessions:

| Level | Sessions | What Appears |
|-------|----------|--------------|
| 1 | 0-4 | Basic grass and small sprouts |
| 2 | 5-9 | Flowers and butterflies |
| 3 | 10-19 | Trees and rabbits |
| 4 | 20-34 | Cozy cottage and birds |
| 5 | 35-49 | Garden fence and pond |
| 6 | 50-74 | Windmill and deer |
| 7 | 75-99 | Full village with well |
| 8 | 100+ | Magical garden with fireflies, moon, and rainbow! |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+

### Run the App

```bash
# Clone the repo
git clone https://github.com/nishant-k-7/Lazytask.git
cd Lazytask

# Option 1: Use the run script
./run.sh

# Option 2: Manual setup
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
python app.py
```

Open **http://localhost:5000** in your browser.

---

## 🎨 Themes

| Theme | Description |
|-------|-------------|
| **Earth** | Warm browns, sage greens, muted oranges |
| **Ocean** | Calm blues and sandy neutrals |
| **Coffee** | Cozy cream, mocha, and forest green (light mode) |
| **Twilight** | Dark mode with soft purple/pink accents |

Switch themes using the colored dots in the header.

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Task | `Ctrl/Cmd + N` |
| Play/Pause Timer | `Space` (in Focus mode) |
| Close Modal | `Esc` |

---

## 📁 Project Structure

```
Lazytask/
├── backend/
│   ├── app.py           # Flask server
│   ├── requirements.txt
│   └── lazytask.db      # SQLite database (auto-created)
├── static/
│   ├── css/
│   │   ├── themes.css   # Theme color schemes
│   │   └── main.css     # All UI styles
│   └── js/
│       ├── app.js       # Main application logic
│       └── garden.js    # Garden village rendering
├── templates/
│   └── index.html       # Main HTML template
├── assets/              # Screenshots
├── run.sh               # Quick start script
└── README.md
```

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| PATCH | `/api/tasks/:id/status` | Update task status |
| GET | `/api/tags` | Get all tags |
| POST | `/api/tags` | Create a tag |
| DELETE | `/api/tags/:name` | Delete a tag |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

---

## 🔄 What Changed (v2.0)

This is a complete rebuild from the original vibe-coded version:

- **Added Python/Flask Backend** – Data now persists in SQLite database
- **Redesigned UI** – Soothing, eye-friendly design with smooth animations
- **🌱 Growing Garden Village** – Gamified focus mode where your village grows!
  - Plants sprout and grow
  - Animals appear (butterflies, rabbits, birds, deer)
  - Buildings unlock (cottage, fence, windmill, well)
  - Level 8 unlocks magical nighttime scene with fireflies
- **4 New Themes** – Carefully designed color schemes that are easy on the eyes
- **Improved Animations** – Subtle hover effects, transitions, and micro-interactions
- **Better Code Structure** – Separated HTML, CSS, and JS into proper files
- **RESTful API** – Full CRUD API for tasks, tags, and settings

---

## 🧠 Why I built this

Didn't want another bloated app.
Didn't want to download anything.
So I just made one that does exactly what I need.

---

Made with ❤️ for productive, cozy work sessions.
