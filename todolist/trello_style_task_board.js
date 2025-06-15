let db;

window.onload = async () => {
  const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.wasm` });
  db = new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, status TEXT, detail TEXT,
    start TEXT, end TEXT
  )`);
  renderTable();
  renderBoard();
};

function renderTable() {
  const tbody = document.getElementById("task-table-body");
  tbody.innerHTML = "";
  const result = db.exec("SELECT * FROM tasks")[0];
  if (!result) return;
  const [cols, rows] = [result.columns, result.values];
  rows.forEach(row => {
    const [id, name, status, detail, start, end] = row;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td><td>${status}</td><td>${detail}</td>
      <td>${start}</td><td>${end}</td>
      <td>
        <button onclick="editTask(${id})" class="text-blue-500">編輯</button>
        <button onclick="deleteTask(${id})" class="text-red-500 ml-2">刪除</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderBoard() {
  const sections = {
    "即將": document.querySelector("#section-upcoming .task-column"),
    "處理中": document.querySelector("#section-doing .task-column"),
    "完成": document.querySelector("#section-done .task-column")
  };
  Object.values(sections).forEach(el => el.innerHTML = "");
  const result = db.exec("SELECT * FROM tasks")[0];
  if (!result) return;
  const rows = result.values;
  rows.forEach(([id, name, status]) => {
    const div = document.createElement("div");
    div.className = "p-2 bg-white rounded shadow";
    div.innerText = name;
    if (sections[status]) sections[status].appendChild(div);
  });
}

function deleteTask(id) {
  db.run("DELETE FROM tasks WHERE id = ?", [id]);
  renderTable();
  renderBoard();
}

document.getElementById("btn-add").onclick = () => openModal();

function openModal(task = null) {
  document.getElementById("task-id").value = task?.id || "";
  document.getElementById("task-name").value = task?.name || "";
  document.getElementById("task-status").value = task?.status || "即將";
  document.getElementById("task-detail").value = task?.detail || "";
  document.getElementById("task-start").value = task?.start || "";
  document.getElementById("task-end").value = task?.end || "";
  document.getElementById("modal-title").innerText = task ? "編輯任務" : "新增任務";
  document.getElementById("task-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("task-modal").classList.add("hidden");
}

function editTask(id) {
  const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    openModal(row);
  }
  stmt.free();
}

function saveTask() {
  const id = document.getElementById("task-id").value;
  const name = document.getElementById("task-name").value.trim();
  const status = document.getElementById("task-status").value;
  const detail = document.getElementById("task-detail").value.trim();
  const start = document.getElementById("task-start").value;
  const end = document.getElementById("task-end").value;

  if (!name || name.length > 100 || detail.length > 500) {
    alert("請填寫正確的資料");
    return;
  }

  if (id) {
    db.run("UPDATE tasks SET name=?, status=?, detail=?, start=?, end=? WHERE id=?",
      [name, status, detail, start, end, id]);
  } else {
    db.run("INSERT INTO tasks (name, status, detail, start, end) VALUES (?, ?, ?, ?, ?)",
      [name, status, detail, start, end]);
  }

  closeModal();
  renderTable();
  renderBoard();
}

document.getElementById("btn-export").onclick = exportToExcel;

function exportToExcel() {
  const result = db.exec("SELECT * FROM tasks")[0];
  if (!result) return alert("沒有資料可匯出");
  const ws = XLSX.utils.aoa_to_sheet([result.columns, ...result.values]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasks");
  XLSX.writeFile(wb, "任務清單.xlsx");
}

document.getElementById("tab-todo").onclick = () => {
  document.getElementById("todo-tab").classList.remove("hidden");
  document.getElementById("board-tab").classList.add("hidden");
};
document.getElementById("tab-board").onclick = () => {
  document.getElementById("todo-tab").classList.add("hidden");
  document.getElementById("board-tab").classList.remove("hidden");
};
