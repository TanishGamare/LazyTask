/**
 * Lazytask - Main Application Logic
 * A cozy todo + pomodoro application
 */

// ============= STATE =============
const State = {
  tasks: [],
  tags: [],
  settings: {
    theme: 'earth',
    focus_min: '25',
    short_break: '5',
    long_break: '15',
    sessions_before_long: '4',
    sessions_done: '0',
    total_sessions: '0',
    linked_task_id: '',
    compact_sidebar: 'false',
    notifications_enabled: 'true',
    sounds_enabled: 'false',
    auto_start_break: 'false',
    auto_start_focus: 'false',
    garden_enabled: 'true',
    garden_clouds: 'true',
    garden_animals: 'true'
  },
  filters: {
    status: 'all',
    priority: 'all',
    tags: [],
    search: ''
  },
  sort: 'created',
  viewMode: 'kanban',
  editingTaskId: null,
  pomo: {
    running: false,
    phase: 'focus',
    remaining: 25 * 60,
    total: 25 * 60,
    interval: null
  }
};

// ============= API HELPERS =============
const API = {
  async get(endpoint) {
    const res = await fetch(`/api${endpoint}`);
    return res.json();
  },
  async post(endpoint, data) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async put(endpoint, data) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async patch(endpoint, data) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async delete(endpoint) {
    const res = await fetch(`/api${endpoint}`, { method: 'DELETE' });
    return res.json();
  }
};

// ============= INITIALIZATION =============
async function init() {
  await loadData();
  applyTheme(State.settings.theme);
  applyCompactMode();
  initPomoTimer();
  renderAll();
  setupEventListeners();
  initDraggablePanel();
  requestNotificationPermission();
}

async function loadData() {
  try {
    const [tasks, tags, settings] = await Promise.all([
      API.get('/tasks'),
      API.get('/tags'),
      API.get('/settings')
    ]);
    State.tasks = tasks;
    State.tags = tags;
    State.settings = { ...State.settings, ...settings };
    
    // Initialize pomo timer from settings
    State.pomo.remaining = parseInt(State.settings.focus_min) * 60;
    State.pomo.total = State.pomo.remaining;
  } catch (err) {
    console.error('Failed to load data:', err);
    toast('Failed to connect to server', 'error');
  }
}

// ============= THEME =============
function applyTheme(theme) {
  State.settings.theme = theme;
  document.body.setAttribute('data-theme', theme);
  
  // Update active theme button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  
  API.put('/settings', { theme });
}

// ============= NAVIGATION =============
function goPage(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`${page}-page`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  
  if (page === 'focus') {
    renderLinkedTaskPanel();
    // Initialize and start garden
    if (window.Garden) {
      Garden.init();
      Garden.setTotalSessions(parseInt(State.settings.total_sessions) || 0);
      Garden.start();
      updateGardenStats();
    }
  } else {
    // Stop garden animation when leaving focus page
    if (window.Garden) {
      Garden.stop();
    }
  }
}

// ============= FILTERS =============
function setStatusFilter(status) {
  State.filters.status = status;
  updateFilterButtons();
  renderBoard();
}

function setPriorityFilter(priority) {
  State.filters.priority = priority;
  updateFilterButtons();
  renderBoard();
}

function toggleTagFilter(tag) {
  const idx = State.filters.tags.indexOf(tag);
  if (idx === -1) {
    State.filters.tags.push(tag);
  } else {
    State.filters.tags.splice(idx, 1);
  }
  renderTagList();
  renderBoard();
}

function updateFilterButtons() {
  // Status filters
  document.querySelectorAll('[data-status-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.statusFilter === State.filters.status);
  });
  
  // Priority filters
  document.querySelectorAll('[data-priority-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priorityFilter === State.filters.priority);
  });
  
  updateBoardTitle();
  updateFilterCounts();
}

function updateBoardTitle() {
  const titles = {
    all: 'All Tasks',
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done'
  };
  document.getElementById('board-title').textContent = titles[State.filters.status] || 'All Tasks';
}

