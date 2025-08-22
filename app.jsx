/* KidVision Observations - standalone JSX build */
const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "teacher-observation-app:v1";

function uid() { return Math.random().toString(36).slice(2, 10); }
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function average(arr) { if (!arr?.length) return 0; return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*100)/100; }

const palette = { blue: "#2563eb", pink: "#db2777", gray: "#1f2937", grayLight: "#374151", bg: "#0b1220", card: "#0f172a", border: "#1f2937", soft: "#111827" };

const SEED = {
  students: [
    { id: uid(), first: "Ava", lastInitial: "G", createdAt: Date.now() - 86400000 },
    { id: uid(), first: "Liam", lastInitial: "R", createdAt: Date.now() - 86400000 * 2 },
    { id: uid(), first: "Noah", lastInitial: "S", createdAt: Date.now() - 86400000 * 3 },
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
    const s = { id: uid(), first: cleanFirst, lastInitial: cleanLast, createdAt: Date.now() };
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

  function exportCSV() {
    const rows = [["Student","Rating","Note","Timestamp"],
      ...state.observations.map((o)=>{ const s=state.students.find(x=>x.id===o.studentId); const name=s?`${s.first} ${s.lastInitial}.`:"Unknown"; return [name, o.rating, o.note, new Date(o.ts).toISOString()]; })];
    const csv = rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "observations.csv"; a.click(); URL.revokeObjectURL(url);
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
            <button onClick={exportCSV} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }}>Export CSV</button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="col-span-2 flex gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search students" className="flex-1 px-4 py-3 rounded-2xl outline-none" style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }} />
            <div className="flex items-center gap-2">
              <label className="text-sm" style={{ color: "#9ca3af" }}>Sort</label>
              <select value={sort} onChange={(e)=>setSort(e.target.value)} className="px-3 py-3 rounded-2xl text-sm" style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }}>
                <option value="name">Name</option>
                <option value="avg">Avg score</option>
                <option value="recent">Most recent</option>
              </select>
            </div>
          </div>
          <NewStudentForm onAdd={addStudent} />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-3 rounded-2xl" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
            <div className="flex items-center justify-between px-2 py-1">
              <h2 className="text-lg font-semibold" style={{ color: "white" }}>Students</h2>
              <span className="text-xs" style={{ color: "#9ca3af" }}>{students.length} total</span>
            </div>
            <ul className="divide-y divide-gray-800">
              {students.map((s)=>(
                <li key={s.id} className="flex items-center gap-3 px-3 py-3 hover:opacity-100 transition" style={{ background: selectedId===s.id ? "#0b1220" : "transparent" }}>
                  <button onClick={()=>setSelectedId(s.id)} className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${s.first} ${s.lastInitial}.`} />
                      <div>
                        <div className="font-medium" style={{ color: "white" }}>{s.first} {s.lastInitial}.</div>
                        <div className="text-xs" style={{ color: "#94a3b8" }}>Avg {avgFor(s.id) || "-"} • Last {lastTs(s.id) ? new Date(lastTs(s.id)).toLocaleDateString() : "-"}</div>
                      </div>
                    </div>
                  </button>
                  <span className="px-2 py-1 rounded-lg text-sm font-semibold" style={{ background: "#111827", color: palette.blue, border: `1px solid ${palette.border}` }}>{avgFor(s.id) || "-"}</span>
                  <button onClick={()=>removeStudent(s.id)} className="px-2 py-1 rounded-lg text-xs" title="Remove student" style={{ background: palette.soft, color: "#9ca3af", border: `1px solid ${palette.border}` }}>Remove</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1 p-4 rounded-2xl sticky top-4 h-fit" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "white" }}>Delegate Window</h2>
            {selectedId ? (
              <StudentDetail
                key={selectedId}
                student={state.students.find((s)=>s.id===selectedId)}
                observations={obsByStudent.get(selectedId) || []}
                onAddObservation={addObservation}
                rating={rating}
                setRating={setRating}
                note={note}
                setNote={setNote}
              />
            ) : (
              <div className="text-sm" style={{ color: "#9ca3af" }}>Select a student to view and add records.</div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs" style={{ color: "#6b7280" }}>
          Built for fast classroom walkthroughs • Data lives locally in your browser
        </footer>
      </div>
    </div>
  );
}

function NewStudentForm({ onAdd }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onAdd(first, last); setFirst(""); setLast(""); }} className="grid grid-cols-3 gap-2">
      <input className="col-span-1 px-4 py-3 rounded-2xl outline-none" placeholder="First name" value={first} onChange={(e)=>setFirst(e.target.value)} style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }} required />
      <input className="col-span-1 px-4 py-3 rounded-2xl outline-none" placeholder="Last initial" value={last} onChange={(e)=>setLast(e.target.value.toUpperCase().slice(0,1))} maxLength={1} style={{ background: palette.soft, color: "white", border: `1px solid ${palette.border}` }} required />
      <button className="col-span-1 px-4 py-3 rounded-2xl font-medium" style={{ background: palette.blue, color: "white" }}>Add Student</button>
    </form>
  );
}

function StudentDetail({ student, observations, onAddObservation, rating, setRating, note, setNote }) {
  const avg = average(observations.map(o=>o.rating));
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={`${student.first} ${student.lastInitial}.`} large />
        <div>
          <div className="text-xl font-semibold" style={{ color: "white" }}>{student.first} {student.lastInitial}.</div>
          <div className="text-xs" style={{ color: "#9ca3af" }}>Average: {avg || "-"} • Records: {observations.length}</div>
        </div>
      </div>

      <div className="p-3 rounded-xl mb-3" style={{ background: palette.soft, border: `1px solid ${palette.border}` }}>
        <div className="text-sm mb-2" style={{ color: "#cbd5e1" }}>Add an observation</div>
        <div className="flex items-center gap-2 mb-2">
          <RatingPicker value={rating} onChange={setRating} />
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#111827", color: "#cbd5e1", border: `1px solid ${palette.border}` }}>1 = needs support • 5 = above proficiency</span>
        </div>
        <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Short note (optional)" rows={3} className="w-full px-3 py-2 rounded-xl resize-none" style={{ background: "#0b1220", color: "#e5e7eb", border: `1px solid ${palette.border}` }} />
        <div className="flex justify-end mt-2">
          <button onClick={onAddObservation} className="px-3 py-2 rounded-xl font-medium" style={{ background: palette.pink, color: "white" }}>Save record</button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "#cbd5e1" }}>History</h3>
        <ul className="space-y-2 max-h-80 overflow-auto pr-1">
          {observations.length === 0 && (<li className="text-sm" style={{ color: "#9ca3af" }}>No records yet.</li>)}
          {observations.map((o)=>(
            <li key={o.id} className="p-3 rounded-xl" style={{ background: palette.soft, border: `1px solid ${palette.border}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm" style={{ color: "#e5e7eb" }}>Rating: <b style={{ color: palette.blue }}>{o.rating}</b></div>
                  {o.note && <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{o.note}</div>}
                </div>
                <div className="text-xs" style={{ color: "#9ca3af" }}>{new Date(o.ts).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
