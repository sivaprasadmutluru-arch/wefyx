import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Headphones,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MoreVertical,
  Package,
  PanelLeftClose,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  User,
  UserCheck,
  UserRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { downloadFile, get, send, uploadFiles } from "./api";
import RequirementsPage from "./RequirementsPage";
import SupportRequestsPanel from "./SupportRequestsPanel";

const statusStyle = {
  SUBMITTED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border border-amber-200",
  SENT_TO_VENDOR: "bg-purple-50 text-purple-700 border border-purple-200",
  VENDOR_ACCEPTED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-600 border border-slate-200",
  DECLINED: "bg-red-50 text-red-700 border border-red-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
};

const readable = (v) =>
  String(v || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());

export default function EmployeePortal({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReq, setSelectedReq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const rows = await get("/requirements");
      setRequirements(Array.isArray(rows) ? rows : []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = () => {
    get("/notifications")
      .then((res) => setNotifications(Array.isArray(res) ? res : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    loadNotifications();
    const interval = setInterval(() => {
      loadData();
      loadNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Real-time live conversation polling
  useEffect(() => {
    if (!selectedReq) return;
    const interval = setInterval(() => {
      get(`/requirements/${selectedReq.id}/messages`)
        .then((chat) => setMessages(chat || []))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedReq?.id]);

  const myRequirements = useMemo(() => {
    return requirements.filter((r) => {
      const matchesSearch = `${r.title} ${r.reference} ${r.customerName} ${r.category} ${r.organization}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !["RESOLVED", "CLOSED", "DECLINED"].includes(r.status)) ||
        (statusFilter === "PENDING_QUOTE" && r.quotationStatus === "PENDING_VENDOR_SUBMISSION") ||
        (statusFilter === "COMPLETED" && ["RESOLVED", "CLOSED"].includes(r.status)) ||
        r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requirements, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: requirements.length,
      assigned: requirements.filter((x) => !["RESOLVED", "CLOSED"].includes(x.status)).length,
      inProgress: requirements.filter((x) => x.status === "IN_PROGRESS" || x.status === "SENT_TO_VENDOR").length,
      completed: requirements.filter((x) => ["RESOLVED", "CLOSED"].includes(x.status)).length,
      attention: requirements.filter((x) => x.priority === "Urgent" || x.priority === "High").length,
    };
  }, [requirements]);

  const openDetail = async (req) => {
    setSelectedReq(req);
    try {
      const [quoteList, msgList, fileList] = await Promise.all([
        get(`/requirements/${req.id}/quotations`).catch(() => []),
        get(`/requirements/${req.id}/messages`).catch(() => []),
        get(`/requirements/${req.id}/attachments`).catch(() => []),
      ]);
      setQuotes(quoteList || []);
      setMessages(msgList || []);
      setAttachments(fileList || []);
    } catch {
      // ignore
    }
  };

  const handleStatusChange = async (reqId, newStatus) => {
    setBusy(true);
    try {
      const actions={ACCEPTED:"accept",UNDER_REVIEW:"review",IN_PROGRESS:"start",RESOLVED:"resolve",CLOSED:"close"};
      if(!actions[newStatus])throw new Error("Use requirement details to invite a vendor.");
      const body={employeeName:user.name};
      if(newStatus==="RESOLVED"){const resolution=window.prompt("Describe the resolution");if(!resolution?.trim())return;body.resolution=resolution.trim();}
      const updated=await send(`/requirements/${reqId}/${actions[newStatus]}`, "PATCH", body);
      setRequirements((prev) =>
        prev.map((r) => (r.id === reqId ? updated : r))
      );
      if (selectedReq?.id === reqId) {
        setSelectedReq(updated);
      }
      showToast(`Status updated to ${readable(newStatus)}`);
    } catch (err) {
      showToast(err.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatMessage.trim() || !selectedReq) return;
    setBusy(true);
    try {
      const payload = {
        message: chatMessage.trim(),
        senderName: user?.name || "Support Engineer",
        senderRole: "EMPLOYEE",
      };
      const res = await send(`/requirements/${selectedReq.id}/messages`, "POST", payload);
      setMessages((prev) => [...prev, res]);
      setChatMessage("");
    } catch {
      showToast("Failed to send message.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveQuote = async (quoteId) => {
    if (!selectedReq) return;
    setBusy(true);
    try {
      await send(`/requirements/${selectedReq.id}/quotations/${quoteId}/review`, "PATCH", {action:"APPROVE"});
      showToast("Quotation approved and shared with customer.");
      openDetail(selectedReq);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to approve quotation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fcfa] text-slate-900 font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in">
          <CheckCircle2 size={16} className="text-[#00a86b]" />
          <span>{toast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR (Dark Navy with #00a86b Green Active)     */}
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

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 text-xs font-semibold">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SERVICE MANAGEMENT
          </div>

          {[
            { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "Requirements", label: "Requirements & Quotes", icon: ClipboardList },
            { id: "Tickets", label: "Tickets", icon: Ticket },
            { id: "Technicians", label: "Technicians / Field Tasks", icon: Headphones, link: "/service-tasks" },
            { id: "Approvals", label: "Contracts & Approvals", icon: FileCheck },
            { id: "Notifications", label: "Notifications", icon: Bell, badge: notifications.filter((x) => !x.read).length },
            { id: "Help", label: "Help Center", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return item.link ? (
              <a
                key={item.id}
                href={item.link}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Icon size={16} className="text-slate-400" />
                {sidebarOpen && <span>{item.label}</span>}
              </a>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
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
      {/* 2. MAIN HEADER & BODY                                    */}
      {/* ======================================================== */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Header */}
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
                Employee Operations
              </h1>
              <p className="text-[11px] text-slate-500">
                All Organizations › {activeTab}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="hidden h-9 w-52 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs md:flex lg:w-64">
              <Search size={14} className="text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..."
                className="w-full bg-transparent outline-none"
              />
            </div>

            {/* Org Badge */}
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 lg:flex">
              <Building2 size={14} className="text-[#00a86b]" />
              <span>Wefyx Technologies</span>
            </div>

            {/* Notification Bell */}
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
                {(user?.name || "E")[0].toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <b className="block text-xs font-bold text-slate-900">{user?.name || "Ahmed Khan"}</b>
                <span className="block text-[10px] text-slate-500">L2 Support Engineer</span>
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
          {/* Metric Summary Cards (Matches Screenshot Running Theme) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Assigned", count: stats.total, icon: Zap, tone: "bg-emerald-50 text-emerald-600" },
              { label: "Active Tasks", count: stats.assigned, icon: CheckCircle2, tone: "bg-emerald-50 text-[#00a86b]" },
              { label: "Pending Vendor", count: stats.inProgress, icon: Clock3, tone: "bg-emerald-50 text-emerald-600" },
              { label: "Attention Needed", count: stats.attention, icon: ShieldCheck, tone: "bg-teal-50 text-teal-600" },
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

          {/* Main Table Card (Matches Screenshot Table Styling) */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {/* Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Service Task Management
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs">
                  <Search size={14} className="text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-44 bg-transparent outline-none"
                  />
                </div>

                <a
                  href="/service-tasks"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#00a86b] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#008c59]"
                >
                  <Plus size={15} strokeWidth={2.6} />
                  <span>Add Task</span>
                </a>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">TASK / REQUIREMENT</th>
                    <th className="px-4 py-3.5">OWNER / ORGANIZATION</th>
                    <th className="px-4 py-3.5">DETAILS</th>
                    <th className="px-4 py-3.5">STATUS</th>
                    <th className="px-4 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRequirements.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div>
                          <b className="block text-slate-900 font-bold">{item.title}</b>
                          <span className="text-[11px] text-slate-400">{item.reference}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-700">
                          {item.organization || "Wefyx Technologies"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {item.category || "IT Support"} · {item.location || "Dubai, UAE"}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          disabled={busy}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none"
                        >
                          <option value={item.status}>{readable(item.status)}</option>
                          {item.status==="SUBMITTED"&&<option value="ACCEPTED">Accept requirement</option>}
                          {item.status==="ACCEPTED"&&<option value="UNDER_REVIEW">Start review</option>}
                          {["ACCEPTED","UNDER_REVIEW","VENDOR_ACCEPTED","AGREED_PRICING_RECORDED"].includes(item.status)&&<option value="IN_PROGRESS">Start work</option>}
                          {item.status==="IN_PROGRESS"&&<option value="RESOLVED">Resolve</option>}
                          {item.status==="RESOLVED"&&<option value="CLOSED">Close</option>}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDetail(item)}
                            title="View details"
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetail(item)}
                            title="Edit task"
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
                  ))}

                  {!loading && myRequirements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-sm text-slate-400">
                        No service tasks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sub-panels */}
          <div className="grid gap-6">
            <RequirementsPage user={user} />
            <SupportRequestsPanel user={user} />
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold text-[#00a86b]">{selectedReq.reference}</span>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{selectedReq.title}</h2>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{selectedReq.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Vendor Quotations */}
            <section className="mt-6 rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles size={16} className="text-[#00a86b]" />
                <span>Vendor Quotations ({quotes.length})</span>
              </h3>
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div>
                    <b className="text-xs text-slate-900">{q.vendorName || "Vendor"}</b>
                    <p className="text-xs text-slate-500">
                      AED {Number(q.amount || 0).toLocaleString()} · {q.leadTimeDays || "—"} days lead time
                    </p>
                  </div>
                  <div>
                    {q.status === "SUBMITTED" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleApproveQuote(q.id)}
                        className="rounded-lg bg-[#00a86b] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#008c59]"
                      >
                        Approve for Customer
                      </button>
                    ) : (
                      <span className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        {readable(q.status)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {!quotes.length && (
                <p className="mt-2 text-xs text-slate-400">No vendor quotations submitted yet.</p>
              )}
            </section>

            {/* Messages */}
            <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MessageCircle size={16} className="text-[#00a86b]" />
                  <span>Live Multi-Party Conversation</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  {messages.length} message{messages.length === 1 ? "" : "s"} · Auto-updating
                </span>
              </div>

              <div className="mt-3 max-h-56 space-y-3 overflow-y-auto pr-1">
                {messages.map((m) => {
                  const isMe =
                    m.senderRole === "EMPLOYEE" ||
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
                        className={`rounded-2xl px-4 py-2.5 text-xs max-w-md shadow-xs leading-relaxed ${
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
                    No messages yet. Send a message to communicate with the customer, admin, and vendors.
                  </p>
                )}
              </div>

              <form onSubmit={handleSendChatMessage} className="mt-3 flex gap-2">
                <input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message to all stakeholders..."
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs outline-none focus:border-[#00a86b]"
                />
                <button
                  type="submit"
                  disabled={busy || !chatMessage.trim()}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#00a86b] px-4 text-xs font-bold text-white hover:bg-[#00965f] disabled:opacity-50 transition"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
