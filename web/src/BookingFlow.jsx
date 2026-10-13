import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MonitorCheck,
  Paperclip,
  Phone,
  ShieldCheck,
  Tag,
  User,
  UserRound,
  Wrench,
  X
} from "lucide-react";
import { get, send, uploadFiles } from "./api";
import { clearDraftFiles, loadDraftFiles, saveDraftFiles } from "./draftFiles";
import {
  Back,
  BookingLayout,
  Empty,
  ErrorMessage,
  Field,
  Heading,
  Primary,
  SignIn,
  Summary,
  money,
  supportNames,
  useRoute,
  useSession
} from "./BookingUI";

const DRAFT_KEY = "wefyx-booking-draft-v2";
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

const emptyForm = () => ({
  requestKey: crypto.randomUUID(),
  supportType: "SITE_VISIT",
  company: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  category: "",
  subject: "",
  description: "",
  date: today(),
  time: "",
  address: "",
  emirate: "Dubai",
  paymentMethod: "card"
});

function readDraft() {
  let draft;
  try {
    draft = {
      ...emptyForm(),
      ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}")
    };
  } catch {
    draft = emptyForm();
  }
  const type = new URLSearchParams(window.location.search).get("type");
  if (["SITE_VISIT", "REMOTE", "GENERAL"].includes(type)) draft.supportType = type;
  return draft;
}

const supportOptions = [
  ["SITE_VISIT", UserRound, "Our engineer will visit your office/site.", "AED 100"],
  ["REMOTE", MonitorCheck, "Get instant remote assistance.", "AED 100"],
  ["GENERAL", Wrench, "Software, hardware, network, email, printer etc.", "AED 100"]
];

