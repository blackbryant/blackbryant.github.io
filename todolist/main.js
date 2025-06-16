// 初始化
 
let editingId = null;

const getEl = id => document.getElementById(id);
const clearForm = () => {
  getEl("taskName").value = "";
  getEl("taskStatus").value = "即將";
  getEl("taskDetail").value = "";
  getEl("startDate").value = "";
  getEl("endDate").value = "";
  editingId = null;
  getEl("createBtn").textContent = "建立";
  getEl("cancelEditBtn").classList.add("hidden");
};

getEl("createBtn").addEventListener("click", () => {
  const name = getEl("taskName").value.trim();
  const status = getEl("taskStatus").value;
  const detail = getEl("taskDetail").value.trim();
  const start = getEl("startDate").value;
  const end = getEl("endDate").value;

  if (!name || !status || !detail || !start) {
    alert("請填寫所有必填欄位");
    return;
  }

  if (editingId) {
    db.run("UPDATE tasks SET name=?, status=?, detail=?, start=?, end=? WHERE id=?", [name, status, detail, start, end, editingId]);
  } else {
    db.run("INSERT INTO tasks (name, status, detail, start, end) VALUES (?, ?, ?, ?, ?)", [name, status, detail, start, end]);
  }

  clearForm();
  renderTable();
});

getEl("cancelEditBtn").addEventListener("click", clearForm);

function renderTable(filter = {}) {
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = [];
  if (filter.status) {
    query += " AND status=?";
    params.push(filter.status);
  }
  if (filter.date) {
    query += " AND start=?";
    params.push(filter.date);
  }

  const res = db.exec(query, params);
  const tbody = getEl("taskTableBody");
  tbody.innerHTML = "";
  if (!res[0]) return;
  const rows = res[0].values;
  for (const row of rows) {
    const [id, name, status, detail, start, end] = row;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-2">${name}</td>
      <td class="p-2">${status}</td>
      <td class="p-2">${detail}</td>
      <td class="p-2">${start}</td>
      <td class="p-2">${end || ""}</td>
      <td class="p-2 space-x-2">
        <button onclick="editTask(${id})" class="text-blue-600">編輯</button>
        <button onclick="deleteTask(${id})" class="text-red-600">刪除</button>
      </td>`;
    tbody.appendChild(tr);
  }
}

function editTask(id) {
  const res = db.exec("SELECT * FROM tasks WHERE id=?", [id]);
  if (!res[0]) return;
  const [row] = res[0].values;
  const [_id, name, status, detail, start, end] = row;
  editingId = _id;
  getEl("taskName").value = name;
  getEl("taskStatus").value = status;
  getEl("taskDetail").value = detail;
  getEl("startDate").value = start;
  getEl("endDate").value = end;
  getEl("createBtn").textContent = "更新";
  getEl("cancelEditBtn").classList.remove("hidden");
}

function deleteTask(id) {
  if (confirm("確定要刪除這筆資料？")) {
    db.run("DELETE FROM tasks WHERE id=?", [id]);
    renderTable();
  }
}

getEl("filterBtn").addEventListener("click", () => {
  const status = getEl("filterStatus").value;
  const date = getEl("filterDate").value;
  renderTable({ status, date });
});

getEl("exportDbBtn").addEventListener("click", () => {
  const data = db.export();
  const blob = new Blob([data], { type: "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tasks.sqlite";
  a.click();
});

getEl("importDbBtn").addEventListener("click", () => getEl("importDbInput").click());
getEl("importDbInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (file) {
    const buffer = await file.arrayBuffer();
    const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${filename}` });
    db = new SQL.Database(new Uint8Array(buffer));
    renderTable();
  }
});

getEl("exportExcelBtn").addEventListener("click", () => {
  const res = db.exec("SELECT * FROM tasks");
  if (!res[0]) return;
  const sheet = XLSX.utils.aoa_to_sheet([res[0].columns, ...res[0].values]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Tasks");
  XLSX.writeFile(wb, "tasks.xlsx");
});

function renderBoard() {
  const res = db.exec("SELECT * FROM tasks");
  const boards = {
    "即將": getEl("todoUpcoming"),
    "處理中": getEl("todoInProgress"),
    "完成": getEl("todoDone")
  };
  for (let key in boards) boards[key].innerHTML = "";
  if (!res[0]) return;
  const rows = res[0].values;
  for (const [_, name, status, detail, start, end] of rows) {
    const div = document.createElement("div");
    div.className = "bg-white rounded p-2 mb-2 shadow";
    div.innerHTML = `<div class="font-bold">${name}</div><div class="text-sm">${detail}</div><div class="text-xs text-gray-500">${start} - ${end || ""}</div>`;
    boards[status]?.appendChild(div);
  }
}

getEl("tab1Btn").addEventListener("click", () => {
  getEl("tab1").classList.remove("hidden");
  getEl("tab2").classList.add("hidden");
});
getEl("tab2Btn").addEventListener("click", () => {
  getEl("tab2").classList.remove("hidden");
  getEl("tab1").classList.add("hidden");
  renderBoard();
});
