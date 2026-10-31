import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import SupportHeader from "./SupportHeader";
import { get } from "./api";
import "./booking.css";

export const supportNames = { SITE_VISIT: "Site Visit Support", REMOTE: "Remote Support", GENERAL: "General IT Support" };
export const statusName = value => String(value || "").toLowerCase().replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
export const money = value => {
  const num = Number(value || 0);
  return `AED ${num % 1 === 0 ? num : num.toFixed(2)}`;
};
export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener("popstate", update); return () => window.removeEventListener("popstate", update); }, []);
  function navigate(url) { window.history.pushState({}, "", url); setPath(window.location.pathname); window.scrollTo(0, 0); }
  return [path, navigate];
}
export function useSession() {
  const [session, setSession] = useState({ loading: true, user: null });
  useEffect(() => {
    let active = true;
    const unauthorized = () => setSession({ loading: false, user: null });
    window.addEventListener("wefyx-unauthorized", unauthorized);
    if (!localStorage.getItem("wefyx-token")) unauthorized();
    else get("/auth/me").then(user => { if (active) setSession({ loading: false, user }); }).catch(() => { if (active) unauthorized(); });
    return () => { active = false; window.removeEventListener("wefyx-unauthorized", unauthorized); };
  }, []);
  return session;
}
export function BookingLayout({ children, title = "Book a Support Service", breadcrumb = "Book a Service", step, narrow = false }) {
  return <div className="wh-home bk-app">
    <SupportHeader/>
    <section className="bk-banner">
      <div>
        <h1>{title}</h1>
        <nav aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className="bk-crumb-sep">&gt;</span>
          <a href="/support">Support</a>
          <span className="bk-crumb-sep">&gt;</span>
          <span className="bk-crumb-active">{breadcrumb}</span>
        </nav>
      </div>
    </section>
    <main className={`bk-shell ${narrow ? "bk-narrow" : ""}`}>
      {step !== undefined && <Progress steps={["Service Details", "Schedule", "Review", "Request Status"]} current={step}/>}
      <div className="bk-page">{children}</div>
    </main>
  </div>;
}
export function Progress({ steps, current }) {
  return <ol className="bk-progress" aria-label="Progress">
    {steps.map((label, index) => (
      <li key={label} className={index < current ? "done" : index === current ? "active" : ""} aria-current={index === current ? "step" : undefined}>
        <span>{index < current ? <Check size={14}/> : index + 1}</span>
        <b>{label}</b>
      </li>
    ))}
  </ol>;
}
export function Field({ label, icon, children, required = false, className = "", ...props }) {
  return <label className={`bk-field ${className}`}>
    <span className="bk-field-label">{label}{required && <i aria-hidden="true"> *</i>}</span>
    {icon ? (
      <div className="bk-input-with-icon">
        <span className="bk-input-icon" aria-hidden="true">{icon}</span>
        {children || <input required={required} {...props}/>}
      </div>
    ) : (
      children || <input required={required} {...props}/>
    )}
  </label>;
}
export function Heading({ children, subtitle }) { return <div className="bk-heading"><h2 tabIndex={-1}>{children}</h2>{subtitle && <p>{subtitle}</p>}</div>; }
export function ErrorMessage({ children }) { return children ? <p className="bk-error" role="alert">{children}</p> : null; }
export function Empty({ children }) { return <p className="bk-empty" role="status">{children}</p>; }
export function Back({ onClick, children = "Back" }) { return <button type="button" className="bk-back" onClick={onClick}><ArrowLeft size={16}/>{children}</button>; }
export function Primary({ children, ...props }) { return <button className="wh-button" {...props}>{children}<ArrowRight size={17}/></button>; }
export function Summary({ booking }) {
  return <dl className="bk-summary">{[["Service type", booking.serviceName||supportNames[booking.supportType]||booking.supportType], ["Date & time", `${booking.date} · ${booking.time} (UAE)`], ["Company", booking.company], ["Contact person", booking.contactName], ["Issue category", booking.category], ["Subject", booking.subject], ["Address", `${booking.address}, ${booking.emirate}`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
export function StatusBadge({ status }) { return <span className={`bk-status bk-status-${status}`}>{statusName(status)}</span>; }
export function SignIn({ returnTo = window.location.pathname }) { return <div className="bk-empty"><ShieldCheck size={35}/><h2>Sign in to continue</h2><p>Use your Wefyx account to access your service bookings.</p><a className="wh-button" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in <ArrowRight size={16}/></a></div>; }