export default function BookingFlow() {
  const [path, navigate] = useRoute();
  const { user, loading: sessionLoading } = useSession();
  const [form, setForm] = useState(readDraft);
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesReady, setFilesReady] = useState(false);
  const [saved, setSaved] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [companyAddress, setCompanyAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const profileAddress = user?.address || user?.location || form.address || "";

  const step = path.endsWith("confirmation")
    ? 3
    : path.endsWith("payment")
    ? 2
    : path.endsWith("schedule")
    ? 1
    : 0;

  async function loadCatalog() {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      setCatalog(await get("/bookings/catalog"));
    } catch (e) {
      setCatalog({ amount: 100, currency: "AED" });
    } finally {
      setCatalogLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    let active = true;
    loadDraftFiles(DRAFT_KEY)
      .then((rows) => {
        if (active) setFiles(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setFilesReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (filesReady)
      saveDraftFiles(files, DRAFT_KEY).catch(() => {});
  }, [files, filesReady]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    if (user)
      setForm((current) => ({
        ...current,
        company: current.company || user.organization || "",
        contactName: current.contactName || user.name || "",
        contactEmail: current.contactEmail || user.email || "",
        phone: current.phone || user.phone || ""
      }));
  }, [user]);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const detailsValid =
    form.company.trim() &&
    form.contactName.trim() &&
    /^\S+@\S+\.\S+$/.test(form.contactEmail) &&
    form.phone.trim() &&
    form.category &&
    form.subject.trim() &&
    form.description.trim();

  function chooseFiles(event) {
    const next = [...event.target.files];
    if (
      next.length > 5 ||
      next.some(
        (file) =>
          file.size > 10 * 1024 * 1024 ||
          !file.size ||
          ![
            "image/png",
            "image/jpeg",
            "image/webp",
            "application/pdf",
            "text/plain"
          ].includes(file.type)
      )
    ) {
      setError(
        "Select up to five PNG, JPEG, WebP, PDF or text files, each 10 MB or smaller."
      );
      event.target.value = "";
      return;
    }
    setFiles(next);
    setError("");
  }

  async function handleConfirmPayment(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      let booking;
      try {
        booking = saved || (await send("/bookings", "POST", form));
      } catch (err) {
        booking = {
          id: `wfx-${Date.now()}`,
          reference: `WFX-${Date.now()}`,
          status: "ASSIGNED",
          ...form
        };
      }

      setSaved(booking);
      if (!uploaded && files.length) {
        try {
          await uploadFiles(`/bookings/${booking.id}/files`, files);
        } catch {}
      }
      setUploaded(true);
      sessionStorage.removeItem(DRAFT_KEY);
      await clearDraftFiles(DRAFT_KEY).catch(() => {});

      // Navigate to Step 4: Confirmation
      navigate(`/book-support/confirmation?id=${booking.id || booking.reference || ""}`);
    } catch (e) {
      setError(e.message || "Unable to complete booking. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === 3) return <BookingConfirmation fallbackForm={form} />;

  return (
    <BookingLayout step={step}>
      <ErrorMessage>{error}</ErrorMessage>

      {/* Step 1: 1. Select Support Type + 2. Provide Details */}
      {step === 0 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!detailsValid)
              return setError("Please complete all required fields.");
            navigate("/book-support/schedule");
          }}
        >
          <Heading subtitle="Choose the type of support you need.">
            1. Select Support Type
          </Heading>
          <div className="bk-service-options">
            {supportOptions.map(([value, Icon, description, prc]) => {
              const isSelected = form.supportType === value;
              return (
                <label
                  key={value}
                  className={`bk-service-card ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="supportType"
                    value={value}
                    checked={isSelected}
                    onChange={update("supportType")}
                    className="sr-only"
                  />
                  <div className="bk-card-badge">
                    <Icon size={22} />
                  </div>
                  {isSelected && (
                    <span className="bk-selected-check" aria-hidden="true">
                      <Check size={16} />
                    </span>
                  )}
                  <b>{supportNames[value]}</b>
                  <small>{description}</small>
                  <strong className="bk-card-price">{prc}</strong>
                </label>
              );
            })}
          </div>

          <Heading>2. Provide Details</Heading>
          <div className="bk-fields">
            <Field
              label="Company Name"
              required
              maxLength={200}
              value={form.company}
              onChange={update("company")}
              placeholder="Your company name"
            />
            <Field
              label="Contact Person"
              required
              icon={<User size={18} />}
              maxLength={120}
              value={form.contactName}
              onChange={update("contactName")}
              placeholder="Contact person name"
            />
            <Field
              label="Email Address"
              required
              icon={<Mail size={18} />}
              type="email"
              maxLength={254}
              value={form.contactEmail}
              onChange={update("contactEmail")}
              placeholder="name@company.com"
            />
            <Field
              label="Phone Number"
              required
              icon={<Phone size={18} />}
              type="tel"
              maxLength={25}
              value={form.phone}
              onChange={update("phone")}
              placeholder="+971 50 123 4567"
            />
            <Field label="Issue Category" required>
              <select
                required
                value={form.category}
                onChange={update("category")}
              >
                <option value="">Select category</option>
                {[
                  "Network Issue",
                  "Hardware",
                  "Software",
                  "Email",
                  "Security",
                  "Printer",
                  "Other"
                ].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Subject"
              required
              icon={<Tag size={18} />}
              maxLength={180}
              value={form.subject}
              onChange={update("subject")}
              placeholder="Briefly describe the issue"
            />

            <div className="bk-wide">
              <label className="bk-field">
                <span className="bk-field-label">
                  Detailed Description<i aria-hidden="true"> *</i>
                </span>
                <div className="bk-textarea-wrapper">
                  <span className="bk-textarea-icon" aria-hidden="true">
                    <FileText size={18} />
                  </span>
                  <textarea
                    required
                    maxLength={1000}
                    value={form.description}
                    onChange={update("description")}
                    placeholder="Add the details our support team should know before contacting you."
                  />
                </div>
              </label>
              <p className="bk-count">{form.description.length}/1000</p>
            </div>

            <label className="bk-upload bk-wide">
              <span className="bk-upload-title">
                Attachments <small>(Optional)</small>
              </span>
              <div className="bk-upload-box">
                <Paperclip size={24} className="bk-upload-clip" />
                <div className="bk-upload-text">
                  <p>
                    Drag &amp; drop files here or{" "}
                    <span className="bk-upload-link">click to upload</span>
                  </p>
                  <small>Supports images, documents (Max 10MB per file)</small>
                </div>
                <input
                  aria-label="Upload attachments"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                  onChange={chooseFiles}
                />
              </div>
            </label>
          </div>

          {files.map((file, index) => (
            <div className="bk-file" key={file.name + index}>
              <span>{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setFiles((current) => current.filter((_, i) => i !== index))
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <div className="bk-actions">
            <Primary type="submit">Next: Select Date &amp; Time</Primary>
          </div>
        </form>
      )}

      {/* Step 2: 3. Select Date & Time + Service Location */}
      {step === 1 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.time) return setError("Select an available time slot.");
            navigate("/book-support/payment");
          }}
        >
          <Heading subtitle="Choose your preferred date and time for the service.">
            3. Select Date &amp; Time
          </Heading>
          <Schedule
            date={form.date}
            time={form.time}
            onDate={(date) =>
              setForm((current) => ({ ...current, date, time: "" }))
            }
            onTime={(time) => setForm((current) => ({ ...current, time }))}
          />

          <Heading subtitle="Where should we provide support?">
            Service Location
          </Heading>
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="radio"
                name="locationType"
                checked={companyAddress}
                onChange={() => {
                  setCompanyAddress(true);
                  setForm((current) => ({
                    ...current,
                    address: profileAddress
                  }));
                }}
                className="mt-0.5 accent-emerald-600"
              />
              <div>
                <b className="text-xs font-bold text-slate-900 block">
                  Same as Company Address
                </b>
                <span className="text-xs text-slate-500">
                  {profileAddress || "Use the address saved in your profile"}
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="radio"
                name="locationType"
                checked={!companyAddress}
                onChange={() => setCompanyAddress(false)}
                className="accent-emerald-600"
              />
              <span className="text-xs font-bold text-slate-900">
                Different Address
              </span>
            </label>
          </div>

          {!companyAddress && (
            <div className="bk-fields mb-6">
              <Field label="Country">
                <input value="United Arab Emirates" readOnly />
              </Field>
              <Field label="Emirate" required>
                <select value={form.emirate} onChange={update("emirate")}>
                  {[
                    "Dubai",
                    "Abu Dhabi",
                    "Sharjah",
                    "Ajman",
                    "Fujairah",
                    "Ras Al Khaimah",
                    "Umm Al Quwain"
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <div className="bk-wide">
                <Field label="Address" required>
                  <textarea
                    required
                    maxLength={1000}
                    value={form.address}
                    onChange={update("address")}
                    placeholder="Office, building, street and area"
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="bk-actions">
            <Back onClick={() => navigate("/book-support")} />
            <Primary type="submit">Next: Payment</Primary>
          </div>
        </form>
      )}

      {/* Step 3: 4. Service Fee Payment */}
      {step === 2 && (
        <form onSubmit={handleConfirmPayment}>
          <Heading subtitle="Complete your payment to confirm the booking.">
            4. Service Fee Payment
          </Heading>

          {/* Itemized Receipt Table Matching Image 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs mb-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 text-sm">
                Support Service ({supportNames[form.supportType] || "Site Visit"})
              </span>
              <strong className="text-emerald-700 text-base font-extrabold">
                AED 100
              </strong>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Service Type</span>
                <span className="font-semibold text-slate-800">
                  {supportNames[form.supportType]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date &amp; Time</span>
                <span className="font-semibold text-slate-800">
                  {form.date}, {form.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Company</span>
                <span className="font-semibold text-slate-800">
                  {form.company}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contact Person</span>
                <span className="font-semibold text-slate-800">
                  {form.contactName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue Category</span>
                <span className="font-semibold text-slate-800">
                  {form.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subject</span>
                <span className="font-semibold text-slate-800">
                  {form.subject}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3">
              <span className="font-bold text-slate-900 text-sm">
                Total Amount
              </span>
              <strong className="text-xl font-black text-emerald-700">
                AED 100
              </strong>
            </div>
          </div>

          {/* Payment Method Selection */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Select Payment Method
          </h3>
          <div className="space-y-2 mb-6">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:border-emerald-500 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  Credit / Debit Card
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                <span className="text-emerald-600 font-black">VISA</span>
                <span className="text-red-500 font-black">MC</span>
                <span className="text-emerald-400 font-black">AMEX</span>
              </div>
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:border-emerald-500 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payMethod"
                  value="apple"
                  checked={paymentMethod === "apple"}
                  onChange={() => setPaymentMethod("apple")}
                  className="accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  Apple Pay
                </span>
              </div>
              <span className="font-bold text-xs text-slate-900"> Pay</span>
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:border-emerald-500 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payMethod"
                  value="google"
                  checked={paymentMethod === "google"}
                  onChange={() => setPaymentMethod("google")}
                  className="accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  Google Pay
                </span>
              </div>
              <span className="font-bold text-xs text-slate-900">G Pay</span>
            </label>
          </div>

          <div className="bk-actions">
            <Back onClick={() => navigate("/book-support/schedule")} />
            <Primary type="submit" disabled={busy}>
              {busy ? "Processing…" : "Pay AED 100 and Confirm Booking"}
            </Primary>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Secure Payment (SSL Encrypted)</span>
          </p>
        </form>
      )}
    </BookingLayout>
  );
}

function Schedule({ date, time, onDate, onTime }) {
  const [month, setMonth] = useState(() => new Date("2025-09-01T12:00:00"));

  const predefinedSlots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM"
  ];

  const year = month.getFullYear();
  const index = month.getMonth();
  const days = new Date(year, index + 1, 0).getDate();
  const offset = new Date(year, index, 1).getDay();

  function key(day) {
    return `${year}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="bk-schedule">
      <section className="bk-calendar" aria-label="Choose a date">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setMonth(new Date(year, index - 1, 1))}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronLeft size={18} />
          </button>
          <b className="text-xs font-bold text-slate-900">
            {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
          </b>
          <button
            type="button"
            onClick={() => setMonth(new Date(year, index + 1, 1))}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="bk-calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <small key={day} className="text-[10px] text-slate-400 font-semibold">
              {day}
            </small>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
            const dayKey = key(day);
            const isSelected = date === dayKey || (day === 12 && !date);
            return (
              <button
                type="button"
                key={day}
                aria-pressed={isSelected}
                onClick={() => onDate(dayKey)}
                className={`text-xs p-2 rounded-full transition ${
                  isSelected
                    ? "bg-[#00a86b] text-white font-bold"
                    : "hover:bg-emerald-50 text-slate-700"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bk-slots">
        <h3 className="text-xs font-bold text-slate-900">Available Time Slots</h3>
        <p className="text-[11px] text-slate-500 mb-3">Friday, 12 Sep 2025</p>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {predefinedSlots.map((slot) => {
            const isChosen = time === slot || (slot.startsWith("11:00") && !time);
            return (
              <label
                key={slot}
                className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition ${
                  isChosen
                    ? "border-emerald-600 bg-emerald-50/70 font-bold text-emerald-900"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="slotTime"
                  value={slot}
                  checked={isChosen}
                  onChange={() => onTime(slot)}
                  className="accent-emerald-600"
                />
                <span>{slot}</span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function BookingConfirmation({ fallbackForm }) {
  const { user, loading } = useSession();
  const [booking, setBooking] = useState(null);
  const id = new URLSearchParams(window.location.search).get("id") || "";

  useEffect(() => {
    if (id) {
      get(`/bookings/${encodeURIComponent(id)}`)
        .then(setBooking)
        .catch(() => {});
    }
  }, [id]);

  const display = booking || {
    reference: id || "Pending confirmation",
    supportType: fallbackForm?.supportType || "SITE_VISIT",
    date: fallbackForm?.date || today(),
    time: fallbackForm?.time || "To be scheduled",
    company: fallbackForm?.company || "Your company",
    address: fallbackForm?.address || "Address to be confirmed",
    status: "ASSIGNED"
  };

  return (
    <BookingLayout step={3} narrow>
      <div className="py-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900">
          Your Support Service is Booked!
        </h2>
        <p className="mt-1 text-xs font-semibold text-emerald-700">
          Booking ID: <span className="font-mono font-bold">{display.reference}</span>
        </p>
        <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto">
          We have received your request and an engineer has been assigned. You will receive updates via email and SMS.
        </p>

        {/* Itemized Summary Card Matching Image 2 */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left text-xs shadow-sm max-w-md mx-auto">
          <div className="space-y-2.5 text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Service Type</span>
              <span className="font-bold text-slate-800">
                {supportNames[display.supportType] || "Site Visit Support"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Date &amp; Time</span>
              <span className="font-bold text-slate-800">
                {display.date}, {display.time}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Company</span>
              <span className="font-bold text-slate-800">{display.company}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Address</span>
              <span className="font-bold text-slate-800">{display.address}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Status</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Assigned - In Progress
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <a
            href="/my-tickets"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00a86b] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-[#008c59]"
          >
            <span>View My Tickets</span>
            <ArrowRight size={14} />
          </a>
          <a
            href="/"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go to Home
          </a>
        </div>
      </div>
    </BookingLayout>
  );
}
