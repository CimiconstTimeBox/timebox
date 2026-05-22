/* ==========================================================================
   EL TIMEBOX — SCRIPT DE LA AGENDA INTERACTIVA (app.js)
   ========================================================================== */

// --- CONFIGURACIÓN E INDICADORES HORARIOS (Igual al diario físico) ---
const hoursMap = [
  { val: 7, time00: '07:00', time30: '07:30' },
  { val: 8, time00: '08:00', time30: '08:30' },
  { val: 9, time00: '09:00', time30: '09:30' },
  { val: 10, time00: '10:00', time30: '10:30' },
  { val: 11, time00: '11:00', time30: '11:30' },
  { val: 12, time00: '12:00', time30: '12:30' },
  { val: 13, time00: '13:00', time30: '13:30' },
  { val: 14, time00: '14:00', time30: '14:30' },
  { val: 15, time00: '15:00', time30: '15:30' },
  { val: 16, time00: '16:00', time30: '16:30' },
  { val: 17, time00: '17:00', time30: '17:30' },
  { val: 18, time00: '18:00', time30: '18:30' },
  { val: 19, time00: '19:00', time30: '19:30' },
  { val: 20, time00: '20:00', time30: '20:30' },
  { val: 21, time00: '21:00', time30: '21:30' }
];

// Generar array plano de franjas horarias en orden
const timeSlotsOrder = [];
hoursMap.forEach(row => {
  timeSlotsOrder.push(row.time00);
  timeSlotsOrder.push(row.time30);
});