function updateFilterCounts() {
  const counts = { all: 0, todo: 0, inprogress: 0, done: 0 };
  State.tasks.forEach(t => {
    counts.all++;
    counts[t.status]++;
  });
  
  document.querySelectorAll('[data-status-filter]').forEach(btn => {
    const count = counts[btn.dataset.statusFilter] || 0;
    const countEl = btn.querySelector('.count');
    if (countEl) countEl.textContent = count;
  });
}

// ============= TAGS =============
function renderTagList() {
  const container = document.getElementById('tag-list');
  if (!container) return;
  
  if (State.tags.length === 0) {
    container.innerHTML = '<div class="empty-state"><span>No tags yet</span></div>';
    return;
  }
  
  container.innerHTML = State.tags.map(tag => `
    <button class="tag-pill ${State.filters.tags.includes(tag) ? 'active' : ''}" 
            onclick="toggleTagFilter('${esc(tag)}')">
      ${esc(tag)}
      <span class="remove" onclick="event.stopPropagation(); removeTag('${esc(tag)}')">&times;</span>
    </button>
  `).join('');
}

async function addTag() {
  const input = document.getElementById('new-tag-input');
  const name = input.value.trim().toLowerCase();
  
  if (!name) return;
  if (State.tags.includes(name)) {
    toast('Tag already exists', 'error');
    return;
  }
  
  try {
    await API.post('/tags', { name });
    State.tags.push(name);
    input.value = '';
    renderTagList();
    renderModalTags();
    toast('Tag added');
  } catch (err) {
    toast('Failed to add tag', 'error');
  }
}

async function removeTag(name) {
  try {
    await API.delete(`/tags/${encodeURIComponent(name)}`);
    State.tags = State.tags.filter(t => t !== name);
    State.filters.tags = State.filters.tags.filter(t => t !== name);
    
    // Remove from all tasks in local state
    State.tasks.forEach(task => {
      task.tags = task.tags.filter(t => t !== name);
    });
    
    renderTagList();
    renderBoard();
    toast('Tag removed');
  } catch (err) {
    toast('Failed to remove tag', 'error');
  }
}

// ============= SORTING =============
function setSort(sort) {
  State.sort = sort;
  renderBoard();
}

// ============= TASK RENDERING =============
function getFilteredTasks(statusOverride) {
  let tasks = [...State.tasks];
  
  // Status filter
  const status = statusOverride || State.filters.status;
  if (status !== 'all') {
    tasks = tasks.filter(t => t.status === status);
  }
  
  // Priority filter
  if (State.filters.priority !== 'all') {
    tasks = tasks.filter(t => t.priority === State.filters.priority);
  }
  
  // Tag filter
  if (State.filters.tags.length > 0) {
    tasks = tasks.filter(t => State.filters.tags.every(ft => t.tags.includes(ft)));
  }
  
  // Search filter
  if (State.filters.search) {
    const search = State.filters.search.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(search) ||
      (t.description || '').toLowerCase().includes(search) ||
      t.tags.some(tag => tag.toLowerCase().includes(search))
    );
  }
  
  // Sorting
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => {
    switch (State.sort) {
      case 'priority':
        return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
      case 'due':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      case 'title':
        return a.title.localeCompare(b.title);
      default: // created
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });
  
  return tasks;
}

function getDueInfo(dueDate) {
  if (!dueDate) return { text: '', class: '' };
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.round((due - now) / 86400000);
  
  if (diff < 0) return { text: `Overdue ${Math.abs(diff)}d`, class: 'overdue' };
  if (diff === 0) return { text: 'Due today', class: 'soon' };
  if (diff <= 2) return { text: `Due in ${diff}d`, class: 'soon' };
  return { text: `Due ${dueDate}`, class: '' };
}

function getSubtaskProgress(task) {
  if (!task.subtasks || task.subtasks.length === 0) return null;
  const done = task.subtasks.filter(s => s.done).length;
  return {
    done,
    total: task.subtasks.length,
    percent: Math.round((done / task.subtasks.length) * 100)
  };
}

