/* KidVision Observations V1.3 */
const { useEffect, useMemo, useState } = React;
const STORAGE_KEY = "kidvision-observations:v1.3";
function uid() { return Math.random().toString(36).slice(2, 10); }
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function average(arr) { if (!arr?.length) return 0; return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*100)/100; }
const palette = { blue: "#2563eb", pink: "#db2777", gray: "#1f2937", grayLight: "#374151", bg: "#0b1220", card: "#0f172a", border: "#1f2937", soft: "#111827" };
const SEED = { students: [], observations: [] };
function todayIso() { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }


function App() {
  const [state, setState] = useState(() => loadState() || SEED);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [rating, setRating] = useState(3);
  const [note, setNote] = useState("");
  const [obsDate, setObsDate] = useState(todayIso());
  const [tab, setTab] = useState("delegate"); // delegate | records

  useEffect(() => { saveState(state); }, [state]);

  const obsByStudent = useMemo(() => {
    const map = new Map();
    for (const ob of state.observations) {
      if (!map.has(ob.studentId)) map.set(ob.studentId, []);
      map.get(ob.studentId).push(ob);
    }
    for (const arr of map.values()) arr.sort((a,b)=>b.ts - a.ts);
    return map;
  }, [state.observations]);

  const filteredStudents = useMemo(() => {
    if (!query.trim()) return state.students;
    const q = query.toLowerCase();
    return state.students.filter(s => `${s.first} ${s.lastInitial}`.toLowerCase().includes(q));
  }, [state.students, query]);

  function addStudent(first, lastInitial) {
    const f = (first||"").trim(); const l = (lastInitial||"").trim().replace(/\.$/, "").slice(0,1).toUpperCase();
    if (!f || !l) return;
    const s = { id: uid(), first: f, lastInitial: l };
    setState(st => ({ ...st, students: [s, ...st.students] }));
    setSelectedId(s.id);
  }

  function bulkAddStudents(list) {
    // list = array of {first, lastInitial}
    const cleaned = [];
    for (const item of list) {
      const f = (item.first||"").trim();
      let l = (item.lastInitial||"").trim();
      if (!f) continue;
      if (!l && item.last) l = String(item.last)[0] || "";
      l = l.replace(/\.$/, "").slice(0,1).toUpperCase();
      if (!l) continue;
      cleaned.push({ id: uid(), first: f, lastInitial: l });
    }
    if (cleaned.length) setState(st => ({ ...st, students: [...cleaned, ...st.students] }));
  }

  function removeStudent(id) {
    setState(st => ({ students: st.students.filter(s=>s.id!==id), observations: st.observations.filter(o=>o.studentId!==id) }));
    if (selectedId === id) setSelectedId(null);
  }

  function addObservation() {
    if (!selectedId) return;
    // Build timestamp using selected date + current time
    const [y,m,d] = obsDate.split("-").map(n=>parseInt(n,10));
    const now = new Date();
    const ts = new Date(y, (m-1), d, now.getHours(), now.getMinutes(), now.getSeconds()).getTime();
    const ob = { id: uid(), studentId: selectedId, rating, note: note.trim(), ts };
    setState(st => ({ ...st, observations: [ob, ...st.observations] }));
    setNote("");
  }

  function deleteObservation(id) {
    setState(st => ({ ...st, observations: st.observations.filter(o=>o.id!==id) }));
  }

  return (
    <div className="min-h-screen" style={{ background: `radial-gradient(1200px 600px at 20% -10%, ${palette.blue}20, transparent), radial-gradient(800px 400px at 100% 0%, ${palette.pink}12, transparent), ${palette.bg}` }}>
      <div className="container-narrow px-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "white" }}>KidVision Observations</h1>
            <p className="text-sm" style={{ color: "#94a3b8" }}>Quick 1–5 ratings • 5 = above proficiency</p>
          </div>
          <div className="flex items-center gap-2">
            <UploadStudents onBulkAdd={bulkAddStudents} />
          </div>
        </header>

        {/* Search + chips */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="col-span-2 flex gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search students" className="flex-1 px-4 py-3 rounded-2xl outline-none" style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }} />
          </div>
          <NewStudentForm onAdd={addStudent} />
        </div>

        {/* Bubbles / chips selector */}
        <div className="mt-4 p-3 rounded-2xl" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <div className="text-sm mb-2" style={{ color: "#cbd5e1" }}>Tap a student bubble to select</div>
          <StudentChips students={filteredStudents} selectedId={selectedId} onSelect={setSelectedId} onRemove={removeStudent} />
        </div>

        {/* Right panel with tabs */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"></div>
          <div className="lg:col-span-1 p-4 rounded-2xl sticky top-4 h-fit" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
            <div className="flex mb-3 gap-2">
              <button onClick={()=>setTab('delegate')} className={`flex-1 px-3 py-2 rounded-xl font-medium ${tab==='delegate'?'bg-blue-600 text-white':'bg-gray-700 text-gray-300'}`}>Delegate</button>
              <button onClick={()=>setTab('records')} className={`flex-1 px-3 py-2 rounded-xl font-medium ${tab==='records'?'bg-pink-600 text-white':'bg-gray-700 text-gray-300'}`}>Records</button>
            </div>
            {tab==='delegate' ? (
              selectedId ? (
                <StudentDetail
                  key={selectedId}
                  student={state.students.find(s=>s.id===selectedId)}
                  onAddObservation={addObservation}
                  rating={rating}
                  setRating={setRating}
                  note={note}
                  setNote={setNote}
                  obsDate={obsDate}
                  setObsDate={setObsDate}
                />
              ) : <div className="text-sm" style={{ color: "#9ca3af" }}>Select a student bubble to add an observation.</div>
            ) : (
              <RecordsViewer
                students={state.students}
                observations={obsByStudent}
                deleteObservation={deleteObservation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function NewStudentForm({ onAdd }) {
  const [first, setFirst] = useState(""); const [last, setLast] = useState("");
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onAdd(first,last); setFirst(""); setLast(""); }} className="grid grid-cols-3 gap-2">
      <input className="col-span-1 px-4 py-3 rounded-2xl outline-none" placeholder="First name" value={first} onChange={(e)=>setFirst(e.target.value)} style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }} required />
      <input className="col-span-1 px-4 py-3 rounded-2xl outline-none" placeholder="Last initial" value={last} onChange={(e)=>setLast(e.target.value.toUpperCase().slice(0,1))} maxLength={1} style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }} required />
      <button className="col-span-1 px-4 py-3 rounded-2xl font-medium" style={{ background: palette.blue, color: "white" }}>Add Student</button>
    </form>
  );
}

