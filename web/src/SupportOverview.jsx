import { useEffect, useState } from "react";
import { ArrowRight, Bell, CreditCard, MapPin, MonitorCheck, ShieldCheck, TicketCheck, UserCheck, UserRound, Wrench, Zap } from "lucide-react";
import { get } from "./api";
import "./support-overview.css";

export function SupportHero() {
  return <section className="support-hero" aria-label="IT support services">
    <img src="/images/home-support-hero.png" alt="Wefyx IT engineer providing support at an office workstation" fetchPriority="high" />
    <div className="support-hero-copy">
      <p className="support-eyebrow">IT Support Services</p>
      <h1>Professional IT Support<br />When You Need It</h1>
      <p>Book a service and get expert support at your office or remotely.</p>
      <a className="support-action" href="/book-support">Book a Support Service <ArrowRight size={18} /></a>
    </div>
  </section>;
}

const steps = [
  [UserCheck, "Choose Service", "Select the support type you need."],
  [CreditCard, "Book & Pay", "Choose a time and confirm your payment."],
  [TicketCheck, "Get Confirmed", "Track your booking and engineer assignment."],
  [Bell, "Support & Update", "Receive support and view your service report."]
];
const benefits = [
  [ShieldCheck, "Expert Engineers", "Certified & experienced"],
  [Zap, "Fast Response", "On-site & remote assistance"],
  [CreditCard, "Transparent Pricing", "Review the fee before payment"],
  [MapPin, "UAE Wide Coverage", "Support where you need it"]
];

export default function SupportOverview() {
  const [services,setServices]=useState([]);
  useEffect(()=>{let active=true;get("/bookings/catalog").then(catalog=>{if(active)setServices(catalog.services||[])}).catch(()=>{});return()=>{active=false}},[]);
  const options=services.map(service=>[service.code,service.code==="REMOTE"?MonitorCheck:service.code==="SITE_VISIT"?UserRound:Wrench,service.name,service.description,`AED ${Number(service.amount).toFixed(2)} incl. VAT`]);
  return <section className="support-overview" aria-label="Book and track IT support">
    <div className="support-options">
      {options.map(([type, Icon, title, description, price]) => <a className="support-option" href={`/book-support?type=${type}`} key={type}>
        <span className="support-icon"><Icon size={26} aria-hidden="true" /></span>
        <h2>{title}</h2><p>{description}</p>
        <span className="support-link">{price ? `${price} · Book support` : "Book support"} <ArrowRight size={16} aria-hidden="true" /></span>
      </a>)}
    </div>
    <div className="support-process">
      <h2>How It Works <ArrowRight size={26} aria-hidden="true" /></h2>
      <ol>{steps.map(([Icon, title, description], index) => <li key={title}>
        <span className="support-icon"><Icon size={24} aria-hidden="true" /></span>
        <div className="support-step"><span>{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></div>
      </li>)}</ol>
    </div>
    <div className="support-benefits"><h2>Why Choose Wefyx?</h2>
      <div>{benefits.map(([Icon, title, description]) => <article key={title}>
        <span className="support-icon"><Icon size={24} aria-hidden="true" /></span>
        <h3>{title}</h3><p>{description}</p>
      </article>)}</div>
    </div>
    <div className="support-tracking"><div><h3>Support that keeps you informed</h3><p>Follow your ticket from engineer assignment to completion, then view your service report.</p></div><a href="/my-tickets">View My Tickets <ArrowRight size={17} aria-hidden="true" /></a></div>
  </section>;
}