// --- ESTADO DE LA AGENDA ---
const state = {
  currentDate: '', // Formato YYYY-MM-DD
  theme: 'paper-light', // 'paper-light' | 'paper-dark'
  // Estructura de los datos cargados del día activo
  dayData: {
    priorities: ['', '', ''],
    braindump: [],
    schedule: {} // Formato: { "09:00": { id, text }, "09:30": ... }
  }
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar polyfill para arrastrar en dispositivos táctiles (iPhones, iPads, Android)
  if (typeof MobileDragDrop !== 'undefined') {
    MobileDragDrop.polyfill({
      dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
    });
  }

  initDate();
  loadTheme();
  renderHoursGrid();
  loadDayData();
  setupEventListeners();
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// --- GESTIÓN DE FECHAS ---
function initDate() {
  const today = new Date();
  state.currentDate = formatDateToString(today);
  
  const datePicker = document.getElementById('date-picker');
  datePicker.value = state.currentDate;
  
  updateDisplayDateLabel(today);
}

function formatDateToString(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function updateDisplayDateLabel(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  let dateStr = date.toLocaleDateString('es-ES', options);
  
  // Capitalizar la primera letra
  dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  document.getElementById('display-date').innerText = dateStr;
}

// --- BASE DE DATOS LOCAL STORAGE ---
function loadDayData() {
  const storageKey = `timebox_agenda_${state.currentDate}`;
  const savedData = localStorage.getItem(storageKey);
  
  if (savedData) {
    state.dayData = JSON.parse(savedData);
    // Asegurar estructura
    if (!state.dayData.priorities) state.dayData.priorities = ['', '', ''];
    if (!state.dayData.braindump) state.dayData.braindump = [];
    if (!state.dayData.schedule) state.dayData.schedule = {};
  } else {
    // Inicializar día vacío
    state.dayData = {
      priorities: ['', '', ''],
      braindump: [],
      schedule: {}
    };
  }

  // Volcar datos a la interfaz
  document.getElementById('priority-1').value = state.dayData.priorities[0] || '';
  document.getElementById('priority-2').value = state.dayData.priorities[1] || '';
  document.getElementById('priority-3').value = state.dayData.priorities[2] || '';
  
  renderBrainDumpList();
  fillScheduleGrid();
}

function saveDayData() {
  const storageKey = `timebox_agenda_${state.currentDate}`;
  localStorage.setItem(storageKey, JSON.stringify(state.dayData));
}

// --- CONFIGURACIÓN DE TEMA ---
function loadTheme() {
  const savedTheme = localStorage.getItem('timebox_agenda_theme');
  if (savedTheme) {
    state.theme = savedTheme;
  }
  applyTheme();
}

function applyTheme() {
  document.body.className = '';
  document.body.classList.add(`theme-${state.theme}`);
  
  const btn = document.getElementById('btn-toggle-theme');
  const sunIcon = btn.querySelector('.sun-icon');
  const moonIcon = btn.querySelector('.moon-icon');
  
  if (state.theme === 'paper-light') {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'paper-light' ? 'paper-dark' : 'paper-light';
  localStorage.setItem('timebox_agenda_theme', state.theme);
  applyTheme();
}

// --- RENDERIZACIÓN DE LA AGENDA (CUADRÍCULA DE HORAS) ---
function renderHoursGrid() {
  const gridContainer = document.getElementById('time-grid');
  gridContainer.innerHTML = '';
  
  hoursMap.forEach(row => {
    const hourRowDiv = document.createElement('div');
    hourRowDiv.className = 'hour-row';
    
    // Label de la hora
    const labelDiv = document.createElement('div');
    labelDiv.className = 'hour-label';
    labelDiv.innerText = row.val;
    hourRowDiv.appendChild(labelDiv);
    
    // Celda de :00
    const cell00 = document.createElement('div');
    cell00.className = 'time-cell';
    cell00.setAttribute('data-time', row.time00);
    hourRowDiv.appendChild(cell00);
    
    // Celda de :30
    const cell30 = document.createElement('div');
    cell30.className = 'time-cell';
    cell30.setAttribute('data-time', row.time30);
    hourRowDiv.appendChild(cell30);
    
    gridContainer.appendChild(hourRowDiv);
  });
}

// --- CONFIGURACIÓN DE ASOCIACIONES DE EVENTOS ---
function setupEventListeners() {
  // Navegación de Días (Botones)
  document.getElementById('btn-prev-day').addEventListener('click', () => changeDay(-1));
  document.getElementById('btn-next-day').addEventListener('click', () => changeDay(1));
  
  // Date Picker
  const datePicker = document.getElementById('date-picker');
  datePicker.addEventListener('change', (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      state.currentDate = selectedDate;
      const parsedDate = new Date(selectedDate + 'T00:00:00'); // prevenir desfase timezone
      updateDisplayDateLabel(parsedDate);
      loadDayData();
    }
  });

  // Cambio de Tema
  document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);

  // Guardar Prioridades al Escribir (Autosave en tiempo real)
  ['priority-1', 'priority-2', 'priority-3'].forEach((id, index) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state.dayData.priorities[index] = e.target.value.trim();
      saveDayData();
    });
  });

  // Añadir Tarea en Descarga de Ideas
  document.getElementById('add-idea-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('idea-input');
    const text = input.value.trim();
    
    if (text) {
      const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false
      };
      
      state.dayData.braindump.push(newTask);
      saveDayData();
      renderBrainDumpList();
      input.value = '';
    }
  });

  // Configurar las Zonas Receptoras (Drop Zones) de la Grilla de Horario
  setupDropZones();
}

function changeDay(offset) {
  const parts = state.currentDate.split('-');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + offset);
  
  state.currentDate = formatDateToString(date);
  document.getElementById('date-picker').value = state.currentDate;
  updateDisplayDateLabel(date);
  
  loadDayData();
}

