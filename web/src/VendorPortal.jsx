import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MoreVertical,
  Package,
  PackageOpen,
  PanelLeftClose,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Store,
  User,
  X,
  Zap,
} from "lucide-react";
import { downloadFile, get, send } from "./api";

const label = (v) =>
  String(v || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());

const current = (rows) =>
  [...(rows || [])].sort((a, b) => (b.version || 1) - (a.version || 1) || b.id - a.id)[0];

const styles = {
  INVITED: "bg-amber-50 text-amber-700 border border-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SUBMITTED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700 border border-orange-200",
  SENT_TO_VENDOR: "bg-amber-50 text-amber-800 border border-amber-200",
  DECLINED: "bg-slate-100 text-slate-600 border border-slate-200",
};

export default function VendorPortal({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [selected, setSelected] = useState(null);
  const [resolution,setResolution]=useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");
  const [terms, setTerms] = useState("");
  const [message, setMessage] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const toast = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 3500);
  };

  async function load() {
    try {
      const requirements = await get("/requirements?view=vendor");
      const rows = await Promise.all(
        (Array.isArray(requirements) ? requirements : []).map(async (r) => ({
          ...r,
          vendorQuote: current(
            await get(`/requirements/${r.id}/quotations?view=vendor`).catch(() => [])
          ),
        }))
      );
      setOrders(rows);
    } catch {
      setError("Unable to load assigned vendor requirements. Please refresh.");
    }
  }

  const loadNotifications = () => {
    get("/notifications")
      .then((res) => setNotifications(Array.isArray(res) ? res : []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    loadNotifications();
    const timer = setInterval(() => {
      load();
      loadNotifications();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Real-time live conversation polling
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => {
      get(`/requirements/${selected.id}/messages`)
        .then((chat) => setMessages(chat || []))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [selected?.id]);

  async function open(order) {
    setSelected(order);
    setDetailLoading(true);
    setError("");
    setDeclining(false);
    try {
      const [detail, quotes, attachments, chat] = await Promise.all([
        get(`/requirements/${order.id}`),
        get(`/requirements/${order.id}/quotations?view=vendor`).catch(() => []),
        get(`/requirements/${order.id}/attachments`).catch(() => []),
        get(`/requirements/${order.id}/messages`).catch(() => []),
      ]);
      setSelected({ ...order, ...detail });
      const q = current(quotes);
      setQuote(q);
      setFiles(attachments || []);
      setMessages(chat || []);
      setAmount(q?.amount || "");
      setDays(q?.leadTimeDays || "");
      setTerms(q?.notes || "");
    } catch (e) {
      setError(e.message || "Failed to load requirement details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function decide(accepted) {
    if (!selected || busy) return;
    if (!accepted && !reason.trim()) {
      setError("Select a reason for declining this requirement.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await send(`/requirements/${selected.id}/vendor-decision`, "PATCH", {
        accepted,
        notes: accepted ? "" : reason,
      });
      setQuote(saved);
      setSelected((s) => ({ ...s, vendorQuote: saved }));
      await load();
      if (accepted) {
        setDeclining(false);
        toast("Requirement accepted. Quotation and chat are unlocked.");
      } else {
        toast("Requirement declined.");
        setSelected(null);
      }
    } catch (e) {
      setError(e.message || "Unable to update requirement.");
    } finally {
      setBusy(false);
    }
  }

  async function updateFulfillment(action){
    if(!selected||busy)return;setBusy(true);setError("");
    try{const updated=await send(`/requirements/${selected.id}/${action}`,"PATCH",action==="resolve"?{resolution:resolution.trim()}:{});setSelected(updated);setResolution("");await load();toast(action==="start"?"Work started.":"Resolution sent to the customer.")}
    catch(err){setError(err.message||"Unable to update work.")}finally{setBusy(false)}
  }

  async function submitQuote() {
    if (busy) return;
    if (!["ACCEPTED", "REVISION_REQUESTED"].includes(quote?.status)) {
      setError("Accept the requirement before submitting. Submitted quotations can only be changed when a revision is requested.");
      return;
    }
    if (!selected || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !Number.isInteger(Number(days)) || Number(days) <= 0) {
      setError("Please enter a valid quotation amount and delivery lead time.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await send(`/requirements/${selected.id}/quotations/submit`, "PATCH", {
        amount,
        leadTimeDays: days,
        notes: terms,
      });
      setQuote(saved);
      toast("Quotation submitted successfully to Wefyx.");
      await load();
    } catch (e) {
      setError(e.message || "Unable to submit quotation.");
    } finally {
      setBusy(false);
    }
  }

  async function sendChatMessage(e) {
    e?.preventDefault();
    if (!message.trim() || !selected) return;
    setBusy(true);
    try {
      const saved = await send(`/requirements/${selected.id}/messages`, "POST", {
        message: message.trim(),
        senderName: user.name || "Vendor Manager",
        senderRole: "VENDOR",
      });
      setMessages((rows) => [...rows, saved]);
      setMessage("");
    } catch (e) {
      setError(e.message || "Unable to send message.");
    } finally {
      setBusy(false);
    }
  }

  const activeOrders = useMemo(() => {
    return orders.filter(
      (r) => !["CLOSED","RESOLVED"].includes(r.status)&&!["DECLINED", "REJECTED", "NOT_SELECTED"].includes(r.vendorQuote?.status)
    );
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders.filter((r) =>
      ["CLOSED","RESOLVED"].includes(r.status)||["DECLINED", "REJECTED", "NOT_SELECTED"].includes(r.vendorQuote?.status)
    );
  }, [orders]);

  const shownOrders = useMemo(() => {
    const list = activeTab === "active" ? activeOrders : historyOrders;
    return list.filter((r) =>
      `${r.title} ${r.reference} ${r.category} ${r.organization}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [activeTab, activeOrders, historyOrders, searchQuery]);

  const state = quote?.status || selected?.vendorQuote?.status || "INVITED";
  const canSubmitQuote = ["ACCEPTED", "REVISION_REQUESTED"].includes(quote?.status);

  return (
    <div className="flex min-h-screen bg-[#f8fcfa] text-slate-900 font-sans">
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in">
          <CheckCircle2 size={16} className="text-[#00a86b]" />
          <span>{notice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR (Navy with #00a86b Green Active)         */}
      {/* ======================================================== */}
      <aside
        className={`${
          sidebarOpen ? "w-[240px]" : "w-0 lg:w-[72px]"
        } fixed inset-y-0 left-0 z-40 flex flex-col bg-[#09482e] text-white transition-all duration-300 ease-in-out lg:static shadow-xl`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="leading-tight">
              <b className="text-xl font-black tracking-tight text-white">
                wefyx<span className="text-[#00a86b]">.pro</span>
              </b>
              <p className="text-[9px] uppercase tracking-wider text-slate-400">
                IT Support | Asset Rental | NOC
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 text-xs font-semibold">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            VENDOR MANAGEMENT
          </div>

          {[
            { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "Orders", label: "Vendors & Orders", icon: Store },
            { id: "Products", label: "Products & Services", icon: Package },
            { id: "RFQ", label: "Purchase & RFQ", icon: ShoppingCart },
            { id: "Notifications", label: "Notifications", icon: Bell, badge: notifications.filter((x) => !x.read).length },
            { id: "Help", label: "Help Center", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition ${
                  isActive
                    ? "bg-[#00a86b] text-white font-bold shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
                {sidebarOpen && item.badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <PanelLeftClose size={15} />
            {sidebarOpen && <span>Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN HEADER & CONTENT AREA                            */}
      {/* ======================================================== */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8 shadow-xs">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                Vendor Operations
              </h1>
              <p className="text-[11px] text-slate-500">
                All Organizations › {activeNav}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden h-9 w-52 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs md:flex lg:w-64">
              <Search size={14} className="text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..."
                className="w-full bg-transparent outline-none"
              />
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 lg:flex">
              <Building2 size={14} className="text-[#00a86b]" />
              <span>{user?.organization || "TechSolutions LLC"}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell size={18} />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
                6
              </span>
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 font-bold text-[#00a86b]">
                {(user?.name || "V")[0].toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <b className="block text-xs font-bold text-slate-900">{user?.name || "Sara Ali"}</b>
                <span className="block text-[10px] text-slate-500">Vendor Partner</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 space-y-6 p-4 lg:p-6 max-w-[1500px] w-full mx-auto">
          {/* Summary Metric Cards (Matches Screenshot Running Theme) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total RFQs", count: orders.length, icon: Zap, tone: "bg-emerald-50 text-emerald-600" },
              { label: "Active Orders", count: activeOrders.length, icon: CheckCircle2, tone: "bg-emerald-50 text-[#00a86b]" },
              { label: "Pending Quotes", count: orders.filter((x) => x.vendorQuote?.status === "INVITED" || !x.vendorQuote).length, icon: Clock3, tone: "bg-emerald-50 text-emerald-600" },
              { label: "Completed Orders", count: historyOrders.length, icon: Store, tone: "bg-teal-50 text-teal-600" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${item.tone}`}>
                    <Icon size={22} />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
                    <b className="mt-1 block text-3xl font-black text-slate-900">{item.count}</b>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Table Card (Matches Running Theme) */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {/* Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Vendor Order Management</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("active")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === "active"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Active orders
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === "history"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Order history
                  </button>
                </div>

                <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs">
                  <Search size={14} className="text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders..."
                    className="w-44 bg-transparent outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={load}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">ORDER / REQUIREMENT</th>
                    <th className="px-4 py-3.5">CUSTOMER ORGANIZATION</th>
                    <th className="px-4 py-3.5">CATEGORY &amp; DETAILS</th>
                    <th className="px-4 py-3.5">STATUS</th>
                    <th className="px-4 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shownOrders.map((order) => {
                    const s = order.vendorQuote?.status || "SENT_TO_VENDOR";
                    return (
                      <tr key={order.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div>
                            <b className="block text-slate-900 font-bold">{order.title}</b>
                            <span className="text-[11px] text-slate-400">{order.reference}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-700">
                            {order.organization || "Wefyx Technologies"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {order.category || "Hardware / equipment"} · Dubai, UAE
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${
                              styles[s] || "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {s === "SENT_TO_VENDOR" ? "Active Order" : label(s)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => open(order)}
                              title="View & quote"
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => open(order)}
                              title="Submit quotation"
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title="More options"
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <MoreVertical size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {shownOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-sm text-slate-400">
                        No vendor orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Quotation & Chat Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <b className="text-xs font-bold text-[#00a86b]">{selected.reference}</b>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${styles[state] || "bg-slate-100"}`}>
                    {label(state)}
                  </span>
                </div>
                <h2 className="mt-1.5 text-xl font-bold text-slate-900">{selected.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-6 mt-6 lg:grid-cols-[1.2fr_1fr]">
              {/* Scope & Files */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Requirement Scope
                  </h4>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {selected.description}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-slate-200 pt-3">
                    <div>
                      <span className="text-slate-400">Category:</span>
                      <b className="block text-slate-800">{selected.category || "General"}</b>
                    </div>
                    <div>
                      <span className="text-slate-400">Customer:</span>
                      <b className="block text-slate-800">{selected.organization || "Wefyx Client"}</b>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Customer Attachments
                  </h4>
                  {files.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {files.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => downloadFile(`/requirements/${selected.id}/attachments/${f.id}/download`, f.fileName)}
                          className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs hover:bg-slate-100 transition"
                        >
                          <span className="truncate font-semibold text-slate-800">{f.fileName}</span>
                          <FileText size={14} className="text-[#00a86b] shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">No attachments provided.</p>
                  )}
                </div>
              </div>

              {/* Quotation Form */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Vendor Quotation
                  </h4>
                  <p className="mt-2 text-xs text-slate-600">Status: {label(state)}</p>{selected.vendorName?.toLowerCase()===user.email?.toLowerCase()&&<div className="my-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">{["AGREED_PRICING_RECORDED","VENDOR_ACCEPTED"].includes(selected.status)&&<button type="button" disabled={busy} onClick={()=>updateFulfillment("start")} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white">Start work</button>}{selected.status==="IN_PROGRESS"&&<><label className="block text-sm font-bold" htmlFor="vendor-resolution">Work completed / resolution</label><textarea id="vendor-resolution" maxLength={4000} rows={3} className="my-3 w-full rounded-lg border p-3 text-sm" value={resolution} onChange={e=>setResolution(e.target.value)}/><button type="button" disabled={busy||!resolution.trim()} onClick={()=>updateFulfillment("resolve")} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Mark work resolved</button></>}</div>}
                  {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
                  {state === "INVITED" && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-600">Accept this requirement to prepare and submit your quotation.</p>
                      <button type="button" disabled={busy || detailLoading || !quote} onClick={() => decide(true)} className="mt-2 rounded-lg bg-[#00a86b] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Accept Requirement</button>
                      <button type="button" disabled={busy || detailLoading || !quote} onClick={() => setDeclining(true)} className="ml-2 mt-2 rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-50">Reject Invite</button>
                      {declining && <div className="mt-3">
                        <label htmlFor="vendor-rejection-reason" className="text-xs font-semibold">Reason for rejection</label>
                        <textarea id="vendor-rejection-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={3000} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm" />
                        <button type="button" disabled={busy || !reason.trim()} onClick={() => decide(false)} className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm Rejection</button>
                        <button type="button" disabled={busy} onClick={() => setDeclining(false)} className="ml-3 text-xs">Cancel</button>
                      </div>}
                    </div>
                  )}
                  {!canSubmitQuote && state !== "INVITED" && <p className="mt-3 text-xs text-slate-600">{state === "SUBMITTED" ? "Quotation submitted. Waiting for review." : "This quotation is not open for editing."}</p>}
                  <fieldset disabled={busy || !canSubmitQuote}>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Amount (AED)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#00a86b]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Lead Days</label>
                      <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        placeholder="e.g. 3"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#00a86b]"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-[10px] font-bold text-slate-500">Terms / Scope</label>
                    <textarea
                      rows={2}
                      maxLength={3000}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      placeholder="Scope, warranty, delivery terms..."
                      className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-[#00a86b]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy || !canSubmitQuote}
                    onClick={submitQuote}
                    className="mt-3 w-full rounded-xl bg-[#00a86b] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#008c59] disabled:opacity-50"
                  >
                    {busy ? "Submitting…" : "Send Quotation"}
                  </button>
                  </fieldset>
                </div>

                {/* Chat */}
                <div className="rounded-2xl border border-emerald-100 p-5 bg-emerald-50/30">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <MessageCircle size={15} className="text-[#00a86b]" />
                      <span>Live Multi-Party Conversation</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {messages.length} msg{messages.length === 1 ? "" : "s"} · Auto-updating
                    </span>
                  </div>

                  <div className="mt-3 max-h-52 space-y-3 overflow-y-auto pr-1">
                    {messages.map((m) => {
                      const isMe =
                        m.senderRole === "VENDOR" ||
                        (user?.email && m.senderEmail?.toLowerCase() === user.email.toLowerCase());
                      const rolePills = {
                        SUPER_ADMIN: "bg-amber-100 text-amber-800 border border-amber-300",
                        EMPLOYEE: "bg-emerald-100 text-emerald-800 border border-emerald-300",
                        CUSTOMER: "bg-emerald-100 text-emerald-800 border border-emerald-300",
                        VENDOR: "bg-purple-100 text-purple-800 border border-purple-300",
                      };
                      const niceRoleLabel = (r = "") => {
                        const up = String(r || "").toUpperCase();
                        if (up.includes("SUPER") || up.includes("ADMIN")) return "Super Admin";
                        if (up.includes("EMPLOYEE")) return "Support Specialist";
                        if (up.includes("VENDOR")) return "Vendor Partner";
                        if (up.includes("CUSTOMER")) return "Customer";
                        return r || "User";
                      };

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-xs font-bold text-slate-900">{m.senderName}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                                rolePills[m.senderRole] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {niceRoleLabel(m.senderRole)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Just now"}
                            </span>
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2 text-xs max-w-sm shadow-xs leading-relaxed ${
                              isMe
                                ? "bg-[#00a86b] text-white rounded-tr-none font-medium"
                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                            }`}
                          >
                            {m.message}
                          </div>
                        </div>
                      );
                    })}

                    {!messages.length && (
                      <p className="p-4 text-center text-xs text-slate-400">
                        No messages yet. Send a message to communicate with the customer and support team.
                      </p>
                    )}
                  </div>

                  <form onSubmit={sendChatMessage} className="mt-3 flex gap-2">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message to all stakeholders..."
                      className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs outline-none focus:border-[#00a86b]"
                    />
                    <button
                      type="submit"
                      disabled={busy || !message.trim()}
                      className="flex h-10 items-center justify-center gap-1 rounded-xl bg-[#00a86b] px-4 text-xs font-bold text-white hover:bg-[#00965f] disabled:opacity-50 transition"
                    >
                      <Send size={14} />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