function createTaskCard(task) {
  const { text: dueText, class: dueClass } = getDueInfo(task.due_date);
  const progress = getSubtaskProgress(task);
  const isLinked = State.settings.linked_task_id == task.id;
  
  return `
    <div class="task-card ${dueClass === 'overdue' ? 'overdue' : ''} ${isLinked ? 'linked' : ''}" 
         data-id="${task.id}" draggable="true">
      <span class="task-priority ${task.priority}">${task.priority}</span>
      <div class="task-title">${esc(task.title)}</div>
      ${task.description ? `<div class="task-desc">${esc(task.description)}</div>` : ''}
      ${task.tags.length ? `
        <div class="task-tags">
          ${task.tags.map(tag => `<span class="task-tag">${esc(tag)}</span>`).join('')}
        </div>
      ` : ''}
      ${dueText ? `<div class="task-due ${dueClass}">${dueText}</div>` : ''}
      ${progress ? `
        <div class="task-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.percent}%"></div>
          </div>
          <div class="progress-label"><span>${progress.done}/${progress.total}</span> subtasks</div>
        </div>
      ` : ''}
      <div class="task-actions">
        <button class="task-action" onclick="openTaskModal(${task.id})">Edit</button>
        <button class="task-action delete" onclick="deleteTask(${task.id})">Delete</button>
        <button class="task-action focus ${isLinked ? 'linked' : ''}" onclick="toggleFocusLink(${task.id})">
          ${isLinked ? '■ Linked' : '▶ Focus'}
        </button>
      </div>
    </div>
  `;
}

function renderBoard() {
  if (State.viewMode === 'kanban') {
    renderKanban();
  } else {
    renderList();
  }
}

function renderKanban() {
  const columns = ['todo', 'inprogress', 'done'];
  
  columns.forEach(status => {
    const tasks = State.filters.status === 'all' 
      ? getFilteredTasks(status)
      : (State.filters.status === status ? getFilteredTasks(status) : []);
    
    const body = document.getElementById(`col-${status}`);
    const count = document.getElementById(`cnt-${status}`);
    
    if (count) count.textContent = tasks.length;
    
    if (body) {
      body.innerHTML = tasks.length 
        ? tasks.map(t => createTaskCard(t)).join('')
        : '<div class="empty-state"><span class="icon">📋</span>No tasks</div>';
      
      // Setup drag events
      setupDragAndDrop(body);
    }
  });
}

function renderList() {
  const container = document.getElementById('list-view');
  const tasks = getFilteredTasks();
  
  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="icon">📋</span>No tasks found</div>';
    return;
  }
  
  container.innerHTML = tasks.map(task => {
    const { text: dueText, class: dueClass } = getDueInfo(task.due_date);
    const progress = getSubtaskProgress(task);
    
    return `
      <div class="list-row">
        <div class="list-row-info">
          <div class="list-row-title">${esc(task.title)}</div>
          ${progress ? `<div style="font-size:0.75rem;color:var(--text-muted)">${progress.done}/${progress.total} subtasks</div>` : ''}
          <div class="list-row-tags">
            ${task.tags.map(tag => `<span class="task-tag">${esc(tag)}</span>`).join('')}
          </div>
        </div>
        <div class="list-row-due ${dueClass}">${dueText || '—'}</div>
        <span class="task-priority ${task.priority}">${task.priority}</span>
        <div class="list-row-actions">
          <button class="task-action" onclick="openTaskModal(${task.id})">Edit</button>
          <button class="task-action delete" onclick="deleteTask(${task.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function setViewMode(mode) {
  State.viewMode = mode;
  document.getElementById('kanban-board').classList.toggle('hidden', mode !== 'kanban');
  document.getElementById('list-view').classList.toggle('active', mode === 'list');
  document.getElementById('view-kanban').classList.toggle('active', mode === 'kanban');
  document.getElementById('view-list').classList.toggle('active', mode === 'list');
  renderBoard();
}

// ============= DRAG & DROP =============
function setupDragAndDrop(container) {
  const cards = container.querySelectorAll('.task-card');
  
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });
  
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);
}

let draggedTaskId = null;

function handleDragStart(e) {
  draggedTaskId = parseInt(e.target.dataset.id);
  e.target.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.style.opacity = '';
  document.querySelectorAll('.column-body').forEach(col => col.classList.remove('drag-over'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  const newStatus = e.currentTarget.id.replace('col-', '');
  const task = State.tasks.find(t => t.id === draggedTaskId);
  
  if (task && task.status !== newStatus) {
    try {
      await API.patch(`/tasks/${draggedTaskId}/status`, { status: newStatus });
      task.status = newStatus;
      renderBoard();
      updateFilterCounts();
      toast(`Moved to ${newStatus === 'inprogress' ? 'In Progress' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
    } catch (err) {
      toast('Failed to move task', 'error');
    }
  }
  
  draggedTaskId = null;
}