// --- RENDERIZACIÓN DE DESCASGA DE IDEAS (BRAIN DUMP) ---
function renderBrainDumpList() {
  const listContainer = document.getElementById('idea-list');
  listContainer.innerHTML = '';
  
  if (state.dayData.braindump.length === 0) {
    listContainer.innerHTML = `
      <li class="empty-list-notice">
        <i data-lucide="sparkles" class="empty-icon"></i>
        <p>Tu mente está despejada.</p>
        <span>Escribe tus tareas arriba y arrástralas al horario para estructurar tu día.</span>
      </li>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  state.dayData.braindump.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-card ${task.completed ? 'completed' : ''}`;
    li.setAttribute('draggable', 'true');
    li.setAttribute('data-task-id', task.id);
    
    li.innerHTML = `
      <div class="task-text">${task.text}</div>
      <button class="delete-task-btn" onclick="event.stopPropagation(); deleteBrainDumpTask('${task.id}')" title="Eliminar tarea">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    
    // Eventos de arrastre nativo en cada tarjeta
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    
    // Doble clic para tachar/completar de forma manual
    li.addEventListener('dblclick', () => toggleBrainDumpTaskComplete(task.id));
    
    listContainer.appendChild(li);
  });
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

window.deleteBrainDumpTask = function(taskId) {
  // 1. Quitar de la descarga de ideas
  state.dayData.braindump = state.dayData.braindump.filter(t => t.id !== taskId);
  
  // 2. Quitar del horario si estaba asignada
  for (const timeKey in state.dayData.schedule) {
    if (state.dayData.schedule[timeKey].id === taskId) {
      delete state.dayData.schedule[timeKey];
    }
  }
  
  saveDayData();
  renderBrainDumpList();
  fillScheduleGrid();
};

function toggleBrainDumpTaskComplete(taskId) {
  const task = state.dayData.braindump.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveDayData();
    renderBrainDumpList();
  }
}

// --- SISTEMA DRAG & DROP (ARRASRE Y SOLTADO) ---
let draggedElement = null;
let draggedTaskId = null;
let isDraggedFromSchedule = false;
let sourceTimeSlot = null;

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedTaskId = draggedElement.getAttribute('data-task-id');
  isDraggedFromSchedule = false;
  
  draggedElement.classList.add('dragging');
  
  // Configurar dato de arrastre
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedTaskId);
}

function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
  }
  draggedElement = null;
  draggedTaskId = null;
  isDraggedFromSchedule = false;
  sourceTimeSlot = null;
}

// Configurar celdas horarias como zonas receptoras
function setupDropZones() {
  const cells = document.querySelectorAll('.time-cell');
  cells.forEach(cell => {
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cell.classList.add('drag-over');
    });
    
    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drag-over');
    });
    
    cell.addEventListener('drop', handleDropOnCell);
    
    // Doble clic en celda vacía para crear tarea directamente
    cell.addEventListener('dblclick', (e) => {
      if (e.currentTarget.children.length === 0) {
        const text = prompt('Escribe la actividad para esta franja horaria:');
        if (text && text.trim()) {
          const time = cell.getAttribute('data-time');
          const tempId = Date.now().toString();
          
          // Crear en descarga de ideas como tachada
          const newTask = { id: tempId, text: text.trim(), completed: true };
          state.dayData.braindump.push(newTask);
          
          // Asignar en el horario
          state.dayData.schedule[time] = { id: tempId, text: text.trim() };
          
          saveDayData();
          renderBrainDumpList();
          fillScheduleGrid();
        }
      }
    });
  });

  // Configurar las Prioridades Clave como zonas receptoras de arrastre
  const priorityRows = document.querySelectorAll('.priority-row');
  priorityRows.forEach((row, index) => {
    row.addEventListener('dragover', (e) => {
      if (!isDraggedFromSchedule && draggedTaskId) {
        e.preventDefault();
        row.classList.add('drag-over');
      }
    });
    
    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over');
    });
    
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drag-over');
      
      if (!isDraggedFromSchedule && draggedTaskId) {
        const task = state.dayData.braindump.find(t => t.id === draggedTaskId);
        if (task) {
          // 1. Establecer valor visual y en el estado
          const inputField = row.querySelector('.priority-input');
          if (inputField) {
            inputField.value = task.text;
          }
          state.dayData.priorities[index] = task.text;
          
          // 2. Marcar la tarea original en descarga de ideas como completada (tachada)
          task.completed = true;
          
          saveDayData();
          renderBrainDumpList();
        }
      }
    });
  });

  // Habilitar la lista de descarga de ideas como receptora para quitar del horario
  const brainDumpPaper = document.querySelector('.dotted-paper-container');
  brainDumpPaper.addEventListener('dragover', (e) => {
    if (isDraggedFromSchedule) {
      e.preventDefault();
      brainDumpPaper.style.boxShadow = '0 0 12px rgba(var(--accent-rgb), 0.2)';
    }
  });

  brainDumpPaper.addEventListener('dragleave', () => {
    brainDumpPaper.style.boxShadow = '';
  });

  brainDumpPaper.addEventListener('drop', (e) => {
    e.preventDefault();
    brainDumpPaper.style.boxShadow = '';
    
    if (isDraggedFromSchedule && sourceTimeSlot) {
      // 1. Destachar la tarea en descarga de ideas (opcional, para conveniencia del usuario)
      const taskId = state.dayData.schedule[sourceTimeSlot].id;
      const task = state.dayData.braindump.find(t => t.id === taskId);
      if (task) {
        task.completed = false;
      }
      
      // 2. Borrar del horario
      delete state.dayData.schedule[sourceTimeSlot];
      
      saveDayData();
      renderBrainDumpList();
      fillScheduleGrid();
    }
  });
}

// --- FUNCIONES AUXILIARES PARA DURACIÓN Y COLISIONES ---

function getOccupiedSlotsMap() {
  const occupied = {}; // slot => { type: 'start'|'extension', parentSlot: string, text: string }
  for (const timeKey in state.dayData.schedule) {
    occupied[timeKey] = { type: 'start', parentSlot: timeKey, text: state.dayData.schedule[timeKey].text };
    const taskData = state.dayData.schedule[timeKey];
    const duration = taskData.duration || 1;
    const startIdx = timeSlotsOrder.indexOf(timeKey);
    if (startIdx !== -1) {
      for (let i = 1; i < duration; i++) {
        const nextIdx = startIdx + i;
        if (nextIdx < timeSlotsOrder.length) {
          const nextSlot = timeSlotsOrder[nextIdx];
          occupied[nextSlot] = { type: 'extension', parentSlot: timeKey, text: taskData.text };
        }
      }
    }
  }
  return occupied;
}

function formatDuration(blocks) {
  const mins = blocks * 30;
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
}

function checkOverlapsAndConfirm(startSlot, duration, ignoreSlot = null) {
  const startIdx = timeSlotsOrder.indexOf(startSlot);
  if (startIdx === -1) return true;
  
  const occupiedMap = getOccupiedSlotsMap();
  const conflictingSlots = new Set();
  
  for (let i = 0; i < duration; i++) {
    const idx = startIdx + i;
    if (idx >= timeSlotsOrder.length) {
      alert('La tarea se extiende más allá del horario disponible (21:30).');
      return false;
    }
    const slot = timeSlotsOrder[idx];
    const occupation = occupiedMap[slot];
    if (occupation && occupation.parentSlot !== ignoreSlot) {
      conflictingSlots.add(occupation.parentSlot);
    }
  }
  
  if (conflictingSlots.size > 0) {
    const listNames = Array.from(conflictingSlots).map(slot => `"${state.dayData.schedule[slot].text}"`).join(', ');
    if (!confirm(`Esta acción colisiona con la(s) tarea(s): ${listNames}. ¿Deseas reemplazarla(s) y liberar ese espacio?`)) {
      return false;
    }
    
    // Si el usuario acepta, eliminamos las tareas conflictivas
    conflictingSlots.forEach(slot => {
      removeTaskFromSchedule(slot);
    });
  }
  
  return true;
}

window.changeTaskDuration = function(timeSlot, offset) {
  const taskData = state.dayData.schedule[timeSlot];
  if (!taskData) return;
  
  const currentDuration = taskData.duration || 1;
  const newDuration = currentDuration + offset;
  
  if (newDuration < 1 || newDuration > 10) return;
  
  if (offset > 0) {
    const isOk = checkOverlapsAndConfirm(timeSlot, newDuration, timeSlot);
    if (!isOk) return;
  }
  
  taskData.duration = newDuration;
  saveDayData();
  fillScheduleGrid();
};

function handleDropOnCell(e) {
  e.preventDefault();
  const cell = e.currentTarget;
  cell.classList.remove('drag-over');
  
  const destTime = cell.getAttribute('data-time');
  
  if (isDraggedFromSchedule) {
    // --- REORGANIZAR DENTRO DE LA AGENDA ---
    if (sourceTimeSlot && sourceTimeSlot !== destTime) {
      const taskToMove = state.dayData.schedule[sourceTimeSlot];
      const duration = taskToMove.duration || 1;
      
      // Comprobar solapamientos ignorando la posición original de la propia tarea
      const isOk = checkOverlapsAndConfirm(destTime, duration, sourceTimeSlot);
      if (!isOk) return;
      
      // Mover a nueva celda y borrar de la original
      state.dayData.schedule[destTime] = taskToMove;
      delete state.dayData.schedule[sourceTimeSlot];
      
      saveDayData();
      fillScheduleGrid();
    }
  } else {
    // --- COLOCAR TAREA DESDE EL BRAIN DUMP ---
    const taskId = e.dataTransfer.getData('text/plain');
    const task = state.dayData.braindump.find(t => t.id === taskId);
    
    if (task) {
      // Comprobar solapamientos para una duración inicial de 1 bloque (30m)
      const isOk = checkOverlapsAndConfirm(destTime, 1);
      if (!isOk) return;
      
      // Registrar en el horario con duración de 1
      state.dayData.schedule[destTime] = {
        id: task.id,
        text: task.text,
        duration: 1
      };
      
      // Tachar automáticamente en la descarga de ideas al asignarla al horario
      task.completed = true;
      
      saveDayData();
      renderBrainDumpList();
      fillScheduleGrid();
    }
  }
}

// --- RENDERIZACIÓN Y LLENADO DEL HORARIO ---
function fillScheduleGrid() {
  // Limpiar celdas previas
  const cells = document.querySelectorAll('.time-cell');
  cells.forEach(cell => {
    cell.innerHTML = '';
  });
  
  // Llenar celdas con tareas del estado actual
  for (const timeKey in state.dayData.schedule) {
    const cell = document.querySelector(`.time-cell[data-time="${timeKey}"]`);
    if (cell) {
      const taskData = state.dayData.schedule[timeKey];
      const durationBlocks = taskData.duration || 1;
      
      const taskElement = document.createElement('div');
      taskElement.className = 'scheduled-task';
      taskElement.setAttribute('draggable', 'true');
      taskElement.setAttribute('data-task-id', taskData.id);
      taskElement.setAttribute('data-time-slot', timeKey);
      
      const durationBadge = `<span class="sched-duration">${formatDuration(durationBlocks)}</span>`;
      
      taskElement.innerHTML = `
        ${durationBadge}
        <span class="sched-text" title="${taskData.text}">${taskData.text}</span>
        <div class="sched-actions">
          <button class="sched-btn btn-duration-dec" onclick="event.stopPropagation(); changeTaskDuration('${timeKey}', -1)" title="Reducir 30m">
            <i data-lucide="minus"></i>
          </button>
          <button class="sched-btn btn-duration-inc" onclick="event.stopPropagation(); changeTaskDuration('${timeKey}', 1)" title="Extender 30m">
            <i data-lucide="plus"></i>
          </button>
          <button class="sched-btn btn-remove-sched" onclick="event.stopPropagation(); removeTaskFromSchedule('${timeKey}')" title="Quitar del horario">
            <i data-lucide="x"></i>
          </button>
        </div>
      `;
      
      // Eventos de arrastre específicos de tareas ya agendadas
      taskElement.addEventListener('dragstart', (e) => {
        draggedElement = e.currentTarget;
        draggedTaskId = taskData.id;
        isDraggedFromSchedule = true;
        sourceTimeSlot = timeKey;
        
        taskElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `sched_${timeKey}`);
      });
      
      taskElement.addEventListener('dragend', handleDragEnd);
      
      cell.appendChild(taskElement);
    }
  }
  
  // Renderizar bloques de extensión para celdas cubiertas por tareas de larga duración
  const occupiedMap = getOccupiedSlotsMap();
  for (const timeKey in occupiedMap) {
    const occupation = occupiedMap[timeKey];
    if (occupation.type === 'extension') {
      const cell = document.querySelector(`.time-cell[data-time="${timeKey}"]`);
      if (cell) {
        const extElement = document.createElement('div');
        extElement.className = 'extension-block';
        extElement.title = `Continuación de: ${occupation.text}`;
        extElement.innerHTML = `<span class="sched-text">↳ ${occupation.text}</span>`;
        cell.appendChild(extElement);
      }
    }
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

window.removeTaskFromSchedule = function(timeSlot) {
  const slotData = state.dayData.schedule[timeSlot];
  if (slotData) {
    // Destachar la tarea en descarga de ideas
    const task = state.dayData.braindump.find(t => t.id === slotData.id);
    if (task) {
      task.completed = false;
    }
    
    // Quitar del horario
    delete state.dayData.schedule[timeSlot];
    
    saveDayData();
    renderBrainDumpList();
    fillScheduleGrid();
  }
};
