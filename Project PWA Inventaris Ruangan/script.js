// ==========================================
// DATA INVENTARIS AWAL & VARIABEL GLOBAL
// ==========================================
let inventoryData = JSON.parse(localStorage.getItem('inventarisData')) || [
  { id: '1', name: 'Proyektor Epson', code: 'PRJ-001', room: 'Ruang Meeting A', quantity: 2, condition: 'Baik' },
  { id: '2', name: 'Kursi Kantor Ergonomis', code: 'KRS-014', room: 'Ruang Kerja 1', quantity: 15, condition: 'Baik' },
  { id: '3', name: 'AC Split 2 PK', code: 'AC-008', room: 'Ruang Server', quantity: 1, condition: 'Rusak Ringan' }
];

let conditionChartInstance = null;
let roomChartInstance = null;
let deferredPrompt;

// --- DOM ELEMENTS ---
const themeToggle = document.getElementById('themeToggle');
const btnInstall = document.getElementById('btnInstall');
const inventoryGrid = document.getElementById('inventoryGrid');
const filterRoom = document.getElementById('filterRoom');
const filterCondition = document.getElementById('filterCondition');
const searchInput = document.getElementById('searchInput');

// Modal Elements
const itemModal = document.getElementById('itemModal');
const modalCard = document.getElementById('modalCard');
const modalTitle = document.getElementById('modalTitle');
const itemForm = document.getElementById('itemForm');
const itemId = document.getElementById('itemId');
const itemName = document.getElementById('itemName');
const itemCode = document.getElementById('itemCode');
const itemRoom = document.getElementById('itemRoom');
const itemQuantity = document.getElementById('itemQuantity');
const itemCondition = document.getElementById('itemCondition');

const btnOpenModal = document.getElementById('btnOpenModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnExport = document.getElementById('btnExport');
const importFile = document.getElementById('importFile');

// ==========================================
// 1. PENANGANAN TEMA (DARK/LIGHT MODE)
// ==========================================
function applyTheme(theme) {
  const htmlEl = document.documentElement;
  const themeIcon = document.getElementById('themeIcon');
  
  if (theme === 'dark') {
    htmlEl.classList.add('dark');
    htmlEl.classList.remove('light');
    if (themeIcon) themeIcon.className = 'bi bi-sun-fill text-amber-400';
  } else {
    htmlEl.classList.add('light');
    htmlEl.classList.remove('dark');
    if (themeIcon) themeIcon.className = 'bi bi-moon-stars-fill text-cyan-500';
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }
}

initTheme();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    if (typeof updateCharts === 'function') {
      updateCharts();
    }
  });
}

// ==========================================
// 2. SIMPAN & RENDER DATA INVENTARIS
// ==========================================
function saveToLocalStorage() {
  localStorage.setItem('inventarisData', JSON.stringify(inventoryData));
}

