import { ArrowLeft, CreditCard, FileText, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const pages = {
  terms: {
    title: "Terms of Service",
    eyebrow: "Website and account terms",
    intro: "These terms explain how customers use Wefyx.pro for IT services, rentals, purchases, support requests and account features.",
    items: [
      [ShieldCheck, "Account responsibility", "Customers must keep account access secure and make sure company, contact, billing and delivery details are accurate."],
      [CreditCard, "Payments and invoices", "Orders may be paid by approved UAE payment methods, bank transfer, card on delivery, cash on delivery or payment link. Payment is confirmed only after review or successful settlement."],
      [Truck, "Delivery and service access", "Customers must provide safe access, accurate address details and an authorized contact for equipment delivery, installation or support visits."],
      [FileText, "Order changes", "Wefyx may confirm availability, substitute equivalent equipment with customer approval, or cancel orders that cannot be fulfilled."],
    ],
  },
  rental: {
    title: "Rental Terms",
    eyebrow: "Equipment rental policy",
    intro: "Rental equipment remains Wefyx property and must be returned in working condition with accessories, chargers, adapters and supplied items.",
    items: [
      [FileText, "Rental period", "Rental duration, renewal and return timing are confirmed on the order or quotation. Late returns may extend billing."],
      [ShieldCheck, "Security deposit", "A refundable security deposit may be collected separately and returned after equipment inspection and clearance of dues."],
      [Truck, "Delivery and pickup", "Delivery, installation, pickup and site access are coordinated with the customer contact and may depend on location and availability."],
      [RotateCcw, "Damage or missing items", "Repair, replacement, cleaning or missing accessory costs may be deducted from the deposit or billed separately."],
    ],
  },
  refund: {
    title: "Refund Policy",
    eyebrow: "Cancellations, deposits and refunds",
    intro: "Refunds are reviewed against order status, payment method, service work completed, delivery progress and equipment condition.",
    items: [
      [RotateCcw, "Order cancellation", "Orders cancelled before dispatch are normally eligible for refund after deducting any approved non-refundable service or processing costs."],
      [Truck, "After dispatch", "Delivery, installation, used rental days and completed support services may be deducted from refunds once fulfillment has started."],
      [ShieldCheck, "Security deposit return", "Refundable deposits are returned after inspection, return of all supplied items and settlement of outstanding dues."],
      [CreditCard, "Refund timing", "Approved refunds are processed to the original method or by bank transfer where applicable. Bank and provider timelines may vary."],
    ],
  },
};

export default function TrustPolicyPage({ type = "terms" }) {
  const page = pages[type] || pages.terms;
  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <div className="border-b border-white/10 bg-[#062d1c] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
      <a href="/" className="flex items-center gap-3" aria-label="Wefyx home"><div className="text-3xl font-black tracking-[-.08em] text-[#76eebc]">W</div><div><div className="text-xl font-bold">Wefyx<span className="text-emerald-400">.</span>pro</div><div className="text-[10px] text-emerald-100/65">IT Support & Rental Platform</div></div></a>
      <a href="/" className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/10"><ArrowLeft size={15}/> Back home</a>
    </div></div>
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <section className="rounded-3xl bg-[#0a3b27] px-6 py-9 text-white shadow-xl sm:px-10 sm:py-12"><div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"><ShieldCheck size={15}/>{page.eyebrow}</div><h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-100/75">{page.intro}</p><p className="mt-5 text-xs font-medium text-emerald-100/55">Effective and last updated: October 8, 2026</p></section>
      <div className="mt-8 grid gap-5 md:grid-cols-2">{page.items.map(([Icon,title,copy])=><section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon size={20}/></span><h2 className="text-lg font-bold text-slate-900">{title}</h2></div><p className="mt-4 text-sm leading-7 text-slate-600">{copy}</p></section>)}</div>
      <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 sm:p-8"><h2 className="text-lg font-bold text-slate-900">Need clarification?</h2><p className="mt-3 text-sm leading-7 text-slate-600">For order, rental or refund questions, contact <a className="font-semibold text-emerald-700 underline underline-offset-2" href="mailto:support@wefyx.pro">support@wefyx.pro</a>. Contract or quotation-specific terms override these general website terms where they differ.</p></section>
    </main>
  </div>;
}
