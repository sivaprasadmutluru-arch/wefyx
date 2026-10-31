import { useEffect, useState, useRef } from "react";
import { SupportHero } from "./SupportOverview";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Lock,
  Headphones,
  Server,
  Building2,
  Network,
  Laptop,
  CheckCircle2,
  FileText,
  Clock,
  Wrench,
  Sparkles
} from "lucide-react";

export default function HeroSlider({ onOpenQuote, onOpenVisit }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  const slides = [
    { id: "support-booking" },
    {
      id: "managed-it",
      badge: "YOUR TRUSTED IT PARTNER IN THE UAE",
      headlinePrefix: "Complete Managed IT Services",
      headlineHighlight: "For a Smarter, Stronger Business.",
      description:
        "From devices to data centers — we design, deploy, manage and support your entire IT infrastructure so you can focus on what matters most: your business.",
      benefits: [
        { icon: TrendingUp, label: "Reduce IT Costs", sub: "Predictable monthly SLA" },
        { icon: Zap, label: "Improve Productivity", sub: "99.9% uptime target" },
        { icon: Lock, label: "Enhance Security", sub: "EDR & next-gen firewall" },
        { icon: ShieldCheck, label: "Scale with Confidence", sub: "UAE certified engineers" }
      ],
      primaryBtn: { text: "Get a Free Consultation", action: "quote" },
      secondaryBtn: { text: "Explore Managed Services", href: "/services" },
      image: "/images/home-hero-reference.png",
      panelTitle: "BUILDING THE DIGITAL FOUNDATION FOR TOMORROW",
      panelItems: [
        "Data Centers",
        "Cloud Infrastructure",
        "Managed IT Services",
        "Cybersecurity",
        "IT Support",
        "AMC & IT Lifecycle Management"
      ],
      footerText: "SECURE · RELIABLE · ALWAYS ON"
    },
    {
      id: "data-center",
      badge: "MISSION-CRITICAL INFRASTRUCTURE",
      headlinePrefix: "Design. Build. Operate.",
      headlineHighlight: "Mission-Critical Data Centers.",
      description:
        "Tier III/IV compliant server rooms, civil planning, precision cooling, UPS power systems, structured cabling and 24/7 NOC monitoring across UAE.",
      benefits: [
        { icon: Server, label: "Precision Cooling", sub: "In-row & hot aisle containment" },
        { icon: Zap, label: "Redundant UPS Power", sub: "N+1 & 2N generator backup" },
        { icon: ShieldCheck, label: "Fire Suppression", sub: "FM-200 & NOVEC 1230" },
        { icon: Headphones, label: "24/7 DCIM NOC", sub: "Continuous environmental monitoring" }
      ],
      primaryBtn: { text: "Explore Data Center Solutions", href: "/data-center" },
      secondaryBtn: { text: "Book Site Survey", action: "visit" },
      image: "/images/wefyx-data-center-v2.png",
      panelTitle: "END-TO-END DATA CENTER CAPABILITIES",
      panelItems: [
        "Turnkey Civil & Raised Flooring",
        "Server Racks & Hot/Cold Aisles",
        "Structured Fiber & Copper Cabling",
        "Environmental & Power Monitoring",
        "Access Control & CCTV Surveillance",
        "Migration & Decommissioning"
      ],
      footerText: "TIER III/IV COMPLIANT · HIGH DENSITY"
    },
    {
      id: "it-support",
      badge: "SLA-BACKED 15-MINUTE RESPONSE",
      headlinePrefix: "Your Complete IT Department.",
      headlineHighlight: "Without the Overhead.",
      description:
        "SLA-backed 15-minute response times, certified on-site engineers, remote helpdesk, and dedicated account management for UAE enterprises.",
      benefits: [
        { icon: Clock, label: "15-Min Response SLA", sub: "Fast remote assistance" },
        { icon: Wrench, label: "On-Site Certified Engineers", sub: "Dubai, Abu Dhabi & Sharjah" },
        { icon: Headphones, label: "24/7 Helpdesk", sub: "Always available engineers" },
        { icon: ShieldCheck, label: "Flat-Rate Pricing", sub: "No surprise invoices" }
      ],
      primaryBtn: { text: "Book Site Visit", action: "visit" },
      secondaryBtn: { text: "Talk to Support", href: "/contact" },
      image: "/images/home-support-hero.png",
      panelTitle: "ENTERPRISE SUPPORT CAPABILITIES",
      panelItems: [
        "24/7 Helpdesk & End-User Support",
        "On-Site Engineer Dispatch",
        "Desktop & Laptop Lifecycle",
        "Microsoft 365 & Email Admin",
        "Network & Wi-Fi Troubleshooting",
        "Patch & Vulnerability Management"
      ],
      footerText: "CERTIFIED · RESPONSIVE · RELIABLE"
    },
    {
      id: "cybersecurity",
      badge: "ENTERPRISE SECURITY & CONNECTIVITY",
      headlinePrefix: "Secure. Connected.",
      headlineHighlight: "Always Available.",
      description:
        "Enterprise SD-WAN, Fortinet/Cisco next-gen firewalls, endpoint protection (EDR), vulnerability audits, and proactive threat management.",
      benefits: [
        { icon: Lock, label: "Next-Gen Firewalls", sub: "Fortinet, Cisco & Sophos" },
        { icon: Network, label: "Enterprise SD-WAN", sub: "High availability multi-WAN" },
        { icon: ShieldCheck, label: "EDR & Antivirus", sub: "Behavioral threat defense" },
        { icon: Zap, label: "Compliance Audits", sub: "NESA & ISO 27001 aligned" }
      ],
      primaryBtn: { text: "Request Security Audit", action: "quote" },
      secondaryBtn: { text: "Explore Network Solutions", href: "/services#network" },
      image: "/images/product-switch.png",
      panelTitle: "CYBER DEFENSE & NETWORKING",
      panelItems: [
        "Next-Generation Firewalls",
        "Endpoint Detection & Response",
        "Zero Trust Remote Access & VPN",
        "Wi-Fi 6 Enterprise Networks",
        "Vulnerability Assessments",
        "Continuous SOC & NOC Monitoring"
      ],
      footerText: "ZERO TRUST · PROACTIVE DEFENSE"
    },
    {
      id: "rental",
      badge: "FLEXIBLE CORPORATE HARDWARE",
      headlinePrefix: "Business Technology.",
      headlineHighlight: "When You Need It.",
      description:
        "Flexible daily, monthly, and annual rental for laptops, workstations, servers, meeting rooms, and event technology with zero upfront capital.",
      benefits: [
        { icon: Laptop, label: "Zero Upfront Capital", sub: "Preserve operational cash" },
        { icon: Zap, label: "Fast UAE Delivery", sub: "Pre-configured & ready to use" },
        { icon: ShieldCheck, label: "Maintenance Included", sub: "Full replacement warranty" },
        { icon: Building2, label: "Short & Long Terms", sub: "Daily, monthly or yearly" }
      ],
      primaryBtn: { text: "Browse Rentals", href: "/rent" },
      secondaryBtn: { text: "Shop Electronics", href: "/shop" },
      image: "/images/rental-hero-reference.png",
      panelTitle: "COMMERCIAL HARDWARE FLEETS",
      panelItems: [
        "Business Laptops",
        "CAD & High-Spec Workstations",
        "Temporary Servers & Networking",
        "Event Displays & Projectors",
        "Video Conference Equipment",
        "Custom Corporate Bundles"
      ],
      footerText: "PRE-LOADED · DELIVERED · SUPPORTED"
    }
  ];

  // Autoplay Timer (6s)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Swipe handlers for mobile touch
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  const current = slides[currentSlide];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#f2fdf8] via-[#f8fefc] to-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Highlights Slider"
    >
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {current.id === "support-booking" ? <SupportHero /> : <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Hero Content (7 Cols) */}
          <div className="lg:col-span-7 xl:col-span-7">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-100/60 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#008553]">
              <Sparkles size={12} className="text-[#008553]" />
              <span>{current.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-[#09482e] sm:text-4xl lg:text-5xl">
              {current.headlinePrefix}{" "}
              <span className="bg-gradient-to-r from-[#008553] to-[#008553] bg-clip-text text-transparent">
                {current.headlineHighlight}
              </span>
            </h1>

            {/* Description */}
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {current.description}
            </p>

            {/* 4 Benefit Badges Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
              {current.benefits.map((b) => {
                const IconComponent = b.icon;
                return (
                  <div
                    key={b.label}
                    className="flex flex-col rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-[#008553]">
                        <IconComponent size={15} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{b.label}</span>
                    </div>
                    <span className="mt-1 text-[10px] text-slate-500 line-clamp-1">{b.sub}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {current.primaryBtn.action === "quote" ? (
                <button
                  type="button"
                  onClick={onOpenQuote}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#008553] px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700 hover:shadow-xl"
                >
                  <span>{current.primaryBtn.text}</span>
                  <ArrowRight size={15} />
                </button>
              ) : current.primaryBtn.action === "visit" ? (
                <button
                  type="button"
                  onClick={onOpenVisit}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00a86b] px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-[#008c59] hover:shadow-xl"
                >
                  <span>{current.primaryBtn.text}</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <a
                  href={current.primaryBtn.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#008553] px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700 hover:shadow-xl"
                >
                  <span>{current.primaryBtn.text}</span>
                  <ArrowRight size={15} />
                </a>
              )}

              {current.secondaryBtn.action === "visit" ? (
                <button
                  type="button"
                  onClick={onOpenVisit}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span>{current.secondaryBtn.text}</span>
                </button>
              ) : (
                <a
                  href={current.secondaryBtn.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span>{current.secondaryBtn.text}</span>
                </a>
              )}
            </div>
          </div>

          {/* Right Hero Visual & Dark Glass Overlay Panel (5 Cols) */}
          <div className="relative lg:col-span-5 xl:col-span-5">
            <div className="relative mx-auto flex max-w-lg items-stretch overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-2xl">
              {/* Background Image of Engineer / Server Room */}
              <img
                src={current.image}
                alt={current.headlinePrefix}
                className="absolute inset-0 h-full w-full object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
              />

              {/* Gradient Scrim for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              {/* Right Side Glass Panel Overlay (Matches Reference Design) */}
              <div className="relative z-10 flex w-full flex-col justify-between p-6 text-white sm:p-7">
                <div>
                  <div className="inline-block rounded-md bg-emerald-600/90 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-white shadow">
                    WEFYX ENTERPRISE
                  </div>
                  <h3 className="mt-3 text-lg font-black tracking-tight text-white sm:text-xl">
                    {current.panelTitle}
                  </h3>
                  <div className="mt-4 space-y-2 border-t border-white/15 pt-3">
                    {current.panelItems.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs font-medium text-slate-200">
                        <CheckCircle2 size={13} className="text-[#00a86b] flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-3 text-[10px] font-bold tracking-wider text-emerald-300">
                  {current.footerText}
                </div>
              </div>
            </div>
          </div>
        </div>

        }
        {/* Slider Controls & Indicators */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 pt-4">
          {/* Slide Dots */}
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === idx
                    ? "w-8 bg-[#008553]"
                    : "w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* Prev / Next Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Next Slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