function UploadStudents({ onBulkAdd }) {
  function parseCSV(text) {
    // Accepts formats:
    // First,Last or First,LastInitial or First LastInitial
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const list = [];
    for (let line of lines) {
      if (line.includes(",")) {
        const [first, last] = line.split(",").map(s=>s.trim());
        list.push({ first, last, lastInitial: (last||"")[0] });
      } else {
        const parts = line.split(/\s+/);
        const first = parts[0] || "";
        const lastInitial = (parts[1]||"").replace(/\.$/,'').slice(0,1).toUpperCase();
        list.push({ first, lastInitial });
      }
    }
    return list;
  }
  function onFile(e){
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const list = parseCSV(text);
      onBulkAdd(list);
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  return (
    <div className="flex items-center gap-2">
      <label className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer" style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }}>
        Upload names (CSV/TXT)
        <input type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
      </label>
    </div>
  );
}

function StudentChips({ students, selectedId, onSelect, onRemove }) {
  return (
    <div className="flex flex-wrap gap-2">
      {students.length === 0 && <div className="text-sm" style={{ color: "#9ca3af" }}>No students yet. Add or upload above.</div>}
      {students.map(s => (
        <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: selectedId===s.id ? '#0b1220' : palette.soft, border: `1px solid ${palette.border}` }}>
          <button onClick={()=>onSelect(s.id)} className="flex items-center gap-2">
            <Avatar name={`${s.first} ${s.lastInitial}.`} />
            <span className="text-sm" style={{ color: "white" }}>{s.first} {s.lastInitial}.</span>
          </button>
          <button title="Remove" onClick={()=>onRemove(s.id)} className="text-xs" style={{ color: "#9ca3af" }}>✕</button>
        </div>
      ))}
    </div>
  );
}