// ============= TASK MODAL =============
let subtaskCounter = 100;

function openTaskModal(id = null) {
  State.editingTaskId = id;
  const modal = document.getElementById('task-modal');
  const task = id ? State.tasks.find(t => t.id === id) : null;
  
  document.getElementById('modal-title').textContent = id ? 'Edit Task' : 'New Task';
  document.getElementById('task-title').value = task?.title || '';
  document.getElementById('task-desc').value = task?.description || '';
  document.getElementById('task-status').value = task?.status || 'todo';
  document.getElementById('task-priority').value = task?.priority || 'medium';
  document.getElementById('task-due').value = task?.due_date || '';
  
  renderModalTags(task?.tags || []);
  renderSubtaskEditor(task?.subtasks || []);
  
  modal.classList.add('open');
  setTimeout(() => document.getElementById('task-title').focus(), 100);
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('open');
  State.editingTaskId = null;
}

function renderModalTags(selected = []) {
  const container = document.getElementById('modal-tag-list');
  container.innerHTML = State.tags.map(tag => `
    <button type="button" class="modal-tag ${selected.includes(tag) ? 'selected' : ''}" 
            onclick="this.classList.toggle('selected')">
      ${esc(tag)}
    </button>
  `).join('');
}

function renderSubtaskEditor(subtasks = []) {
  const container = document.getElementById('subtask-edit-list');
  container.innerHTML = subtasks.map(sub => `
    <div class="subtask-edit-row" data-sub-id="${sub.id}">
      <input type="text" class="field-input" value="${esc(sub.text)}" placeholder="Subtask..." data-done="${sub.done}">
      <button type="button" class="subtask-delete-btn" onclick="this.parentElement.remove()">✕</button>
    </div>
  `).join('');
}

