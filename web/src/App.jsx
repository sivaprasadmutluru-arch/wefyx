import { AuthVisual, Brand } from "./WefyxUI";
import BookingFlow from "./BookingFlow";
import ServiceTickets from "./ServiceTickets";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  Building2,
  GitBranch,
  Network,
  Ticket,
  Headphones,
  FileClock,
  MonitorSmartphone,
  Package,
  Boxes,
  RadioTower,
  Store,
  ShoppingCart,
  ReceiptText,
  CreditCard,
  WalletCards,
  Settings,
  Plug,
  ScrollText,
  BarChart3,
  Menu,
  Search,
  Bell,
  Mail,
  Phone,
  HelpCircle,
  Globe2,
  ChevronDown,
  PanelLeftClose,
  Plus,
  SlidersHorizontal,
  MoreVertical,
  Eye,
  Pencil,
  ArrowUpRight,
  UserRound,
  CircleUserRound,
  Clock3,
  Shield,
  Activity,
  EyeOff,
  LockKeyhole,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { get, send, sendPublic, login } from "./api";
import { localUsers, localRoles } from "./data";
import { HelpCenterPage, NotificationsPage } from "./SupportPages";
import { MessagesPage } from "./MessagesPage";
import UserDetailsPage from "./UserDetailsPage";
import AuditLogsPage from "./AuditLogsPage";
import PermissionMatrixPage from "./PermissionMatrixPage";
import UserModal from "./UserModal";
import DynamicModulePage from "./DynamicModulePage";
import DynamicUsersPage from "./DynamicUsersPage";
import DynamicRolesPage from "./DynamicRolesPage";
import AdminProfilePage from "./AdminProfilePage";
import DynamicPermissionMatrixPage from "./DynamicPermissionMatrixPage";
import DynamicAuditLogsPage from "./DynamicAuditLogsPage";
import DynamicPermissionsPage from "./DynamicPermissionsPage";
import PrivacyPolicyPage from "./PrivacyPolicyPage";
import TrustPolicyPage from "./TrustPolicyPage";
import EmployeePortal from "./EmployeePortal";
import EmployeeApprovals from './EmployeeApprovals';
import VendorPortal from "./VendorPortal";
import PublicRegistration, { CareersPage, VendorRegistrationPage } from "./PublicRegistration";
import CustomerAccount from "./CustomerAccount";
import RequirementsPage from "./RequirementsPage";
import ServiceWebsite from "./ServiceWebsite";
import { CartPage, RentalCatalog, RentalDetail } from "./RentalPages";
import InfoPage from "./InfoPages";
import SupportPage from "./SupportPage";
import DataCenterPage from "./DataCenterPage";
import AMCPage from "./AMCPage";
import SolutionsPage from "./SolutionsPage";
import IndustriesPage from "./IndustriesPage";
import ShopPage from "./ShopPage";
import ProductManagementPage from "./ProductManagementPage";
const sections = [
  ["MAIN NAVIGATION", [["Dashboard", LayoutDashboard]]],
  [
    "USER & ACCESS MANAGEMENT",
    [
      ["Users Management", Users],
      ["Role Management", ShieldCheck],
      ["Permissions", KeyRound],
      ["Permission Matrix", Shield],
      ["Permission Requests", FileClock],
      ["Audit Logs", ScrollText],
    ],
  ],
  [
    "ORGANIZATION MANAGEMENT",
    [
      ["Organizations", Building2],
      ["Branches", GitBranch],
      ["Departments", Network],
      ["Teams", Users],
    ],
  ],
  [
    "SERVICE MANAGEMENT",
    [
      ["Requirements & Quotes", ReceiptText],
      ["Orders", ShoppingCart],
      ["Tickets", Ticket],
      ["Technicians", Headphones],
      ["Contracts (AMC)", FileClock],
      ["Assets", MonitorSmartphone],
      ["Asset Rental", Package],
      ["Inventory", Boxes],
      ["NOC Monitoring", RadioTower],
    ],
  ],
  [
    "VENDOR MANAGEMENT",
    [
      ["Vendors", Store],
      ["Products & Services", Boxes],
      ["Purchase & RFQ", ShoppingCart],
      ["Vendor Settlements", ReceiptText],
    ],
  ],
  [
    "FINANCIAL MANAGEMENT",
    [
      ["Invoices & Billing", ReceiptText],
      ["Payments", CreditCard],
      ["Wallet & Credits", WalletCards],
      ["Payouts", ArrowUpRight],
    ],
  ],
  [
    "SYSTEM MANAGEMENT",
    [
      ["System Settings", Settings],
      ["Integrations", Plug],
      ["Reports & Analytics", BarChart3],
      ["Messages", Mail],
      ["Notifications", Bell],
      ["Help Center", HelpCircle],
    ],
  ],
];
function Sidebar({ page, setPage, open, setOpen }) {
  return (
    <aside
      className={`${open ? "w-[220px]" : "w-0 lg:w-[70px]"} fixed inset-y-0 z-30 overflow-hidden bg-navy text-white transition-all lg:static`}
    >
      <div className="flex h-20 min-w-[220px] items-center border-b border-white/10 px-5">
        <div>
          <div className="text-2xl font-bold tracking-tight">
            wefyx<span className="text-emerald-400">.</span>pro
          </div>
          <div className="text-[10px] text-slate-300">
            IT Support | Asset Rental | NOC
          </div>
        </div>
      </div>
      <nav className="h-[calc(100vh-132px)] min-w-[220px] overflow-y-auto py-2">
        {sections.map(([title, items]) => (
          <div key={title}>
            <div className="nav-section">{title}</div>
            {items.map(([name, Icon]) => (
              <button
                key={name}
                onClick={() => {
                  if (
                    [
                      "Dashboard",
                      "Users Management",
                      "Role Management",
                    ].includes(name)
                  )
                    setPage(name);
                  if (innerWidth < 1024) setOpen(false);
                }}
                className={`mx-2 flex w-[204px] items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] ${page === name ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={15} />
                <span>{name}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <button
        onClick={() => setOpen(false)}
        className="m-3 flex w-[196px] items-center justify-center gap-2 rounded-lg border border-white/15 py-2 text-xs text-slate-300"
      >
        <PanelLeftClose size={15} /> Collapse Menu
      </button>
    </aside>
  );
}
function Header({
  page,
  onMenu,
  onLogout,
  onHelp,
  onNotifications,
  onMessages,
  onProfile,
}) {
  const [org, setOrg] = useState(
    () => localStorage.getItem("wefyx-organization") || "ALL",
  );
  const switchOrg = (value) => {
    setOrg(value);
    localStorage.setItem("wefyx-organization", value);
    window.location.reload();
  };
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenu} className="text-slate-500">
          <Menu size={21} />
        </button>
        <div>
          <h1 className="text-lg font-bold">
            {page === "Dashboard" ? "Super Admin Dashboard" : page}
          </h1>
          <p className="text-[11px] text-slate-500">
            {org === "ALL" ? "All Organizations" : org} › {page}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden h-9 w-56 items-center gap-2 rounded-lg border bg-slate-50 px-3 xl:flex">
          <Search size={15} />
          <input
            className="w-full bg-transparent text-xs outline-none"
            placeholder="Search everything..."
          />
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2 lg:flex">
          <Building2 size={15} className="text-brand" />
          <select
            value={org}
            onChange={(e) => switchOrg(e.target.value)}
            className="h-9 max-w-44 bg-transparent text-[11px] font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Organizations</option>
            <option>ABC Trading LLC</option>
            <option>Wefyx Technologies</option>
            <option>TechSolutions LLC</option>
            <option>Rentals UAE</option>
            <option>MSP Global Solutions</option>
            <option>TechGear LLC</option>
          </select>
        </div>
        <Search className="lg:hidden" size={18} />
        <button
          onClick={onNotifications}
          title="Notifications"
          className="relative text-slate-500 hover:text-brand"
        >
          <Bell size={18} />
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
            6
          </span>
        </button>
        <button
          onClick={onMessages}
          title="Messages"
          className="relative hidden text-slate-500 hover:text-brand sm:block"
        >
          <Mail size={18} />
          <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-brand" />
        </button>
        <button
          onClick={onHelp}
          title="Help Center"
          className="hidden text-slate-500 hover:text-brand md:block"
        >
          <HelpCircle size={18} />
        </button>
        <div className="hidden items-center gap-2 border-l pl-4 sm:flex">
          <button onClick={onProfile} title="View profile" className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 font-bold text-brand hover:ring-2 hover:ring-brand/30">
            SA
          </button>
          <button onClick={onProfile} className="hidden text-left 2xl:block">
            <div className="text-xs font-semibold">System Administrator</div>
            <div className="text-[10px] text-slate-500">Super Admin</div>
          </button>
          <button
            onClick={onLogout}
            title="Sign out"
            className="icon-btn ml-1 border-0 hover:text-red-500"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
const fmt = (n) => Number(n).toLocaleString();
const statusStyle = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  INACTIVE: "bg-slate-100 text-slate-500",
  PENDING: "bg-amber-50 text-amber-600",
  SUSPENDED: "bg-red-50 text-red-500",
  DELETED: "bg-slate-100 text-slate-400",
};
const roleColors = [
  "bg-emerald-50 text-emerald-600",
  "bg-emerald-50 text-emerald-600",
  "bg-emerald-50 text-emerald-600",
  "bg-red-50 text-red-500",
  "bg-amber-50 text-amber-600",
  "bg-emerald-50 text-emerald-600",
];
function StatCard({
  label,
  value,
  icon: Icon,
  color = "blue",
  delta = "+ 8.6%",
}) {
  const c = {
    blue: "bg-emerald-50 text-emerald-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    amber: "bg-amber-50 text-amber-600",
    cyan: "bg-emerald-50 text-emerald-600",
  }[color];
  return (
    <div className="card flex min-w-[190px] flex-1 items-center gap-3 p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${c}`}>
        <Icon size={21} />
      </div>
      <div>
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-xl font-bold">{fmt(value)}</div>
        <div
          className={`mt-1 text-[10px] ${color === "red" ? "text-red-500" : "text-emerald-500"}`}
        >
          {delta} <span className="text-slate-400">vs last week</span>
        </div>
      </div>
    </div>
  );
}
function UsersTable({
  users = localUsers,
  limit = 10,
  onView,
  onEdit,
  onDelete,
}) {
  const isDashboard = limit === 8;
  const [page, setPage] = useState(1);
  const [dashboardPageSize, setDashboardPageSize] = useState(10);
  const [dashboardUsers, setDashboardUsers] = useState(users);
  useEffect(() => {
    if (!isDashboard) return;
    get("/users").then((result) => {
      if (!Array.isArray(result)) return;
      setDashboardUsers(result);
      window.dispatchEvent(
        new CustomEvent("dashboard-user-count", { detail: result.length }),
      );
    });
    const changePage = (e) => setPage(e.detail);
    const changePageSize = (e) => {
      setDashboardPageSize(e.detail);
      setPage(1);
    };
    window.addEventListener("dashboard-user-page", changePage);
    window.addEventListener("dashboard-user-page-size", changePageSize);
    return () => {
      window.removeEventListener("dashboard-user-page", changePage);
      window.removeEventListener("dashboard-user-page-size", changePageSize);
    };
  }, [isDashboard]);
  const source = isDashboard ? dashboardUsers : users;
  const effectiveLimit = isDashboard ? dashboardPageSize : limit;
  const start = isDashboard ? (page - 1) * effectiveLimit : 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-xs">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3">User</th>
            <th>Role</th>
            <th>Organization</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Joined On</th>
            <th className="pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {source.slice(start, start + effectiveLimit).map((u, i) => (
            <tr
              className="border-t border-slate-100 hover:bg-slate-50/60"
              key={u.id}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-8 w-8 rounded-full ${roleColors[(start + i) % 6]} place-items-center font-bold`}
                  >
                    {u.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`pill ${roleColors[(start + i) % 6]}`}>
                  {u.role}
                </span>
              </td>
              <td>
                <b className="font-medium">{u.organization}</b>
                <div className="text-[10px] text-slate-400">{u.location}</div>
              </td>
              <td>
                <span className={`pill ${statusStyle[u.status]}`}>
                  {u.status[0] + u.status.slice(1).toLowerCase()}
                </span>
              </td>
              <td>
                {u.lastLogin ? (
                  <>
                    <div>{new Date(u.lastLogin).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">
                      IP: 194.168.1.{10 + start + i}
                    </div>
                  </>
                ) : (
                  <span>–</span>
                )}
              </td>
              <td>{new Date(u.joinedOn).toLocaleDateString()}</td>
              <td>
                <div className="flex gap-1">
                  <button
                    onClick={() => onView?.(u)}
                    title="View user"
                    className="icon-btn h-8 w-8"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => onEdit?.(u)}
                    title="Edit user"
                    className="icon-btn h-8 w-8"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete?.(u)}
                    title="Delete user"
                    className="icon-btn h-8 w-8 hover:text-red-500"
                  >
                    <ReceiptText size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Toolbar({ placeholder, add, onAdd }) {
  const showAdd = onAdd || placeholder !== "Search users...";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 lg:max-w-[310px]">
        <Search size={15} />
        <input
          className="w-full text-xs outline-none"
          placeholder={placeholder}
        />
      </div>
      <button className="icon-btn w-auto gap-2 px-3">
        <SlidersHorizontal size={15} /> Filters
      </button>
      {showAdd && (
        <button
          onClick={onAdd}
          className="flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-white shadow-sm"
        >
          <Plus size={16} />
          {add}
        </button>
      )}
      <button className="icon-btn">
        <MoreVertical size={16} />
      </button>
    </div>
  );
}
function Dashboard() {
  const [s, setS] = useState({
    totalUsers: 18542,
    technicians: 2847,
    customers: 8731,
    vendors: 1243,
    activeTickets: 1256,
    activeUsers: 15842,
    inactiveUsers: 1256,
    pendingUsers: 842,
    suspendedUsers: 402,
    deletedUsers: 200,
    growth: [12122, 12842, 13654, 15231, 16485, 18542],
  });
  useEffect(() => {
    get("/dashboard/summary").then((x) => x && setS(x));
  }, []);
  const line = s.growth.map((v, i) => ({
    m: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"][i],
    v,
  }));
  const pie = [
    { name: "Active", value: s.activeUsers, color: "#13b981" },
    { name: "Inactive", value: s.inactiveUsers, color: "#008553" },
    { name: "Pending", value: s.pendingUsers, color: "#fbbf24" },
    { name: "Suspended", value: s.suspendedUsers, color: "#f04444" },
    { name: "Deleted", value: s.deletedUsers, color: "#94b8a9" },
  ];
  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label="Total Users" value={s.totalUsers} icon={UserRound} />
        <StatCard label="Technicians" value={s.technicians} icon={Headphones} />
        <StatCard label="Customers" value={s.customers} icon={Building2} />
        <StatCard label="Vendors" value={s.vendors} icon={Store} />
        <StatCard
          label="Active Tickets"
          value={s.activeTickets}
          icon={Ticket}
          color="red"
          delta="- 3.2%"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-4 xl:col-span-2">
          <div className="mb-4 text-sm font-bold">
            User Growth{" "}
            <span className="text-[10px] font-normal text-slate-400">
              (Last 6 Months)
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={line}>
                <CartesianGrid stroke="#edf7f3" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#008553"
                  strokeWidth={3}
                  dot={{ fill: "white", stroke: "#008553", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-2 text-sm font-bold">Users by Status</div>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pie}
                  innerRadius={54}
                  outerRadius={78}
                  dataKey="value"
                >
                  {pie.map((x) => (
                    <Cell key={x.name} fill={x.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-32 mb-20 text-center">
            <b className="text-xl">18,542</b>
            <div className="text-[10px] text-slate-400">Total Users</div>
          </div>
          <div className="flex justify-center gap-3 text-[9px]">
            {pie.slice(0, 4).map((x) => (
              <span key={x.name}>
                <i
                  className="mr-1 inline-block h-2 w-2 rounded-full"
                  style={{ background: x.color }}
                />
                {x.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-sm font-bold">Users Management</h2>
            <p className="text-[10px] text-slate-400">
              Manage all platform users, their roles, status and permissions.
            </p>
          </div>
          <Toolbar placeholder="Search users..." add="Add New User" />
        </div>
        <UsersTable users={localUsers} limit={8} />
        <Pagination text="Showing 1 to 8 of 18,542 users" />
      </div>
    </div>
  );
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [serverTotal, setServerTotal] = useState(0);
  const [serverPages, setServerPages] = useState(1);
  const [serverStats, setServerStats] = useState({ activeOrders: 0, completedOrders: 0, orderValue: 0, unpaidOrders: 0, pendingPaymentLinks: 0, lowStockProducts: 0, delayedOrders: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const statuses = ["PLACED", "CONFIRMED", "PROCESSING", "DISPATCHED", "COMPLETED", "CANCELLED"];
  const text = (value = "") => String(value || "—").replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
  const date = (value) => value ? new Date(value).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const amount = (value) => `AED ${Number(value || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const badgeTone = (value = "") => {
    if (["COMPLETED", "CONFIRMED"].includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (["CANCELLED"].includes(value)) return "bg-red-50 text-red-700 border-red-200";
    if (["PROCESSING", "DISPATCHED"].includes(value)) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };
  const load = () => {
    const params = new URLSearchParams({ q, status, mode, page: String(page - 1), size: String(pageSize) });
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    return get(`/orders/search?${params}`).then((result) => {
      setOrders(result.content || []);
      setSelectedIds([]);
      setServerTotal(result.totalElements || 0);
      setServerPages(Math.max(1, result.totalPages || 1));
      setServerStats({ activeOrders: result.activeOrders || 0, completedOrders: result.completedOrders || 0, orderValue: result.orderValue || 0, unpaidOrders: result.unpaidOrders || 0, pendingPaymentLinks: result.pendingPaymentLinks || 0, lowStockProducts: result.lowStockProducts || 0, delayedOrders: result.delayedOrders || 0 });
    }).catch(() => { setOrders([]); setServerTotal(0); setServerPages(1); });
  };
  useEffect(() => { load(); }, [q, status, mode, dateFrom, dateTo, page, pageSize]);
  useEffect(() => setPage(1), [q, status, mode, dateFrom, dateTo, pageSize]);
  const stats = {
    total: serverTotal,
    active: serverStats.activeOrders,
    completed: serverStats.completedOrders,
    value: serverStats.orderValue,
  };
  async function updateStatus(order, next) {
    if (!next || next === order.status) return;
    setBusyId(order.id);
    try {
      await send(`/orders/${order.id}/status`, "PATCH", { status: next });
      load();
    } finally {
      setBusyId(null);
    }
  }
  async function updatePayment(order, next) {
    setBusyId(order.id);
    try { await send(`/orders/${order.id}/payment`, "PATCH", { paymentStatus: next, paymentMethod: order.paymentMethod, invoiceNumber: order.invoiceNumber, paymentReference: order.paymentReference, paymentProofUrl: order.paymentProofUrl, paymentNotes: order.paymentNotes }); load(); }
    finally { setBusyId(null); }
  }
  async function editPayment(order) {
    const paymentReference = valueOrPrompt("Transaction/reference number", order.paymentReference || "");
    if (paymentReference === null) return;
    const paymentProofUrl = valueOrPrompt("Payment proof URL", order.paymentProofUrl || "");
    if (paymentProofUrl === null) return;
    const paymentNotes = valueOrPrompt("Payment notes", order.paymentNotes || "");
    if (paymentNotes === null) return;
    setBusyId(order.id);
    try { await send(`/orders/${order.id}/payment`, "PATCH", { paymentStatus: order.paymentStatus || "PENDING", paymentMethod: order.paymentMethod, invoiceNumber: order.invoiceNumber, paymentReference, paymentProofUrl, paymentNotes }); load(); }
    finally { setBusyId(null); }
  }
  async function settleDeposit(order) {
    const depositStatus = valueOrPrompt("Deposit status", order.depositStatus || "HELD");
    if (depositStatus === null) return;
    const depositRefundReference = valueOrPrompt("Refund/reference number", order.depositRefundReference || "");
    if (depositRefundReference === null) return;
    const depositDeductionReason = valueOrPrompt("Deduction/refund notes", order.depositDeductionReason || "");
    if (depositDeductionReason === null) return;
    setBusyId(order.id);
    try { await send(`/orders/${order.id}/deposit`, "PATCH", { depositStatus, depositRefundReference, depositDeductionReason }); load(); }
    finally { setBusyId(null); }
  }
  async function decideCancellation(order, decision) {
    const reason = valueOrPrompt(`${decision} cancellation reason`, order.cancellationRequestReason || "");
    if (reason === null) return;
    setBusyId(order.id);
    try { await send(`/orders/${order.id}/cancel-decision`, "PATCH", { decision, reason }); load(); }
    finally { setBusyId(null); }
  }
  async function showAudit(order) {
    try {
      const rows = await get(`/orders/${order.id}/audit`);
      window.alert((rows || []).slice(0, 12).map((item)=>`${date(item.createdAt)} · ${item.actorEmail || "System"} · ${text(item.action)} · ${item.fieldName || ""}: ${item.previousValue || "—"} → ${item.nextValue || "—"}${item.note ? ` · ${item.note}` : ""}`).join("\n") || "No audit events yet.");
    } catch (error) { window.alert(error.message || "Unable to load audit history."); }
  }
  async function updateDelivery(order, next) {
    const trackingNotes = next === "DELIVERED" ? valueOrPrompt("Delivery notes", order.trackingNotes || "Delivered successfully") : order.trackingNotes;
    if (trackingNotes === null) return;
    setBusyId(order.id);
    try { await send(`/orders/${order.id}/fulfillment`, "PATCH", { deliveryStatus: next, trackingNotes }); load(); }
    finally { setBusyId(null); }
  }
  async function bulkUpdate(next) {
    if (!selectedIds.length) return;
    const reason = next === "CANCELLED" ? valueOrPrompt("Cancellation reason", "Cancelled by admin") : "";
    if (reason === null) return;
    await send("/orders/bulk-status", "PATCH", { ids: selectedIds, status: next, reason });
    load();
  }
  function exportCsv() {
    const header = ["Reference","Customer","Email","Organization","Status","Payment Method","Payment Status","Payment Ref","Invoice","Delivery","Subtotal","VAT","Deposit","Amount Due","Created"];
    const rows = orders.map((order)=>[order.reference,order.customerName,order.customerEmail,order.organization,order.status,order.paymentMethod,order.paymentStatus,order.paymentReference,order.invoiceNumber,order.deliveryStatus,order.subtotal,order.vat,order.securityDeposit,order.amountDue,order.createdAt]);
    const csv = [header, ...rows].map((row)=>row.map((cell)=>`"${String(cell ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");anchor.href=url;anchor.download="wefyx-orders.csv";document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function valueOrPrompt(label, fallback) {
    const value = window.prompt(label, fallback);
    return value === null ? null : value;
  }
  return <div className="space-y-5 p-4 lg:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-white p-5">
      <div><h2 className="text-xl font-black text-slate-900">Customer Order History</h2><p className="mt-1 text-xs text-slate-500">Review customer purchases, rentals, delivery address, and fulfillment status.</p></div>
      <div className="flex gap-2"><button onClick={exportCsv} className="h-10 rounded-xl border bg-white px-4 text-xs font-bold text-brand">Export CSV</button><button onClick={load} className="h-10 rounded-xl bg-brand px-4 text-xs font-bold text-white">Refresh Orders</button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[[ShoppingCart,"Total Orders",stats.total],[Clock3,"Active Orders",stats.active],[CheckCircle2,"Completed",stats.completed],[ReceiptText,"Order Value",amount(stats.value)]].map(([Icon,label,value])=><article key={label} className="card flex items-center gap-3 p-4"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-brand"><Icon size={20}/></div><div><span className="text-[11px] text-slate-500">{label}</span><b className="mt-1 block text-xl">{value}</b></div></article>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[[CreditCard,"Unpaid orders",serverStats.unpaidOrders],[WalletCards,"Payment links pending",serverStats.pendingPaymentLinks],[Package,"Low-stock products",serverStats.lowStockProducts],[Bell,"Delayed orders",serverStats.delayedOrders]].map(([Icon,label,value])=><article key={label} className="card flex items-center gap-3 border-amber-100 bg-amber-50/40 p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-700"><Icon size={18}/></div><div><span className="text-[11px] text-slate-500">{label}</span><b className="mt-1 block text-lg">{value}</b></div></article>)}
    </div>
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex flex-wrap gap-1.5">{["ALL", ...statuses].map((item)=><button key={item} onClick={()=>setStatus(item)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${status===item?"bg-brand text-white":"bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-brand"}`}>{text(item)}</button>)}</div>
        <label className="flex h-10 min-w-72 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={15} className="text-slate-400"/><input value={q} onChange={(e)=>setQ(e.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Search reference, customer, email..."/></label>
      </div>
      <div className="grid gap-3 border-b bg-slate-50/60 p-4 text-xs md:grid-cols-5">
        <label className="font-bold text-slate-600">Mode<select value={mode} onChange={(e)=>setMode(e.target.value)} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal outline-none focus:border-brand"><option value="ALL">All modes</option><option value="BUY">Buy</option><option value="RENT">Rent</option></select></label>
        <label className="font-bold text-slate-600">From<input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal outline-none focus:border-brand"/></label>
        <label className="font-bold text-slate-600">To<input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal outline-none focus:border-brand"/></label>
        <label className="font-bold text-slate-600">Page size<select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal outline-none focus:border-brand"><option value="5">5 / page</option><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select></label>
        <button type="button" onClick={()=>{setQ("");setStatus("ALL");setMode("ALL");setDateFrom("");setDateTo("");setPage(1);}} className="mt-5 h-10 rounded-xl border bg-white px-3 font-bold text-slate-600 hover:bg-emerald-50 hover:text-brand md:mt-6">Clear filters</button>
      </div>
      {selectedIds.length>0&&<div className="flex flex-wrap items-center gap-2 border-b bg-emerald-50 p-3 text-xs"><b>{selectedIds.length} selected</b><button onClick={()=>bulkUpdate("CONFIRMED")} className="rounded-lg bg-brand px-3 py-2 font-bold text-white">Mark confirmed</button><button onClick={()=>bulkUpdate("PROCESSING")} className="rounded-lg border bg-white px-3 py-2 font-bold text-slate-700">Mark processing</button><button onClick={()=>bulkUpdate("DISPATCHED")} className="rounded-lg border bg-white px-3 py-2 font-bold text-slate-700">Mark dispatched</button><button onClick={()=>bulkUpdate("CANCELLED")} className="rounded-lg border border-red-200 bg-white px-3 py-2 font-bold text-red-600">Cancel selected</button><button onClick={()=>setSelectedIds([])} className="ml-auto rounded-lg border bg-white px-3 py-2 font-bold text-slate-600">Clear</button></div>}
      <div className="divide-y divide-slate-100">
        {orders.map((order)=><article key={order.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3"><input type="checkbox" checked={selectedIds.includes(order.id)} onChange={(e)=>setSelectedIds((ids)=>e.target.checked?[...ids,order.id]:ids.filter((id)=>id!==order.id))} className="mt-1 accent-emerald-600"/><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black">{order.reference}</h3><span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeTone(order.status)}`}>{text(order.status)}</span><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">{text(order.paymentStatus || "PENDING")}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">{text(order.deliveryStatus || "PENDING")}</span></div><p className="mt-1 text-xs text-slate-500">{date(order.createdAt)} · {order.itemCount} item(s) · Invoice {order.invoiceNumber || "—"} · {text(order.paymentMethod || "PAY_ON_DELIVERY")}</p><p className="mt-2 text-xs text-slate-700"><b>{order.customerName || "Customer"}</b> · {order.customerEmail || "—"} · {order.organization || "—"}</p>{(order.paymentReference||order.paymentProofUrl||order.paymentNotes)&&<p className="mt-2 text-xs text-slate-500">Payment ref: {order.paymentReference || "—"} {order.paymentProofUrl&&<a className="ml-2 font-bold text-brand" href={order.paymentProofUrl} target="_blank" rel="noreferrer">Proof</a>} {order.paymentNotes&&` · ${order.paymentNotes}`}</p>}</div></div>
            <div className="text-right"><b className="text-lg text-emerald-800">{amount(order.amountDue||order.total)}</b><small className="block text-[10px] text-slate-500">Deposit {amount(order.securityDeposit)} · {text(order.depositStatus || "—")}</small><div className="mt-2 grid gap-1"><select disabled={busyId===order.id} value={order.status} onChange={(e)=>updateStatus(order,e.target.value)} className="h-9 rounded-lg border px-2 text-xs font-semibold outline-none focus:border-brand">{statuses.map((item)=><option key={item} value={item}>{text(item)}</option>)}</select><select disabled={busyId===order.id} value={order.paymentStatus || "PENDING"} onChange={(e)=>updatePayment(order,e.target.value)} className="h-9 rounded-lg border px-2 text-xs font-semibold outline-none focus:border-brand">{["UNPAID","PENDING","PAID","PARTIALLY_PAID","REFUNDED","FAILED"].map((item)=><option key={item} value={item}>{text(item)}</option>)}</select><select disabled={busyId===order.id} value={order.deliveryStatus || "PENDING"} onChange={(e)=>updateDelivery(order,e.target.value)} className="h-9 rounded-lg border px-2 text-xs font-semibold outline-none focus:border-brand">{["PENDING","PACKING","DISPATCHED","OUT_FOR_DELIVERY","DELIVERED","FAILED","CANCELLED"].map((item)=><option key={item} value={item}>{text(item)}</option>)}</select><button disabled={busyId===order.id} onClick={()=>editPayment(order)} className="h-9 rounded-lg border bg-white px-2 text-xs font-bold text-brand">Payment details</button><button disabled={busyId===order.id} onClick={()=>settleDeposit(order)} className="h-9 rounded-lg border bg-white px-2 text-xs font-bold text-brand">Deposit</button><button onClick={()=>showAudit(order)} className="h-9 rounded-lg border bg-white px-2 text-xs font-bold text-slate-700">Audit</button></div></div>
          </div>
          {order.cancellationRequestStatus==="REQUESTED"&&<div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><b>Cancellation requested:</b><span>{order.cancellationRequestReason || "No reason provided"}</span><button onClick={()=>decideCancellation(order,"APPROVED")} className="ml-auto rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Approve</button><button onClick={()=>decideCancellation(order,"REJECTED")} className="rounded-lg border border-red-200 bg-white px-3 py-2 font-bold text-red-600">Reject</button></div>}
          {order.deliveryAddress?.addressLine&&<div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"><b>{order.deliveryAddress.label || "Delivery address"}</b><div>{order.deliveryAddress.contactName} · {order.deliveryAddress.phone}</div><div>{order.deliveryAddress.addressLine}, {order.deliveryAddress.emirate}, {order.deliveryAddress.country}</div></div>}
          {(order.trackingNotes||order.cancellationReason||order.dispatchedAt||order.deliveredAt)&&<div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 text-xs leading-5 text-slate-600"><b>Fulfillment</b>{order.dispatchedAt&&<div>Dispatched: {date(order.dispatchedAt)}</div>}{order.deliveredAt&&<div>Delivered: {date(order.deliveredAt)}</div>}{order.trackingNotes&&<div>Notes: {order.trackingNotes}</div>}{order.cancellationReason&&<div className="text-red-600">Cancellation: {order.cancellationReason}</div>}</div>}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{order.items?.map((item)=><div key={`${order.id}-${item.productId}-${item.mode}`} className="rounded-xl bg-slate-50 p-3 text-xs"><b>{item.name}</b><p className="mt-1 text-slate-500">{item.mode === "RENT" ? `${item.quantity} x ${item.months} month(s)` : `Quantity ${item.quantity}`}</p><strong className="mt-2 block">{amount(item.lineTotal)}</strong></div>)}</div>
        </article>)}
        {!orders.length&&<div className="p-10 text-center text-sm text-slate-500">No orders match this filter.</div>}
      </div>
      {serverTotal>0&&<div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-xs text-slate-500"><span>Showing {(page-1)*pageSize+1} to {Math.min(page*pageSize,serverTotal)} of {serverTotal} orders</span><div className="flex gap-1"><button disabled={page===1} onClick={()=>setPage((x)=>Math.max(1,x-1))} className="icon-btn h-8 w-8 disabled:opacity-40">‹</button>{Array.from({length:serverPages},(_,i)=>i+1).slice(Math.max(0,page-4),Math.max(7,page+3)).map((item)=><button key={item} onClick={()=>setPage(item)} className={`icon-btn h-8 w-8 ${page===item?"border-brand text-brand":""}`}>{item}</button>)}{serverPages>7&&page<serverPages-3&&<span className="grid h-8 place-items-center px-1">…</span>}<button disabled={page===serverPages} onClick={()=>setPage((x)=>Math.min(serverPages,x+1))} className="icon-btn h-8 w-8 disabled:opacity-40">›</button></div></div>}
    </section>
  </div>;
}

function Pagination({ text }) {
  const isDashboard = text.includes("18,542 users");
  const [dashboardTotal, setDashboardTotal] = useState(localUsers.length);
  useEffect(() => {
    if (!isDashboard) return;
    const updateCount = (event) => setDashboardTotal(event.detail);
    window.addEventListener("dashboard-user-count", updateCount);
    get("/users").then(
      (result) => Array.isArray(result) && setDashboardTotal(result.length),
    );
    return () => window.removeEventListener("dashboard-user-count", updateCount);
  }, [isDashboard]);
  const total = isDashboard ? dashboardTotal : 50;
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.ceil(total / pageSize);
  const [page, setPage] = useState(1);
  const goToPage = (value) => {
    const next = Math.max(1, Math.min(totalPages, value));
    setPage(next);
    if (isDashboard)
      window.dispatchEvent(
        new CustomEvent("dashboard-user-page", { detail: next }),
      );
  };
  const changePageSize = (value) => {
    const nextSize = Number(value);
    setPageSize(nextSize);
    setPage(1);
    if (isDashboard) {
      window.dispatchEvent(
        new CustomEvent("dashboard-user-page-size", { detail: nextSize }),
      );
      window.dispatchEvent(
        new CustomEvent("dashboard-user-page", { detail: 1 }),
      );
    }
  };
  const displayText = isDashboard
    ? `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, total)} of ${total} users`
    : text;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-[11px] text-slate-500">
      <span>{displayText}</span>
      <div className="flex gap-1">
        <button
          disabled={page === 1}
          onClick={() => goToPage(page - 1)}
          className="icon-btn h-8 w-8 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((x) => (
          <button
            onClick={() => goToPage(x)}
            key={x}
            className={`icon-btn h-8 w-8 ${x === page ? "border-brand text-brand" : ""}`}
          >
            {x}
          </button>
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => goToPage(page + 1)}
          className="icon-btn h-8 w-8 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
      <select
        value={pageSize}
        onChange={(event) => changePageSize(event.target.value)}
        className="rounded-lg border px-3 py-2"
        aria-label="Users per page"
      >
        <option value="10">10 / page</option>
        <option value="20">20 / page</option>
        <option value="50">50 / page</option>
      </select>
    </div>
  );
}
function UsersPage() {
  const [users, setUsers] = useState(localUsers),
    [tab, setTab] = useState("ALL"),
    [q, setQ] = useState(""),
    [selected, setSelected] = useState(null),
    [editing, setEditing] = useState(undefined);
  useEffect(() => {
    get("/users").then((x) => x.length && setUsers(x));
  }, []);
  if (selected)
    return <UserDetailsPage user={selected} onBack={() => setSelected(null)} />;
  async function save(form) {
    const saved = await send(editing?.id ? `/users/${editing.id}` : "/users", editing?.id ? "PUT" : "POST", form);
    setUsers((rows) => editing?.id ? rows.map((row) => row.id === saved.id ? saved : row) : [saved, ...rows]);
    setEditing(undefined);
  }
  async function remove(u) {
    if (!confirm(`Delete ${u.name}?`)) return;
    setUsers((v) => v.filter((x) => x.id !== u.id));
    try {
      await send(`/users/${u.id}`, "DELETE");
    } catch { }
  }
  const shown = users.filter(
    (u) =>
      (tab === "ALL" || u.status === tab) &&
      `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()),
  );
  const count = (s) => users.filter((u) => u.status === s).length;
  const stats = [
    ["Total Users", users.length, UserRound, "blue"],
    ["Active Users", count("ACTIVE"), Users, "green"],
    ["Inactive Users", count("INACTIVE"), Clock3, "red"],
    ["Pending Users", count("PENDING"), Clock3, "cyan"],
    ["Suspended Users", count("SUSPENDED"), Shield, "red"],
    ["Deleted Users", count("DELETED"), ReceiptText, "red"],
  ];
  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="flex gap-3 overflow-x-auto">
        {stats.map((x) => (
          <StatCard
            key={x[0]}
            label={x[0]}
            value={x[1]}
            icon={x[2]}
            color={x[3]}
          />
        ))}
      </div>
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b px-4 pt-3">
          <div className="flex gap-5 overflow-x-auto">
            {[
              "ALL",
              "ACTIVE",
              "INACTIVE",
              "PENDING",
              "SUSPENDED",
              "DELETED",
            ].map((t) => (
              <button
                onClick={() => setTab(t)}
                key={t}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-[11px] font-semibold ${tab === t ? "border-brand text-brand" : "border-transparent text-slate-500"}`}
              >
                {t[0] + t.slice(1).toLowerCase()} Users
              </button>
            ))}
          </div>
          <div className="pb-3">
            <Toolbar
              placeholder="Search users by name, email, role..."
              add="Add New User"
              onAdd={() => setEditing(null)}
            />
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 md:hidden">
            <Search size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full outline-none"
              placeholder="Search users..."
            />
          </div>
        </div>
        <UsersTable
          users={shown}
          onView={setSelected}
          onEdit={setEditing}
          onDelete={remove}
        />
        <Pagination text={`Showing ${shown.length} of ${users.length} users`} />
      </div>
      {editing !== undefined && (
        <UserModal
          user={editing?.id ? editing : null}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
    </div>
  );
}
function RolesPage() {
  const [roles, setRoles] = useState(localRoles);
  useEffect(() => {
    get("/roles").then((x) => x.length && setRoles(x));
  }, []);
  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="flex gap-3 overflow-x-auto">
        <StatCard label="Total Roles" value="26" icon={Users} />
        <StatCard
          label="Active Roles"
          value="23"
          icon={ShieldCheck}
          color="green"
        />
        <StatCard
          label="Inactive Roles"
          value="2"
          icon={Clock3}
          color="amber"
        />
        <StatCard label="System Roles" value="8" icon={Shield} color="red" />
        <StatCard
          label="Custom Roles"
          value="18"
          icon={UserRound}
          color="cyan"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_370px]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div className="flex gap-6 text-xs">
              <b className="text-brand">All Roles</b>
              <span>System Roles</span>
              <span>Custom Roles</span>
            </div>
            <Toolbar placeholder="Search roles..." add="Add New Role" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Role Name</th>
                  <th>Type</th>
                  <th>Users</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r, i) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-lg ${roleColors[i % 6]}`}
                        >
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <b>{r.name}</b>
                          <div className="text-[9px] text-slate-400">
                            {r.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`pill ${r.type === "System" ? "bg-emerald-50 text-emerald-600" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td>{r.users}</td>
                    <td className="max-w-[220px] text-slate-500">
                      {r.description}
                    </td>
                    <td>
                      <span className="pill bg-emerald-50 text-emerald-600">
                        Active
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="icon-btn h-8 w-8">
                          <Eye size={14} />
                        </button>
                        <button className="icon-btn h-8 w-8">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination text="Showing 1 to 9 of 26 roles" />
        </div>
        <div className="card h-fit p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Role Permissions Preview</h3>
            <a className="text-[10px] font-semibold text-brand">
              View Full Matrix ↗
            </a>
          </div>
          <label className="mt-4 block text-[10px] text-slate-500">
            Select Role
          </label>
          <select className="mt-1 w-full rounded-lg border p-2 text-xs">
            <option>Operations Manager</option>
            <option>System Administrator</option>
          </select>
          <div className="mt-5 grid grid-cols-[1fr_repeat(3,34px)] text-[9px] font-semibold text-slate-500">
            <span>Module</span>
            <span>View</span>
            <span>Edit</span>
            <span>Delete</span>
          </div>
          {[
            "Dashboard",
            "Users Management",
            "Role Management",
            "Tickets",
            "Technicians",
            "Contracts (AMC)",
            "Assets",
            "Inventory",
            "NOC Monitoring",
            "Reports & Analytics",
            "Settings",
          ].map((x, i) => (
            <div
              key={x}
              className="grid grid-cols-[1fr_repeat(3,34px)] items-center border-b py-2 text-[10px]"
            >
              <span>{x}</span>
              <span className="text-emerald-500">●</span>
              <span className="text-emerald-500">●</span>
              <span className={i > 5 ? "text-red-400" : "text-emerald-500"}>
                {i > 5 ? "×" : "●"}
              </span>
            </div>
          ))}
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between text-xs">
              <span>Total Permissions</span>
              <b>112 / 150</b>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-3/4 rounded-full bg-brand" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function WefyxMark({ className = "h-12 w-14" }) {
  return (
    <svg className={className} viewBox="0 0 72 58" role="img" aria-label="Wefyx W logo">
      <defs>
        <linearGradient id="wefyx-mark-gradient" x1="4" y1="5" x2="68" y2="53" gradientUnits="userSpaceOnUse">
          <stop stopColor="#61ebb2" />
          <stop offset="0.52" stopColor="#6eedb8" />
          <stop offset="1" stopColor="#008553" />
        </linearGradient>
      </defs>
      <path d="M6 9h13l10 24 8-18 7 16-10 19H23L6 9Z" fill="url(#wefyx-mark-gradient)" />
      <path d="M31 9h13l10 24L64 9h13L59 50H48L31 9Z" fill="url(#wefyx-mark-gradient)" transform="translate(-5 0)" />
    </svg>
  );
}

function ProviderIcon({ provider }) {
  if (provider === "Google") {
    return <span className="text-base font-black text-[#008553]">G</span>;
  }
  if (provider === "Microsoft") {
    return (
      <span className="grid h-4 w-4 grid-cols-2 gap-[1px]">
        <i className="bg-[#f35325]" /><i className="bg-[#81bc06]" />
        <i className="bg-[#008553]" /><i className="bg-[#ffba08]" />
      </span>
    );
  }
  return (
    <svg className="h-5 w-5 fill-black" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.1 12.5c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.2-2-3.8-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.5-3-.1 0-2.9-1.1-2.9-4.1ZM14.5 4.8c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.4.7-3.2 1.6-.7.8-1.3 2-1.2 3.2 1.2.1 2.5-.6 3.3-1.5Z" />
    </svg>
  );
}

function Login({ onLogin, onRegister, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail || ""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [accountType, setAccountType] = useState("customer");
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 8) {
      setError("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      localStorage.setItem("wefyx-token", result.token);
      localStorage.setItem("wefyx-auth", "true");
      localStorage.setItem("wefyx-user", JSON.stringify(result.user));
      localStorage.setItem("wefyx-account-type", accountType);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      if (returnTo && /^\/(book-support|my-tickets|service-tasks|support-updates)(\/|\?|$)/.test(returnTo) && !returnTo.includes("\\")) {
        window.location.assign(returnTo);
        return;
      }
      onLogin();
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="wf-auth wf-auth-login"><AuthVisual login/>
      <section className="flex min-h-[calc(100vh-24px)] items-center justify-center px-1 py-4 lg:min-h-0 lg:justify-end lg:pl-10 lg:pr-3 xl:pl-14 xl:pr-4">
        <div className="w-full max-w-[500px] rounded-[26px] bg-white p-6 shadow-2xl shadow-black/20 sm:p-8 lg:min-h-[600px] lg:p-6">
          <div className="wf-form-brand"><Brand/></div>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to continue to your <b className="text-emerald-600">Wefyx.pro</b> account
              </p>
            </div>
            <button type="button" className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50">
              <Globe2 size={15} strokeWidth={1.8} />
              <span>English</span>
              <ChevronDown size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="mb-2 grid grid-cols-3 rounded-xl border bg-slate-50 p-1">
            <button
              type="button"
              aria-pressed={accountType === "vendor"}
              onClick={() => setAccountType("vendor")}
              className={`order-2 flex h-10 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${accountType === "vendor" ? "bg-[#008553] text-white shadow-md shadow-emerald-200" : "text-slate-600 hover:bg-white"}`}
            >
              <Users size={15} /> Vendor
            </button>
            <button
              type="button"
              aria-pressed={accountType === "customer"}
              onClick={() => setAccountType("customer")}
              className={`order-1 flex h-10 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${accountType === "customer" ? "bg-[#008553] text-white shadow-md shadow-emerald-200" : "text-slate-600 hover:bg-white"}`}
            >
              <CircleUserRound size={15} /> Customer
            </button>
            <button
              type="button"
              aria-pressed={accountType === "employee"}
              onClick={() => setAccountType("employee")}
              className={`order-3 flex h-10 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${accountType === "employee" ? "bg-[#008553] text-white shadow-md shadow-emerald-200" : "text-slate-600 hover:bg-white"}`}
            >
              <UserRound size={15} /> Employee
            </button>
          </div>
          {accountType === "employee" && <p className="mb-4 text-center text-[11px] text-slate-500">Employee accounts must be approved by an administrator before sign in.</p>}
          <form onSubmit={submit} className="space-y-3">
            <LoginField label="Email address" icon={Mail}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                className="w-full bg-transparent text-sm outline-none"
                placeholder="you@company.com"
                aria-label="Email address"
              />
            </LoginField>
            <div>
              <div className="mb-2 flex justify-between">
                <label className="text-xs font-semibold">Password</label>
                <button
                  type="button"
                  disabled title="Password recovery is not configured. Contact Wefyx support for help."
                  className="text-xs font-semibold text-brand"
                >
                  Forgot password?
                </button>
              </div>
              <div className="flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:border-brand focus-within:ring-4 focus-within:ring-emerald-50">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  aria-label="Password"
                  className="w-full bg-transparent text-sm outline-none"
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                  className="text-slate-400"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-emerald-600"
                />{" "}
                Remember me
              </label>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <ShieldCheck size={13} /> Secure login
              </span>
            </div>
            <div className={`flex h-9 items-center rounded-lg px-3 text-[11px] text-red-600 ${error ? "visible bg-red-50" : "invisible"}`} role="alert">
              {error || "No login error"}
            </div>
            <button
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#008553] text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-[#008553] disabled:opacity-70"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Sign In  →"
              )}
            </button>
          </form>
          <div className="my-4 flex items-center gap-4 text-[11px] text-slate-400"><span className="h-px flex-1 bg-slate-200" />or continue with<span className="h-px flex-1 bg-slate-200" /></div>
          <div className="grid grid-cols-3 gap-3">
            {["Google", "Microsoft", "Apple"].map(provider => <button type="button" disabled title={`${provider} sign-in is not configured`} key={provider} className="flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"><ProviderIcon provider={provider} />{provider}</button>)}
          </div>
          <div className="mt-5 text-center text-[11px] text-slate-400">
            By using Wefyx, you agree to our{" "}
            <a href="/privacy-policy" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Privacy Policy
            </a>
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">
            New to Wefyx?{" "}
            <button type="button" onClick={onRegister} className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Create an account
            </button>
          </div>
        </div>
      </section>

      </div>
  );
}
function LoginField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold">{label}</label>
      <div className="flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:border-brand focus-within:ring-4 focus-within:ring-emerald-50">
        <Icon size={18} className="text-slate-400" />
        {children}
      </div>
    </div>
  );
}
function Registration({ onBack }) {
  const [accountType, setAccountType] = useState("customer"),
    [name, setName] = useState(""),
    [organization, setOrganization] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [consent, setConsent] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [showConfirmPassword, setShowConfirmPassword] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !organization.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter your full name, organization, and a valid email address.");
      return;
    }
    if (!/^[+0-9][0-9() .-]{6,24}$/.test(phone.trim())) {
      setError("Enter a valid phone number, including country code.");
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("Use a password between 8 and 72 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!consent) {
      setError("Please acknowledge the Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    try {
      const result = await sendPublic("/auth/register", "POST", {
        name: name.trim(),
        organization: organization.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: accountType === "vendor" ? "VENDOR" : accountType === "employee" ? "EMPLOYEE" : "CUSTOMER",
      });
      setSuccess(result.message || (accountType === "employee" ? "Registration submitted. An administrator must approve your employee account before you can sign in." : "Account created. You can now sign in."));
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="wf-auth"><AuthVisual/>
      <section className="flex min-h-[calc(100vh-24px)] items-center justify-center px-1 py-4 lg:min-h-0 lg:justify-end lg:pl-10 lg:pr-3 xl:pl-14 xl:pr-4">
        <div className="w-full max-w-[500px] rounded-[26px] bg-white p-6 shadow-2xl shadow-black/20 sm:p-8 lg:min-h-[600px] lg:p-6">
          <div className="mb-7 flex items-center gap-3 lg:hidden"><WefyxMark className="h-11 w-14"/><div><div className="text-3xl font-bold text-navy">Wefyx<span className="text-brand">.</span>pro</div><div className="mt-1 text-xs text-slate-500">IT Support Management Platform</div></div></div>
          <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-3xl font-bold tracking-tight">Create Account</h2><p className="mt-1.5 text-sm text-slate-500">Join your <b className="text-emerald-600">Wefyx.pro</b> support network</p></div><button type="button" className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"><Globe2 size={15} strokeWidth={1.8}/><span>English</span><ChevronDown size={14} strokeWidth={2}/></button></div>
          <div className="mb-2 grid grid-cols-3 rounded-xl border bg-slate-50 p-1"><button type="button" aria-pressed={accountType === "customer"} onClick={() => setAccountType("customer")} className={`flex h-10 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${accountType === "customer" ? "bg-[#008553] text-white shadow-md shadow-emerald-200" : "text-slate-600 hover:bg-white"}`}><CircleUserRound size={15}/> Customer</button><button type="button" aria-pressed={accountType === "vendor"} onClick={() => setAccountType("vendor")} className={`flex h-10 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${accountType === "vendor" ? "bg-[#008553] text-white shadow-md shadow-emerald-200" : "text-slate-600 hover:bg-white"}`}><Users size={15}/> Vendor</button><button type="button" aria-pressed={accountType === "employee"} onClick={() => setAccountType("employee")} className={`flex h-10 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${accountType === "employee" ? "bg-[#008553] text-white shadow-md shadow-emerald-200" : "text-slate-600 hover:bg-white"}`}><UserRound size={15}/> Employee</button></div>
          <p className="mb-4 text-center text-[11px] text-slate-500">{accountType === "employee" ? "Employee registrations require administrator approval before sign in." : `Create a ${accountType} account to access your Wefyx workspace.`}</p>
          <form onSubmit={submit} className="space-y-3">
            <LoginField label="Full name" icon={UserRound}><input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} type="text" className="w-full bg-transparent text-sm outline-none" placeholder="Your full name" /></LoginField>
            <LoginField label="Company / organization" icon={Building2}><input required maxLength={200} value={organization} onChange={(event) => setOrganization(event.target.value)} type="text" className="w-full bg-transparent text-sm outline-none" placeholder="Your company name" /></LoginField>
            <LoginField label="Email address" icon={Mail}><input required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full bg-transparent text-sm outline-none" placeholder="you@company.com"
                aria-label="Email address" /></LoginField>
            <LoginField label="Phone number" icon={Phone}><input required maxLength={25} value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" className="w-full bg-transparent text-sm outline-none" placeholder="+971 50 123 4567" /></LoginField>
            <div><label className="mb-2 block text-xs font-semibold">Password</label><div className="flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:border-brand focus-within:ring-4 focus-within:ring-emerald-50"><LockKeyhole size={18} className="text-slate-400"/><input required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} className="w-full bg-transparent text-sm outline-none" placeholder="At least 8 characters"/><button type="button" aria-label="Show password" onClick={() => setShowPassword(!showPassword)} className="text-slate-400">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
            <div><label className="mb-2 block text-xs font-semibold">Confirm password</label><div className="flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:border-brand focus-within:ring-4 focus-within:ring-emerald-50"><LockKeyhole size={18} className="text-slate-400"/><input required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={showConfirmPassword ? "text" : "password"} className="w-full bg-transparent text-sm outline-none" placeholder="Repeat your password"/><button type="button" aria-label="Show confirm password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400">{showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
            <label className="flex items-start gap-2 pt-1 text-xs leading-5 text-slate-600"><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 accent-emerald-600"/><span>I have read and acknowledge the <a href="/privacy-policy" className="font-semibold text-emerald-600 hover:underline">Privacy Policy</a>.</span></label>
            <div className={`flex min-h-9 items-center rounded-lg px-3 text-[11px] ${error ? "bg-red-50 text-red-600" : success ? "bg-emerald-50 text-emerald-700" : "invisible"}`} role="alert">{error || success || "No registration message"}</div>
            <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#008553] text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-[#008553] disabled:opacity-70">{loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"/> : "Create Account  →"}</button>
          </form>
          <div className="mt-5 text-center text-[11px] text-slate-400">Already have an account? <button type="button" onClick={() => onBack(email.trim())} className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">Sign in</button></div>
          <div className="mt-3 text-center text-[11px] text-slate-400">By creating an account, you agree to our <a href="/privacy-policy" className="font-semibold text-emerald-600 hover:underline">Privacy Policy</a></div>
        </div>
      </section>

    </div>
  );
}
function AppSidebar({ page, setPage, expanded, setExpanded }) {
  return (
    <aside
      className={`${expanded ? "w-[220px]" : "w-0 lg:w-[70px]"} fixed inset-y-0 z-30 shrink-0 overflow-hidden bg-navy text-white transition-[width] duration-300 lg:static`}
    >
      <div
        className={`flex h-20 items-center border-b border-white/10 ${expanded ? "px-5" : "px-[19px]"}`}
      >
        {expanded ? (
          <div className="min-w-[180px]">
            <div className="text-2xl font-bold tracking-tight">
              wefyx<span className="text-emerald-400">.</span>pro
            </div>
            <div className="text-[10px] text-slate-300">
              IT Support | Asset Rental | NOC
            </div>
          </div>
        ) : (
          <div className="hidden h-9 w-9 place-items-center rounded-lg bg-brand text-sm font-bold lg:grid">
            W
          </div>
        )}
      </div>
      <nav className="h-[calc(100vh-132px)] overflow-y-auto overflow-x-hidden py-2">
        {sections.map(([title, items]) => (
          <div key={title}>
            <div
              className={`${expanded ? "nav-section" : "my-3 hidden h-px bg-white/10 lg:block"}`}
            >
              {expanded ? title : ""}
            </div>
            {items.map(([name, Icon]) => (
              <button
                title={!expanded ? name : undefined}
                key={name}
                onClick={() => {
                  setPage(name);
                  if (window.innerWidth < 1024) setExpanded(false);
                }}
                className={`mx-2 flex h-9 items-center rounded-lg transition ${expanded ? "w-[204px] gap-3 px-3" : "w-[54px] justify-center"} ${page === name ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={16} className="shrink-0" />
                {expanded && (
                  <span className="whitespace-nowrap text-[12px]">{name}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <button
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "Collapse menu" : "Expand menu"}
        className={`${expanded ? "mx-3 w-[196px]" : "mx-2 w-[54px]"} flex h-9 items-center justify-center gap-2 rounded-lg border border-white/15 text-xs text-slate-300`}
      >
        <PanelLeftClose size={15} className={!expanded ? "rotate-180" : ""} />
        {expanded && "Collapse Menu"}
      </button>
    </aside>
  );
}
const demoTickets = [
  [
    "TKT-2026-1256",
    "Email service unavailable",
    "ABC Trading LLC",
    "Ahmed Khan",
    "CRITICAL",
    "OPEN",
    "Email",
  ],
  [
    "TKT-2026-1255",
    "Laptop display issue",
    "Wefyx Technologies",
    "Mike Johnson",
    "MEDIUM",
    "IN_PROGRESS",
    "Hardware",
  ],
  [
    "TKT-2026-1254",
    "VPN access failure",
    "TechSolutions LLC",
    "Fatima Hassan",
    "HIGH",
    "PENDING",
    "Network",
  ],
  [
    "TKT-2026-1253",
    "Network latency alert",
    "Rentals UAE",
    "Ahmed Khan",
    "HIGH",
    "IN_PROGRESS",
    "Network",
  ],
  [
    "TKT-2026-1252",
    "Printer not responding",
    "MSP Global Solutions",
    "Mike Johnson",
    "LOW",
    "RESOLVED",
    "Hardware",
  ],
  [
    "TKT-2026-1251",
    "Account locked",
    "ABC Trading LLC",
    "Fatima Hassan",
    "MEDIUM",
    "CLOSED",
    "Access",
  ],
].map((t, i) => ({
  id: i + 1,
  reference: t[0],
  subject: t[1],
  customer: t[2],
  assignee: t[3],
  priority: t[4],
  status: t[5],
  category: t[6],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));
function TicketModal({ ticket, onClose, onSave }) {
  const [form, setForm] = useState(
    ticket || {
      subject: "",
      customer: "",
      assignee: "Ahmed Khan",
      priority: "MEDIUM",
      status: "OPEN",
      category: "Hardware",
    },
  );
  const field = (key, value) => setForm({ ...form, [key]: value });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close ticket form"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {ticket ? "Edit ticket" : "Create new ticket"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter the support request details and assignment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn border-0 text-xl"
          >
            ×
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-xs font-semibold">
            Subject
            <input
              required
              value={form.subject}
              onChange={(e) => field("subject", e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-brand"
              placeholder="Briefly describe the issue"
            />
          </label>
          <label className="text-xs font-semibold">
            Customer
            <input
              required
              value={form.customer}
              onChange={(e) => field("customer", e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-brand"
              placeholder="Customer organization"
            />
          </label>
          <label className="text-xs font-semibold">
            Category
            <select
              value={form.category}
              onChange={(e) => field("category", e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"
            >
              <option>Hardware</option>
              <option>Software</option>
              <option>Network</option>
              <option>Email</option>
              <option>Access</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Assignee
            <select
              value={form.assignee}
              onChange={(e) => field("assignee", e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"
            >
              <option>Ahmed Khan</option>
              <option>Mike Johnson</option>
              <option>Fatima Hassan</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Priority
            <select
              value={form.priority}
              onChange={(e) => field("priority", e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"
            >
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
          </label>
          {ticket && (
            <label className="text-xs font-semibold">
              Status
              <select
                value={form.status}
                onChange={(e) => field("status", e.target.value)}
                className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"
              >
                <option>OPEN</option>
                <option>IN_PROGRESS</option>
                <option>PENDING</option>
                <option>RESOLVED</option>
                <option>CLOSED</option>
              </select>
            </label>
          )}
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border px-5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button className="h-10 rounded-lg bg-brand px-5 text-xs font-semibold text-white">
            {ticket ? "Save changes" : "Create ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
function TicketsPage() {
  const [tickets, setTickets] = useState(demoTickets),
    [tab, setTab] = useState("ALL"),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(null);
  useEffect(() => {
    get("/tickets").then((x) => Array.isArray(x) && x.length && setTickets(x));
  }, []);
  const shown = tickets.filter(
    (t) =>
      (tab === "ALL" || t.status === tab) &&
      `${t.reference} ${t.subject} ${t.customer} ${t.assignee}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const count = (s) => tickets.filter((t) => t.status === s).length;
  async function save(form) {
    if (modal?.id) {
      const updated = { ...modal, ...form };
      setTickets((v) => v.map((t) => (t.id === modal.id ? updated : t)));
      setModal(null);
      try {
        const saved = await send(`/tickets/${modal.id}`, "PUT", updated);
        setTickets((v) => v.map((t) => (t.id === saved.id ? saved : t)));
      } catch { }
    } else {
      const temp = {
        ...form,
        id: Date.now(),
        reference: `TKT-2026-${1257 + tickets.length}`,
        createdAt: new Date().toISOString(),
      };
      setTickets((v) => [temp, ...v]);
      setModal(null);
      try {
        const saved = await send("/tickets", "POST", form);
        setTickets((v) => v.map((t) => (t.id === temp.id ? saved : t)));
      } catch { }
    }
  }
  async function remove(t) {
    setTickets((v) => v.filter((x) => x.id !== t.id));
    try {
      await send(`/tickets/${t.id}`, "DELETE");
    } catch { }
  }
  const statusClass = {
    OPEN: "bg-emerald-50 text-emerald-600",
    IN_PROGRESS: "bg-emerald-50 text-emerald-600",
    PENDING: "bg-amber-50 text-amber-600",
    RESOLVED: "bg-emerald-50 text-emerald-600",
    CLOSED: "bg-slate-100 text-slate-500",
  },
    priorityClass = {
      LOW: "text-slate-500",
      MEDIUM: "text-emerald-600",
      HIGH: "text-orange-500",
      CRITICAL: "text-red-500",
    };
  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Tickets" value={tickets.length} icon={Ticket} />
        <StatCard label="Open" value={count("OPEN")} icon={Activity} />
        <StatCard
          label="In Progress"
          value={count("IN_PROGRESS")}
          icon={Clock3}
          color="cyan"
        />
        <StatCard
          label="Pending"
          value={count("PENDING")}
          icon={Clock3}
          color="amber"
        />
        <StatCard
          label="Resolved"
          value={count("RESOLVED")}
          icon={CheckCircle2}
          color="green"
        />
      </div>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b px-4 pt-4">
          <div className="flex gap-5 overflow-x-auto">
            {[
              "ALL",
              "OPEN",
              "IN_PROGRESS",
              "PENDING",
              "RESOLVED",
              "CLOSED",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={`whitespace-nowrap border-b-2 pb-4 text-[11px] font-semibold ${tab === s ? "border-brand text-brand" : "border-transparent text-slate-500"}`}
              >
                {s === "ALL" ? "All Tickets" : s.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pb-3">
            <div className="flex h-9 items-center gap-2 rounded-lg border px-3">
              <Search size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-52 text-xs outline-none"
                placeholder="Search tickets..."
              />
            </div>
            <button
              onClick={() => setModal({})}
              className="flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-white"
            >
              <Plus size={16} /> Create Ticket
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-xs">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th>Customer</th>
                <th>Assignee</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t, i) => (
                <tr key={t.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <b>{t.subject}</b>
                    <div className="text-[10px] font-semibold text-brand">
                      {t.reference}
                    </div>
                  </td>
                  <td>{t.customer}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full ${roleColors[i % 6]}`}
                      >
                        {t.assignee
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      {t.assignee}
                    </div>
                  </td>
                  <td>{t.category}</td>
                  <td>
                    <b className={priorityClass[t.priority]}>● {t.priority}</b>
                  </td>
                  <td>
                    <select
                      value={t.status}
                      onChange={async (e) => {
                        const status = e.target.value;
                        setTickets((v) =>
                          v.map((x) => (x.id === t.id ? { ...x, status } : x)),
                        );
                        try {
                          await send(`/tickets/${t.id}/status`, "PATCH", {
                            status,
                          });
                        } catch { }
                      }}
                      className={`rounded-md border-0 px-2 py-1 text-[10px] font-semibold ${statusClass[t.status]}`}
                    >
                      {[
                        "OPEN",
                        "IN_PROGRESS",
                        "PENDING",
                        "RESOLVED",
                        "CLOSED",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModal(t)}
                        className="icon-btn h-8 w-8"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(t)}
                        className="icon-btn h-8 w-8 hover:text-red-500"
                        title="Delete"
                      >
                        <ReceiptText size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              No tickets match the current filters.
            </div>
          )}
        </div>
        <Pagination
          text={`Showing ${shown.length} of ${tickets.length} tickets`}
        />
      </div>
      {modal && (
        <TicketModal
          ticket={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
const moduleMeta = {
  Permissions: {
    entity: "Permission",
    action: "Create Permission",
    columns: ["Permission", "Module", "Assigned Roles", "Access Level"],
    items: [
      "View dashboard",
      "Manage users",
      "Create tickets",
      "Edit assets",
      "Approve invoices",
      "Export reports",
    ],
  },
  "Permission Matrix": {
    entity: "Access Rule",
    action: "Update Matrix",
    columns: ["Role / Module", "Role Type", "Permissions", "Scope"],
    items: [
      "Super Admin Matrix",
      "System Administrator Matrix",
      "Operations Manager Matrix",
      "Branch Manager Matrix",
      "L1 Technician Matrix",
      "Vendor Manager Matrix",
    ],
  },
  "Permission Requests": {
    entity: "Access Request",
    action: "New Request",
    columns: ["Request", "Requested By", "Permission", "Requested On"],
    items: [
      "Temporary admin access",
      "Invoice export access",
      "Asset edit permission",
      "Vendor approval rights",
      "NOC dashboard access",
      "Audit log export",
    ],
  },
  Organizations: {
    entity: "Organization",
    action: "Add Organization",
    columns: ["Organization", "Industry", "Users", "Location"],
    items: [
      "ABC Trading LLC",
      "Wefyx Technologies",
      "TechSolutions LLC",
      "Rentals UAE",
      "MSP Global Solutions",
      "TechGear LLC",
    ],
  },
  Branches: {
    entity: "Branch",
    action: "Add Branch",
    columns: ["Branch", "Organization", "Manager", "Location"],
    items: [
      "Dubai HQ",
      "Abu Dhabi Office",
      "Sharjah Branch",
      "Ajman Service Center",
      "Al Quoz Warehouse",
      "JLT Office",
    ],
  },
  Departments: {
    entity: "Department",
    action: "Add Department",
    columns: ["Department", "Head", "Members", "Organization"],
    items: [
      "IT Support",
      "Network Operations",
      "Finance",
      "Service Delivery",
      "Procurement",
      "Customer Success",
    ],
  },
  Teams: {
    entity: "Team",
    action: "Create Team",
    columns: ["Team", "Team Lead", "Members", "Coverage"],
    items: [
      "L1 Support Team",
      "L2 Engineering",
      "NOC Team Alpha",
      "Field Technicians",
      "Asset Operations",
      "Billing Support",
    ],
  },
  Tickets: {
    entity: "Ticket",
    action: "Create Ticket",
    columns: ["Ticket", "Customer", "Assignee", "Priority"],
    items: [
      "Email service unavailable",
      "Laptop display issue",
      "VPN access failure",
      "Network latency alert",
      "Printer not responding",
      "Account locked",
    ],
  },
  Technicians: {
    entity: "Technician",
    action: "Add Technician",
    columns: ["Technician", "Specialization", "Open Tickets", "Availability"],
    items: [
      "Ahmed Khan",
      "Mike Johnson",
      "Fatima Hassan",
      "Ravi Menon",
      "Sarah Thomas",
      "Omar Farooq",
    ],
  },
  "Contracts (AMC)": {
    entity: "Contract",
    action: "New Contract",
    columns: ["Contract", "Customer", "Service Plan", "Renewal"],
    items: [
      "AMC-2026-015-0894",
      "AMC-2026-012-0742",
      "AMC-2026-008-0611",
      "AMC-2026-004-0520",
      "AMC-2025-098-0418",
      "AMC-2025-084-0371",
    ],
  },
  Assets: {
    entity: "Asset",
    action: "Add Asset",
    columns: ["Asset", "Category", "Assigned To", "Condition"],
    items: [
      "Dell Latitude 7450",
      "Cisco Catalyst 9300",
      "HP LaserJet Pro",
      "MacBook Pro M4",
      "FortiGate 100F",
      "Synology RS1221+",
    ],
  },
  "Asset Rental": {
    entity: "Rental",
    action: "New Rental",
    columns: ["Rental", "Customer", "Assets", "Return Date"],
    items: [
      "RNT-2026-1042",
      "RNT-2026-1038",
      "RNT-2026-1029",
      "RNT-2026-1017",
      "RNT-2026-0998",
      "RNT-2026-0981",
    ],
  },
  Inventory: {
    entity: "Inventory Item",
    action: "Add Stock",
    columns: ["Item", "SKU", "In Stock", "Warehouse"],
    items: [
      "USB-C Docking Station",
      "CAT6 Cable Box",
      "Wireless Keyboard",
      "27-inch Monitor",
      "Laptop Charger 65W",
      "Network Patch Panel",
    ],
  },
  "NOC Monitoring": {
    entity: "Monitor",
    action: "Add Monitor",
    columns: ["Device", "IP Address", "Uptime", "Last Check"],
    items: [
      "Core Router DXB-01",
      "Firewall AUH-02",
      "Web Server PROD-1",
      "Database Cluster",
      "VPN Gateway",
      "Backup Appliance",
    ],
  },
  Vendors: {
    entity: "Vendor",
    action: "Add Vendor",
    columns: ["Vendor", "Category", "Open Orders", "Rating"],
    items: [
      "TechGear LLC",
      "Global IT Supplies",
      "Emirates Networks",
      "CloudBridge ME",
      "SecureSys Arabia",
      "DataCore Systems",
    ],
  },
  "Products & Services": {
    entity: "Product",
    action: "Add Product",
    columns: ["Product / Service", "Category", "Vendor", "Unit Price"],
    items: [
      "Managed IT Support",
      "Network Assessment",
      "Endpoint Protection",
      "Cloud Backup",
      "Server Maintenance",
      "NOC Monitoring",
    ],
  },
  "Purchase & RFQ": {
    entity: "RFQ",
    action: "Create RFQ",
    columns: ["Reference", "Vendor", "Items", "Due Date"],
    items: [
      "RFQ-2026-0081",
      "PO-2026-0142",
      "RFQ-2026-0079",
      "PO-2026-0138",
      "RFQ-2026-0074",
      "PO-2026-0125",
    ],
  },
  "Vendor Settlements": {
    entity: "Settlement",
    action: "New Settlement",
    columns: ["Settlement", "Vendor", "Amount", "Due Date"],
    items: [
      "SET-2026-0842",
      "SET-2026-0836",
      "SET-2026-0819",
      "SET-2026-0804",
      "SET-2026-0798",
      "SET-2026-0781",
    ],
  },
  "Invoices & Billing": {
    entity: "Invoice",
    action: "Create Invoice",
    columns: ["Invoice", "Customer", "Amount", "Due Date"],
    items: [
      "INV-2026-18452",
      "INV-2026-18451",
      "INV-2026-18450",
      "INV-2026-18449",
      "INV-2026-18448",
      "INV-2026-18447",
    ],
  },
  Payments: {
    entity: "Payment",
    action: "Record Payment",
    columns: ["Payment", "Customer", "Amount", "Method"],
    items: [
      "PAY-2026-9382",
      "PAY-2026-9381",
      "PAY-2026-9380",
      "PAY-2026-9379",
      "PAY-2026-9378",
      "PAY-2026-9377",
    ],
  },
  "Wallet & Credits": {
    entity: "Wallet",
    action: "Add Credit",
    columns: ["Account", "Organization", "Balance", "Last Activity"],
    items: [
      "WLT-ABC-001",
      "WLT-WFX-002",
      "WLT-TCH-003",
      "WLT-RNT-004",
      "WLT-MSP-005",
      "WLT-TGR-006",
    ],
  },
  Payouts: {
    entity: "Payout",
    action: "Create Payout",
    columns: ["Payout", "Recipient", "Amount", "Processed On"],
    items: [
      "OUT-2026-0642",
      "OUT-2026-0638",
      "OUT-2026-0629",
      "OUT-2026-0617",
      "OUT-2026-0598",
      "OUT-2026-0581",
    ],
  },
  "System Settings": {
    entity: "Setting",
    action: "Save Changes",
    columns: ["Setting", "Category", "Current Value", "Updated By"],
    items: [
      "General configuration",
      "Email notifications",
      "Security policy",
      "SLA defaults",
      "Regional settings",
      "Data retention",
    ],
  },
  Integrations: {
    entity: "Integration",
    action: "Add Integration",
    columns: ["Integration", "Provider", "Last Sync", "Connection"],
    items: [
      "Microsoft 365",
      "Slack",
      "Jira Service Management",
      "QuickBooks Online",
      "Azure Active Directory",
      "Twilio",
    ],
  },
  "Audit Logs": {
    entity: "Event",
    action: "Export Logs",
    columns: ["Event", "User", "IP Address", "Timestamp"],
    items: [
      "User role updated",
      "Ticket status changed",
      "New user created",
      "Invoice exported",
      "Integration connected",
      "Asset reassigned",
    ],
  },
  "Reports & Analytics": {
    entity: "Report",
    action: "Create Report",
    columns: ["Report", "Category", "Owner", "Last Generated"],
    items: [
      "Service Performance",
      "Ticket SLA Summary",
      "Asset Utilization",
      "Revenue Analysis",
      "Technician Productivity",
      "Customer Satisfaction",
    ],
  },
};
function ModulePage({ name }) {
  const m = moduleMeta[name] || {
    entity: name,
    action: `Add ${name}`,
    columns: [name, "Owner", "Reference", "Updated"],
    items: Array.from({ length: 6 }, (_, i) => `${name} record ${i + 1}`),
  };
  const counts = [
    ["Total", 1248, BarChart3, "blue"],
    ["Active", 986, Activity, "green"],
    ["Pending", 184, Clock3, "amber"],
    ["Attention", 78, Shield, "red"],
  ];
  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map(([label, value, Icon, color]) => (
          <StatCard
            key={label}
            label={`${label} ${m.entity}s`}
            value={value}
            icon={Icon}
            color={color}
            delta={label === "Attention" ? "- 2.1%" : "+ 6.4%"}
          />
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 pt-4">
          <div className="flex gap-6 text-xs font-semibold">
            <button className="border-b-2 border-brand pb-4 text-brand">
              All {m.entity}s
            </button>
            <button className="border-b-2 border-transparent pb-4 text-slate-500">
              Active
            </button>
            <button className="border-b-2 border-transparent pb-4 text-slate-500">
              Pending
            </button>
            <button className="hidden border-b-2 border-transparent pb-4 text-slate-500 sm:block">
              Archived
            </button>
          </div>
          <div className="pb-3">
            <Toolbar
              placeholder={`Search ${m.entity.toLowerCase()}s...`}
              add={m.action}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead className="table-head">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" />
                </th>
                {m.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th>Status</th>
                <th className="pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {m.items.map((item, i) => (
                <tr
                  key={item}
                  className="border-t border-slate-100 transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-lg ${roleColors[i % 6]}`}
                      >
                        <span className="font-bold">
                          {item.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <b className="font-semibold">{item}</b>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          {m.entity.toUpperCase()}-
                          {String(2048 - i * 7).padStart(5, "0")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <b className="font-medium">
                      {
                        [
                          "Wefyx Technologies",
                          "ABC Trading LLC",
                          "TechSolutions LLC",
                          "System Operations",
                          "Dubai Branch",
                          "Global Services",
                        ][i]
                      }
                    </b>
                    <div className="text-[10px] text-slate-400">
                      {["Dubai, UAE", "Abu Dhabi, UAE", "Sharjah, UAE"][i % 3]}
                    </div>
                  </td>
                  <td>
                    {[18, 42, 7, 128, 24, 63][i]}{" "}
                    <span className="text-slate-400">
                      {i % 2 ? "assigned" : "items"}
                    </span>
                  </td>
                  <td>
                    {
                      [
                        "May 24, 2026",
                        "Jun 02, 2026",
                        "May 29, 2026",
                        "Jun 08, 2026",
                        "May 18, 2026",
                        "Jun 12, 2026",
                      ][i]
                    }
                  </td>
                  <td>
                    <span
                      className={`pill ${i === 2 ? "bg-amber-50 text-amber-600" : i === 4 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      {i === 2 ? "Pending" : i === 4 ? "Attention" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="icon-btn h-8 w-8" title="View">
                        <Eye size={14} />
                      </button>
                      <button className="icon-btn h-8 w-8" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="icon-btn h-8 w-8" title="More">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          text={`Showing 1 to ${m.items.length} of 1,248 ${m.entity.toLowerCase()}s`}
        />
      </div>
    </div>
  );
}
function LogoutAlert({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <button
        aria-label="Close logout confirmation"
        onClick={onCancel}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-500">
          <LogOut size={22} />
        </div>
        <h2 id="logout-title" className="mt-5 text-xl font-bold text-slate-900">
          Sign out of Wefyx?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          You’ll need to enter your credentials again to access the IT support
          dashboard.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Stay signed in
          </button>
          <button
            onClick={onConfirm}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-semibold text-white shadow-lg shadow-red-100 transition hover:bg-red-600"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
function AuthenticatedApp({ initialRegister = false }) {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("wefyx-auth") === "true",
  ),
    [registering, setRegistering] = useState(() => initialRegister),
    [loginEmail, setLoginEmail] = useState(""),
    [page, setPage] = useState("Dashboard"),
    [previousPage, setPreviousPage] = useState("Dashboard"),
    [expanded, setExpanded] = useState(() => window.innerWidth >= 1024),
    [logoutOpen, setLogoutOpen] = useState(false);
  useEffect(() => {
    const unauthorized = () => setAuthenticated(false);
    window.addEventListener("wefyx-unauthorized", unauthorized);
    return () => window.removeEventListener("wefyx-unauthorized", unauthorized);
  }, []);
  if (!authenticated) {
    return <PublicRegistration initialView={registering ? "signup" : "login"} />;
  }
  function logout() {
    localStorage.removeItem("wefyx-auth");
    localStorage.removeItem("wefyx-token");
    localStorage.removeItem("wefyx-user");
    setLogoutOpen(false);
    setAuthenticated(false);
  }
  const signedInUser = JSON.parse(localStorage.getItem("wefyx-user") || "null");
  if (signedInUser?.role === "EMPLOYEE") return <EmployeePortal user={signedInUser} onLogout={logout} />;
  if (signedInUser?.role === "VENDOR") return <VendorPortal user={signedInUser} onLogout={logout} />;
  if (signedInUser?.role === "CUSTOMER") { window.location.assign("/account"); return null; }
  if (signedInUser?.role !== "SUPER_ADMIN") { logout(); return null; }
  let content =
    page === "Dashboard" ? (
      <Dashboard />
    ) : page === "Users Management" ? (
      <><EmployeeApprovals /><DynamicUsersPage /></>
    ) : page === "Role Management" ? (
      <DynamicRolesPage />
    ) : page === "Permissions" ? (
      <DynamicPermissionsPage />
    ) : page === "Tickets" ? (
      <TicketsPage />
    ) : page === "Audit Logs" ? (
      <DynamicAuditLogsPage />
    ) : page === "Permission Matrix" ? (
      <DynamicPermissionMatrixPage />
    ) : page === "Help Center" ? (
      <HelpCenterPage />
    ) : page === "Notifications" ? (
      <NotificationsPage />
    ) : page === "Messages" ? (
      <MessagesPage />
    ) : page === "Requirements & Quotes" ? (
      <RequirementsPage />
    ) : page === "Orders" ? (
      <AdminOrdersPage />
    ) : page === "Products & Services" ? (
      <ProductManagementPage />
    ) : page === "My Profile" ? (
      <AdminProfilePage onBack={() => setPage(previousPage)} />
    ) : (
      <DynamicModulePage name={page} />
    );
  return (
    <div className="wf-workspace wf-admin-shell flex min-h-screen">
      <AppSidebar
        page={page}
        setPage={setPage}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      {expanded && (
        <button
          aria-label="Close menu"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
        />
      )}
      <main className="min-w-0 flex-1">
        <Header
          page={page}
          onMenu={() => setExpanded(!expanded)}
          onLogout={() => setLogoutOpen(true)}
          onHelp={() => setPage("Help Center")}
          onNotifications={() => setPage("Notifications")}
          onMessages={() => setPage("Messages")}
          onProfile={() => {
            if (page !== "My Profile") setPreviousPage(page);
            setPage("My Profile");
          }}
        />
        {content}
      </main>
      {logoutOpen && (
        <LogoutAlert onCancel={() => setLogoutOpen(false)} onConfirm={logout} />
      )}
    </div>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/book-support" || path.startsWith("/book-support/")) return <BookingFlow />;
  if (path === "/my-tickets" || path.startsWith("/my-tickets/")) return <ServiceTickets />;
  if (path === "/service-tasks" || path.startsWith("/service-tasks/")) return <ServiceTickets employee />;
  if (path.startsWith("/support-updates/")) return <ServiceTickets notification />;
  if (path === "/privacy-policy") return <PrivacyPolicyPage />;
  if (path === "/terms") return <TrustPolicyPage type="terms" />;
  if (path === "/rental-terms") return <TrustPolicyPage type="rental" />;
  if (path === "/refund-policy") return <TrustPolicyPage type="refund" />;
  if (path === "/portal") return <AuthenticatedApp />;
  if (path === "/account" || path.startsWith("/account/")) return <CustomerAccount />;
  if (path === "/register" || path === "/signup" || path === "/join") return <PublicRegistration initialView="signup" />;
  if (path === "/login" || path === "/signin") return <PublicRegistration initialView="login" />;
  if (path === "/forgot-password" || path === "/reset-password") return <PublicRegistration initialView="forgot" />;
  if (path === "/careers") return <CareersPage />;
  if (path === "/become-a-vendor") return <VendorRegistrationPage />;
  if (path === "/rent") return <RentalCatalog />;
  if (path === "/rent/dell-latitude-5550") return <RentalDetail />;
  if (path === "/cart") return <CartPage />;
  if (path === "/services") return <InfoPage type="services" />;
  if (path === "/data-center") return <DataCenterPage />;
  if (path === "/amc") return <AMCPage />;
  if (path === "/solutions") return <SolutionsPage />;
  if (path === "/industries") return <IndustriesPage />;
  if (path === "/shop") return <ShopPage />;
  if (path === "/about") return <InfoPage type="about" />;
  if (path === "/contact") return <SupportPage />;
  if (path === "/support") return <SupportPage />;
  return <ServiceWebsite />;
}