function StudentDetail({ student, onAddObservation, rating, setRating, note, setNote, obsDate, setObsDate }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={`${student.first} ${student.lastInitial}.`} large />
        <div>
          <div className="text-xl font-semibold" style={{ color: "white" }}>{student.first} {student.lastInitial}.</div>
        </div>
      </div>
      <div className="p-3 rounded-xl mb-3" style={{ background: palette.soft, border: `1px solid ${palette.border}` }}>
        <div className="text-sm mb-2" style={{ color: "#cbd5e1" }}>Add an observation</div>
        <div className="flex items-center gap-2 mb-2">
          <RatingPicker value={rating} onChange={setRating} />
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#111827", color: "#cbd5e1", border: `1px solid ${palette.border}` }}>1 = needs support • 5 = above proficiency</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs" style={{ color: "#cbd5e1" }}>Date</label>
          <input type="date" value={obsDate} onChange={(e)=>setObsDate(e.target.value)} className="px-3 py-2 rounded-xl text-sm" style={{ background: "#0b1220", color: "#e5e7eb", border: `1px solid ${palette.border}` }} />
        </div>
        <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Short note (optional)" rows={3} className="w-full px-3 py-2 rounded-xl resize-none" style={{ background: "#0b1220", color: "#e5e7eb", border: `1px solid ${palette.border}` }} />
        <div className="flex justify-end mt-2">
          <button onClick={onAddObservation} className="px-3 py-2 rounded-xl font-medium" style={{ background: palette.pink, color: "white" }}>Save record</button>
        </div>
      </div>
    </div>
  );
}

function RecordsViewer({ students, observations, deleteObservation }) {
  const [recordViewId, setRecordViewId] = useState("");
  const student = students.find(s=>s.id===recordViewId);
  const obs = student ? (observations.get(student.id) || []) : [];
  const avg = obs.length ? average(obs.map(o=>o.rating)) : null;
  return (
    <div>
      <div className="mb-3">
        <select value={recordViewId} onChange={(e)=>setRecordViewId(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }}>
          <option value="">Select student...</option>
          {students.map(s=>(<option key={s.id} value={s.id}>{s.first} {s.lastInitial}.</option>))}
        </select>
      </div>
      {student ? (
        <div>
          <div className="text-lg font-semibold mb-2" style={{ color: "white" }}>{student.first} {student.lastInitial}.</div>
          <div className="text-xs mb-3" style={{ color: "#9ca3af" }}>Average: {avg || "-"} • Records: {obs.length}</div>
          <ul className="space-y-2 max-h-80 overflow-auto pr-1">
            {obs.map(o => (
              <li key={o.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: palette.soft, border: `1px solid ${palette.border}` }}>
                <div>
                  <div className="text-sm" style={{ color: "#e5e7eb" }}>Rating: <b style={{ color: palette.blue }}>{o.rating}</b> • {new Date(o.ts).toLocaleDateString()}</div>
                  {o.note && <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{o.note}</div>}
                </div>
                <button onClick={()=>deleteObservation(o.id)} className="px-2 py-1 rounded-lg text-xs" title="Delete" style={{ background: "#111827", color: "#fca5a5", border: `1px solid ${palette.border}` }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-sm" style={{ color: "#9ca3af" }}>Choose a student to view history.</div>
      )}
    </div>
  );
}

function RatingPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="rating">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={()=>onChange(n)} className="w-10 h-10 rounded-xl font-semibold" aria-pressed={value===n} title={`Set rating ${n}`} style={{ background: value===n ? palette.blue : palette.soft, color: value===n ? "white" : "#cbd5e1", border: `1px solid ${palette.border}` }}>{n}</button>
      ))}
    </div>
  );
}

function Avatar({ name, large }) {
  const initials = name.split(" ").filter(Boolean).map(x=>x[0]?.toUpperCase()).slice(0,2).join("");
  return (
    <div className={`flex items-center justify-center rounded-2xl ${large ? "w-12 h-12 text-lg" : "w-9 h-9 text-sm"}`} style={{ background: `linear-gradient(135deg, ${palette.blue}33, ${palette.pink}33)`, color: "white", border: `1px solid ${palette.border}` }}>{initials}</div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
