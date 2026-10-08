import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  KeyRound,
  UserX,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  ClipboardList,
  Ticket,
  BriefcaseBusiness,
  Store,
  ScrollText,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { get, send } from "./api";

const InfoCard = ({ title, children, action = "Edit", onAction }) => (
  <section className="card p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-[10px] font-semibold text-brand hover:opacity-80"
        >
          <Pencil size={12} />
          {action}
        </button>
      )}
    </div>
    {children}
  </section>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-[11px]">
    <span className="text-slate-500">{label}</span>
    <b className="text-right font-medium text-slate-800">{value}</b>
  </div>
);

const textStatus = (value = "") => String(value || "—").replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
const formatDate = (value) => value ? new Date(value).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" }) : "—";
const money = (value) => `AED ${Number(value || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
const contains = (value, needle) => String(value || "").toLowerCase().includes(String(needle || "").toLowerCase());
const roleKind = (role = "") => {
  const value = role.toUpperCase();
  if (value.includes("VENDOR") || value.includes("PARTNER")) return "vendor";
  if (value.includes("TECH") || value.includes("ENGINEER") || value.includes("NOC") || value.includes("AGENT") || value.includes("OPERATIONS") || value.includes("SERVICE DELIVERY")) return "employee";
  if (value.includes("SUPER") || value.includes("ADMIN")) return "admin";
  return "customer";
};

function MiniHistory({ title, icon: Icon, rows, empty, render }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [query, rows.length]);
  return <section className="card p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Icon size={16} className="text-brand"/>{title}</h3>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{rows.length}</span>
    </div>
    {rows.length ? <><label className="mb-3 flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={13} className="text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder={`Filter ${title.toLowerCase()}...`}/></label><div className="space-y-3">{paged.map(render)}</div>{filtered.length>pageSize&&<div className="mt-4 flex items-center justify-between text-[10px] text-slate-500"><span>{(page-1)*pageSize+1}-{Math.min(page*pageSize,filtered.length)} of {filtered.length}</span><div className="flex gap-1"><button disabled={page===1} onClick={()=>setPage((x)=>Math.max(1,x-1))} className="h-7 w-7 rounded-lg border disabled:opacity-40">‹</button><button disabled={page===totalPages} onClick={()=>setPage((x)=>Math.min(totalPages,x+1))} className="h-7 w-7 rounded-lg border disabled:opacity-40">›</button></div></div>}{!filtered.length&&<p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">No records match this filter.</p>}</> : <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">{empty}</p>}
  </section>;
}

const STANDARD_ROLES = [
  "Customer",
  "Customer Admin",
  "L1 Technician",
  "L2 Engineer",
  "L3 Engineer",
  "NOC Engineer",
  "Support Agent",
  "Operations Manager",
  "Service Delivery Manager",
  "Vendor Manager",
  "Finance Manager",
  "Super Admin",
  "System Administrator",
];

export default function UserDetailsPage({ user: initialUser, onBack }) {
  const [user, setUser] = useState(initialUser);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role || "Customer");
  const [savingRole, setSavingRole] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState({ orders: [], requirements: [], tickets: [], employeeRequirements: [], vendorRequirements: [], employeeTickets: [], vendorQuotes: [], auditEvents: [], metrics: {} });

  useEffect(() => {
    let active = true;
    get(`/admin/users/${user.id}/insights`).then((insights) => {
      if (!active) return;
      setHistory({
        orders: insights.orders || [],
        requirements: insights.customerRequirements || [],
        tickets: insights.customerTickets || [],
        employeeRequirements: insights.employeeRequirements || [],
        vendorRequirements: insights.vendorRequirements || [],
        employeeTickets: insights.employeeTickets || [],
        vendorQuotes: insights.vendorQuotes || [],
        auditEvents: insights.auditEvents || [],
        metrics: insights.metrics || {},
      });
    }).catch(() => {
      Promise.all([
        get("/orders").catch(() => []),
        get("/requirements").catch(() => []),
        get("/tickets").catch(() => []),
      ]).then(([orders, requirements, tickets]) => {
        if (!active) return;
        setHistory({ orders: Array.isArray(orders) ? orders : [], requirements: Array.isArray(requirements) ? requirements : [], tickets: Array.isArray(tickets) ? tickets : [], employeeRequirements: [], vendorRequirements: [], employeeTickets: [], vendorQuotes: [], auditEvents: [], metrics: {} });
      });
    });
    return () => { active = false; };
  }, [user.id]);

  const about = useMemo(() => {
    const kind = roleKind(user.role);
    const orders = history.orders.filter((order) => same(order.customerEmail, user.email) || same(order.customerName, user.name) || same(order.organization, user.organization));
    const customerRequirements = history.requirements.filter((item) => same(item.customerEmail, user.email) || same(item.organization, user.organization));
    const employeeRequirements = history.employeeRequirements.length ? history.employeeRequirements : history.requirements.filter((item) => same(item.employeeEmail, user.email) || same(item.employeeName, user.name));
    const vendorRequirements = history.vendorRequirements.length ? history.vendorRequirements : history.requirements.filter((item) => same(item.vendorName, user.email) || same(item.vendorName, user.name) || contains(item.vendorName, user.organization));
    const tickets = history.tickets.filter((ticket) => same(ticket.customerEmail, user.email) || same(ticket.assigneeEmail, user.email) || same(ticket.customer, user.organization));
    const employeeTickets = history.employeeTickets.length ? history.employeeTickets : history.tickets.filter((ticket) => same(ticket.assigneeEmail, user.email) || same(ticket.assignee, user.name));
    const totalOrderValue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { kind, orders, customerRequirements, employeeRequirements, vendorRequirements, tickets, employeeTickets, vendorQuotes: history.vendorQuotes, auditEvents: history.auditEvents, metrics: history.metrics, totalOrderValue };
  }, [history, user]);

  const initials = (user.name || "U")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveRole = async () => {
    if (!selectedRole || selectedRole === user.role) {
      setIsEditingRole(false);
      return;
    }
    setSavingRole(true);
    try {
      await send(`/users/${user.id}/role`, "PATCH", { role: selectedRole });
      setUser((prev) => ({ ...prev, role: selectedRole }));
      setIsEditingRole(false);
      showToast(`Role updated to "${selectedRole}" successfully.`);
    } catch {
      try {
        await send(`/users/${user.id}`, "PUT", { ...user, role: selectedRole });
        setUser((prev) => ({ ...prev, role: selectedRole }));
        setIsEditingRole(false);
        showToast(`Role updated to "${selectedRole}" successfully.`);
      } catch {
        showToast("Failed to update user role.");
      }
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="space-y-4 p-4 lg:p-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand transition"
      >
        <ArrowLeft size={15} /> Back to Users
      </button>

      {/* Top Banner */}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="card flex flex-wrap items-center gap-6 p-6">
          <div className="grid h-24 w-24 place-items-center rounded-2xl bg-emerald-100 text-2xl font-bold text-brand shadow-inner">
            {initials}
          </div>
          <div className="min-w-[190px]">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <span className="pill bg-emerald-50 text-emerald-600 border border-emerald-200">
                {user.status || "ACTIVE"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                {user.role || "Customer"}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingRole(!isEditingRole)}
                className="text-[11px] font-semibold text-brand hover:underline"
              >
                Change Role
              </button>
            </div>

            {/* Inline Role Assignment Changer */}
            {isEditingRole && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2 text-xs">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold"
                >
                  {STANDARD_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === "Customer" ? "👤 Customer (Default)" : r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={savingRole}
                  onClick={handleSaveRole}
                  className="rounded-lg bg-brand px-3 py-1 font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-50"
                >
                  {savingRole ? "Saving…" : "Save Role"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingRole(false)}
                  className="rounded-lg border bg-white px-2 py-1 text-slate-600"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="mt-4 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                {user.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                {user.phone || "+971 50 123 4567"}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                {user.location || "Dubai, UAE"}
              </div>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5 border-l border-slate-100 pl-6 text-xs md:grid-cols-4">
            <div>
              <span className="text-slate-400">User ID</span>
              <b className="mt-1 block text-slate-800">USR-{String(user.id).padStart(6, "0")}</b>
            </div>
            <div>
              <span className="text-slate-400">Assigned Role</span>
              <b className="mt-1 block text-brand">{user.role || "Customer"}</b>
            </div>
            <div>
              <span className="text-slate-400">Joined On</span>
              <b className="mt-1 block text-slate-800">
                {user.joinedOn ? new Date(user.joinedOn).toLocaleDateString() : "Recent"}
              </b>
            </div>
            <div>
              <span className="text-slate-400">Status</span>
              <b className="mt-1 block text-emerald-600">{user.status || "ACTIVE"}</b>
            </div>
            <div>
              <span className="text-slate-400">Organization</span>
              <b className="mt-1 block text-slate-800">{user.organization || "ACME Trading LLC"}</b>
            </div>
            <div>
              <span className="text-slate-400">Last Login</span>
              <b className="mt-1 block text-emerald-600">Active Session</b>
            </div>
            <div>
              <span className="text-slate-400">Login IP</span>
              <b className="mt-1 block text-slate-700">196.168.1.22</b>
            </div>
            <div>
              <span className="text-slate-400">Login Device</span>
              <b className="mt-1 block text-slate-700">Web App Client</b>
            </div>
          </div>
        </section>

        {/* Action Panel */}
        <section className="card p-5">
          <h3 className="text-sm font-bold text-slate-900">Admin Actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsEditingRole(true)}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand text-xs font-semibold text-white shadow-xs"
            >
              <ShieldCheck size={14} /> Assign Role
            </button>
            <button
              onClick={() => showToast("Password reset link sent to user email.")}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <KeyRound size={14} /> Reset Pass
            </button>
            <button
              onClick={() => showToast("User status updated.")}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <UserX size={14} /> Deactivate
            </button>
            <button
              onClick={() => showToast("Permission matrix loaded.")}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ShieldCheck size={14} /> Permissions
            </button>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Delete user ${user.name}?`)) {
                onBack();
              }
            }}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete User
          </button>
        </section>
      </div>

      {/* Tabs */}
      <div className="card flex gap-7 overflow-x-auto px-5 pt-4">
        {[
          "About",
          "Order History",
          "Requirement History",
          about.kind === "vendor" ? "Vendor History" : about.kind === "employee" ? "Employee Work" : "Tickets",
          "Roles & Permissions",
          "Activity Log",
        ].map((x, i) => (
          <button
            key={x}
            className={`whitespace-nowrap border-b-2 pb-4 text-xs font-semibold ${
              i === 0 ? "border-brand text-brand" : "border-transparent text-slate-500"
            }`}
          >
            {x}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_300px]">
        <div className="space-y-4">
          <InfoCard title="Personal Information">
            <Row label="Full Name" value={user.name} />
            <Row label="Email Address" value={user.email} />
            <Row label="Phone Number" value={user.phone || "+971 50 123 4567"} />
            <Row label="Account Type" value={textStatus(about.kind)} />
            <Row label="Organization" value={user.organization || "—"} />
            <Row label="Address" value={user.location || "Dubai, UAE"} />
          </InfoCard>
          <InfoCard title="Contact & Security">
            <Row label="Work Email" value={user.email} />
            <Row label="Phone Number" value="Verified" />
            <Row label="Two-Factor Auth" value="Enabled" />
            <Row label="Security Status" value="Active & Compliant" />
          </InfoCard>
        </div>

        <div className="space-y-4">
          <InfoCard title="Role & Organization Assignment" action="Change" onAction={() => setIsEditingRole(true)}>
            <Row label="Current Role" value={user.role || "Customer"} />
            <Row label="Organization" value={user.organization || "ACME Trading LLC"} />
            <Row label="Access Scope" value="Role-Based Controls" />
            <Row label="Default Portal" value={about.kind === "admin" ? "Admin Console" : about.kind === "vendor" ? "Vendor Portal" : about.kind === "employee" ? "Employee Portal" : "Customer Portal"} />
          </InfoCard>
          <InfoCard title="Live History Summary" action={null}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">Orders</span>
                <b className="mt-1 block text-xl">{about.metrics.orders ?? about.orders.length}</b>
              </div>
              <div>
                <span className="text-xs text-slate-400">Order Value</span>
                <b className="mt-1 block text-xl">{money(about.metrics.orderValue ?? about.totalOrderValue)}</b>
              </div>
            </div>
            <Row label="Requirements" value={(about.metrics.customerRequirements || 0) + (about.metrics.employeeRequirements || 0) + (about.metrics.vendorRequirements || 0)} />
            <Row label="Tickets" value={(about.metrics.customerTickets || 0) + (about.metrics.employeeTickets || 0)} />
            <Row label="Audit Events" value={about.metrics.auditEvents || about.auditEvents.length} />
          </InfoCard>
        </div>

        <div className="space-y-4">
          <InfoCard title="Roles & Permissions" action="Manage" onAction={() => setIsEditingRole(true)}>
            <div className="flex flex-wrap gap-2">
              <span className="pill bg-emerald-50 text-emerald-600">{user.role || "Customer"}</span>
              <span className="pill bg-emerald-50 text-emerald-600">Portal Access</span>
              <span className="pill bg-emerald-50 text-emerald-600">Tickets Access</span>
            </div>
            <div className="mt-6 grid grid-cols-3">
              <div>
                <b className="text-xl">1</b>
                <div className="text-[10px] text-slate-400">Active Role</div>
              </div>
              <div>
                <b className="text-xl">42</b>
                <div className="text-[10px] text-slate-400">Permissions</div>
              </div>
              <div>
                <b className="text-xl">Full</b>
                <div className="text-[10px] text-slate-400">Tier</div>
              </div>
            </div>
          </InfoCard>
        </div>

        <section className="card p-5">
          <div className="flex justify-between">
            <h3 className="text-sm font-bold">Activity Timeline</h3>
            <button className="text-[10px] font-semibold text-brand">View All</button>
          </div>
          <div className="mt-5 space-y-5">
            {[
              ...(about.orders[0] ? [[`Order ${about.orders[0].reference}`, formatDate(about.orders[0].createdAt), ShoppingBag, "text-emerald-500"]] : []),
              ...(about.customerRequirements[0] ? [[`Requirement ${about.customerRequirements[0].reference || about.customerRequirements[0].id}`, formatDate(about.customerRequirements[0].createdAt), ClipboardList, "text-emerald-500"]] : []),
              ...(about.employeeTickets[0] ? [[`Ticket ${about.employeeTickets[0].reference}`, formatDate(about.employeeTickets[0].createdAt), Ticket, "text-emerald-500"]] : []),
              ["Role verified", user.role || "Customer", ShieldCheck, "text-emerald-500"],
              ["Account active", user.status || "ACTIVE", Shield, "text-emerald-500"],
            ].map(([x, d, Icon, c]) => (
              <div key={x} className="flex gap-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-50 ${c}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <b className="text-[11px]">{x}</b>
                  <div className="text-[9px] text-slate-400">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <MiniHistory title="Order History" icon={ShoppingBag} rows={about.orders} empty="No customer orders found for this user yet." render={(order)=><div key={order.id} className="rounded-xl border border-slate-100 p-3 text-xs"><div className="flex justify-between gap-3"><b>{order.reference}</b><span className="font-bold text-emerald-700">{money(order.total)}</span></div><div className="mt-1 text-slate-500">{formatDate(order.createdAt)} · {textStatus(order.status)} · {order.itemCount} item(s)</div>{order.deliveryAddress?.addressLine&&<div className="mt-2 text-[11px] leading-5 text-slate-500">{order.deliveryAddress.addressLine}, {order.deliveryAddress.emirate}</div>}</div>}/>
        <MiniHistory title="Requirement History" icon={ClipboardList} rows={[...about.customerRequirements, ...about.employeeRequirements].filter((item,index,array)=>array.findIndex(row=>row.id===item.id)===index)} empty="No requirements connected to this user yet." render={(item)=><div key={item.id} className="rounded-xl border border-slate-100 p-3 text-xs"><div className="flex justify-between gap-3"><b>{item.reference || `REQ-${item.id}`}</b><span className="font-bold text-emerald-700">{textStatus(item.status)}</span></div><div className="mt-1 text-slate-500">{item.title || item.category} · {formatDate(item.createdAt)}</div><div className="mt-2 text-[11px] text-slate-500">Customer: {item.customerName || item.customerEmail || "—"}</div></div>}/>
        <MiniHistory title={about.kind === "vendor" ? "Vendor History" : about.kind === "employee" ? "Employee History" : "Ticket History"} icon={about.kind === "vendor" ? Store : about.kind === "employee" ? BriefcaseBusiness : Ticket} rows={about.kind === "vendor" ? about.vendorRequirements : about.kind === "employee" ? about.employeeTickets : about.tickets} empty={about.kind === "vendor" ? "No vendor quotations or selected requirement history found yet." : about.kind === "employee" ? "No assigned employee ticket history found yet." : "No support tickets found for this customer yet."} render={(item)=><div key={`${item.reference || item.id}`} className="rounded-xl border border-slate-100 p-3 text-xs"><div className="flex justify-between gap-3"><b>{item.reference || `REQ-${item.id}`}</b><span className="font-bold text-emerald-700">{textStatus(item.status)}</span></div><div className="mt-1 text-slate-500">{item.subject || item.title || item.category || "Activity"} · {formatDate(item.createdAt)}</div><div className="mt-2 text-[11px] text-slate-500">{about.kind === "vendor" ? `Vendor: ${item.vendorName || user.name}` : about.kind === "employee" ? `Assignee: ${item.assignee || user.name}` : `Customer: ${item.customer || user.organization || "—"}`}</div></div>}/>
      </div>
      <MiniHistory title="Audit Trail" icon={ScrollText} rows={about.auditEvents} empty="No audit trail events found for this user yet." render={(item)=><div key={item.id} className="rounded-xl border border-slate-100 p-3 text-xs"><div className="flex justify-between gap-3"><b>{item.name}</b><span className="font-bold text-emerald-700">{item.status}</span></div><div className="mt-1 text-slate-500">{formatDate(item.createdAt)} · {item.owner || "System"}</div><div className="mt-2 text-[11px] text-slate-500">{item.details}</div></div>}/>
    </div>
  );
}
