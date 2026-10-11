import React, { useState, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  LayoutDashboard,
  HeartPulse,
  Droplets,
  Pill,
  CalendarDays,
  Users,
  ShieldCheck,
  Plus,
  Check,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Download,
  Clock,
  Pause,
  Play,
  Heart,
  SlidersHorizontal,
  CheckCircle2,
  Leaf,
} from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { api } from "./lib/api";
import { loadDemo, saveDemo, createDemo, occurrences } from "./lib/demo";
import "./styles.css";
const WellnessScene = lazy(() => import("./three/WellnessScene"));
const dateText = (v) =>
  new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const dateTime = (v) =>
  new Date(v).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const uid = () => crypto.randomUUID();
function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <Activity size={23} />
      </span>
      chronic<span>care</span>
      <span className="brand-dot">.</span>
    </Link>
  );
}
function App() {
  const [demo, setDemo] = useState(
      () => sessionStorage.getItem("cc-demo") === "true",
    ),
    [user, setUser] = useState(null),
    [boot, setBoot] = useState(true),
    [animate, setAnimate] = useState(
      () =>
        !matchMedia("(prefers-reduced-motion: reduce)").matches &&
        localStorage.getItem("cc-motion") !== "off",
    );
  useEffect(() => {
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setBoot(false));
  }, []);
  const startDemo = () => {
    sessionStorage.setItem("cc-demo", "true");
    setDemo(true);
  };
  const toggleMotion = () =>
    setAnimate((v) => {
      localStorage.setItem("cc-motion", v ? "off" : "on");
      return !v;
    });
  return (
    <MotionConfig reducedMotion={animate ? "user" : "always"}>
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              startDemo={startDemo}
              animate={animate}
              toggleMotion={toggleMotion}
            />
          }
        />
        <Route
          path="/login"
          element={
            <Auth setUser={setUser} setDemo={setDemo} startDemo={startDemo} />
          }
        />
        <Route
          path="/register"
          element={
            <Auth
              register
              setUser={setUser}
              setDemo={setDemo}
              startDemo={startDemo}
            />
          }
        />
        <Route
          path="/patient/*"
          element={
            boot && !demo ? (
              <div className="loading">Opening your workspace…</div>
            ) : demo || user ? (
              <Workspace
                demo={demo}
                user={user}
                setUser={setUser}
                setDemo={setDemo}
                animate={animate}
                toggleMotion={toggleMotion}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <div className="not-found">
              <Brand />
              <h1>Let’s get you back on track.</h1>
              <Link className="button" to="/">
                Go home <ArrowRight size={18} />
              </Link>
            </div>
          }
        />
      </Routes>
    </MotionConfig>
  );
}
function Landing({ startDemo, animate, toggleMotion }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Brand />
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#care">Built around you</a>
        </div>
        <Link className="text-link" to="/login">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </nav>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> SMALL STEPS. LONG-TERM CARE.
            </div>
            <h1>
              Your health story.
              <br />
              <em>All in one place.</em>
            </h1>
            <p>
              A little more clarity. A little less to keep track of.
              <br className="desktop-break" /> Bring your readings, routines,
              and care team together.
            </p>
            <div className="hero-actions">
              <Link
                className="button"
                to="/patient/dashboard"
                onClick={startDemo}
              >
                Explore the demo <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" to="/register">
                Create an account
              </Link>
            </div>
            <div className="hero-proof">
              <span className="small-icon">
                <ShieldCheck size={18} />
              </span>
              <span>
                Your records. Your control.
                <small>Share with your care team, on your terms.</small>
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-label">
              <span className="live-dot" /> A LITTLE CARE, EVERY DAY
            </div>
            <Suspense fallback={<div className="heart-fallback">♥</div>}>
              <WellnessScene animate={animate} />
            </Suspense>
            <div className="floating-card reading-float">
              <span className="icon-box peach">
                <HeartPulse size={21} />
              </span>
              <div>
                <small>A clearer picture</small>
                <b>One reading at a time</b>
              </div>
              <svg width="67" height="34" viewBox="0 0 67 34">
                <path
                  d="M0 20h13l5-13 8 23 8-22 5 12h28"
                  fill="none"
                  stroke="#0f8b78"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="floating-card routine-float">
              <span className="check-round">
                <Check size={16} />
              </span>
              <div>
                <b>Small steps add up</b>
                <small>Make space for your daily routine</small>
              </div>
            </div>
            <div className="scene-caption">
              <span>ILLUSTRATIVE WELLNESS SCENE · DRAG TO EXPLORE</span>
              <button
                className="icon-button"
                onClick={toggleMotion}
                aria-label={animate ? "Pause animation" : "Play animation"}
              >
                {animate ? <Pause size={15} /> : <Play size={15} />}
              </button>
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <span>Thoughtfully built for everyday care</span>
          <div>
            <Droplets size={19} /> Diabetes tracking
          </div>
          <div>
            <HeartPulse size={19} /> Blood pressure
          </div>
          <div>
            <Users size={19} /> Connected care
          </div>
        </section>
        <section className="features" id="how-it-works">
          <div className="section-intro">
            <div>
              <div className="eyebrow">LESS SCATTERED. MORE CONNECTED.</div>
              <h2>Care that fits into your life.</h2>
            </div>
            <p>
              The everyday details, brought together.
              <br />
              So you can focus on the bigger picture.
            </p>
          </div>
          <div className="feature-grid">
            {[
              [
                Droplets,
                "01",
                "Know your patterns",
                "Log glucose and blood pressure. See your history clearly, with simple trends and context.",
                "mint",
              ],
              [
                Pill,
                "02",
                "Find your rhythm",
                "Keep a medication schedule and record doses. Make your next small step easier.",
                "peach",
              ],
              [
                Users,
                "03",
                "Stay connected",
                "Share records with an approved clinician and keep follow-ups in one calm space.",
                "lavender",
              ],
            ].map(([Icon, num, title, copy, color]) => (
              <article key={num}>
                <div className="feature-top">
                  <span className={`icon-box ${color}`}>
                    <Icon size={25} />
                  </span>
                  <span>{num}</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="care" className="care-banner">
          <div>
            <Leaf size={26} />
            <h2>You’re more than your numbers.</h2>
            <p>A thoughtful space for your care, one day at a time.</p>
          </div>
          <Link to="/patient/dashboard" onClick={startDemo} className="button">
            Take a look inside <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Brand />
        <p>
          Synthetic portfolio demo · Tracking, not medical advice or emergency
          monitoring.
        </p>
        <span>Made for the everyday.</span>
      </footer>
    </div>
  );
}
function Auth({ register = false, setUser, setDemo, startDemo }) {
  const nav = useNavigate(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.target));
    try {
      const d = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body,
      });
      setUser(d.user);
      setDemo(false);
      sessionStorage.removeItem("cc-demo");
      nav("/patient/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <Brand />
        <div>
          <div className="eyebrow">YOUR EVERYDAY CARE COMPANION</div>
          <h1>
            A little care.
            <br />
            <em>A clearer tomorrow.</em>
          </h1>
          <p>One place for the details that matter.</p>
          <Heart className="auth-heart" strokeWidth={0.7} />
        </div>
        <small>Synthetic data only. Not for clinical use.</small>
      </div>
      <div className="auth-panel">
        <Link to="/" className="text-link">
          ← Back to home
        </Link>
        <h2>{register ? "Make room for better routines." : "Welcome back."}</h2>
        <p>
          {register
            ? "Create your patient workspace."
            : "Your care story continues here."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <label>
              Your name
              <input
                name="displayName"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input type="email" name="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              minLength={10}
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
            />
            <small>At least 10 characters.</small>
          </label>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? "Please wait…"
              : register
                ? "Create patient account"
                : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p>
          {register ? "Already have an account?" : "New to ChronicCare?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <div className="auth-demo">
          <b>Just looking around?</b>
          <p>Explore a fictional care journey. No account needed.</p>
          <Link
            className="button secondary"
            to="/patient/dashboard"
            onClick={startDemo}
          >
            Open synthetic demo
          </Link>
        </div>
      </div>
    </div>
  );
}
const sections = [
  ["dashboard", "Overview", LayoutDashboard],
  ["readings", "My readings", Activity],
  ["medications", "Medications", Pill],
  ["follow-ups", "Follow-ups", CalendarDays],
  ["sharing", "Care team", Users],
];
function Workspace({ demo, user, setUser, setDemo, animate, toggleMotion }) {
  const nav = useNavigate(),
    [data, setData] = useState(() =>
      demo
        ? loadDemo()
        : { readings: [], medications: [], doses: [], plans: [], links: [] },
    ),
    [busy, setBusy] = useState(!demo),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [menu, setMenu] = useState(false),
    [patients, setPatients] = useState([]),
    [selected, setSelected] = useState("");
  const clinician = !demo && user?.role === "clinician";
  const patientId = clinician ? selected : user?.id;
  const name = demo ? "Alex Morgan" : user?.displayName || "Your workspace";
  async function refresh() {
    if (demo) return;
    setBusy(true);
    setError("");
    try {
      let id = patientId;
      if (clinician) {
        const p = await api("/clinician/patients");
        setPatients(p);
        id = selected || p[0]?.id;
        setSelected(id || "");
      }
      const links = await api("/care-links");
      if (!id) {
        setData({ readings: [], medications: [], doses: [], plans: [], links });
        return;
      }
      const [summary, medications, doses, plans] = await Promise.all([
        api(
          `/patients/${id}/summary?from=${new Date(Date.now() - 365 * 86400000).toISOString()}`,
        ),
        api(`/patients/${id}/medications`),
        api(`/patients/${id}/doses`),
        api(`/patients/${id}/care-plans`),
      ]);
      setData({ readings: summary.readings, medications, doses, plans, links });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [patientId, demo]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  async function mutate(fn, endpoint, options) {
    setError("");
    try {
      if (demo) {
        const next = fn(data);
        saveDemo(next);
        setData(next);
      } else {
        await api(endpoint, options);
        await refresh();
      }
      setNotice(
        demo ? "Saved to this browser’s synthetic demo." : "Saved securely.",
      );
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }
  async function logout() {
    try {
      if (!demo) await api("/auth/logout", { method: "POST" });
      setDemo(false);
      setUser(null);
      sessionStorage.removeItem("cc-demo");
      nav("/");
    } catch (e) {
      setError(e.message);
    }
  }
  const context = {
    data,
    demo,
    clinician,
    patientId,
    mutate,
    setModal,
    setNotice,
    timezone: demo
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : user?.timezone,
  };
  return (
    <div className="workspace">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Brand />
        <div className="workspace-label">
          {clinician ? "CLINICIAN WORKSPACE" : "MY HEALTH SPACE"}
        </div>
        <nav>
          {sections.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={`/patient/${path}`}
              onClick={() => setMenu(false)}
            >
              <Icon size={19} />
              {clinician && path === "readings" ? "Patient readings" : label}
              {path === "follow-ups" &&
                data.plans.filter((p) => p.status === "open").length > 0 && (
                  <span className="nav-count">
                    {data.plans.filter((p) => p.status === "open").length}
                  </span>
                )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="care-note">
            <span className="leaf-icon">
              <Leaf size={22} />
            </span>
            <b>Every small step counts.</b>
            <p>
              Your care journey is yours.
              <br />
              Take it one day at a time.
            </p>
          </div>
          <button className="motion-toggle" onClick={toggleMotion}>
            {animate ? <Pause size={16} /> : <Play size={16} />} Motion{" "}
            {animate ? "on" : "off"}
          </button>
          <button className="profile" onClick={logout}>
            <span className="avatar">
              {name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <b>{name}</b>
              <small>{demo ? "Demo patient" : user?.role}</small>
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          <span className="breadcrumb">
            My workspace <ChevronRight size={14} />{" "}
            <b>{clinician ? "Patient care" : "Your health, connected"}</b>
          </span>
          <span className="topbar-right">
            <span className="live-dot" />
            {demo ? "Synthetic demo" : "Private workspace"}
            <span className="avatar small">{name[0]}</span>
          </span>
        </header>
        {demo && (
          <div className="demo-banner">
            <ShieldCheck size={15} />
            <span>
              You’re exploring a synthetic demo. Changes stay in this browser.
            </span>
            <Link to="/register">
              Create account <ArrowUpRight size={13} />
            </Link>
          </div>
        )}
        <main className="dashboard-content">
          {clinician && (
            <div className="patient-select">
              <label>
                Assigned patient
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {patients.length ? (
                    patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))
                  ) : (
                    <option value="">No accepted invitations yet</option>
                  )}
                </select>
              </label>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={refresh}>Retry</button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}
          {busy ? (
            <div className="loading">Loading your care records…</div>
          ) : (
            <Routes>
              <Route
                path="dashboard"
                element={
                  <Overview {...context} name={name} animate={animate} />
                }
              />
              <Route path="readings" element={<Readings {...context} />} />
              <Route
                path="medications"
                element={<Medications {...context} />}
              />
              <Route path="follow-ups" element={<FollowUps {...context} />} />
              <Route path="sharing" element={<Sharing {...context} />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          )}
          <div className="workspace-footer">
            <span>
              <ShieldCheck size={14} />{" "}
              {demo
                ? "Fictional records. Real possibilities."
                : "You decide who can access your records."}
            </span>
            <span>Tracking support · Not emergency monitoring</span>
          </div>
        </main>
      </div>
      {modal && (
        <Modal
          title={
            modal === "reading"
              ? "Add a reading"
              : modal === "medication"
                ? "Add medication schedule"
                : "Create a follow-up"
          }
          onClose={() => setModal(null)}
        >
          <EntryForm kind={modal} {...context} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
function PageHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Overview(props) {
  const { data, name, setModal, demo, timezone } = props;
  const latest = [...data.readings].sort(
    (a, b) => new Date(b.measuredAt) - new Date(a.measuredAt),
  );
  const g = latest.find((r) => r.type === "glucose"),
    bp = latest.find((r) => r.type === "blood-pressure");
  const due = occurrences(data.medications, 7, new Date(), timezone).filter(
    (o) => o.due,
  );
  const taken = due.filter((o) =>
    data.doses.some(
      (d) =>
        d.medicationId === o.medication._id &&
        d.scheduledFor === o.scheduledFor &&
        d.status === "taken",
    ),
  ).length;
  return (
    <>
      <PageHeading
        eyebrow={new Date()
          .toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
          .toUpperCase()}
        title={`A little care, ${name.split(" ")[0]}.`}
        subtitle="Here’s your health story at a glance."
        action={
          <button className="button" onClick={() => setModal("reading")}>
            <Plus size={18} /> Add reading
          </button>
        }
      />
      <section className="welcome-card">
        <div>
          <span className="tag">YOUR DAILY CHECK-IN</span>
          <h2>
            Small steps.
            <br />A clearer picture.
          </h2>
          <p>
            Keep showing up for yourself.
            <br />
            Your next reading is a good place to start.
          </p>
          <Link to="/patient/readings">
            See your health journey <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-illustration">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="css-heart">♥</div>
          <span className="orbit-dot" />
          <div className="illustration-note">
            <Leaf size={15} /> One day at a time
          </div>
        </div>
        <span className="welcome-decoration">+</span>
      </section>
      <section className="stat-grid">
        <Stat
          icon={Droplets}
          color="mint"
          title="Latest glucose"
          value={g?.value ?? "—"}
          unit={g?.unit || "mg/dL"}
          detail={
            g ? `${g.context} · ${dateTime(g.measuredAt)}` : "No readings yet"
          }
          spark="0,24 15,20 28,27 40,10 52,17 65,12 80,16"
        />
        <Stat
          icon={HeartPulse}
          color="peach"
          title="Blood pressure"
          value={bp ? `${bp.systolic}/${bp.diastolic}` : "—"}
          unit="mmHg"
          detail={bp ? dateTime(bp.measuredAt) : "No readings yet"}
          spark="0,20 13,12 27,18 40,8 53,20 65,14 80,18"
        />
        <Stat
          icon={Pill}
          color="lavender"
          title="Recorded adherence"
          value={
            due.length ? `${Math.round((taken / due.length) * 100)}%` : "—"
          }
          unit="last 7 days"
          detail={`${taken} taken / ${due.length} due · self-reported`}
        />
      </section>
      <div className="dashboard-grid">
        <TrendCard data={data} />
        <section className="panel today-panel">
          <div className="panel-heading">
            <h3>Today’s routine</h3>
            <span className="tag subtle">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <p className="muted">A little structure for your day.</p>
          <DoseList {...props} compact />
          <Link className="panel-link" to="/patient/medications">
            View medication schedule <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <div className="dashboard-grid bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <h3>Next on your care journey</h3>
            <Link to="/patient/follow-ups">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>
          {data.plans
            .filter((p) => p.status === "open")
            .slice(0, 2)
            .map((p) => (
              <div className="followup-row" key={p._id}>
                <span className="date-tile">
                  {new Date(p.dueAt).toLocaleDateString("en-IN", {
                    month: "short",
                  })}
                  <b>{new Date(p.dueAt).getDate()}</b>
                </span>
                <div>
                  <b>{p.title}</b>
                  <small>
                    {demo
                      ? "Dr. Maya Chen · Demo care team"
                      : "Your assigned clinician"}
                  </small>
                </div>
                <ChevronRight size={18} />
              </div>
            ))}
          {!data.plans.some((p) => p.status === "open") && (
            <Empty text="No upcoming follow-ups. Your care team’s plans will appear here." />
          )}
        </section>
        <section className="reflection">
          <Leaf size={25} />
          <div className="eyebrow">A GENTLE REMINDER</div>
          <h3>
            Progress is a practice,
            <br />
            not a perfect streak.
          </h3>
          <p>Make a little room for yourself today.</p>
        </section>
      </div>
    </>
  );
}
function Stat({ icon: Icon, color, title, value, unit, detail }) {
  return (
    <article className="stat-card">
      <div className="stat-title">
        <span>{title}</span>
        <span className={`icon-box ${color}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="stat-value">
        {value}
        <span>{unit}</span>
      </div>
      <p>{detail}</p>
    </article>
  );
}
function TrendCard({ data, full = false }) {
  const [days, setDays] = useState("7"),
    [type, setType] = useState("glucose"),
    [context, setContext] = useState("all"),
    [table, setTable] = useState(false),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const start =
    days === "custom" && from
      ? new Date(`${from}T00:00:00`)
      : new Date(Date.now() - Number(days === "custom" ? 7 : days) * 86400000);
  const end = days === "custom" && to ? new Date(`${to}T23:59:59`) : new Date();
  const records = data.readings
    .filter(
      (r) =>
        r.type === type &&
        new Date(r.measuredAt) >= start &&
        new Date(r.measuredAt) <= end &&
        (context === "all" || type !== "glucose" || r.context === context),
    )
    .sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
  const chart = records.map((r) => ({
    ...r,
    label: dateTime(r.measuredAt),
    glucose: r.unit === "mmol/L" ? Math.round(r.value * 18.0182) : r.value,
  }));
  return (
    <section className="panel trend-panel">
      <div className="panel-heading">
        <h3>Your trends</h3>
        <select
          aria-label="Trend period"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="custom">Custom dates</option>
        </select>
      </div>
      <div className="trend-controls">
        <div className="segmented">
          <button
            className={type === "glucose" ? "selected" : ""}
            onClick={() => setType("glucose")}
          >
            Glucose
          </button>
          <button
            className={type === "blood-pressure" ? "selected" : ""}
            onClick={() => setType("blood-pressure")}
          >
            Blood pressure
          </button>
        </div>
        <button className="text-button" onClick={() => setTable(!table)}>
          {table ? "Chart view" : "Table view"}
        </button>
      </div>
      {days === "custom" && (
        <div className="date-filters">
          <label>
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="chart-meta">
        <span>
          {records.length} readings · {type === "glucose" ? "mg/dL" : "mmHg"}
        </span>
        {type === "glucose" && (
          <select
            aria-label="Glucose context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          >
            <option value="all">All contexts</option>
            <option value="fasting">Fasting</option>
            <option value="post-meal">Post-meal</option>
            <option value="random">Random</option>
          </select>
        )}
      </div>
      {!records.length ? (
        <Empty text="No readings in this period. Add a reading or choose another date range." />
      ) : table ? (
        <ReadingTable records={records} />
      ) : (
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            {type === "glucose" ? (
              <AreaChart
                data={chart}
                margin={{ top: 15, right: 10, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#54bda6" stopOpacity={0.23} />
                    <stop offset="100%" stopColor="#54bda6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="#e8eeeb"
                />
                <XAxis
                  dataKey="label"
                  tickFormatter={(v) => v.split(",")[0]}
                  tick={{ fontSize: 10, fill: "#88948e" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={35}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "#88948e" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Area
                  type="linear"
                  dataKey="glucose"
                  name="Glucose (mg/dL)"
                  stroke="#128a75"
                  strokeWidth={2.5}
                  fill="url(#tealFill)"
                  dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={chart}
                margin={{ top: 15, right: 10, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickFormatter={(v) => v.split(",")[0]}
                  minTickGap={35}
                  tick={{ fontSize: 10 }}
                />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  dataKey="systolic"
                  name="Systolic (mmHg)"
                  stroke="#118572"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="diastolic"
                  name="Diastolic (mmHg)"
                  stroke="#b38aca"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      <div className="chart-foot">
        <span className="live-dot" /> Observed readings only. Lines connect
        recorded measurements.
      </div>
    </section>
  );
}
function ReadingTable({ records }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Measured</th>
            <th>Reading</th>
            <th>Value</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r._id}>
              <td>{dateTime(r.measuredAt)}</td>
              <td>{r.type === "glucose" ? "Glucose" : "Blood pressure"}</td>
              <td>
                <b>
                  {r.type === "glucose"
                    ? r.value
                    : `${r.systolic}/${r.diastolic}`}
                </b>{" "}
                <small>{r.unit}</small>
              </td>
              <td>
                <span className="tag subtle">{r.context}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Readings(props) {
  const [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1);
  const rows = [...props.data.readings]
    .filter((r) => filter === "all" || r.type === filter)
    .sort((a, b) => new Date(b.measuredAt) - new Date(a.measuredAt));
  function exportCsv() {
    const header = "Measured at,Type,Value,Systolic,Diastolic,Unit,Context\n";
    const csv =
      header +
      rows
        .map((r) =>
          [
            r.measuredAt,
            r.type,
            r.value ?? "",
            r.systolic ?? "",
            r.diastolic ?? "",
            r.unit,
            r.context,
          ].join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "chroniccare-readings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR HEALTH JOURNAL"
        title="Every reading tells a story."
        subtitle="Glucose and blood pressure, with the context that matters."
        action={
          <button className="button" onClick={() => props.setModal("reading")}>
            <Plus size={18} /> Add reading
          </button>
        }
      />
      <TrendCard data={props.data} full />
      <section className="panel history">
        <div className="panel-heading">
          <h3>Reading history</h3>
          <div className="inline-actions">
            <select
              aria-label="Filter reading history"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All readings</option>
              <option value="glucose">Glucose</option>
              <option value="blood-pressure">Blood pressure</option>
            </select>
            <button
              className="button secondary small-button"
              onClick={exportCsv}
              disabled={!rows.length}
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>
        {rows.length ? (
          <ReadingTable records={rows.slice((page - 1) * 10, page * 10)} />
        ) : (
          <Empty text="Your first reading is the start of your story." />
        )}
        <div className="pagination">
          <span>{rows.length} readings</span>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.max(1, Math.ceil(rows.length / 10))}
          </span>
          <button
            disabled={page * 10 >= rows.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </>
  );
}
function DoseList({ data, mutate, clinician, timezone, compact = false }) {
  const [saving, setSaving] = useState("");
  const doses = occurrences(data.medications, 1, new Date(), timezone);
  async function mark(o, status) {
    setSaving(o.medication._id + o.scheduledFor);
    const log = {
      medicationId: o.medication._id,
      scheduledFor: o.scheduledFor,
      status,
    };
    await mutate(
      (d) => ({
        ...d,
        doses: [
          ...d.doses.filter(
            (x) =>
              !(
                x.medicationId === log.medicationId &&
                x.scheduledFor === log.scheduledFor
              ),
          ),
          log,
        ],
      }),
      `/medications/${o.medication._id}/doses/${encodeURIComponent(o.scheduledFor)}`,
      { method: "PUT", body: { status } },
    );
    setSaving("");
  }
  return (
    <div className="dose-list">
      {(compact ? doses.slice(0, 3) : doses).map((o) => {
        const status =
          data.doses.find(
            (d) =>
              d.medicationId === o.medication._id &&
              d.scheduledFor === o.scheduledFor,
          )?.status || "unknown";
        return (
          <div className="dose-row" key={o.medication._id + o.scheduledFor}>
            <div className={`dose-icon ${status === "taken" ? "done" : ""}`}>
              {status === "taken" ? <Check size={18} /> : <Pill size={19} />}
            </div>
            <div className="dose-copy">
              <b>{o.medication.name}</b>
              <small>{o.medication.instructions}</small>
              <span>
                <Clock size={12} /> {o.time} ·{" "}
                {status === "unknown"
                  ? o.due
                    ? "Unrecorded"
                    : "Upcoming"
                  : status}
              </span>
            </div>
            {!clinician && (
              <select
                aria-label={`Dose status for ${o.medication.name} at ${o.time}`}
                disabled={
                  !o.due || saving === o.medication._id + o.scheduledFor
                }
                value={status}
                onChange={(e) => mark(o, e.target.value)}
              >
                <option value="unknown">Unrecorded</option>
                <option value="taken">Taken</option>
                <option value="skipped">Skipped</option>
              </select>
            )}
          </div>
        );
      })}
      {!doses.length && <Empty text="No scheduled doses today." />}
    </div>
  );
}
function Medications(props) {
  return (
    <>
      <PageHeading
        eyebrow="A ROUTINE THAT WORKS FOR YOU"
        title="A little consistency, every day."
        subtitle="Record what you’ve taken. Keep your care team in the loop."
        action={
          <button
            className="button"
            onClick={() => props.setModal("medication")}
          >
            <Plus size={18} /> Add schedule
          </button>
        }
      />
      <section className="panel">
        <div className="panel-heading">
          <h3>Today’s medication log</h3>
          <span className="tag subtle">Self-reported</span>
        </div>
        <DoseList {...props} />
        <p className="fine-print">
          Reminders appear when you open this app. Unrecorded does not mean
          missed. Future doses cannot be marked taken.
        </p>
      </section>
      <h2 className="section-title">Your schedules</h2>
      <div className="medication-grid">
        {props.data.medications.map((m) => (
          <article className="panel medication-card" key={m._id}>
            <span className="icon-box lavender">
              <Pill size={23} />
            </span>
            <h3>{m.name}</h3>
            <p>{m.instructions}</p>
            <div className="med-times">
              {m.scheduleVersions.at(-1).times.map((t) => (
                <span className="tag subtle" key={t}>
                  <Clock size={13} />
                  {t}
                </span>
              ))}
            </div>
            <small>
              {m.provenance} · Schedule v{m.scheduleVersions.at(-1).version}
            </small>
          </article>
        ))}
      </div>
      <div className="info-note">
        <ShieldCheck size={17} /> Schedules record existing instructions. This
        app does not recommend medications or dose changes.
      </div>
    </>
  );
}
function FollowUps(props) {
  const [filter, setFilter] = useState("all");
  return (
    <>
      <PageHeading
        eyebrow="YOUR NEXT STEPS"
        title="Care doesn’t stop at a visit."
        subtitle="Keep follow-ups and your care team’s plans close."
        action={
          props.clinician && (
            <button className="button" onClick={() => props.setModal("plan")}>
              <Plus size={18} /> Create follow-up
            </button>
          )
        }
      />
      <div className="segmented standalone">
        {["all", "open", "completed"].map((f) => (
          <button
            key={f}
            className={filter === f ? "selected" : ""}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <section className="panel">
        {props.data.plans
          .filter((p) => filter === "all" || p.status === filter)
          .map((p) => (
            <div className="followup-row large" key={p._id}>
              <span className="date-tile">
                {new Date(p.dueAt).toLocaleDateString("en-IN", {
                  month: "short",
                })}
                <b>{new Date(p.dueAt).getDate()}</b>
              </span>
              <div>
                <span className="tag subtle">
                  {p.status === "completed"
                    ? "Completed"
                    : new Date(p.dueAt) < new Date()
                      ? "Overdue"
                      : "Upcoming"}
                </span>
                <h3>{p.title}</h3>
                <small>
                  {props.demo
                    ? "Dr. Maya Chen · Synthetic care plan"
                    : "Clinician-authored plan"}{" "}
                  · Due {dateText(p.dueAt)}
                </small>
              </div>
              <button
                className="button secondary small-button"
                onClick={() =>
                  props.mutate(
                    (d) => ({
                      ...d,
                      plans: d.plans.map((x) =>
                        x._id === p._id
                          ? {
                              ...x,
                              status:
                                p.status === "completed" ? "open" : "completed",
                              version: x.version + 1,
                            }
                          : x,
                      ),
                    }),
                    `/care-plans/${p._id}`,
                    {
                      method: "PATCH",
                      body: {
                        status: p.status === "completed" ? "open" : "completed",
                        version: p.version,
                      },
                    },
                  )
                }
              >
                {p.status === "completed" ? (
                  "Reopen"
                ) : (
                  <>
                    <Check size={16} /> Mark complete
                  </>
                )}
              </button>
            </div>
          ))}
        {!props.data.plans.length && (
          <Empty text="Your clinician’s follow-up plans will appear here." />
        )}
      </section>
    </>
  );
}
function Sharing(props) {
  const [token, setToken] = useState(""),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(""),
    [created, setCreated] = useState("");
  async function inspect(e) {
    e.preventDefault();
    setError("");
    try {
      setPreview(
        await api(`/care-links/invitations/${encodeURIComponent(token)}`),
      );
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="CONNECTED, ON YOUR TERMS"
        title="Your care. Your circle."
        subtitle="Choose who can review your records. Revoke access at any time."
      />
      <section className="panel">
        <div className="panel-heading">
          <h3>Active care connections</h3>
          <ShieldCheck size={22} />
        </div>
        {props.data.links
          .filter((l) => l.status === "active")
          .map((l) => (
            <div className="followup-row" key={l._id}>
              <span className="avatar">MC</span>
              <div>
                <b>{l.name || "Approved care connection"}</b>
                <small>May read records and create care plans</small>
              </div>
              <button
                className="text-button danger"
                onClick={() =>
                  props.mutate(
                    (d) => ({
                      ...d,
                      links: d.links.filter((x) => x._id !== l._id),
                    }),
                    `/care-links/${l._id}`,
                    { method: "DELETE" },
                  )
                }
              >
                Revoke access
              </button>
            </div>
          ))}
        {!props.data.links.length && (
          <Empty text="No active care connections. Your records are private." />
        )}
      </section>
      <section className="panel sharing-invite">
        <h3>
          {props.clinician ? "Invite a patient" : "Connect with your clinician"}
        </h3>
        {props.demo ? (
          <p>
            This synthetic demo shows consent-based sharing. Sign in to accept a
            real invitation.
          </p>
        ) : props.clinician ? (
          <>
            <p>Create a single-use invitation, valid for 24 hours.</p>
            <button
              className="button"
              onClick={async () => {
                try {
                  const r = await api("/care-links/invitations", {
                    method: "POST",
                  });
                  setCreated(r.token);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Create invitation
            </button>
            {created && (
              <label>
                Share this invitation code
                <input readOnly value={created} />
              </label>
            )}
          </>
        ) : (
          <form onSubmit={inspect}>
            <p>
              Paste your clinician’s invitation code. You’ll see their identity
              before sharing.
            </p>
            <label>
              Invitation code
              <input
                required
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setPreview(null);
                }}
              />
            </label>
            <button className="button secondary">Review invitation</button>
          </form>
        )}
        {error && <div className="error">{error}</div>}
        {preview && (
          <div className="auth-demo">
            <h3>{preview.clinician}</h3>
            <p>{preview.permissions}</p>
            <button
              className="button"
              onClick={async () => {
                if (
                  await props.mutate((d) => d, "/care-links/accept", {
                    method: "POST",
                    body: { token },
                  })
                ) {
                  setPreview(null);
                  setToken("");
                }
              }}
            >
              Approve sharing
            </button>
          </div>
        )}
      </section>
      <div className="info-note">
        <ShieldCheck size={17} /> Revoking access blocks subsequent requests
        from that clinician.
      </div>
    </>
  );
}
function Modal({ title, children, onClose }) {
  const ref = React.useRef();
  useEffect(() => {
    const prior = document.activeElement;
    ref.current.showModal();
    return () => prior?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-title">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function EntryForm({
  kind,
  data,
  demo,
  clinician,
  patientId,
  mutate,
  onClose,
}) {
  const [type, setType] = useState("glucose"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const now = new Date(),
    local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  const requestId = React.useRef(uid());
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = Object.fromEntries(new FormData(e.target));
    try {
      let body, endpoint, fn;
      if (kind === "reading") {
        body = {
          type,
          unit: type === "glucose" ? f.unit : "mmHg",
          context: f.context,
          measuredAt: new Date(f.measuredAt).toISOString(),
          clientRequestId: requestId.current,
          ...(type === "glucose"
            ? { value: Number(f.value) }
            : { systolic: Number(f.systolic), diastolic: Number(f.diastolic) }),
        };
        if (new Date(body.measuredAt) > new Date())
          throw new Error("Measurement cannot be in the future.");
        if (type === "blood-pressure" && body.diastolic >= body.systolic)
          throw new Error("Systolic must be greater than diastolic.");
        if (type === "glucose" && body.unit === "mmol/L" && body.value > 83)
          throw new Error("Check the glucose value and unit.");
        endpoint = `/patients/${patientId}/readings`;
        fn = (d) => ({
          ...d,
          readings: [
            { ...body, _id: requestId.current },
            ...d.readings.filter((r) => r._id !== requestId.current),
          ],
        });
      } else if (kind === "medication") {
        body = {
          name: f.name,
          instructions: f.instructions,
          times: [f.time],
          asNeeded: false,
        };
        endpoint = `/patients/${patientId}/medications`;
        fn = (d) => ({
          ...d,
          medications: [
            ...d.medications,
            {
              _id: uid(),
              name: f.name,
              instructions: f.instructions,
              provenance: "self-reported",
              startAt: new Date().toISOString(),
              scheduleVersions: [
                {
                  version: 1,
                  effectiveAt: new Date().toISOString(),
                  times: [f.time],
                  asNeeded: false,
                },
              ],
            },
          ],
        });
      } else {
        body = { title: f.title, dueAt: new Date(f.dueAt).toISOString() };
        endpoint = `/patients/${patientId}/care-plans`;
        fn = (d) => ({
          ...d,
          plans: [
            ...d.plans,
            { ...body, _id: uid(), status: "open", version: 1 },
          ],
        });
      }
      if (await mutate(fn, endpoint, { method: "POST", body })) onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="entry-form">
      {demo && (
        <div className="info-note compact">
          Synthetic demo only · Saved in this browser
        </div>
      )}
      {kind === "reading" ? (
        <>
          <div className="segmented standalone">
            <button
              type="button"
              className={type === "glucose" ? "selected" : ""}
              onClick={() => setType("glucose")}
            >
              <Droplets size={16} /> Glucose
            </button>
            <button
              type="button"
              className={type === "blood-pressure" ? "selected" : ""}
              onClick={() => setType("blood-pressure")}
            >
              <HeartPulse size={16} /> Blood pressure
            </button>
          </div>
          {type === "glucose" ? (
            <div className="form-grid">
              <label>
                Glucose value
                <input
                  type="number"
                  name="value"
                  min="0.1"
                  max="1500"
                  step="0.1"
                  required
                  autoFocus
                />
              </label>
              <label>
                Unit
                <select name="unit">
                  <option>mg/dL</option>
                  <option>mmol/L</option>
                </select>
              </label>
            </div>
          ) : (
            <div className="form-grid">
              <label>
                Systolic · mmHg
                <input
                  type="number"
                  name="systolic"
                  min="30"
                  max="350"
                  required
                />
              </label>
              <label>
                Diastolic · mmHg
                <input
                  type="number"
                  name="diastolic"
                  min="20"
                  max="250"
                  required
                />
              </label>
            </div>
          )}
          <label>
            Measured at
            <input
              type="datetime-local"
              name="measuredAt"
              defaultValue={local}
              max={local}
              required
            />
          </label>
          <label>
            Context
            <select name="context" key={type}>
              {(type === "glucose"
                ? ["fasting", "post-meal", "random"]
                : ["resting", "after-activity"]
              ).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : kind === "medication" ? (
        <>
          <label>
            Medication name
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <label>
            Existing instructions
            <input
              name="instructions"
              required
              maxLength={300}
              placeholder="Copy the directions you already follow"
            />
          </label>
          <label>
            Daily scheduled time
            <input type="time" name="time" required />
          </label>
          <p className="fine-print">
            {clinician
              ? "Recorded as clinician-authored."
              : "Recorded as a self-reported schedule."}{" "}
            Do not change your prescribed directions based on this app.
          </p>
        </>
      ) : (
        <>
          <label>
            Follow-up task
            <input name="title" minLength={3} maxLength={300} required />
          </label>
          <label>
            Due date
            <input name="dueAt" type="datetime-local" required />
          </label>
        </>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <button className="button secondary" type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="button" disabled={busy}>
          {busy
            ? "Saving…"
            : "Save " +
              (kind === "reading"
                ? "reading"
                : kind === "medication"
                  ? "schedule"
                  : "follow-up")}
          <Check size={16} />
        </button>
      </div>
    </form>
  );
}
function Empty({ text }) {
  return (
    <div className="empty">
      <Leaf size={25} />
      <p>{text}</p>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
