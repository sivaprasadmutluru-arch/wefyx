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
  if (type&&/^[A-Z][A-Z0-9_]{1,39}$/.test(type)) draft.supportType = type;
  if(draft.date<today()){draft.date=today();draft.time="";}
  if(!/^\d{2}:\d{2}$/.test(draft.time))draft.time="";
  return draft;
}

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
      setCatalog(null);setCatalogError(e.message||"Unable to load service details. Please retry.");
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

  function changeForm(patch){setSaved(null);setUploaded(false);setForm(current=>({...current,...patch,requestKey:crypto.randomUUID()}))}
  const update = (key) => (event) => changeForm({[key]:event.target.value});

  const selectedService=catalog?.services?.find(service=>service.code===form.supportType);
  const supportOptions=(catalog?.services||[]).map(service=>[service.code,service.code==="REMOTE"?MonitorCheck:service.code==="SITE_VISIT"?UserRound:Wrench,service.description,money(service.amount),service.name]);
  const detailsValid =
    selectedService&&
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
      if(!user||user.role!=="CUSTOMER")throw new Error("Sign in with a customer account to submit a service request.");
      const booking=saved||(await send("/bookings","POST",form));
      setSaved(booking);
      if (!uploaded && files.length) {
        await uploadFiles(`/bookings/${booking.id}/files`, files);
      }
      setUploaded(true);
      if(catalog?.checkoutAvailable){const checkout=await send(`/bookings/${booking.id}/checkout`,"POST",{});if(checkout.checkoutUrl){window.location.assign(checkout.checkoutUrl);return}}
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

  if (step === 3) return <BookingConfirmation />;
  if(step===2&&sessionLoading)return <BookingLayout><p>Checking your account…</p></BookingLayout>;
  if(step===2&&!user)return <BookingLayout><SignIn returnTo="/book-support/payment"/></BookingLayout>;

  return (
    <BookingLayout step={step}>
      <ErrorMessage>{error||catalogError}</ErrorMessage>{catalogLoading&&<p role="status">Loading services…</p>}{!catalogLoading&&catalog?.services?.length===0&&<p>No services available for new bookings.</p>}

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
            {supportOptions.map(([value, Icon, description, prc, name]) => {
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
                  <b>{name}</b>
                  <small>{description}</small>
                  <strong className="bk-card-price">{prc} <small>including VAT</small></strong>
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
            const address=companyAddress?profileAddress:form.address;
            if(!address.trim())return setError("Enter the service address.");
            changeForm({address});
            navigate("/book-support/payment");
          }}
        >
          <Heading subtitle="Choose your preferred date and time for the service.">
            3. Select Date &amp; Time
          </Heading>
          <Schedule
            supportType={form.supportType}
            advanceDays={selectedService?.advanceDays||90}
            date={form.date}
            time={form.time}
            onDate={(date) =>
              changeForm({date,time:""})
            }
            onTime={(time) => changeForm({time})}
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

          {(!companyAddress||!profileAddress) && (
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
            <Primary type="submit">Next: Review</Primary>
          </div>
        </form>
      )}

      {/* Step 3: 4. Service Fee Payment */}
      {step === 2 && (
        <form onSubmit={handleConfirmPayment}>
          <Heading subtitle="Check your details before submitting your service request.">4. Review your request</Heading>
          <Summary booking={{...form,serviceName:selectedService?.name}}/>
          <div className="mt-6 rounded-xl border bg-white p-5 text-sm"><b>Service fee: {money(saved?.amount??selectedService?.amount??0)} including VAT</b><p className="mt-3 leading-6 text-slate-600">{catalog?.checkoutMessage||"Online payment is not available. Submitting saves your request; your appointment is not confirmed or reserved."}</p><p className="mt-2 text-slate-600">{catalog?.checkoutAvailable?"Your chosen slot is held for up to one hour while you complete secure payment.":"You can track the pending request in My Support Tickets."}</p></div>
          <div className="bk-actions"><Back onClick={()=>navigate("/book-support/schedule")}/><Primary type="submit" disabled={busy||catalogLoading||!selectedService}>{busy?"Please wait…":catalog?.checkoutAvailable?"Continue to secure payment":"Submit service request"}</Primary></div>
        </form>
      )}
    </BookingLayout>
  );
}

