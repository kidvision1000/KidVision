/* KidVision Observations V1.1 */
const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "kidvision-observations:v1.1";
function uid() { return Math.random().toString(36).slice(2, 10); }
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function average(arr) { if (!arr?.length) return 0; return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*100)/100; }

const palette = { blue: "#2563eb", pink: "#db2777", gray: "#1f2937", grayLight: "#374151", bg: "#0b1220", card: "#0f172a", border: "#1f2937", soft: "#111827" };

const SEED = {
  students: [
    { id: uid(), first: "Ava", lastInitial: "G" },
    { id: uid(), first: "Liam", lastInitial: "R" },
    { id: uid(), first: "Noah", lastInitial: "S" },
  ],
  observations: [],
};


function App() {
  const [state, setState] = useState(() => loadState() || SEED);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [rating, setRating] = useState(3);
  const [note, setNote] = useState("");
  const [sort, setSort] = useState("name");
  const [tab, setTab] = useState("delegate"); // "delegate" or "records"
  const [recordViewId, setRecordViewId] = useState("");

  useEffect(() => { saveState(state); }, [state]);

  const students = useMemo(() => {
    let list = [...state.students];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => `${s.first} ${s.lastInitial}`.toLowerCase().includes(q));
    }
    if (sort === "name") list.sort((a,b)=>a.first.localeCompare(b.first));
    else if (sort === "avg") list.sort((a,b)=>avgFor(b.id) - avgFor(a.id));
    else if (sort === "recent") list.sort((a,b)=>(lastTs(b.id)||0) - (lastTs(a.id)||0));
    return list;
  }, [state.students, query, sort, state.observations]);

  const obsByStudent = useMemo(() => {
    const map = new Map();
    for (const ob of state.observations) {
      if (!map.has(ob.studentId)) map.set(ob.studentId, []);
      map.get(ob.studentId).push(ob);
    }
    for (const arr of map.values()) arr.sort((a,b)=>b.ts - a.ts);
    return map;
  }, [state.observations]);

  function avgFor(id) { const arr = obsByStudent.get(id) || []; return average(arr.map(o=>o.rating)); }
  function lastTs(id) { const arr = obsByStudent.get(id) || []; return arr[0]?.ts || null; }

  function addStudent(first, lastInitial) {
    const cleanFirst = first.trim();
    const cleanLast = lastInitial.trim().replace(/\.$/, "");
    if (!cleanFirst || !cleanLast) return;
    const s = { id: uid(), first: cleanFirst, lastInitial: cleanLast };
    setState((st) => ({ ...st, students: [s, ...st.students] }));
    setSelectedId(s.id);
  }

  function removeStudent(id) {
    setState((st) => ({ students: st.students.filter(s=>s.id!==id), observations: st.observations.filter(o=>o.studentId!==id) }));
    if (selectedId===id) setSelectedId(null);
  }

  function addObservation() {
    if (!selectedId) return;
    const ob = { id: uid(), studentId: selectedId, rating, note: note.trim(), ts: Date.now() };
    setState((st)=>({ ...st, observations: [ob, ...st.observations] }));
    setNote("");
  }

  function deleteObservation(id) {
    setState((st) => ({ ...st, observations: st.observations.filter(o=>o.id!==id) }));
  }

  function exportCSV() {
    const rows = [["Student","Rating","Note","Timestamp"],
      ...state.observations.map((o)=>{ const s=state.students.find(x=>x.id===o.studentId); const name=s?`${s.first} ${s.lastInitial}.`:"Unknown"; return [name, o.rating, o.note, new Date(o.ts).toISOString()]; })];
    const csv = rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "observations.csv"; a.click(); URL.revokeObjectURL(url);
  }


  return (
    <div className="min-h-screen" style={{ background: palette.bg }}>
      <div className="container-narrow px-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "white" }}>KidVision Observations</h1>
            <p className="text-sm" style={{ color: "#94a3b8" }}>Quick 1–5 ratings • 5 = above proficiency</p>
          </div>
          <button onClick={exportCSV} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }}>Export CSV</button>
        </header>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="col-span-2 flex gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search students" className="flex-1 px-4 py-3 rounded-2xl outline-none" style={{ background: palette.soft, color: "white" }} />
          </div>
          <NewStudentForm onAdd={addStudent} />
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-3 rounded-2xl" style={{ background: palette.card }}>
            <ul className="divide-y divide-gray-800">
              {students.map((s)=>(
                <li key={s.id} className="flex items-center gap-3 px-3 py-3">
                  <button onClick={()=>setSelectedId(s.id)} className="flex-1 text-left text-white">{s.first} {s.lastInitial}.</button>
                  <span className="px-2 py-1 rounded-lg text-sm font-semibold text-blue-400">{avgFor(s.id) || "-"}</span>
                  <button onClick={()=>removeStudent(s.id)} className="text-xs text-gray-400">Remove</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-1 p-4 rounded-2xl" style={{ background: palette.card }}>
            <div className="flex mb-3 gap-2">
              <button onClick={()=>setTab("delegate")} className={tab==="delegate"?"bg-blue-600 text-white flex-1":"bg-gray-700 text-gray-300 flex-1"}>Delegate</button>
              <button onClick={()=>setTab("records")} className={tab==="records"?"bg-pink-600 text-white flex-1":"bg-gray-700 text-gray-300 flex-1"}>Records</button>
            </div>
            {tab==="delegate" ? (
              selectedId ? <StudentDetail student={state.students.find((s)=>s.id===selectedId)} observations={obsByStudent.get(selectedId) || []} onAddObservation={addObservation} rating={rating} setRating={setRating} note={note} setNote={setNote} /> : <div className="text-sm text-gray-400">Select a student.</div>
            ) : (
              <RecordsViewer students={state.students} observations={obsByStudent} deleteObservation={deleteObservation} recordViewId={recordViewId} setRecordViewId={setRecordViewId} />
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
      <input className="col-span-1 px-4 py-3 rounded-2xl" placeholder="First name" value={first} onChange={(e)=>setFirst(e.target.value)} />
      <input className="col-span-1 px-4 py-3 rounded-2xl" placeholder="Last initial" value={last} onChange={(e)=>setLast(e.target.value.toUpperCase().slice(0,1))} maxLength={1} />
      <button className="col-span-1 px-4 py-3 rounded-2xl bg-blue-600 text-white">Add</button>
    </form>
  );
}

function StudentDetail({ student, observations, onAddObservation, rating, setRating, note, setNote }) {
  return (
    <div>
      <div className="mb-2 text-white font-semibold">{student.first} {student.lastInitial}.</div>
      <RatingPicker value={rating} onChange={setRating} />
      <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Note" rows={3} className="w-full mt-2 p-2 rounded bg-gray-800 text-white" />
      <button onClick={onAddObservation} className="mt-2 px-3 py-2 bg-pink-600 text-white rounded">Save</button>
    </div>
  );
}

function RecordsViewer({ students, observations, deleteObservation, recordViewId, setRecordViewId }) {
  const student = students.find(s=>s.id===recordViewId);
  const obs = student ? (observations.get(student.id) || []) : [];
  return (
    <div>
      <select value={recordViewId} onChange={(e)=>setRecordViewId(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white mb-2">
        <option value="">Select student...</option>
        {students.map(s=>(<option key={s.id} value={s.id}>{s.first} {s.lastInitial}.</option>))}
      </select>
      {student && (
        <ul className="space-y-2 max-h-64 overflow-auto">
          {obs.map(o=>(
            <li key={o.id} className="p-2 rounded bg-gray-700 text-white flex justify-between items-center">
              <span>{o.rating} | {o.note || "—"} | {new Date(o.ts).toLocaleString()}</span>
              <button onClick={()=>deleteObservation(o.id)} className="text-xs text-red-400 ml-2">Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RatingPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n)=>(
        <button key={n} onClick={()=>onChange(n)} className={value===n?"bg-blue-600 text-white":"bg-gray-600 text-gray-200"} style={{padding:"0.5rem 0.75rem", borderRadius:"0.5rem"}}>{n}</button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