function addSubtaskField() {
  const container = document.getElementById('subtask-edit-list');
  const row = document.createElement('div');
  row.className = 'subtask-edit-row';
  row.dataset.subId = ++subtaskCounter;
  row.innerHTML = `
    <input type="text" class="field-input" placeholder="Subtask..." data-done="false">
    <button type="button" class="subtask-delete-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(row);
  row.querySelector('input').focus();
}

async function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) {
    toast('Title is required', 'error');
    return;
  }
  
  const selectedTags = [...document.querySelectorAll('.modal-tag.selected')]
    .map(el => el.textContent.trim());
  
  const subtasks = [...document.querySelectorAll('#subtask-edit-list .subtask-edit-row')]
    .map((row, i) => {
      const input = row.querySelector('input');
      const text = input.value.trim();
      if (!text) return null;
      return {
        id: parseInt(row.dataset.subId) || i + 1,
        text,
        done: input.dataset.done === 'true'
      };
    })
    .filter(Boolean);
  
  const data = {
    title,
    description: document.getElementById('task-desc').value.trim(),
    status: document.getElementById('task-status').value,
    priority: document.getElementById('task-priority').value,
    due_date: document.getElementById('task-due').value,
    tags: selectedTags,
    subtasks
  };
  
  try {
    if (State.editingTaskId) {
      const updated = await API.put(`/tasks/${State.editingTaskId}`, data);
      const idx = State.tasks.findIndex(t => t.id === State.editingTaskId);
      if (idx !== -1) State.tasks[idx] = updated;
      toast('Task updated');
    } else {
      const created = await API.post('/tasks', data);
      State.tasks.unshift(created);
      toast('Task created');
    }
    
    closeTaskModal();
    renderBoard();
    updateFilterCounts();
    renderLinkedTaskPanel();
  } catch (err) {
    toast('Failed to save task', 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  
  try {
    await API.delete(`/tasks/${id}`);
    State.tasks = State.tasks.filter(t => t.id !== id);
    
    if (State.settings.linked_task_id == id) {
      State.settings.linked_task_id = '';
      await API.put('/settings', { linked_task_id: '' });
    }
    
    renderBoard();
    updateFilterCounts();
    renderLinkedTaskPanel();
    toast('Task deleted');
  } catch (err) {
    toast('Failed to delete task', 'error');
  }
}

// ============= FOCUS LINKING =============
async function toggleFocusLink(taskId) {
  const newLinkedId = State.settings.linked_task_id == taskId ? '' : taskId;
  State.settings.linked_task_id = newLinkedId;
  
  try {
    await API.put('/settings', { linked_task_id: newLinkedId.toString() });
    renderBoard();
    renderLinkedTaskPanel();
  } catch (err) {
    toast('Failed to update focus link', 'error');
  }
}

function renderLinkedTaskPanel() {
  const panel = document.getElementById('linked-task-panel');
  const body = document.getElementById('linked-task-body');
  if (!panel || !body) return;
  
  const task = State.settings.linked_task_id 
    ? State.tasks.find(t => t.id == State.settings.linked_task_id)
    : null;
  
  if (!task) {
    panel.classList.add('hidden');
    body.innerHTML = '<div class="no-linked-task">Link a task via ▶ Focus on the board</div>';
    return;
  }
  
  panel.classList.remove('hidden');
  const progress = getSubtaskProgress(task);
  
  const subtasksHtml = task.subtasks?.length
    ? task.subtasks.map(sub => `
        <div class="linked-subtask ${sub.done ? 'done' : ''}" onclick="toggleLinkedSubtask(${task.id}, ${sub.id})">
          <input type="checkbox" ${sub.done ? 'checked' : ''} onclick="event.stopPropagation(); toggleLinkedSubtask(${task.id}, ${sub.id})">
          <span class="linked-subtask-text">${esc(sub.text)}</span>
        </div>
      `).join('')
    : '<div class="no-linked-task">No subtasks</div>';
  
  body.innerHTML = `
    <div class="linked-task-title">${esc(task.title)}</div>
    ${progress ? `
      <div class="linked-task-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress.percent}%"></div>
        </div>
        <div class="progress-text">${progress.done}/${progress.total} subtasks</div>
      </div>
    ` : ''}
    <div class="linked-subtasks">${subtasksHtml}</div>
  `;
}

function unlinkTask() {
  const linkedId = State.settings.linked_task_id;
  if (linkedId) {
    toggleFocusLink(parseInt(linkedId));
  }
}

async function toggleLinkedSubtask(taskId, subtaskId) {
  try {
    const result = await API.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    const task = State.tasks.find(t => t.id === taskId);
    if (task) {
      task.subtasks = result.subtasks;
    }
    renderLinkedTaskPanel();
    renderBoard();
  } catch (err) {
    toast('Failed to toggle subtask', 'error');
  }
}

// ============= POMODORO =============
function initPomoTimer() {
  const focusMin = parseInt(State.settings.focus_min) || 25;
  State.pomo.remaining = focusMin * 60;
  State.pomo.total = State.pomo.remaining;
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const { remaining, total, running, phase } = State.pomo;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  document.getElementById('pomo-timer').textContent = timeStr;
  document.getElementById('pomo-timer').classList.toggle('running', running);
  
  // Phase label
  const phaseEl = document.getElementById('pomo-phase');
  const phaseLabels = { focus: 'Focus', shortbreak: 'Break', longbreak: 'Long Break' };
  phaseEl.textContent = phaseLabels[phase] || 'Focus';
  phaseEl.className = `pomo-phase ${running ? 'running' : ''} ${phase !== 'focus' ? 'break' : ''}`;
  
  // Progress
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const progressFill = document.getElementById('pomo-progress-fill');
  progressFill.style.width = `${progress}%`;
  progressFill.className = `pomo-progress-fill ${phase === 'focus' ? 'focus' : ''}`;
  
  // Play/pause button
  document.getElementById('pomo-play').textContent = running ? '⏸' : '▶';
  
  // Session dots
  renderSessionDots();
}

function renderSessionDots() {
  const container = document.getElementById('pomo-sessions');
  const total = parseInt(State.settings.sessions_before_long) || 4;
  const done = parseInt(State.settings.sessions_done) % total;
  
  container.innerHTML = Array(total).fill(0).map((_, i) => `
    <div class="session-dot ${i < done ? 'done' : ''}"></div>
  `).join('');
}

function togglePomo() {
  if (State.pomo.running) {
    pausePomo();
  } else {
    startPomo();
  }
}

function startPomo() {
  State.pomo.running = true;
  State.pomo.interval = setInterval(() => {
    State.pomo.remaining--;
    updatePomoDisplay();
    
    if (State.pomo.remaining <= 0) {
      endPomoPhase();
    }
  }, 1000);
  updatePomoDisplay();
}

function pausePomo() {
  State.pomo.running = false;
  clearInterval(State.pomo.interval);
  updatePomoDisplay();
}

function resetPomo() {
  pausePomo();
  State.pomo.phase = 'focus';
  State.pomo.remaining = parseInt(State.settings.focus_min) * 60;
  State.pomo.total = State.pomo.remaining;
  updatePomoDisplay();
}

function skipPomo() {
  pausePomo();
  endPomoPhase();
}

async function endPomoPhase() {
  pausePomo();
  
  if (State.pomo.phase === 'focus') {
    // Completed a focus session
    let sessions = parseInt(State.settings.sessions_done) || 0;
    let totalSessions = parseInt(State.settings.total_sessions) || 0;
    sessions++;
    totalSessions++;
    State.settings.sessions_done = sessions.toString();
    State.settings.total_sessions = totalSessions.toString();
    
    await API.put('/settings', { 
      sessions_done: sessions.toString(),
      total_sessions: totalSessions.toString()
    });
    
    // Update garden with new session count
    if (window.Garden) {
      Garden.setTotalSessions(totalSessions);
      updateGardenStats();
    }
    
    const sessionsBeforeLong = parseInt(State.settings.sessions_before_long) || 4;
    const isLongBreak = sessions % sessionsBeforeLong === 0;
    
    State.pomo.phase = isLongBreak ? 'longbreak' : 'shortbreak';
    const breakMin = isLongBreak 
      ? parseInt(State.settings.long_break) 
      : parseInt(State.settings.short_break);
    
    State.pomo.remaining = breakMin * 60;
    State.pomo.total = State.pomo.remaining;
    
    notify(isLongBreak ? '🎉 Long break time!' : '☕ Short break!');
  } else {
    // Completed a break
    State.pomo.phase = 'focus';
    State.pomo.remaining = parseInt(State.settings.focus_min) * 60;
    State.pomo.total = State.pomo.remaining;
    
    notify('🎯 Time to focus!');
  }
  
  updatePomoDisplay();
}

// ============= GARDEN STATS =============
function updateGardenStats() {
  const totalSessions = parseInt(State.settings.total_sessions) || 0;
  const level = window.Garden ? Garden.getLevel() : 1;
  
  const levelEl = document.getElementById('garden-level');
  const sessionsEl = document.getElementById('total-sessions');
  
  if (levelEl) levelEl.textContent = level;
  if (sessionsEl) sessionsEl.textContent = totalSessions;
}

// ============= SETTINGS MODAL =============
function openSettingsModal() {
  // Timer settings
  document.getElementById('settings-focus').value = State.settings.focus_min;
  document.getElementById('settings-short').value = State.settings.short_break;
  document.getElementById('settings-long').value = State.settings.long_break;
  document.getElementById('settings-sessions').value = State.settings.sessions_before_long;
  
  // Update toggle switches
  updateToggle('toggle-compact', State.settings.compact_sidebar === 'true');
  updateToggle('toggle-notifications', State.settings.notifications_enabled === 'true');
  updateToggle('toggle-sounds', State.settings.sounds_enabled === 'true');
  updateToggle('toggle-autobreak', State.settings.auto_start_break === 'true');
  updateToggle('toggle-autofocus', State.settings.auto_start_focus === 'true');
  updateToggle('toggle-garden', State.settings.garden_enabled === 'true');
  updateToggle('toggle-clouds', State.settings.garden_clouds === 'true');
  updateToggle('toggle-animals', State.settings.garden_animals === 'true');
  
  // Update theme selection
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.theme === State.settings.theme);
  });
  
  // Update garden preview
  const totalSessions = parseInt(State.settings.total_sessions) || 0;
  const level = window.Garden ? Garden.getLevel() : Math.min(8, Math.floor(totalSessions / 3) + 1);
  document.getElementById('preview-level').textContent = level;
  document.getElementById('preview-sessions').textContent = totalSessions;
  
  // Reset to first tab
  switchSettingsTab('general');
  
  document.getElementById('settings-modal').classList.add('open');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('open');
}

function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.settings-panel').forEach(p => {
    p.classList.toggle('active', p.id === `settings-${tab}`);
  });
}

function updateToggle(id, active) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('active', active);
}

function toggleCompactMode() {
  const el = document.getElementById('toggle-compact');
  el.classList.toggle('active');
}

function toggleNotifications() {
  const el = document.getElementById('toggle-notifications');
  el.classList.toggle('active');
}

function toggleSounds() {
  const el = document.getElementById('toggle-sounds');
  el.classList.toggle('active');
}

function toggleAutoBreak() {
  const el = document.getElementById('toggle-autobreak');
  el.classList.toggle('active');
}

function toggleAutoFocus() {
  const el = document.getElementById('toggle-autofocus');
  el.classList.toggle('active');
}

function toggleGardenEnabled() {
  const el = document.getElementById('toggle-garden');
  el.classList.toggle('active');
}

function toggleClouds() {
  const el = document.getElementById('toggle-clouds');
  el.classList.toggle('active');
}

function toggleAnimals() {
  const el = document.getElementById('toggle-animals');
  el.classList.toggle('active');
}

function selectTheme(theme) {
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.theme === theme);
  });
}

async function resetGardenProgress() {
  if (!confirm('Reset your garden progress to Level 1? This will set your total sessions to 0.')) {
    return;
  }
  
  State.settings.total_sessions = '0';
  await API.put('/settings', { total_sessions: '0' });
  
  if (window.Garden) {
    Garden.setTotalSessions(0);
  }
  
  // Update preview
  document.getElementById('preview-level').textContent = '1';
  document.getElementById('preview-sessions').textContent = '0';
  updateGardenStats();
  
  toast('Garden progress reset');
}

function applyCompactMode() {
  const isCompact = State.settings.compact_sidebar === 'true';
  document.body.classList.toggle('compact-sidebar', isCompact);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('peek');
  
  // Remove peek when mouse leaves sidebar
  const removePeek = () => {
    sidebar.classList.remove('peek');
    sidebar.removeEventListener('mouseleave', removePeek);
  };
  sidebar.addEventListener('mouseleave', removePeek);
}

// ============= DRAGGABLE LINKED TASK PANEL =============
function initDraggablePanel() {
  const panel = document.getElementById('linked-task-panel');
  const header = document.getElementById('linked-task-header');
  if (!panel || !header) return;
  
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.linked-task-close')) return;
    
    isDragging = true;
    panel.classList.add('dragging');
    
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const page = document.getElementById('focus-page');
    const pageRect = page.getBoundingClientRect();
    
    let newX = e.clientX - offsetX - pageRect.left;
    let newY = e.clientY - offsetY - pageRect.top;
    
    // Constrain to page bounds
    newX = Math.max(0, Math.min(newX, pageRect.width - panel.offsetWidth));
    newY = Math.max(0, Math.min(newY, pageRect.height - panel.offsetHeight));
    
    panel.style.left = newX + 'px';
    panel.style.top = newY + 'px';
    panel.style.right = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      panel.classList.remove('dragging');
    }
  });
}

async function saveAllSettings() {
  // Gather all settings
  const focusMin = Math.max(1, parseInt(document.getElementById('settings-focus').value) || 25);
  const shortBreak = Math.max(1, parseInt(document.getElementById('settings-short').value) || 5);
  const longBreak = Math.max(1, parseInt(document.getElementById('settings-long').value) || 15);
  const sessionsBeforeLong = Math.max(1, parseInt(document.getElementById('settings-sessions').value) || 4);
  
  const compactSidebar = document.getElementById('toggle-compact').classList.contains('active');
  const notificationsEnabled = document.getElementById('toggle-notifications').classList.contains('active');
  const soundsEnabled = document.getElementById('toggle-sounds').classList.contains('active');
  const autoStartBreak = document.getElementById('toggle-autobreak').classList.contains('active');
  const autoStartFocus = document.getElementById('toggle-autofocus').classList.contains('active');
  const gardenEnabled = document.getElementById('toggle-garden').classList.contains('active');
  const gardenClouds = document.getElementById('toggle-clouds').classList.contains('active');
  const gardenAnimals = document.getElementById('toggle-animals').classList.contains('active');
  
  // Get selected theme
  const selectedTheme = document.querySelector('.theme-option.selected')?.dataset.theme || State.settings.theme;
  
  // Update state
  State.settings.focus_min = focusMin.toString();
  State.settings.short_break = shortBreak.toString();
  State.settings.long_break = longBreak.toString();
  State.settings.sessions_before_long = sessionsBeforeLong.toString();
  State.settings.compact_sidebar = compactSidebar.toString();
  State.settings.notifications_enabled = notificationsEnabled.toString();
  State.settings.sounds_enabled = soundsEnabled.toString();
  State.settings.auto_start_break = autoStartBreak.toString();
  State.settings.auto_start_focus = autoStartFocus.toString();
  State.settings.garden_enabled = gardenEnabled.toString();
  State.settings.garden_clouds = gardenClouds.toString();
  State.settings.garden_animals = gardenAnimals.toString();
  State.settings.theme = selectedTheme;
  
  try {
    await API.put('/settings', {
      focus_min: focusMin.toString(),
      short_break: shortBreak.toString(),
      long_break: longBreak.toString(),
      sessions_before_long: sessionsBeforeLong.toString(),
      compact_sidebar: compactSidebar.toString(),
      notifications_enabled: notificationsEnabled.toString(),
      sounds_enabled: soundsEnabled.toString(),
      auto_start_break: autoStartBreak.toString(),
      auto_start_focus: autoStartFocus.toString(),
      garden_enabled: gardenEnabled.toString(),
      garden_clouds: gardenClouds.toString(),
      garden_animals: gardenAnimals.toString(),
      theme: selectedTheme
    });
    
    // Apply theme
    applyTheme(selectedTheme);
    
    // Apply compact mode
    applyCompactMode();
    
    // Update garden options
    if (window.Garden) {
      Garden.setOptions({
        enabled: gardenEnabled,
        clouds: gardenClouds,
        animals: gardenAnimals
      });
    }
    
    // Update timer if not running and in focus phase
    if (!State.pomo.running && State.pomo.phase === 'focus') {
      State.pomo.remaining = focusMin * 60;
      State.pomo.total = State.pomo.remaining;
      updatePomoDisplay();
    }
    
    closeSettingsModal();
    toast('Settings saved');
  } catch (err) {
    toast('Failed to save settings', 'error');
  }
}

// Keep old saveSettings for backward compatibility
async function saveSettings() {
  await saveAllSettings();
}

// ============= NOTIFICATIONS =============
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function notify(msg) {
  toast(msg);
  
  // Desktop notifications
  if (State.settings.notifications_enabled === 'true' && 
      'Notification' in window && Notification.permission === 'granted') {
    new Notification('Lazytask', { body: msg });
  }
  
  // Play a gentle sound if enabled
  if (State.settings.sounds_enabled === 'true') {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 520;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  }
}

// ============= TOAST =============
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ============= UTILITIES =============
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============= EVENT LISTENERS =============
function setupEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeSettingsModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      openTaskModal();
    }
    // Space to toggle timer on focus page
    if (e.key === ' ' && document.getElementById('focus-page').classList.contains('active')) {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePomo();
      }
    }
  });
  
  // Search input
  document.getElementById('search-input')?.addEventListener('input', e => {
    State.filters.search = e.target.value.toLowerCase();
    renderBoard();
  });
  
  // Add tag on Enter
  document.getElementById('new-tag-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTag();
  });
  
  // Sort select
  document.getElementById('sort-select')?.addEventListener('change', e => {
    setSort(e.target.value);
  });
}

// ============= RENDER ALL =============
function renderAll() {
  renderTagList();
  renderBoard();
  updateFilterButtons();
  updatePomoDisplay();
}

// ============= INITIALIZE =============
document.addEventListener('DOMContentLoaded', init);