function renderInventory(data = inventoryData) {
  if (!inventoryGrid) return;
  inventoryGrid.innerHTML = '';
  
  if (data.length === 0) {
    inventoryGrid.innerHTML = `
      <div class="col-span-full text-center py-10">
        <i class="bi bi-inbox text-4xl text-slate-300 dark:text-slate-600"></i>
        <p class="mt-2 text-xs text-slate-400">Tidak ada data inventaris yang ditemukan.</p>
      </div>
    `;
    return;
  }

  data.forEach(item => {
    let badgeColor = '';
    if (item.condition === 'Baik') badgeColor = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300';
    else if (item.condition === 'Rusak Ringan') badgeColor = 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300';
    else badgeColor = 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300';

    const card = document.createElement('div');
    card.className = 'p-4 cyber-card rounded-2xl border transition space-y-3 bg-white dark:bg-slate-900/60 shadow-sm';
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <span class="text-[10px] font-mono text-cyan-500 dark:text-cyan-400 font-semibold uppercase">${item.code}</span>
          <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">${item.name}</h4>
        </div>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold ${badgeColor}">
          ${item.condition}
        </span>
      </div>
      <div class="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p class="flex items-center gap-1.5"><i class="bi bi-geo-alt-fill text-cyan-400"></i> ${item.room}</p>
        <p class="flex items-center gap-1.5"><i class="bi bi-boxes text-pink-400"></i> Jumlah: <strong class="text-slate-700 dark:text-slate-200">${item.quantity} Unit</strong></p>
      </div>
      <div class="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-end gap-2">
        <button onclick="editItem('${item.id}')" class="px-3 py-1.5 text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 rounded-xl font-medium hover:bg-cyan-100 transition flex items-center gap-1">
          <i class="bi bi-pencil-square"></i> Edit
        </button>
        <button onclick="deleteItem('${item.id}')" class="px-3 py-1.5 text-xs bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 rounded-xl font-medium hover:bg-rose-100 transition flex items-center gap-1">
          <i class="bi bi-trash"></i> Hapus
        </button>
      </div>
    `;
    inventoryGrid.appendChild(card);
  });

  populateRoomFilter();
}

function populateRoomFilter() {
  if (!filterRoom) return;
  const rooms = [...new Set(inventoryData.map(item => item.room))];
  const currentValue = filterRoom.value;
  filterRoom.innerHTML = '<option value="">Semua Ruangan</option>';
  rooms.forEach(room => {
    const opt = document.createElement('option');
    opt.value = room;
    opt.textContent = room;
    if (room === currentValue) opt.selected = true;
    filterRoom.appendChild(opt);
  });
}

// ==========================================
// 3. FUNGSI GRAFIK (CHART.JS)
// ==========================================
function updateCharts() {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#cbd5e1' : '#475569';

  const conditions = { 'Baik': 0, 'Rusak Ringan': 0, 'Rusak Berat': 0 };
  inventoryData.forEach(item => {
    if (conditions[item.condition] !== undefined) {
      conditions[item.condition] += Number(item.quantity);
    }
  });

  const conditionElem = document.getElementById('conditionChart');
  if (conditionElem) {
    const ctxCondition = conditionElem.getContext('2d');
    if (conditionChartInstance) conditionChartInstance.destroy();
    conditionChartInstance = new Chart(ctxCondition, {
      type: 'doughnut',
      data: {
        labels: ['Baik', 'Rusak Ringan', 'Rusak Berat'],
        datasets: [{
          data: [conditions['Baik'], conditions['Rusak Ringan'], conditions['Rusak Berat']],
          backgroundColor: ['#4ade80', '#fbbf24', '#f87171'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, font: { size: 11 } } }
        }
      }
    });
  }

  const roomCounts = {};
  inventoryData.forEach(item => {
    roomCounts[item.room] = (roomCounts[item.room] || 0) + Number(item.quantity);
  });

  const roomElem = document.getElementById('roomChart');
  if (roomElem) {
    const ctxRoom = roomElem.getContext('2d');
    if (roomChartInstance) roomChartInstance.destroy();
    roomChartInstance = new Chart(ctxRoom, {
      type: 'bar',
      data: {
        labels: Object.keys(roomCounts),
        datasets: [{
          label: 'Jumlah Barang',
          data: Object.values(roomCounts),
          backgroundColor: '#00f2fe',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: isDark ? '#1e293b' : '#e2e8f0' } }
        }
      }
    });
  }
}

// ==========================================
// 4. FILTER DAN PENCARIAN
// ==========================================
function filterData() {
  const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
  const selectedRoom = filterRoom ? filterRoom.value : '';
  const selectedCondition = filterCondition ? filterCondition.value : '';

  const filtered = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchValue) || item.code.toLowerCase().includes(searchValue);
    const matchesRoom = selectedRoom === '' || item.room === selectedRoom;
    const matchesCondition = selectedCondition === '' || item.condition === selectedCondition;
    return matchesSearch && matchesRoom && matchesCondition;
  });

  renderInventory(filtered);
}

if (searchInput) searchInput.addEventListener('input', filterData);
if (filterRoom) filterRoom.addEventListener('change', filterData);
if (filterCondition) filterCondition.addEventListener('change', filterData);

// ==========================================
// 5. MODAL DAN MANAJEMEN DATA (CRUD)
// ==========================================
function openModal(isEdit = false) {
  if (!itemModal) return;
  itemModal.classList.remove('hidden');
  setTimeout(() => {
    itemModal.classList.remove('opacity-0');
    if (modalCard) {
      modalCard.classList.remove('scale-95');
      modalCard.classList.add('scale-100');
    }
  }, 10);

  if (!isEdit && itemForm) {
    if (modalTitle) modalTitle.textContent = 'Tambah Barang Baru';
    itemForm.reset();
    if (itemId) itemId.value = '';
  }
}

function closeModal() {
  if (!itemModal) return;
  itemModal.classList.add('opacity-0');
  if (modalCard) {
    modalCard.classList.remove('scale-100');
    modalCard.classList.add('scale-95');
  }
  setTimeout(() => {
    itemModal.classList.add('hidden');
  }, 300);
}

if (btnOpenModal) btnOpenModal.addEventListener('click', () => openModal(false));
if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

if (itemForm) {
  itemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const idVal = itemId.value;
    const newItem = {
      id: idVal ? idVal.toString() : Date.now().toString(),
      name: itemName.value,
      code: itemCode.value,
      room: itemRoom.value,
      quantity: parseInt(itemQuantity.value),
      condition: itemCondition.value
    };

    if (idVal) {
      const index = inventoryData.findIndex(item => item.id.toString() === idVal.toString());
      if (index !== -1) {
        inventoryData[index] = newItem;
      }
    } else {
      inventoryData.push(newItem);
    }

    saveToLocalStorage();
    renderInventory();
    updateCharts();
    closeModal();
  });
}

window.editItem = function(id) {
  const item = inventoryData.find(i => i.id.toString() === id.toString());
  if (item) {
    if (itemId) itemId.value = item.id;
    if (itemName) itemName.value = item.name;
    if (itemCode) itemCode.value = item.code;
    if (itemRoom) itemRoom.value = item.room;
    if (itemQuantity) itemQuantity.value = item.quantity;
    if (itemCondition) itemCondition.value = item.condition;

    if (modalTitle) modalTitle.textContent = 'Edit Data Barang';
    openModal(true);
  }
};

window.deleteItem = function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
    inventoryData = inventoryData.filter(item => item.id.toString() !== id.toString());
    saveToLocalStorage();
    renderInventory();
    updateCharts();
  }
};

// ==========================================
// 6. EXPORT & IMPORT DATA (JSON)
// ==========================================
if (btnExport) {
  btnExport.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventoryData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `inventaris_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });
}

if (importFile) {
  importFile.addEventListener('change', (e) => {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          inventoryData = importedData;
          saveToLocalStorage();
          renderInventory();
          updateCharts();
          alert('Data berhasil di-import!');
        } else {
          alert('Format file JSON tidak valid!');
        }
      } catch (err) {
        alert('Gagal membaca file JSON!');
      }
    };
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0]);
    }
  });
}

// ==========================================
// INITIAL RENDER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  renderInventory();
  updateCharts();
});