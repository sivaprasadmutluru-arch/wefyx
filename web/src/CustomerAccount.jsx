import { useEffect, useMemo, useState } from "react";
import {
  Bell, CheckCircle2, CircleHelp, ClipboardList, Clock3, FilePlus2, Headphones,
  History, ImagePlus, LayoutDashboard, LogOut, MapPin, Package, Save, ShieldCheck,
  ShoppingBag, Ticket, UserRound
} from "lucide-react";
import UnifiedHeader from "./UnifiedHeader";
import { PublicFooter } from "./RentalPages";
import { get, send } from "./api";

const tabs = [
  ["", "Overview", LayoutDashboard],
  ["orders", "Orders", ShoppingBag],
  ["requirements", "Requirements", ClipboardList],
  ["tickets", "Support", Ticket],
  ["profile", "Profile", UserRound],
  ["help", "Help", CircleHelp],
];

const textStatus = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
const formatDate = (value) => value ? new Date(value).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" }) : "—";
const money = (value) => `AED ${Number(value || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const badge = (status = "") => {
  if (["COMPLETED", "RESOLVED", "CLOSED", "CONFIRMED"].includes(status)) return "bg-emerald-100 text-emerald-800";
  if (["CANCELLED", "DECLINED", "REJECTED"].includes(status)) return "bg-red-100 text-red-700";
  if (["PROCESSING", "IN_PROGRESS", "UNDER_REVIEW", "DISPATCHED"].includes(status)) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
};

function Empty({ icon: Icon, title, copy, action, href }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <Icon className="mx-auto text-emerald-600" size={32}/><h3 className="mt-3 text-base font-bold">{title}</h3><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{copy}</p>
    {action && <a href={href} className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white">{action}</a>}
  </div>;
}

export default function CustomerAccount() {
  const section = window.location.pathname.replace(/^\/account\/?/, "").split("/")[0];
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("wefyx-user") || "null"));
  const [orders, setOrders] = useState([]), [requirements, setRequirements] = useState([]), [tickets, setTickets] = useState([]), [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(() => new URLSearchParams(window.location.search).get("created") || "");
  const [photoUrl, setPhotoUrl] = useState("");
  const [profile, setProfile] = useState({ name: "", email: "", organization: "", phone: "", jobTitle: "", website: "", emirate: "Dubai", address: "", country: "United Arab Emirates" });
  const [ticketForm, setTicketForm] = useState({ requirementId: "", subject: "", category: "General support", priority: "MEDIUM", description: "" });

  const loadPhoto = async () => {
    const token = localStorage.getItem("wefyx-token");
    if (!token) return;
    const response = await fetch("/api/profile/photo", { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    setPhotoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return url; });
  };

  const load = async () => {
    setLoading(true);setError("");
    try {
      const [me, orderRows, requestRows, ticketRows, noticeRows, profileData] = await Promise.all([
        get("/auth/me"), get("/orders"), get("/requirements?view=customer"), get("/tickets"), get("/notifications"), get("/profile")
      ]);
      if (me.role !== "CUSTOMER") { window.location.assign("/portal"); return; }
      setUser(me);localStorage.setItem("wefyx-user", JSON.stringify(me));setOrders(orderRows || []);setRequirements(requestRows || []);setTickets(ticketRows || []);setNotifications(noticeRows || []);setProfile(profileData);
      loadPhoto().catch(() => {});
    } catch (requestError) { setError(requestError.message || "Unable to load your account."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!localStorage.getItem("wefyx-token") || !user) { window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`); return; }
    if (user.role !== "CUSTOMER") { window.location.assign("/portal"); return; }
    load();
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl); };
  }, []);

  useEffect(() => {
    if (!orderSuccess) return undefined;
    const timer = window.setTimeout(() => {
      setOrderSuccess("");
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [orderSuccess]);

  const stats = useMemo(() => ({
    activeOrders: orders.filter((x) => !["COMPLETED", "CANCELLED"].includes(x.status)).length,
    openRequirements: requirements.filter((x) => !["RESOLVED", "CLOSED", "DECLINED", "REJECTED"].includes(x.status)).length,
    openTickets: tickets.filter((x) => !["RESOLVED", "CLOSED"].includes(x.status)).length,
    unread: notifications.filter((x) => !x.read).length,
  }), [orders, requirements, tickets, notifications]);

  const logout = () => { ["wefyx-token", "wefyx-auth", "wefyx-user", "wefyx-account-type"].forEach((key) => localStorage.removeItem(key)); window.location.assign("/"); };

  async function createTicket(event) {
    event.preventDefault();setError("");setSuccess("");
    try {
      const payload = { ...ticketForm, requirementId: ticketForm.requirementId ? Number(ticketForm.requirementId) : null };
      await send("/tickets", "POST", payload);setTicketForm({ requirementId: "", subject: "", category: "General support", priority: "MEDIUM", description: "" });setSuccess("Support ticket created. Our team has been notified.");await load();
    } catch (requestError) { setError(requestError.message || "Unable to create ticket."); }
  }

  async function saveProfile(event) {
    event.preventDefault();setError("");setSuccess("");
    try { const updated = await send("/profile", "PUT", profile);setProfile(updated);setUser((current) => ({ ...current, ...updated }));localStorage.setItem("wefyx-user", JSON.stringify({ ...user, ...updated }));setSuccess("Profile updated successfully."); }
    catch (requestError) { setError(requestError.message || "Unable to update profile."); }
  }

  async function uploadPhoto(file) {
    if (!file) return;setError("");
    const body = new FormData();body.append("file", file);const token = localStorage.getItem("wefyx-token");
    const response = await fetch("/api/profile/photo", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body });
    if (!response.ok) { const data = await response.json().catch(() => ({}));setError(data.message || "Unable to upload profile photo.");return; }
    await loadPhoto();setSuccess("Profile photo updated.");
  }

  if (!user) return null;
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    {orderSuccess&&<div className="sr-success-blast" role="status" aria-live="polite"><div className="sr-flower-burst">{Array.from({length:24},(_,i)=><i key={i} style={{"--petal":i}}/>)}</div><div className="sr-success-card"><div className="sr-success-flower">✿</div><CheckCircle2/><h2>Order Placed Successfully!</h2><p>{orderSuccess} was created successfully. You can track the order status from your account.</p><div className="sr-success-progress"/></div></div>}
    <UnifiedHeader/>
    <section className="border-b border-emerald-900/10 bg-gradient-to-r from-[#073b2e] to-[#008553] text-white">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/30 bg-white/15 text-xl font-bold shadow-lg place-items-center">{photoUrl ? <img className="h-full w-full object-cover" src={photoUrl} alt="Profile"/> : user.name?.slice(0, 1).toUpperCase()}</div>
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Customer account</p><h1 className="mt-1 text-2xl font-extrabold">Welcome, {user.name}</h1><p className="mt-1 text-sm text-emerald-100">{user.organization} · {user.email}</p></div>
        </div>
        <div className="flex gap-2"><a href="/shop" className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800">Shop products</a><a href="/services#requirement" className="rounded-xl border border-white/30 px-4 py-2.5 text-xs font-bold text-white">New requirement</a></div>
      </div>
    </section>
    <div className="sticky top-[60px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {tabs.map(([id, label, Icon]) => <a key={id} href={`/account${id ? `/${id}` : ""}`} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold ${section === id ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}><Icon size={15}/>{label}</a>)}
        <button onClick={logout} className="ml-auto flex shrink-0 items-center gap-2 px-3 text-xs font-bold text-slate-500 hover:text-red-600"><LogOut size={15}/>Sign out</button>
      </nav>
    </div>
    <main className="mx-auto min-h-[560px] max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17}/>{success}</div>}
      {loading ? <div className="grid min-h-[360px] place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"/></div> : <>
        {section === "" && <div className="space-y-7">
          <div><h2 className="text-2xl font-extrabold">Account overview</h2><p className="mt-1 text-sm text-slate-500">Orders, service requirements and support activity in one place.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[[Package,"Active orders",stats.activeOrders],[ClipboardList,"Open requirements",stats.openRequirements],[Headphones,"Open tickets",stats.openTickets],[Bell,"Unread updates",stats.unread]].map(([Icon,label,value])=><article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={20}/></div><b className="mt-4 block text-3xl">{value}</b><span className="text-sm text-slate-500">{label}</span></article>)}</div>
          <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Recent orders</h3><a className="text-xs font-bold text-emerald-700" href="/account/orders">View all</a></div>{orders.slice(0,3).map((x)=><div key={x.id} className="mt-4 flex items-center justify-between border-t pt-4 text-sm"><span><b>{x.reference}</b><small className="mt-1 block text-slate-500">{formatDate(x.createdAt)}</small></span><span className="text-right"><b>{money(x.total)}</b><small className={`mt-1 block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge(x.status)}`}>{textStatus(x.status)}</small></span></div>)}{!orders.length&&<p className="mt-5 text-sm text-slate-500">No orders yet.</p>}</section><section className="rounded-2xl border bg-white p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Service activity</h3><a className="text-xs font-bold text-emerald-700" href="/account/requirements">View history</a></div>{requirements.slice(0,3).map((x)=><div key={x.id} className="mt-4 flex items-center justify-between border-t pt-4 text-sm"><span><b>{x.title}</b><small className="mt-1 block text-slate-500">{x.reference || `REQ-${x.id}`}</small></span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${badge(x.status)}`}>{textStatus(x.status)}</span></div>)}{!requirements.length&&<p className="mt-5 text-sm text-slate-500">No requirements yet.</p>}</section></div>
        </div>}
        {section === "orders" && <section><h2 className="text-2xl font-extrabold">Order history</h2><p className="mt-1 mb-6 text-sm text-slate-500">Track purchases and equipment rentals placed through the website.</p>{orders.length ? <div className="space-y-4">{orders.map((order)=><article key={order.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h3 className="font-extrabold">{order.reference}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${badge(order.status)}`}>{textStatus(order.status)}</span></div><p className="mt-1 text-xs text-slate-500">Placed {formatDate(order.createdAt)} · {order.itemCount} item(s)</p></div><b className="text-lg text-emerald-800">{money(order.total)}</b></div>{order.deliveryAddress?.addressLine&&<div className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900"><MapPin size={15} className="mt-0.5 flex-shrink-0"/><span><b>{order.deliveryAddress.label || "Delivery address"}</b><small className="mt-1 block text-emerald-800">{order.deliveryAddress.contactName} · {order.deliveryAddress.phone}</small><small className="mt-1 block leading-5">{order.deliveryAddress.addressLine}, {order.deliveryAddress.emirate}</small>{order.deliveryAddress.latitude&&order.deliveryAddress.longitude&&<small className="mt-1 block">Location: {Number(order.deliveryAddress.latitude).toFixed(5)}, {Number(order.deliveryAddress.longitude).toFixed(5)}</small>}</span></div>}<div className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">{order.items?.map((item)=><div key={`${item.productId}-${item.mode}`} className="rounded-xl bg-slate-50 p-3 text-xs"><b>{item.name}</b><p className="mt-1 text-slate-500">{item.mode === "RENT" ? `${item.quantity} × ${item.months} month(s)` : `Quantity ${item.quantity}`}</p><strong className="mt-2 block">{money(item.lineTotal)}</strong></div>)}</div></article>)}</div> : <Empty icon={ShoppingBag} title="No orders yet" copy="Products and rentals checked out from your cart will appear here." action="Browse products" href="/shop"/>}</section>}
        {section === "requirements" && <section><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold">Requirement history</h2><p className="mt-1 text-sm text-slate-500">Track proposals, quotations and fulfillment status.</p></div><a href="/services#requirement" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">Submit requirement</a></div><div className="mt-6 space-y-3">{requirements.map((item)=><article key={item.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.reference || `REQ-${item.id}`} · {item.category} · {item.priority}</p><p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.description}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${badge(item.status)}`}>{textStatus(item.status)}</span></div></article>)}{!requirements.length&&<Empty icon={ClipboardList} title="No requirements yet" copy="Tell us what your business needs and our team will prepare a proposal." action="Create requirement" href="/services#requirement"/>}</div></section>}
        {section === "tickets" && <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div><h2 className="text-2xl font-extrabold">Support tickets</h2><p className="mt-1 mb-6 text-sm text-slate-500">Follow issues and resolutions from the Wefyx support team.</p><div className="space-y-3">{tickets.map((item)=><article key={item.id} className="rounded-2xl border bg-white p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold">{item.subject}</h3><p className="mt-1 text-xs text-slate-500">{item.reference} · {item.assignee || "Unassigned"}</p></div><span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${badge(item.status)}`}>{textStatus(item.status)}</span></div><p className="mt-3 text-sm text-slate-600">{item.description}</p>{item.resolution&&<p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"><b>Resolution:</b> {item.resolution}</p>}</article>)}{!tickets.length&&<Empty icon={Headphones} title="No support tickets" copy="Raise a ticket for a requirement or any account and service issue."/>}</div></div><form onSubmit={createTicket} className="h-fit rounded-2xl border bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 font-bold"><FilePlus2 size={18} className="text-emerald-600"/>Raise a ticket</h3><label className="mt-4 block text-xs font-bold">Related requirement (optional)<select value={ticketForm.requirementId} onChange={(e)=>setTicketForm({...ticketForm,requirementId:e.target.value})} className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"><option value="">General support issue</option>{requirements.map((x)=><option key={x.id} value={x.id}>{x.reference || `REQ-${x.id}`} · {x.title}</option>)}</select></label>{!ticketForm.requirementId&&<><label className="mt-4 block text-xs font-bold">Subject<input required value={ticketForm.subject} onChange={(e)=>setTicketForm({...ticketForm,subject:e.target.value})} className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"/></label><label className="mt-4 block text-xs font-bold">Description<textarea required rows="4" value={ticketForm.description} onChange={(e)=>setTicketForm({...ticketForm,description:e.target.value})} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label></>}<div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-bold">Category<input value={ticketForm.category} onChange={(e)=>setTicketForm({...ticketForm,category:e.target.value})} className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"/></label><label className="text-xs font-bold">Priority<select value={ticketForm.priority} onChange={(e)=>setTicketForm({...ticketForm,priority:e.target.value})} className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label></div><button className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white">Create support ticket</button></form></section>}
        {section === "profile" && <section className="mx-auto max-w-4xl"><h2 className="text-2xl font-extrabold">Profile and company details</h2><p className="mt-1 text-sm text-slate-500">Keep your contact and delivery information current.</p><div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-4 border-b pb-5"><div className="grid h-20 w-20 overflow-hidden rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-800 place-items-center">{photoUrl?<img src={photoUrl} className="h-full w-full object-cover" alt="Profile"/>:user.name?.[0]}</div><label className="cursor-pointer rounded-xl border px-4 py-2.5 text-xs font-bold text-slate-700"><ImagePlus className="mr-2 inline" size={15}/>Upload profile photo<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>uploadPhoto(e.target.files?.[0])}/></label></div><form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">{[["name","Full name"],["organization","Company / organization"],["phone","Mobile number"],["jobTitle","Job title"],["website","Website"],["emirate","Emirate"],["address","Address"],["country","Country"]].map(([key,label])=><label key={key} className={`text-xs font-bold ${key==="address"?"sm:col-span-2":""}`}>{label}<input required={["name","organization","phone"].includes(key)} value={profile[key]||""} onChange={(e)=>setProfile({...profile,[key]:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-emerald-600"/></label>)}<label className="text-xs font-bold sm:col-span-2">Email<input disabled value={profile.email||""} className="mt-2 h-11 w-full rounded-xl border bg-slate-50 px-3 font-normal text-slate-500"/></label><button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white sm:col-span-2"><Save size={15}/>Save profile</button></form></div></section>}
        {section === "help" && <section><h2 className="text-2xl font-extrabold">Help center</h2><p className="mt-1 text-sm text-slate-500">Get assistance with orders, requirements, tickets or your account.</p><div className="mt-6 grid gap-5 md:grid-cols-3">{[[Headphones,"Talk to support","Call +971 4 123 4567","tel:+97141234567"],[CircleHelp,"Send a support request","Describe your issue through our support form.","/contact"],[ShieldCheck,"Account and privacy","Review how Wefyx protects your information.","/privacy-policy"]].map(([Icon,title,copy,href])=><a href={href} key={title} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:border-emerald-400 hover:shadow-md"><Icon className="text-emerald-600" size={26}/><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></a>)}</div><div className="mt-6 rounded-2xl bg-[#073b2e] p-6 text-white"><h3 className="text-lg font-bold">Need urgent IT support?</h3><p className="mt-2 text-sm text-emerald-100">Create a support ticket and our operations team will receive it immediately.</p><a href="/account/tickets" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800">Raise a ticket</a></div></section>}
      </>}
    </main>
    <PublicFooter/>
  </div>;
}
