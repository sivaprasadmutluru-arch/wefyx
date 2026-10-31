import useCatalog from "./useCatalog";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Globe2,
  Headphones,
  Laptop,
  MapPin,
  Menu,
  Monitor,
  Network,
  Phone,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UsersRound,
  Wrench,
  X,
  Zap,
  Building2,
  Lock,
  Boxes,
  FileText,
  ClipboardList,
  LogOut,
  UserRound
} from "lucide-react";
import AIQuotationModal from "./AIQuotationModal";
import SiteVisitModal from "./SiteVisitModal";
import { CART_EVENT, cartCount as countCartItems, loadCart } from "./cart";

export default function UnifiedHeader({ cartCount, onOpenQuote, onOpenVisit }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMega, setActiveMega] = useState(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Dubai, UAE");
  const [showAiModal, setShowAiModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [storedCartCount, setStoredCartCount] = useState(() => countCartItems(loadCart()));
  const liveCartCount = typeof cartCount === "number" ? cartCount : storedCartCount;
  const [accountOpen, setAccountOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(() => {
    try { return localStorage.getItem("wefyx-token") ? JSON.parse(localStorage.getItem("wefyx-user") || "null") : null; } catch { return null; }
  });
  const [profilePhoto, setProfilePhoto] = useState("");
  useEffect(() => {
    const expired=()=>setSessionUser(null);
    window.addEventListener("wefyx-unauthorized",expired);
    return ()=>window.removeEventListener("wefyx-unauthorized",expired);
  }, []);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const refresh = () => setStoredCartCount(countCartItems(loadCart()));
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "CUSTOMER") return;
    const token = localStorage.getItem("wefyx-token");
    fetch("/api/profile/photo", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((response) => response.ok ? response.blob() : null)
      .then((blob) => blob && setProfilePhoto(URL.createObjectURL(blob)))
      .catch(() => {});
  }, [sessionUser?.email]);

  const signOut = () => {
    ["wefyx-token", "wefyx-auth", "wefyx-user", "wefyx-account-type"].forEach((key) => localStorage.removeItem(key));
    window.location.assign("/");
  };

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const {products:catalog}=useCatalog();
  const allSearchable = [
    ...catalog.map(product=>({title:product.name,cat:product.category,href:product.rentable?`/rent/${encodeURIComponent(product.code)}`:`/shop?q=${encodeURIComponent(product.name)}`,desc:product.specification||""})),
    { title: "Managed IT Services", cat: "Service", href: "/services", desc: "Proactive 24/7 IT management and endpoint maintenance" },
    { title: "Data Center Construction", cat: "Infrastructure", href: "/data-center", desc: "Tier III/IV server room design, cooling, and build" },
    { title: "IT Support & Helpdesk", cat: "Service", href: "/services#helpdesk", desc: "Remote and on-site certified engineering support" },
    { title: "Network & Infrastructure", cat: "Service", href: "/services#network", desc: "SD-WAN, Cisco switching, Wi-Fi 6, structured cabling" },
    { title: "Cloud & Microsoft 365", cat: "Cloud", href: "/services#cloud", desc: "Azure, AWS, Microsoft 365 migration & tenant setup" },
    { title: "Cybersecurity Solutions", cat: "Security", href: "/services#cybersecurity", desc: "Next-gen firewalls, EDR, SOC monitoring, audits" },
    { title: "Annual Maintenance Contracts (AMC)", cat: "AMC", href: "/amc", desc: "Preventive maintenance, SLA guarantee, asset cover" },
    { title: "IT Equipment Rental", cat: "Rental", href: "/rent", desc: "Daily, monthly, and yearly business hardware rental" },
    { title: "Shop Electronics", cat: "Shop", href: "/shop", desc: "Enterprise laptops, servers, switches, CCTV cameras" },
    { title: "Book an On-Site Engineer", cat: "Booking", href: "/book-support", desc: "Certified engineer visits your office/site in UAE" },
    { title: "Business Solutions", cat: "Solution", href: "/solutions", desc: "Tailored IT stacks for Corporate, Healthcare, Hospitality" },
    { title: "Industries We Support", cat: "Industry", href: "/industries", desc: "12+ enterprise industry compliance solutions" },
    { title: "Customer Account", cat: "Account", href: "/account", desc: "Access orders, requirements, support tickets, and profile" }
  ];

  const searchResults = allSearchable.filter(item =>
    item.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    item.cat.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const currentPath = typeof window !== "undefined" ? (window.location.pathname.replace(/\/$/, "") || "/") : "/";

  const megaMenus = {
    "IT Services": {
      title: "Enterprise IT Services",
      desc: "Complete managed IT operations, proactive support, and scalable infrastructure.",
      link: "/services",
      items: [
        { title: "IT Support & Helpdesk", desc: "Remote & on-site 24/7 technical support", href: "/services#helpdesk", icon: Headphones },
        { title: "Network & Infrastructure", desc: "LAN, WAN, SD-WAN, switching & Wi-Fi 6", href: "/services#network", icon: Network },
        { title: "Cloud & Microsoft 365", desc: "Azure, AWS, hybrid cloud & migration", href: "/services#cloud", icon: Zap },
        { title: "Cybersecurity & EDR", desc: "Endpoint defense, firewalls & audits", href: "/services#cybersecurity", icon: ShieldCheck },
        { title: "Managed Endpoint Services", desc: "Workstation patching, antivirus & MDM", href: "/services#endpoints", icon: Laptop },
        { title: "Server & Virtualization", desc: "Windows, Linux, VMware & Hyper-V", href: "/services#servers", icon: Server }
      ],
      featured: {
        title: "24/7 Managed NOC",
        desc: "Proactive infrastructure monitoring with 15-minute SLA dispatch.",
        cta: "Explore Managed IT",
        href: "/services"
      }
    },
    "Managed Services": {
      title: "Managed IT & AMC Contracts",
      desc: "Comprehensive technology management with predictable costs and SLAs.",
      link: "/services",
      items: [
        { title: "Annual Maintenance Contracts (AMC)", desc: "Comprehensive & preventive SLA coverage", href: "/amc", icon: FileText },
        { title: "24/7 Infrastructure NOC", desc: "Continuous uptime and server health alerts", href: "/services#noc", icon: Zap },
        { title: "Backup & Disaster Recovery", desc: "Cloud & local immutable backup solutions", href: "/services#aaccbekup", icon: ShieldCheck },
        { title: "IT Asset Management", desc: "Hardware lifecycle, tags & warranty tracking", href: "/services#assets", icon: Boxes },
        { title: "Dedicated On-Site Engineer", desc: "Resident certified engineer at your office", href: "/services#resident", icon: UsersRound }
      ],
      featured: {
        title: "Fixed Monthly IT Cost",
        desc: "Replace unexpected IT expenses with a predictable, all-inclusive SLA.",
        cta: "Calculate AMC Quote",
        href: "/amc"
      }
    },
    "Data Center": {
      title: "Data Center Design & Construction",
      desc: "Turnkey mission-critical data centers from concept to Tier III/IV operations.",
      link: "/data-center",
      items: [
        { title: "Design & Civil Planning", desc: "Raised flooring, containment & layout", href: "/data-center#design", icon: Building2 },
        { title: "Precision Power & UPS", desc: "Redundant power distribution & generators", href: "/data-center#power", icon: Zap },
        { title: "Precision Cooling & HVAC", desc: "In-row, hot/cold aisle thermal control", href: "/data-center#cooling", icon: Server },
        { title: "Structured Fiber Cabling", desc: "High-density CAT6A & MPO/MTP fiber", href: "/data-center#cabling", icon: Network },
        { title: "Fire Suppression & Security", desc: "FM-200, NOVEC 1230, biometric access", href: "/data-center#security", icon: ShieldCheck },
        { title: "NOC & 24/7 Monitoring", desc: "DCIM environmental & load monitoring", href: "/data-center#noc", icon: Headphones }
      ],
      featured: {
        title: "Mission-Critical Uptime",
        desc: "Certified data center engineering adhering to UAE & global standards.",
        cta: "View DC Lifecycle",
        href: "/data-center"
      }
    },
    "Shop Electronics": {
      title: "Enterprise Electronics Sales",
      desc: "Procure brand new business laptops, servers, networking gear and security systems.",
      link: "/shop",
      items: [
        { title: "Laptops & Workstations", desc: "Dell, HP, Lenovo & Apple enterprise models", href: "/shop?cat=Laptop", icon: Laptop },
        { title: "Servers & Storage (NAS)", desc: "Rack servers, Synology & QNAP storage", href: "/shop?cat=Servers", icon: Server },
        { title: "Networking & Firewalls", desc: "Cisco, Fortinet, Ubiquiti UniFi, Aruba", href: "/shop?cat=Networking", icon: Network },
        { title: "CCTV & Physical Security", desc: "Hikvision, Dahua IP cameras & NVRs", href: "/shop?cat=Security", icon: ShieldCheck },
        { title: "Meeting Room AV & Screens", desc: "4K displays, Logitech conference kits", href: "/shop?cat=AV", icon: Monitor },
        { title: "Printers & Scanners", desc: "Canon, HP, Epson network multifunctions", href: "/shop?cat=Printer", icon: FileText }
      ],
      featured: {
        title: "Authorized UAE Warranty",
        desc: "100% genuine products with manufacturer warranty and local setup.",
        cta: "Shop Electronics",
        href: "/shop"
      }
    },
    "Rent Equipment": {
      title: "Flexible IT Equipment Rental",
      desc: "Short-term & long-term rentals for businesses, remote teams, and events.",
      link: "/rent",
      items: [
        { title: "Corporate Laptop Rental", desc: "Available laptops for your team", href: "/rent?cat=Laptop", icon: Laptop },
        { title: "Desktop & Workstation Rental", desc: "High-spec CAD and office workstations", href: "/rent?cat=Desktop", icon: Monitor },
        { title: "Server & Network Rental", desc: "Temporary rack servers & high-speed Wi-Fi", href: "/rent?cat=Servers", icon: Server },
        { title: "Event & Exhibition Tech", desc: "Displays, sound, projectors & badge printers", href: "/rent?cat=Event", icon: Zap },
      ],
      featured: {
        title: "Zero Upfront Capital",
        desc: "Immediate delivery, pre-configured software, and maintenance included.",
        cta: "Browse Rental Catalog",
        href: "/rent"
      }
    },
    "AMC": {
      title: "Annual Maintenance Contracts (AMC)",
      desc: "Guaranteed uptime and proactive care for all company IT assets.",
      link: "/amc",
      items: [
        { title: "Comprehensive AMC", desc: "Parts, labor, and unlimited visits included", href: "/amc#comprehensive", icon: ShieldCheck },
        { title: "Non-Comprehensive AMC", desc: "Preventive visits and discounted emergency labor", href: "/amc#non-comprehensive", icon: Wrench },
        { title: "SLA Response Guarantee", desc: "15-minute remote / 2-hour on-site SLAs", href: "/amc#sla", icon: Zap },
        { title: "Asset Audit & Tagging", desc: "Complete IT inventory and health inspection", href: "/amc#audit", icon: Boxes }
      ],
      featured: {
        title: "Custom AMC Proposals",
        desc: "Get an itemized contract tailored to your exact hardware inventory.",
        cta: "Request AMC Quote",
        href: "/amc"
      }
    },
    "Business Solutions": {
      title: "Turnkey Business IT Solutions",
      desc: "End-to-end technology blueprints designed for specific UAE business environments.",
      link: "/solutions",
      items: [
        { title: "Corporate Offices", desc: "Structured cabling, Wi-Fi 6, 365 & helpdesk", href: "/solutions#corporate", icon: Building2 },
        { title: "Hospitality & Hotels", desc: "Guest Wi-Fi, POS, IP telephony & CCTV", href: "/solutions#hospitality", icon: Zap },
        { title: "Healthcare & Clinics", desc: "HIPAA/DHA compliance, PACS & backup", href: "/solutions#healthcare", icon: ShieldCheck },
        { title: "Retail & Multi-Branch", desc: "Centralized networking, POS & store security", href: "/solutions#retail", icon: Boxes },
        { title: "Warehousing & Logistics", desc: "Rugged Wi-Fi, barcode scanners & cameras", href: "/solutions#logistics", icon: Network }
      ],
      featured: {
        title: "Single Accountable Partner",
        desc: "We design, deploy, and manage the entire technology ecosystem.",
        cta: "Explore Solutions",
        href: "/solutions"
      }
    },
    "Industries": {
      title: "Industries We Support",
      desc: "Specialized IT services customized to regulatory and operational needs.",
      link: "/industries",
      items: [
        { title: "Corporate & Financial", desc: "Fintech security, ISO 27001, banking compliance", href: "/industries#finance", icon: Building2 },
        { title: "Healthcare & Medical", desc: "EMR systems, clinic networking & data security", href: "/industries#healthcare", icon: ShieldCheck },
        { title: "Education & Schools", desc: "Smart classrooms, campus Wi-Fi & filtering", href: "/industries#education", icon: Laptop },
        { title: "Construction & Engineering", desc: "Site offices, satellite links & CAD workstations", href: "/industries#construction", icon: Wrench },
        { title: "Hospitality & Tourism", desc: "High-density guest Wi-Fi & PMS integrations", href: "/industries#hospitality", icon: Zap }
      ],
      featured: {
        title: "UAE Regulatory Compliance",
        desc: "Aligned with TDRA, NESA, Dubai Health Authority, and SIRA standards.",
        cta: "View Industry Matrix",
        href: "/industries"
      }
    }
  };

  megaMenus.Services = {
    ...megaMenus["IT Services"],
    title: "IT & Managed Services",
    link: "/book-support",
    items: [...megaMenus["IT Services"].items, ...megaMenus["Managed Services"].items]
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/book-support", mega: "Services" },
    { label: "Data Center", href: "/data-center", mega: "Data Center" },
    { label: "Shop Electronics", href: "/shop", mega: "Shop Electronics" },
    { label: "Rent Equipment", href: "/rent", mega: "Rent Equipment" },
    { label: "AMC", href: "/amc", mega: "AMC" },
    { label: "Business Solutions", href: "/solutions", mega: "Business Solutions" },
    { label: "Industries", href: "/industries", mega: "Industries" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm transition-all">
        {/* Top Header Bar */}
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-1.5 font-extrabold tracking-tight text-slate-900 transition hover:opacity-95">
              <span className="text-2xl font-black tracking-tighter text-[#09482e] sm:text-3xl">
                Wefy<span className="text-[#00a86b]">x</span>
              </span>
              <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:inline-block">
                .PRO
              </span>
            </a>
            <span className="hidden text-xs text-slate-400 2xl:inline-block">
              Smarter IT. Stronger Business.
            </span>
          </div>

          {/* Center Search Bar */}
          <div className="relative hidden min-w-0 max-w-md flex-1 md:block">
            <div
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs text-slate-400 transition hover:border-slate-300 hover:bg-white"
            >
              <Search size={16} className="text-slate-400" />
              <span className="truncate">Search services, equipment, rentals, solutions...</span>
              <kbd className="ml-auto hidden rounded bg-slate-200/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 lg:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* UAE Location Dropdown */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <MapPin size={14} className="text-emerald-600" />
                <span>{selectedLocation}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {locationOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {["Dubai, UAE", "Abu Dhabi, UAE", "Sharjah, UAE", "Northern Emirates"].map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setLocationOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                        selectedLocation === loc
                          ? "bg-emerald-50 font-bold text-emerald-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Support Link */}
            <a
              href="/contact"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 xl:flex"
            >
              <Headphones size={14} className="text-emerald-600" />
              <span>Support</span>
            </a>

            {/* AI Quotation Button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenQuote) onOpenQuote();
                else setShowAiModal(true);
              }}
              className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 xl:flex"
            >
              <Sparkles size={13} className="text-emerald-600" />
              <span>Request Quote</span>
            </button>

            {/* Cart Icon with Live Badge */}
            <a
              href="/cart"
              className="relative grid h-9 w-9 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Shopping and Rental Cart"
            >
              <ShoppingCart size={18} />
              {liveCartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-sm">
                  {liveCartCount}
                </span>
              )}
            </a>

            {sessionUser?.role === "CUSTOMER" ? <div className="relative">
              <button type="button" onClick={() => setAccountOpen(!accountOpen)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-300">
                <span className="grid h-7 w-7 overflow-hidden place-items-center rounded-lg bg-emerald-100 text-emerald-800">{profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full object-cover"/> : sessionUser.name?.[0]?.toUpperCase()}</span>
                <span className="hidden max-w-28 truncate sm:block">{sessionUser.name}</span><ChevronDown size={13}/>
              </button>
              {accountOpen && <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <div className="border-b px-3 py-2"><b className="block truncate text-xs">{sessionUser.name}</b><small className="block truncate text-[10px] text-slate-500">{sessionUser.email}</small></div>
                <a href="/account" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-50"><UserRound size={14}/>My account</a>
                <a href="/account/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-50"><ShoppingCart size={14}/>Orders</a>
                <a href="/account/requirements" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-50"><ClipboardList size={14}/>Requirements</a>
                <a href="/account/tickets" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Headphones size={14}/>Support</a>
                <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={14}/>Sign out</button>
              </div>}
            </div> : sessionUser ? <a href="/portal" className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:flex"><UsersRound size={14}/>Portal</a> : <>
              <a href="/login" className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex"><UsersRound size={14}/><span>Sign In</span></a>
              <a href="/register" className="inline-flex items-center gap-1.5 rounded-xl bg-[#00a86b] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#008c59] hover:shadow"><span>Get Started</span><ArrowRight size={14}/></a>
            </>}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 xl:hidden"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Secondary Navigation Bar with Dropdowns / Mega Menus (Desktop) */}
        <div className="relative hidden border-t border-slate-100 bg-slate-50/70 xl:block">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1">
              {navLinks.map((item) => {
                const isMega = !!item.mega && megaMenus[item.mega];
                const isActive = currentPath === item.href ||
                  (item.label === "Services" && currentPath.startsWith("/book-support/"));

                return (
                  <div
                    key={item.label}
                    className="static"
                    onFocus={() => isMega && setActiveMega(item.mega)}
                    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveMega(null); }}
                    onKeyDown={(event) => { if (event.key === "Escape") setActiveMega(null); }}
                    onMouseEnter={() => isMega && setActiveMega(item.mega)}
                    onMouseLeave={() => isMega && setActiveMega(null)}
                  >
                    <a
                      href={item.href}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-white font-bold text-emerald-700 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-700 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isMega && <ChevronDown size={11} className={`text-slate-400 transition-transform ${activeMega === item.mega ? "rotate-180" : ""}`} />}
                    </a>

                    {/* Mega Menu Popup */}
                    {isMega && activeMega === item.mega && (
                      <div className="absolute left-1/2 top-full z-50 w-[min(900px,calc(100vw-48px))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition-all">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-bold text-slate-900">{megaMenus[item.mega].title}</h4>
                            <p className="text-[11px] text-slate-500">{megaMenus[item.mega].desc}</p>
                          </div>
                          <a
                            href={megaMenus[item.mega].link}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            <span>View All</span>
                            <ArrowRight size={13} />
                          </a>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {megaMenus[item.mega].items.map((sub) => {
                            const IconComponent = sub.icon;
                            return (
                              <a
                                key={sub.title}
                                href={sub.href}
                                className="group flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                              >
                                <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                                  <IconComponent size={16} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                                    {sub.title}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                                    {sub.desc}
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                        </div>

                        {/* Mega Menu Footer Callout */}
                        {megaMenus[item.mega].featured && (
                          <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-emerald-950 p-3 text-white">
                            <div>
                              <div className="text-xs font-bold text-white">{megaMenus[item.mega].featured.title}</div>
                              <div className="text-[10px] text-slate-300">{megaMenus[item.mega].featured.desc}</div>
                            </div>
                            <a
                              href={megaMenus[item.mega].featured.href}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                            >
                              <span>{megaMenus[item.mega].featured.cta}</span>
                              <ArrowRight size={12} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 text-xs">
              <a
                href="/book-support"
                className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Wrench size={13} />
                <span>Book Site Visit</span>
              </a>
              <span className="text-slate-300">|</span>
              <a href="tel:+97141234567" className="font-semibold text-slate-600 hover:text-slate-900">
                +971 4 123 4567
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-[60px] z-50 max-h-[calc(100vh-60px)] overflow-y-auto border-b border-slate-200 bg-white p-5 shadow-2xl xl:hidden">
            {/* Search Input */}
            <div className="mb-4 flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-600">
              <Search size={16} className="text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, products, rentals..."
                className="w-full bg-transparent outline-none"
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAiModal(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-700"
              >
                <Sparkles size={14} /> AI Quotation
              </button>
              <a
                href="/book-support"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-800"
              >
                <Wrench size={14} /> Site Visit
              </a>
            </div>

            {/* Mobile Nav Links */}
            <nav id="mobile-navigation" className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span>{link.label}</span>
                  <ArrowRight size={14} className="text-slate-400" />
                </a>
              ))}
            </nav>

            {/* Mobile Footer Links */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <a href={sessionUser?.role === "CUSTOMER" ? "/account" : sessionUser ? "/portal" : "/login"} className="font-bold text-slate-900">{sessionUser?.role === "CUSTOMER" ? "My Account" : sessionUser ? "Open Portal" : "Sign In"}</a>
                <a href="tel:+97141234567" className="font-bold text-emerald-700">+971 4 123 4567</a>
              </div>
            </div>
          </div>
        )}

        {/* Global Live Search Overlay */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-16 sm:p-6 sm:pt-20" role="dialog">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center border-b border-slate-200 px-4 py-3">
                <Search size={18} className="text-slate-400 mr-2" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search services, IT equipment, data centers, AMC..."
                  className="w-full text-sm outline-none text-slate-800 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-3">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between rounded-xl p-3 transition hover:bg-slate-50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{item.title}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                              {item.cat}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">{item.desc}</div>
                        </div>
                        <ArrowRight size={14} className="text-slate-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No matching services or equipment found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <AIQuotationModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
      <SiteVisitModal isOpen={showVisitModal} onClose={() => setShowVisitModal(false)} />
    </>
  );
}
