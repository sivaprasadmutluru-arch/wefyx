import { useEffect, useState, useRef } from "react";
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  FileText,
  Flame,
  Globe2,
  GraduationCap,
  HardHat,
  Headphones,
  HeartPulse,
  Hotel,
  Landmark,
  Laptop,
  Lock,
  MapPin,
  Monitor,
  MonitorCheck,
  Network,
  Package,
  Phone,
  Power,
  Printer,
  RefreshCw,
  Scale,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Thermometer,
  TrendingUp,
  Truck,
  UserCheck,
  UserRound,
  UsersRound,
  UtensilsCrossed,
  Warehouse,
  Wifi,
  Wrench,
  Zap
} from "lucide-react";
import UnifiedHeader from "./UnifiedHeader";
import HeroSlider from "./HeroSlider";
import SupportOverview from "./SupportOverview";
import AIQuotationModal from "./AIQuotationModal";
import SiteVisitModal from "./SiteVisitModal";
import { PublicFooter } from "./RentalPages";
import { get } from "./api";
import "./home.css";

export default function ServiceWebsite() {
  const [showAiModal, setShowAiModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [catalog, setCatalog] = useState(null);

  // Animated counters state
  const [countersVisible, setCountersVisible] = useState(false);
  const trustSectionRef = useRef(null);

  useEffect(() => {
    let active = true;
    get("/bookings/catalog")
      .then((val) => {
        if (active) setCatalog(val);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Intersection observer for counters
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    if (trustSectionRef.current) {
      observer.observe(trustSectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 10 Horizontal Service Icons
  const serviceStripItems = [
    { title: "Managed IT Services", href: "/services", icon: Building2, color: "text-emerald-600 bg-emerald-50" },
    { title: "Data Center Construction", href: "/data-center", icon: Server, color: "text-emerald-600 bg-emerald-50" },
    { title: "IT Support & Helpdesk", href: "/services#helpdesk", icon: Headphones, color: "text-emerald-600 bg-emerald-50" },
    { title: "Cloud & Infrastructure", href: "/services#cloud", icon: Zap, color: "text-emerald-600 bg-emerald-50" },
    { title: "Cybersecurity", href: "/services#cybersecurity", icon: ShieldCheck, color: "text-rose-600 bg-rose-50" },
    { title: "Network & Wi-Fi", href: "/services#network", icon: Network, color: "text-emerald-600 bg-emerald-50" },
    { title: "CCTV & Security", href: "/services#cctv", icon: Lock, color: "text-amber-600 bg-amber-50" },
    { title: "Biometric & Access", href: "/services#biometric", icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
    { title: "Rent IT Equipment", href: "/rent", icon: Laptop, color: "text-teal-600 bg-teal-50" },
    { title: "Shop Electronics", href: "/shop", icon: ShoppingCart, color: "text-emerald-600 bg-emerald-50" }
  ];

  // Core Managed Services (6 Cards)
  const coreServices = [
    {
      title: "IT Support & Helpdesk",
      desc: "Comprehensive remote and on-site user support with strict SLA commitments.",
      icon: Headphones,
      color: "from-emerald-600 to-emerald-700",
      items: [
        "Remote & On-Site Certified Engineers",
        "24/7/365 Multi-Tier IT Helpdesk",
        "Desktop, Laptop & Mobile Management",
        "Incident & Service Request Management",
        "SLA-Based Guaranteed 15-Min Response"
      ]
    },
    {
      title: "Network & Infrastructure",
      desc: "Robust high-performance connectivity engineered for zero downtime.",
      icon: Network,
      color: "from-emerald-600 to-emerald-700",
      items: [
        "Enterprise SD-WAN & Multi-WAN Failover",
        "Cisco, Aruba & Fortinet Switch Stacking",
        "High-Density Wi-Fi 6 / 6E Deployments",
        "Structured CAT6A & Optical Fiber Cabling",
        "Real-Time Bandwidth & Latency Monitoring"
      ]
    },
    {
      title: "Cloud & Microsoft 365",
      desc: "Modern cloud environments providing scalability and secure remote collaboration.",
      icon: Zap,
      color: "from-emerald-600 to-emerald-600",
      items: [
        "Microsoft 365 & Exchange Online Migration",
        "Azure & AWS Cloud Infrastructure Setup",
        "Active Directory & Entra ID Hybrid Sync",
        "Virtual Servers & Containerized Workloads",
        "Continuous Cloud Cost & Health Optimization"
      ]
    },
    {
      title: "Cybersecurity & EDR",
      desc: "Multi-layered defense protecting endpoints, networks, and confidential data.",
      icon: ShieldCheck,
      color: "from-rose-600 to-emerald-800",
      items: [
        "Next-Generation Firewalls (Fortinet / Sophos)",
        "Endpoint Detection & Response (EDR / XDR)",
        "MFA, Zero-Trust Access & Encrypted VPN",
        "Vulnerability Scanning & Patch Management",
        "Compliance Audits (NESA, ISO 27001, DHA)"
      ]
    },
    {
      title: "Data Center Services",
      desc: "Turnkey design, civil execution, cooling, and 24/7 mission-critical operations.",
      icon: Server,
      color: "from-emerald-600 to-slate-900",
      items: [
        "Tier III/IV Server Room Civil Architecture",
        "In-Row Precision Cooling & Hot/Cold Aisles",
        "Redundant N+1 UPS & Generator Integration",
        "FM-200 & NOVEC 1230 Fire Suppression",
        "24/7 DCIM NOC Telemetry & Monitoring"
      ]
    },
    {
      title: "AMC & Asset Lifecycle",
      desc: "Predictable maintenance contracts and complete IT asset tracking.",
      icon: Boxes,
      color: "from-emerald-600 to-teal-800",
      items: [
        "Comprehensive & Non-Comprehensive AMC",
        "Scheduled Monthly Preventive Maintenance",
        "Hardware Tagging, Warranty & Lifecycle",
        "Standby Replacement Hardware Included",
        "Dedicated UAE Technical Account Manager"
      ]
    }
  ];

  // Extended Services (7 Categories)
  const extendedCategories = [
    {
      title: "Managed Endpoint Services",
      icon: Laptop,
      items: ["PC & Laptop Management", "Patch Updates", "Antivirus / EDR", "Device Monitoring", "Remote Management", "OS & App Deployment"]
    },
    {
      title: "Managed Server Services",
      icon: Server,
      items: ["Windows Server", "Linux Server", "Active Directory / DNS", "Virtualization (VMware/Hyper-V)", "Backup & Disaster Recovery", "Server Health Telemetry"]
    },
    {
      title: "Managed Network Services",
      icon: Network,
      items: ["Routers & Switches", "Access Points", "Firewalls & VPNs", "Bandwidth Monitoring", "Network Health Audits", "24/7 Outage Alerts"]
    },
    {
      title: "Microsoft Services",
      icon: Zap,
      items: ["Microsoft 365", "Exchange Online", "SharePoint & OneDrive", "Microsoft Teams", "Azure AD / Entra ID", "License Management"]
    },
    {
      title: "Backup & Disaster Recovery",
      icon: ShieldCheck,
      items: ["Immutable Cloud Backup", "Local NAS Backup", "Database Backup", "Disaster Recovery Testing", "Ransomware Rollback", "Business Continuity"]
    },
    {
      title: "IT Asset Management",
      icon: Boxes,
      items: ["Asset Registration & QR", "Employee Tracking", "Warranty Management", "Repair History", "Hardware Lifecycle", "Secure E-Waste Disposal"]
    },
    {
      title: "24/7 NOC Monitoring",
      icon: Headphones,
      items: ["24/7 Infrastructure NOC", "Application Monitoring", "Server Load Alerts", "Firewall Uptime", "Automated Escalation", "Incident Reports"]
    }
  ];

  // 12 Industries
  const industries = [
    { title: "Corporate Offices", icon: Building2, desc: "End-to-end IT, Wi-Fi 6, 365 & helpdesk" },
    { title: "Hospitality & Hotels", icon: Hotel, desc: "High-density guest Wi-Fi, IP-PBX & POS" },
    { title: "Healthcare & Clinics", icon: HeartPulse, desc: "DHA compliance, PACS & immutable backup" },
    { title: "Retail & Multi-Branch", icon: Store, desc: "Central SD-WAN, POS & remote CCTV" },
    { title: "Education & Campus", icon: GraduationCap, desc: "Smart classroom Wi-Fi & content filters" },
    { title: "Warehousing & Logistics", icon: Warehouse, desc: "Industrial Wi-Fi & handheld scanners" },
    { title: "Construction & Sites", icon: HardHat, desc: "Site trailer trailers & CAD workstations" },
    { title: "Manufacturing", icon: Wrench, desc: "Factory network resilience & SCADA security" },
    { title: "Real Estate", icon: Building2, desc: "Cloud ERP, VPN & smart showroom displays" },
    { title: "Restaurants & F&B", icon: UtensilsCrossed, desc: "Cloud POS, kitchen displays & guest portal" },
    { title: "Financial & Banking", icon: Landmark, desc: "ISO 27001, DLP, zero trust & audit trails" },
    { title: "Public & Enterprise", icon: Scale, desc: "TDRA aligned, sovereign & high availability" }
  ];

  const featuredReviews = [
    {
      name: "Aisha Rahman",
      role: "Operations Director",
      company: "Dubai Healthcare Group",
      rating: 5,
      service: "Managed IT",
      review: "Wefyx stabilized our support queue in the first month and gave our team clear SLA reporting."
    },
    {
      name: "Khalid Mansoor",
      role: "IT Manager",
      company: "Emirates Retail Co.",
      rating: 4.9,
      service: "Network & Wi-Fi",
      review: "Their engineers handled our multi-branch network upgrade cleanly with almost no disruption."
    },
    {
      name: "Neha Iyer",
      role: "Founder",
      company: "Studio North",
      rating: 4.8,
      service: "Equipment Rental",
      review: "Fast rental delivery, neat setup, and responsive support whenever our team needed changes."
    },
    {
      name: "Omar Siddiq",
      role: "Facilities Lead",
      company: "Al Noor Offices",
      rating: 4.6,
      service: "AMC",
      review: "Reliable preventive maintenance and clear follow-up after every visit."
    }
  ];

  const [reviews, setReviews] = useState(featuredReviews);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    company: "",
    service: "Managed IT",
    rating: "5",
    review: ""
  });
  const [reviewNotice, setReviewNotice] = useState("");

  const visibleReviews = reviews
    .filter((item) => Number(item.rating) >= 4.7)
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 6);

  const averageRating = visibleReviews.length
    ? visibleReviews.reduce((sum, item) => sum + Number(item.rating), 0) / visibleReviews.length
    : 0;

  const updateReviewForm = (field) => (event) => {
    setReviewForm((current) => ({ ...current, [field]: event.target.value }));
    setReviewNotice("");
  };

  const submitReview = (event) => {
    event.preventDefault();
    const ratingValue = Number(reviewForm.rating);
    const nextReview = {
      name: reviewForm.name.trim(),
      role: "Verified Customer",
      company: reviewForm.company.trim() || "Wefyx Customer",
      service: reviewForm.service,
      rating: ratingValue,
      review: reviewForm.review.trim()
    };
    setReviews((current) => [nextReview, ...current]);
    setReviewForm({ name: "", company: "", service: "Managed IT", rating: "5", review: "" });
    setReviewNotice(
      ratingValue >= 4.7
        ? "Thanks for the review. It is now visible in the top-rated customer cards."
        : "Thanks for the feedback. Lower ratings are recorded but not shown on the public homepage."
    );
  };

  // Animated Counter Helper
  const CounterNumber = ({ target, suffix = "" }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (!countersVisible) return;
      let start = 0;
      const duration = 1800;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = target / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, stepTime);
      return () => clearInterval(timer);
    }, [countersVisible, target]);

    return (
      <span>
        {count.toLocaleString()}
        {suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header with Top Bar, Search, Location, Cart, Sign In, Get Started, Second Nav & Mega Menus */}
      <UnifiedHeader
        onOpenQuote={() => setShowAiModal(true)}
        onOpenVisit={() => setShowVisitModal(true)}
      />

      <main id="main-content">
        {/* 2. Hero Section with 5-Slide Slider (Slide 1 visually dominant with dark glass panel) */}
        <HeroSlider
          onOpenQuote={() => setShowAiModal(true)}
          onOpenVisit={() => setShowVisitModal(true)}
        />

        {/* 3. Horizontal Service Icon Strip (10 across on desktop / scroll on mobile) */}
        <SupportOverview />
        <section className="border-y border-slate-200/80 bg-white py-6" aria-label="Quick Service Directory">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
              {serviceStripItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className="group flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm"
                  >
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${item.color} group-hover:scale-110 transition-transform shadow-xs`}>
                      <IconComponent size={20} />
                    </div>
                    <span className="mt-2 text-[11px] font-bold leading-tight text-slate-700 group-hover:text-emerald-800 line-clamp-2">
                      {item.title}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Data Center Hero Section (Visually Powerful) */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#063521] via-[#073d26] to-[#063521] py-16 text-white lg:py-20">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#008553_1px,transparent_1px)] [background-size:24px_24px]" />
          
          <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              {/* Left Copy */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <Server size={14} /> DATA CENTER SOLUTIONS · DESIGN. BUILD. OPERATE.
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  End-to-End Data Center Services
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  From strategy and design to construction, deployment, and ongoing management — Wefyx delivers secure, scalable, and high-performance data center solutions for modern businesses across Dubai and the UAE.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href="/data-center"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-bold text-[#09482e] shadow-lg transition hover:bg-slate-100 hover:shadow-xl"
                  >
                    <span>Explore Data Center Solutions</span>
                    <ArrowRight size={15} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowVisitModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <span>Book Site Survey (AED 105)</span>
                  </button>
                </div>
              </div>

              {/* Right Feature Panel */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-white/15 bg-slate-900/90 p-6 backdrop-blur-md shadow-2xl">
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    MISSION-CRITICAL CAPABILITIES
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      "Data Center Design & Build (Tier III/IV)",
                      "Power & Precision Cooling Systems",
                      "Network & High-Density Fiber Infrastructure",
                      "24/7 NOC Monitoring & DCIM Management",
                      "Workload Migration & Modernization"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-xs font-medium text-slate-200">
                        <CheckCircle2 size={16} className="text-[#00a86b] flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] font-extrabold tracking-wider text-emerald-300">
                    <span>Scalable.</span>
                    <span>Secure.</span>
                    <span>Always On.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Three Business Division Cards (Managed IT Dominant) */}
        <section className="py-14 lg:py-18">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Card 1: Buy Electronics */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 p-7 shadow-sm transition hover:border-emerald-300 hover:shadow-xl">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                    CARD 1 · SALES
                  </span>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">BUY ELECTRONICS</h3>
                  <p className="mt-1 text-xs font-bold text-emerald-700">Latest Technology for Your Business</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    Laptops, desktops, servers, networking switches, firewalls, CCTV cameras, accessories, and enterprise technology.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {["Laptops", "Servers", "Networking", "CCTV", "Screens"].map((t) => (
                      <span key={t} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="/shop"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
                  >
                    <span>Shop Now</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Card 2: Rent Equipment */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 p-7 shadow-sm transition hover:border-emerald-300 hover:shadow-xl">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                    CARD 2 · RENTALS
                  </span>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">RENT EQUIPMENT</h3>
                  <p className="mt-1 text-xs font-bold text-emerald-700">Flexible Rentals for Every Need</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    Short-term and long-term electronics rentals for companies, remote teams, project offices, and events.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {["Laptop", "Desktop", "Monitor", "Printer", "Servers"].map((t) => (
                      <span key={t} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="/rent"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
                  >
                    <span>Rent Now</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Card 3: Managed IT Services (Visually Dominant!) */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-700 bg-gradient-to-br from-emerald-950 to-emerald-900 p-7 pt-14 text-white shadow-xl transition hover:shadow-2xl">
                <div className="absolute right-4 top-4 rounded-full bg-[#00a86b] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow">
                  PRIMARY IDENTITY
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
                    CARD 3 · CORE CAPABILITY
                  </span>
                  <h3 className="mt-1 text-2xl font-black text-white">MANAGED IT SERVICES</h3>
                  <p className="mt-1 text-xs font-bold text-emerald-300">Your Complete IT Department</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-200">
                    Proactive, secure, and reliable IT infrastructure management at a predictable flat-rate monthly cost. Full 24/7 SLA backing.
                  </p>
                  <div className="mt-4 space-y-1.5 border-t border-white/15 pt-3">
                    {["24/7 Helpdesk & Ticket Management", "Certified On-Site Engineers UAE Wide", "Endpoint & Server Maintenance", "Enterprise Cybersecurity & Backup"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-[11px] text-slate-200">
                        <CheckCircle2 size={13} className="text-[#00a86b]" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="/services"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00a86b] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-[#008c59]"
                  >
                    <span>Learn More &amp; Get Started</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Business Trust Section with Animated Counters & Partner Logos */}
        <section
          ref={trustSectionRef}
          className="border-y border-slate-200 bg-slate-50 py-14"
          aria-label="Business Trust and Credentials"
        >
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="text-3xl font-black text-[#09482e] sm:text-4xl">
                  <CounterNumber target={250} suffix="+" />
                </div>
                <div className="mt-1 text-xs font-bold text-slate-600">Business Clients</div>
                <div className="text-[10px] text-slate-400">Across UAE Enterprises</div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="text-3xl font-black text-[#09482e] sm:text-4xl">
                  <CounterNumber target={150} suffix="+" />
                </div>
                <div className="mt-1 text-xs font-bold text-slate-600">IT Projects Delivered</div>
                <div className="text-[10px] text-slate-400">On Time &amp; On Budget</div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="text-3xl font-black text-[#008553] sm:text-4xl">
                  <span>99.9%</span>
                </div>
                <div className="mt-1 text-xs font-bold text-slate-600">Uptime Commitment</div>
                <div className="text-[10px] text-slate-400">SLA-Backed Infrastructure</div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="text-3xl font-black text-[#00a86b] sm:text-4xl">
                  <span>24/7</span>
                </div>
                <div className="mt-1 text-xs font-bold text-slate-600">Support Available</div>
                <div className="text-[10px] text-slate-400">15-Min Response Guarantee</div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="text-3xl font-black text-[#09482e] sm:text-4xl">
                  <span>UAE</span>
                </div>
                <div className="mt-1 text-xs font-bold text-slate-600">Nationwide Coverage</div>
                <div className="text-[10px] text-slate-400">Dubai, Abu Dhabi &amp; Emirates</div>
              </div>
            </div>

            {/* Enterprise Technology Ecosystem */}
            <div className="mt-10 border-t border-slate-200/80 pt-6">
              <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Enterprise Technology Ecosystem &amp; Supported Vendor Architecture
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-bold text-slate-500">
                {["Microsoft Azure", "Cisco Systems", "Dell Technologies", "Fortinet Security", "HP Enterprise", "Lenovo Think", "VMware Cloud", "Ubiquiti UniFi", "Hikvision CCTV", "AWS Cloud"].map((partner) => (
                  <span key={partner} className="rounded-md bg-white border border-slate-200 px-3 py-1.5 shadow-xs">
                    {partner}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. Core Managed IT Services (Major Homepage Section - 6 Cards) */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                END-TO-END CAPABILITIES
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-[#09482e] sm:text-4xl">
                Our Core Managed IT Services
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
                End-to-end IT management to keep your business running, secure, and future-ready.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {coreServices.map((srv) => {
                const IconComponent = srv.icon;
                return (
                  <div
                    key={srv.title}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-emerald-400 hover:shadow-xl"
                  >
                    <div>
                      <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${srv.color} text-white shadow-md`}>
                        <IconComponent size={22} />
                      </div>
                      <h3 className="mt-5 text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition">
                        {srv.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        {srv.desc}
                      </p>

                      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                        {srv.items.map((it) => (
                          <li key={it} className="flex items-center gap-2 text-xs text-slate-700">
                            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-4">
                      <a
                        href="/services#requirement"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <span>Request Service Details</span>
                        <ArrowRight size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. Extended Managed Services (One Technology Partner. Every IT Requirement.) */}
        <section className="bg-slate-50 border-y border-slate-200 py-16 lg:py-24">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                FULL-SPECTRUM COVERAGE
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-[#09482e] sm:text-4xl">
                One Technology Partner. Every IT Requirement.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
                Modular service categories designed to seamlessly integrate with your existing workflows.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {extendedCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                        <IconComponent size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{cat.title}</h3>
                    </div>

                    <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                      {cat.items.map((it) => (
                        <li key={it} className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. Industries We Support */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                SECTOR SPECIFIC ARCHITECTURE
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-[#09482e] sm:text-4xl">
                Industries We Support Across the UAE
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
                Tailored IT solutions adhering to UAE regulations and operational standards.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {industries.map((ind) => {
                const IconComponent = ind.icon;
                return (
                  <a
                    key={ind.title}
                    href="/industries"
                    className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
                  >
                    <div>
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <IconComponent size={18} />
                      </div>
                      <h3 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition">
                        {ind.title}
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                        {ind.desc}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* 10. Customer Reviews & Ratings */}
        <section className="border-y border-slate-200 bg-white py-16 lg:py-20" aria-labelledby="reviews-heading">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                  CUSTOMER RATINGS
                </span>
                <h2 id="reviews-heading" className="mt-2 text-3xl font-extrabold text-[#09482e] sm:text-4xl">
                  Top-Rated Customer Reviews
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Only high-rated public reviews are highlighted here, sorted by rating so the strongest customer feedback appears first.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2 text-3xl font-black text-[#09482e]">
                      {averageRating.toFixed(1)}
                      <Star size={25} className="fill-amber-400 text-amber-400" />
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-600">Average top rating</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-3xl font-black text-[#09482e]">{visibleReviews.length}</div>
                    <p className="mt-1 text-xs font-bold text-slate-600">Featured reviews</p>
                  </div>
                </div>

                <form onSubmit={submitReview} className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900">Add your review</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Name
                      <input
                        required
                        value={reviewForm.name}
                        onChange={updateReviewForm("name")}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                        placeholder="Your name"
                      />
                    </label>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Company
                      <input
                        value={reviewForm.company}
                        onChange={updateReviewForm("company")}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                        placeholder="Company name"
                      />
                    </label>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Service
                      <select
                        value={reviewForm.service}
                        onChange={updateReviewForm("service")}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                      >
                        {["Managed IT", "Data Center", "Network & Wi-Fi", "Equipment Rental", "AMC", "Cybersecurity"].map((service) => (
                          <option key={service}>{service}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Rating
                      <select
                        value={reviewForm.rating}
                        onChange={updateReviewForm("rating")}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                      >
                        {["5", "4.9", "4.8", "4.7", "4.6", "4.5", "4"].map((rating) => (
                          <option key={rating} value={rating}>{rating} stars</option>
                        ))}
                      </select>
                    </label>
                    <label className="sm:col-span-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Review
                      <textarea
                        required
                        rows="4"
                        value={reviewForm.review}
                        onChange={updateReviewForm("review")}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                        placeholder="Share your experience with Wefyx"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700"
                  >
                    <Star size={14} />
                    <span>Submit Review</span>
                  </button>
                  {reviewNotice && (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-700">
                      {reviewNotice}
                    </p>
                  )}
                </form>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {visibleReviews.map((item) => (
                  <article
                    key={`${item.name}-${item.company}-${item.rating}`}
                    className="flex min-h-56 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-0.5 text-amber-400" aria-label={`${item.rating} star rating`}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              size={16}
                              className={index + 1 <= Math.round(item.rating) ? "fill-amber-400" : "text-slate-300"}
                            />
                          ))}
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                          {Number(item.rating).toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-700">
                        "{item.review}"
                      </p>
                    </div>
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <h3 className="text-sm font-extrabold text-slate-900">{item.name}</h3>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {item.role} · {item.company}
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        {item.service}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 11. Dual Action Banners: Site Visit Booking (AED 105) & AI Quotation */}
        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Site Visit Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-8 shadow-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  <Wrench size={12} /> ON-SITE UAE ENGINEERING
                </div>
                <h3 className="mt-3 text-2xl font-black text-slate-900">
                  Need an IT Expert at Your Office?
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Book a site visit with our certified engineer for just <strong>AED 100</strong> (+ 5% VAT = <strong>AED 105</strong>). Get professional advice, physical inspection, network testing, and a detailed recommendation report.
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-emerald-200/60 pt-4">
                  <div>
                    <div className="text-[10px] text-slate-500">Inspection Fee:</div>
                    <div className="text-xl font-black text-emerald-800">AED 105 <span className="text-[10px] font-normal text-slate-500">(incl. VAT)</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVisitModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700"
                  >
                    <span>Book Site Visit</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* AI Quotation Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-8 shadow-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  <Sparkles size={12} /> INSTANT AI ESTIMATOR
                </div>
                <h3 className="mt-3 text-2xl font-black text-slate-900">
                  Get an Instant AI Quotation
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Tell us your requirements and get an AI-assisted IT solution with itemized estimated pricing in minutes. Smart recommendations tailored to your exact user and server count.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Smart Recommendations</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Instant Estimates</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Tailored Solutions</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Save Time &amp; Cost</div>
                </div>

                <div className="mt-6 border-t border-emerald-200/60 pt-4 text-right">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700"
                  >
                    <span>Try AI Quotation</span>
                    <Sparkles size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Unified Global Footer */}
      <PublicFooter />

      {/* Global Action Modals */}
      <AIQuotationModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
      <SiteVisitModal isOpen={showVisitModal} onClose={() => setShowVisitModal(false)} />
    </div>
  );
}
