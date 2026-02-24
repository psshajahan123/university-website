import { useState, useEffect } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000/api";

function App() {
  const [view, setView] = useState("home");
  const [universities, setUniversities] = useState([]);
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({ university: "", semester: "", year: "" });
  const [searchReg, setSearchReg] = useState("");
  const [studentResult, setStudentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/universities`)
      .then(r => r.json())
      .then(d => setUniversities(d))
      .catch(() => setUniversities(DEMO_UNIVERSITIES));
  }, []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_BASE}/results?${params}`);
      const data = await res.json();
      setResults(data.length ? data : DEMO_RESULTS);
    } catch {
      setResults(DEMO_RESULTS);
      showToast("Using demo data – connect your backend!", "warn");
    }
    setLoading(false);
  };

  const fetchStudent = async () => {
    if (!searchReg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/results/student/${searchReg}`);
      const data = await res.json();
      setStudentResult(data || DEMO_STUDENT);
    } catch {
      setStudentResult(DEMO_STUDENT);
    }
    setLoading(false);
  };

  const getGradeColor = (grade) => {
    const map = { "A+": "#00e676", A: "#69f0ae", B: "#40c4ff", C: "#ffab40", D: "#ff6e40", F: "#ff1744" };
    return map[grade] || "#90a4ae";
  };

  const getPassBg = (status) => status === "Pass" ? "rgba(0,230,118,0.12)" : "rgba(255,23,68,0.12)";

  return (
    <div className="app">
      {/* Animated background */}
      <div className="bg-grid" />
      <div className="bg-glow g1" />
      <div className="bg-glow g2" />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => setView("home")}>
            <span className="logo-icon">◈</span>
            <div>
              <div className="logo-title">EduPortal</div>
              <div className="logo-sub">University Results System</div>
            </div>
          </div>
          <nav className="nav">
            {["home", "results", "student"].map(v => (
              <button key={v} className={`nav-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
                {v === "home" ? "Dashboard" : v === "results" ? "All Results" : "Student Lookup"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">

        {/* HOME */}
        {view === "home" && (
          <div className="fade-in">
            <div className="hero">
              <div className="hero-badge">Academic Results Portal</div>
              <h1 className="hero-title">University Semester<br /><span className="accent">Results Hub</span></h1>
              <p className="hero-desc">Access semester results from multiple universities in one place. Search by student, filter by semester, and view detailed scorecards.</p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => setView("results")}>Browse Results →</button>
                <button className="btn-ghost" onClick={() => setView("student")}>Student Lookup</button>
              </div>
            </div>

            <div className="stats-row">
              {[
                { label: "Universities", value: "12+", icon: "🏛️" },
                { label: "Students", value: "50K+", icon: "🎓" },
                { label: "Semesters", value: "8", icon: "📅" },
                { label: "Subjects", value: "200+", icon: "📚" },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="uni-grid">
              <h2 className="section-title">Participating Universities</h2>
              <div className="uni-cards">
                {DEMO_UNIVERSITIES.map(u => (
                  <div className="uni-card" key={u.id}>
                    <div className="uni-avatar">{u.short}</div>
                    <div className="uni-name">{u.name}</div>
                    <div className="uni-loc">📍 {u.location}</div>
                    <button className="uni-btn" onClick={() => { setFilters(f => ({ ...f, university: u.id })); setView("results"); }}>
                      View Results
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALL RESULTS */}
        {view === "results" && (
          <div className="fade-in">
            <div className="page-header">
              <h2 className="page-title">Semester Results</h2>
              <p className="page-sub">Filter and explore results across universities</p>
            </div>

            <div className="filter-bar">
              <select className="filter-select" value={filters.university} onChange={e => setFilters(f => ({ ...f, university: e.target.value }))}>
                <option value="">All Universities</option>
                {DEMO_UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select className="filter-select" value={filters.semester} onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}>
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              <select className="filter-select" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}>
                <option value="">All Years</option>
                {[2024, 2023, 2022, 2021].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="btn-primary" onClick={fetchResults} disabled={loading}>
                {loading ? "Loading…" : "Search"}
              </button>
            </div>

            {results.length > 0 && (
              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      {["Reg No.", "Student Name", "University", "Semester", "Subject", "Marks", "Grade", "Status"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ background: getPassBg(r.status) }}>
                        <td className="mono">{r.reg_no}</td>
                        <td className="bold">{r.student_name}</td>
                        <td>{r.university}</td>
                        <td>Sem {r.semester}</td>
                        <td>{r.subject}</td>
                        <td className="mono">{r.marks}/100</td>
                        <td><span className="grade-badge" style={{ color: getGradeColor(r.grade), borderColor: getGradeColor(r.grade) }}>{r.grade}</span></td>
                        <td><span className={`status-badge ${r.status === "Pass" ? "pass" : "fail"}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p>Apply filters and click Search to view results</p>
                <button className="btn-ghost" onClick={fetchResults}>Load All Results</button>
              </div>
            )}
          </div>
        )}

        {/* STUDENT LOOKUP */}
        {view === "student" && (
          <div className="fade-in">
            <div className="page-header">
              <h2 className="page-title">Student Lookup</h2>
              <p className="page-sub">Enter your registration number to view your complete result card</p>
            </div>

            <div className="search-box">
              <input className="search-input" placeholder="Enter Registration Number (e.g. 2021CS001)" value={searchReg} onChange={e => setSearchReg(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchStudent()} />
              <button className="btn-primary" onClick={fetchStudent} disabled={loading}>{loading ? "…" : "Find"}</button>
            </div>

            {studentResult && (
              <div className="result-card">
                <div className="rc-header">
                  <div className="rc-avatar">{studentResult.name?.split(" ").map(w => w[0]).join("")}</div>
                  <div>
                    <div className="rc-name">{studentResult.name}</div>
                    <div className="rc-meta">{studentResult.reg_no} · {studentResult.university} · {studentResult.department}</div>
                    <div className="rc-sem">Semester {studentResult.semester} · {studentResult.year}</div>
                  </div>
                  <div className="rc-cgpa">
                    <div className="cgpa-val">{studentResult.cgpa}</div>
                    <div className="cgpa-label">CGPA</div>
                  </div>
                </div>

                <table className="results-table mt">
                  <thead>
                    <tr>{["Subject Code", "Subject Name", "Internal", "External", "Total", "Grade", "Status"].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {studentResult.subjects?.map((s, i) => (
                      <tr key={i} style={{ background: getPassBg(s.status) }}>
                        <td className="mono">{s.code}</td>
                        <td className="bold">{s.name}</td>
                        <td>{s.internal}</td>
                        <td>{s.external}</td>
                        <td className="mono bold">{s.total}/100</td>
                        <td><span className="grade-badge" style={{ color: getGradeColor(s.grade), borderColor: getGradeColor(s.grade) }}>{s.grade}</span></td>
                        <td><span className={`status-badge ${s.status === "Pass" ? "pass" : "fail"}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="rc-summary">
                  <div className="sum-item"><span>Total Marks</span><strong>{studentResult.total_marks}</strong></div>
                  <div className="sum-item"><span>Percentage</span><strong>{studentResult.percentage}%</strong></div>
                  <div className="sum-item"><span>Result</span><strong className={studentResult.overall_status === "Pass" ? "text-pass" : "text-fail"}>{studentResult.overall_status}</strong></div>
                  <div className="sum-item"><span>Rank</span><strong>{studentResult.rank}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2024 EduPortal · University Results Management System</p>
      </footer>
    </div>
  );
}

// Demo data for UI preview
const DEMO_UNIVERSITIES = [
  { id: 1, short: "AU", name: "Anna University", location: "Chennai, TN" },
  { id: 2, short: "VTU", name: "Visvesvaraya Tech Univ", location: "Belagavi, KA" },
  { id: 3, short: "JNTU", name: "JNTU Hyderabad", location: "Hyderabad, TS" },
  { id: 4, short: "MU", name: "Mumbai University", location: "Mumbai, MH" },
  { id: 5, short: "DU", name: "Delhi University", location: "New Delhi, DL" },
  { id: 6, short: "CU", name: "Calcutta University", location: "Kolkata, WB" },
];

const DEMO_RESULTS = [
  { reg_no: "2021CS001", student_name: "Arjun Sharma", university: "Anna University", semester: 3, subject: "Data Structures", marks: 87, grade: "A", status: "Pass" },
  { reg_no: "2021CS002", student_name: "Priya Menon", university: "Anna University", semester: 3, subject: "Data Structures", marks: 92, grade: "A+", status: "Pass" },
  { reg_no: "2021EC003", student_name: "Rahul Verma", university: "VTU", semester: 4, subject: "Digital Electronics", marks: 74, grade: "B", status: "Pass" },
  { reg_no: "2021ME004", student_name: "Sneha Rao", university: "JNTU Hyderabad", semester: 5, subject: "Thermodynamics", marks: 61, grade: "C", status: "Pass" },
  { reg_no: "2021CS005", student_name: "Karan Patel", university: "Mumbai University", semester: 2, subject: "Mathematics II", marks: 35, grade: "F", status: "Fail" },
  { reg_no: "2021IT006", student_name: "Divya Kumar", university: "Delhi University", semester: 6, subject: "Machine Learning", marks: 95, grade: "A+", status: "Pass" },
];

const DEMO_STUDENT = {
  name: "Arjun Sharma", reg_no: "2021CS001", university: "Anna University",
  department: "Computer Science", semester: 3, year: 2023, cgpa: "8.7",
  total_marks: "512/600", percentage: "85.3", overall_status: "Pass", rank: "5 / 120",
  subjects: [
    { code: "CS301", name: "Data Structures", internal: 45, external: 42, total: 87, grade: "A", status: "Pass" },
    { code: "CS302", name: "Computer Architecture", internal: 40, external: 38, total: 78, grade: "B", status: "Pass" },
    { code: "CS303", name: "Discrete Mathematics", internal: 48, external: 47, total: 95, grade: "A+", status: "Pass" },
    { code: "CS304", name: "Operating Systems", internal: 42, external: 41, total: 83, grade: "A", status: "Pass" },
    { code: "CS305", name: "Database Management", internal: 46, external: 44, total: 90, grade: "A+", status: "Pass" },
    { code: "CS306", name: "Software Engineering", internal: 38, external: 41, total: 79, grade: "B", status: "Pass" },
  ]
};

export default App;