function Schedule({date,time,onDate,onTime,supportType,advanceDays}){
  const [month,setMonth]=useState(()=>new Date(`${date||today()}T12:00:00`));
  const [slots,setSlots]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(""),[retry,setRetry]=useState(0);
  const max=new Date(`${today()}T12:00:00Z`);max.setUTCDate(max.getUTCDate()+advanceDays);const maxDate=max.toISOString().slice(0,10);
  useEffect(()=>{let active=true;setLoading(true);setError("");setSlots([]);get(`/bookings/availability?date=${encodeURIComponent(date||today())}&supportType=${encodeURIComponent(supportType)}`).then(rows=>{if(active){setSlots(rows);if(time&&!rows.some(slot=>slot.time===time&&slot.available))onTime("")}}).catch(err=>{if(active)setError(err.message||"Unable to load available slots.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[date,retry,supportType]);
  const year=month.getFullYear(),index=month.getMonth(),days=new Date(year,index+1,0).getDate(),offset=new Date(year,index,1).getDay();
  const key=day=>`${year}-${String(index+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  return <div className="bk-schedule"><section className="bk-calendar" aria-label="Choose a date"><div className="mb-4 flex items-center justify-between"><button aria-label="Previous month" type="button" disabled={key(days)<today()||key(1)<=today().slice(0,7)+"-01"} onClick={()=>setMonth(new Date(year,index-1,1))}><ChevronLeft size={18}/></button><b>{month.toLocaleDateString("en",{month:"long",year:"numeric"})}</b><button aria-label="Next month" type="button" disabled={key(1).slice(0,7)>=maxDate.slice(0,7)} onClick={()=>setMonth(new Date(year,index+1,1))}><ChevronRight size={18}/></button></div><div className="bk-calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><small key={day}>{day}</small>)}{Array.from({length:offset},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:days},(_,i)=>i+1).map(day=><button type="button" key={day} disabled={key(day)<today()||key(day)>maxDate} aria-pressed={date===key(day)} onClick={()=>onDate(key(day))} className={`rounded-full p-2 text-sm disabled:opacity-30 ${date===key(day)?"bg-emerald-600 text-white":"hover:bg-emerald-50"}`}>{day}</button>)}</div></section><section className="bk-slots"><h3 className="font-bold">Available time slots</h3><p className="my-3 text-sm text-slate-500">{date} · UAE time</p>{loading?<p>Loading availability…</p>:error?<div role="alert"><p>{error}</p><button type="button" onClick={()=>setRetry(r=>r+1)}>Retry</button></div>:<div className="space-y-2">{slots.map(slot=><label key={slot.time} className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${slot.available?"cursor-pointer":"opacity-40"} ${time===slot.time?"border-emerald-600 bg-emerald-50":""}`}><input type="radio" name="slotTime" disabled={!slot.available} value={slot.time} checked={time===slot.time} onChange={()=>onTime(slot.time)}/>{slot.time} – {slot.endTime}{!slot.available&&" · Unavailable"}</label>)}{!slots.some(slot=>slot.available)&&<p>No appointments available on this date. Choose another date.</p>}</div>}</section></div>;
}

function BookingConfirmation(){
  const {user,loading:sessionLoading}=useSession();
  const [booking,setBooking]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[paymentAvailable,setPaymentAvailable]=useState(false);
  useEffect(()=>{get("/bookings/catalog").then(catalog=>setPaymentAvailable(catalog.checkoutAvailable)).catch(()=>{})},[]);
  const id=new URLSearchParams(window.location.search).get("id");
  useEffect(()=>{if(sessionLoading)return;if(!user){setLoading(false);return}if(!id){setError("No service request was specified.");setLoading(false);return}let active=true;get(`/bookings/${encodeURIComponent(id)}`).then(async row=>{if(row.status==="AWAITING_PAYMENT"&&new URLSearchParams(window.location.search).has("session_id"))return send(`/bookings/${encodeURIComponent(id)}/verify-payment`,"POST",{});return row}).then(row=>{if(active)setBooking(row)}).catch(err=>{if(active)setError(err.message||"Unable to load this request.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id,user,sessionLoading]);
  if(sessionLoading||loading)return <BookingLayout narrow><p>Loading service request…</p></BookingLayout>;
  if(!user)return <BookingLayout narrow><SignIn/></BookingLayout>;
  if(!booking)return <BookingLayout narrow><ErrorMessage>{error||"Service request not found."}</ErrorMessage><a href="/my-tickets">View my requests</a></BookingLayout>;
  const pending=booking.status==="AWAITING_PAYMENT";
  async function resumePayment(){setError("");try{const result=await send(`/bookings/${booking.id}/checkout`,"POST",{});if(result.checkoutUrl)window.location.assign(result.checkoutUrl);else setBooking(await get(`/bookings/${booking.id}`))}catch(e){setError(e.message)}}
  return <BookingLayout step={3} narrow><ErrorMessage>{error}</ErrorMessage><div className="py-6"><CheckCircle2 className="mx-auto text-emerald-600" size={40}/><h2 className="mt-4 text-center text-2xl font-bold">{pending?"Service request saved":"Service booking details"}</h2><p className="mt-2 text-center font-mono">{booking.reference}</p><p className="my-5 text-center text-sm text-slate-600">{pending?"Payment has not been verified yet. Your appointment is pending; check the payment status before trying again.":`Current status: ${booking.status.toLowerCase().replaceAll("_"," ")}.`}</p><Summary booking={booking}/>{pending&&paymentAvailable&&<button className="wh-button mt-5" onClick={resumePayment}>Pay / check payment</button>}<a className="wh-button mt-6" href={`/my-tickets/${booking.id}`}>Track my request <ArrowRight size={16}/></a></div></BookingLayout>;
}
