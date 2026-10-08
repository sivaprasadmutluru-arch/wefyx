import { useEffect, useState } from "react";
import { ArrowRight, Building2, CalendarDays, Check, Cloud, FileText, Headphones, MapPin, Network, Phone, Server, ShieldCheck, Upload, UsersRound, Wrench, Zap } from "lucide-react";
import { PublicFooter, PublicHeader } from "./RentalPages";
import { get, login, send, sendPublic, uploadFiles } from "./api";
import { goToPortal } from "./portal";
import SupportOverview from "./SupportOverview";

const services = [[Building2,"Managed IT Services",["Proactive monitoring","Patch & update management","Cost optimization"]],[Headphones,"IT Support & Helpdesk",["24/7 helpdesk support","Remote & on-site support","Fast issue resolution"]],[Network,"Network & Infrastructure",["Network design","Wi-Fi & LAN solutions","Firewall & security"]],[Cloud,"Cloud & Microsoft 365",["Cloud migration","Microsoft 365 setup","Secure cloud solutions"]],[ShieldCheck,"Cybersecurity",["Threat protection","Endpoint security","Security audits"]],[Server,"Data Center & AMC",["Server & storage","Data center setup","AMC & maintenance"]]];
const generic = {"data-center":["DATA CENTER SOLUTIONS","Design. Build. Operate. With confidence."],about:["ABOUT WEFYX","Smarter IT. Stronger businesses."],contact:["CONTACT WEFYX","Let’s solve your next technology challenge."],shop:["BUSINESS TECHNOLOGY","Equip your people for their best work."]};

export default function InfoPage({type="services"}) { return type === "services" ? <ServicesPage/> : <Generic type={type}/>; }

function ServicesPage(){
  const [requirementOnly,setRequirementOnly]=useState(()=>window.location.hash==="#requirement");
  useEffect(()=>{
    const updateView=()=>{
      const isRequirement=window.location.hash==="#requirement";
      setRequirementOnly(isRequirement);
      if(!isRequirement)window.location.replace(`/book-support${window.location.search}`);
    };
    updateView();
    window.addEventListener("hashchange",updateView);
    return()=>window.removeEventListener("hashchange",updateView);
  },[]);

  const [notice,setNotice]=useState("");
  const [success,setSuccess]=useState(false);
  const [busy,setBusy]=useState(false);
  const [reference,setReference]=useState("");
  const submit=async(event,label)=>{
    event.preventDefault();
    const formElement=event.currentTarget;
    if(busy)return;setBusy(true);setNotice("");
    try{
      const form=new FormData(formElement),data=Object.fromEntries(form.entries());
      let customer;try{customer=JSON.parse(localStorage.getItem("wefyx-user")||"null")}catch{customer=null}
      const customerSignedIn=localStorage.getItem("wefyx-auth")==="true"&&customer?.role==="CUSTOMER";
      if(!customerSignedIn){
        if(data.password!==data.confirmPassword)throw new Error("Passwords do not match.");
        try{await sendPublic("/auth/register","POST",{name:data.fullName,email:data.email,password:data.password,organization:data.organization,phone:data.phone,role:"CUSTOMER"})}catch(error){if(error.status===409||String(error.message).toLowerCase().includes("already exists"))throw new Error("Customer already exists. Please sign in.");throw error}
        const session=await login(data.email,data.password);localStorage.setItem("wefyx-token",session.token);localStorage.setItem("wefyx-auth","true");localStorage.setItem("wefyx-user",JSON.stringify(session.user));localStorage.setItem("wefyx-account-type","customer");customer=session.user;
      }
      const requirement=await send("/requirements","POST",{title:`${data.service||"General service"} requirement`,description:`Customer type: ${data.customerType||"Not specified"}. Devices/users: ${data.devices||"Not specified"}. Business type: ${data.businessType||"Not specified"}. Existing issues: ${data.issues||"None provided"}. Expected timeline: ${data.timeline||"Not specified"}. Budget: ${data.budget||"Not specified"}. Details: ${data.details||"No additional details"}`,category:data.service||"General service",priority:data.timeline==="Immediately"?"High":"Medium",quotationRequested:true,customerName:customer?.name||data.fullName,organization:customer?.organization||data.organization});
      const files=formElement.querySelector('input[type="file"]')?.files||[];if(files.length)await uploadFiles(`/requirements/${requirement.id}/attachments`,files);
      setReference(requirement.reference);setSuccess(true);setNotice("Requirement submitted successfully.");setTimeout(goToPortal,2600);
    }catch(error){setNotice(error.message||"Unable to submit your requirement.")}finally{setBusy(false)}
  };
  if(!requirementOnly)return null;
  return <div className={`services-reference${requirementOnly?" requirement-page":""}`}><PublicHeader/><main>
    {!requirementOnly&&<><section className="sr-hero support-services-hero">
      <div className="sr-hero-media">
        <img src="/images/home-support-hero.png" alt="Wefyx IT engineer providing office support" className="sr-hero-img"/>
        <div className="sr-hero-fade"/>
      </div>
      <div className="sr-shell sr-hero-inner">
        <div className="sr-copy">
          <p>IT SUPPORT SERVICES</p>
          <h1>Professional IT Support<br/>When You Need It</h1>
          <span>Get expert support at your office or remotely.<br/>Tell us what you need and receive a tailored proposal.</span>
          <div className="sr-actions"><a href="/book-support">Book a Support Service <ArrowRight size={16}/></a><a href="#requirement">Submit Requirement <ArrowRight size={16}/></a></div>
          <div className="sr-proof">
            <b><ShieldCheck/>Reliable<br/>Support</b>
            <b><UsersRound/>Certified<br/>Engineers</b>
            <b><Zap/>Fast<br/>Response</b>
            <b><MapPin/>UAE<br/>Coverage</b>
          </div>
        </div>
        <aside>
          <small>OUR IT SERVICES</small>
          <div className="sr-aside-list">
            {[[Headphones,"IT Support & Helpdesk"],[Cloud,"Infrastructure & Cloud"],[ShieldCheck,"Cybersecurity"],[Server,"Data Center Solutions"],[Wrench,"On-site Engineer Support"]].map(([I,t])=><span key={t}><I size={19}/>{t}</span>)}
          </div>
          <footer>SECURE <i/> RELIABLE <i/> ALWAYS ON</footer>
        </aside>
      </div>
    </section>
    <SupportOverview /></>}<section className="sr-shell sr-forms sr-single-form"><CompactRequirementForm done={submit} busy={busy}/></section>
    {!requirementOnly&&<><section className="sr-shell sr-core"><h2>Our Core IT Services</h2><p>End-to-end IT solutions to keep your business running, secure and future-ready.</p><div>{services.map(([I,t,items])=><article key={t}><I/><h3>{t}</h3><ul>{items.map(x=><li key={x}>{x}</li>)}</ul><a href="#requirement">Learn More <ArrowRight/></a></article>)}</div></section>
    <section className="sr-shell sr-process"><h2>Our Simple Process</h2><p>From request to resolution — a seamless experience.</p><div className="sr-steps">{[[FileText,"Submit Requirement","Share your needs and attachments"],[FileText,"Review & Proposal","Our employee reviews and prepares the proposal"],[Check,"Accept & Confirm Deal","Approve the proposal and confirm the engagement"],[CalendarDays,"Site Visit & Execution","We schedule the visit and deliver the service"]].map(([I,t,d],i)=><article key={t}><b>{i+1}</b><I/><span><strong>{t}</strong><small>{d}</small></span>{i<3&&<ArrowRight/>}</article>)}</div><div className="sr-quick">{[[Headphones,"24/7","Support Available"],[Zap,"SLA","Response Time"],[UsersRound,"Certified","Engineers"],[MapPin,"UAE","Nationwide Coverage"],[Building2,"250+","Business Clients"]].map(([I,n,l])=><span key={n}><I/><b>{n}<small>{l}</small></b></span>)}</div></section>
    <section className="sr-shell sr-support"><Headphones/><div><h2>Need Immediate IT Assistance?</h2><p>Submit your requirement first. After proposal acceptance and deal confirmation, our team will schedule the site visit.</p></div><a href="#requirement">Submit Requirement <ArrowRight/></a><a href="tel:+97141234567"><Phone/>Talk to Support</a></section>
    </>}
  </main><PublicFooter/>{success&&<div className="sr-success-blast" role="status" aria-live="polite"><div className="sr-flower-burst">{Array.from({length:24},(_,i)=><i key={i} style={{"--petal":i}}/>)}</div><div className="sr-success-card"><div className="sr-success-flower">✿</div><Check/><h2>Requirement Submitted!</h2><p>{reference} was created successfully. Opening your customer workspace.</p><div className="sr-success-progress"/></div></div>}{notice&&!success&&<div className="sr-notice"><Check/>{notice}</div>}</div>;
}
function VisitForm({done}){return <form id="site-visit" onSubmit={e=>done(e,"Site visit booking")}><header><CalendarDays/><div><h2>Book an Engineer for Site Visit</h2><p>Get professional on-site IT support from our certified engineers.<br/>We’ll visit your location, assess your requirements and provide the right solution.</p></div></header><div className="sr-booking"><div className="sr-fields"><Field label="Full Name" req/><Field label="Company Name"/><Field label="Email Address" req type="email"/><Field label="Mobile Number" req placeholder="+971 50 123 4567"/><Select label="Emirate / Location" items={["Select emirate","Dubai","Abu Dhabi","Sharjah"]}/><Select label="Service Type" items={["Select service type","IT Support","Network Setup","Cybersecurity"]}/><Field label="Preferred Date" req type="date"/><Field label="Preferred Time" req type="time"/><Text label="Requirement Details" req/><UploadBox/></div><aside className="sr-summary"><h3>Site Visit Summary</h3><p>Regular Price <s className="sr-old-price">AED 105</s></p><strong>Current Price <b className="sr-free">FREE</b></strong><button>Confirm Free Booking <ArrowRight/></button><small><ShieldCheck/>Your information is safe with us.</small></aside></div></form>}
function RequirementForm({done,busy}){let user=null;try{user=JSON.parse(localStorage.getItem("wefyx-user")||"null")}catch{}const signedIn=localStorage.getItem("wefyx-auth")==="true"&&user?.role==="CUSTOMER";return <form id="requirement" onSubmit={e=>done(e,"Requirement request")}><header><FileText/><div><h2>{signedIn?"Submit Requirement":"Customer Details & Requirement"}</h2><p>{signedIn?"Share what you need and our employee will review it and send you a proposal.":"Create your customer account and submit the requirement in one step."}</p></div></header><div className="sr-fields sr-requirement">{!signedIn&&<><Field name="fullName" label="Full Name" req/><Field name="organization" label="Company / Organization" req/><Field name="email" label="Work Email" req type="email"/><Field name="phone" label="Phone Number" req placeholder="+971 50 123 4567"/><Field name="password" label="Create Password" req type="password" minLength={8}/><Field name="confirmPassword" label="Confirm Password" req type="password" minLength={8}/></>}<Select name="customerType" label="Company / Individual" req items={["Select option","Company","Individual"]}/><Select name="service" label="Required Service" req items={["Select service","Managed IT","IT Support","Data Center","Cybersecurity","Other"]}/><Field name="devices" label="Number of Devices or Users" req placeholder="e.g. 10, 50, 100"/><Select name="businessType" label="Business Type" req items={["Select business type","Corporate","Retail","Healthcare","Individual","Other"]}/><Text name="issues" label="Existing Issues (if any)"/><Select name="timeline" label="Expected Timeline" req items={["Select timeline","Immediately","This month","This quarter"]}/><Select name="budget" label="Budget Range" items={["Select budget range","Under AED 5,000","AED 5,000–20,000","AED 20,000+"]}/><Text name="details" label="Requirement Details" req/><UploadBox wide/><button disabled={busy} className="sr-submit">{busy?"Submitting requirement…":"Request Proposal"}<ArrowRight/></button></div></form>}
function CompactRequirementForm({done,busy}){
 const hasStoredSession=localStorage.getItem("wefyx-auth")==="true"&&!!localStorage.getItem("wefyx-token");
 const[user,setUser]=useState(null),[checking,setChecking]=useState(hasStoredSession),[step,setStep]=useState(1);
 useEffect(()=>{let active=true;if(!hasStoredSession)return;get("/auth/me").then(profile=>{if(!active)return;if(profile?.role!=="CUSTOMER")throw new Error("Customer session required");setUser(profile);localStorage.setItem("wefyx-user",JSON.stringify(profile));setStep(2)}).catch(()=>{if(!active)return;localStorage.removeItem("wefyx-auth");localStorage.removeItem("wefyx-token");localStorage.removeItem("wefyx-user");setUser(null);setStep(1)}).finally(()=>active&&setChecking(false));return()=>{active=false}},[]);
 const signedIn=user?.role==="CUSTOMER";
 const next=(event)=>{const inputs=[...event.currentTarget.closest("form").querySelectorAll(".sr-account-step input")];const invalid=inputs.find(input=>!input.checkValidity());if(invalid){invalid.reportValidity();return}setStep(2);};
 if(checking)return <form id="requirement"><header><FileText/><div><h2>Customer Details & Requirement</h2><p>Checking your customer session…</p></div></header><div className="sr-session-checking">Verifying your account securely…</div></form>;
 return <form id="requirement" onSubmit={e=>done(e,"Requirement request")}>
  <header><FileText/><div><h2>{signedIn?"Submit Requirement":"Customer Details & Requirement"}</h2><p>{signedIn?"Share what you need and our employee will review it and send you a proposal.":"Create your customer account and submit the requirement in one step."}</p></div></header>
  {!signedIn&&<div className="sr-form-stepper"><button type="button" onClick={()=>setStep(1)} className={step===1?"active":"done"}><b>1</b><span>Your details</span></button><i/><button type="button" onClick={()=>step===2&&setStep(2)} className={step===2?"active":""}><b>2</b><span>Requirement</span></button></div>}
  <div className="sr-fields sr-requirement">
   {!signedIn&&<div className={`sr-step-fields sr-account-step ${step===1?"":"sr-step-hidden"}`}><Field name="fullName" label="Full Name" req/><Field name="organization" label="Company / Organization" req/><Field name="email" label="Work Email" req type="email"/><Field name="phone" label="Phone Number" req placeholder="+971 50 123 4567"/><Field name="password" label="Create Password" req type="password" minLength={8}/><Field name="confirmPassword" label="Confirm Password" req type="password" minLength={8}/><button type="button" onClick={next} className="sr-step-next">Continue to requirement <ArrowRight/></button></div>}
   <div className={`sr-step-fields sr-requirement-step ${!signedIn&&step!==2?"sr-step-hidden":""}`}><Select name="customerType" label="Company / Individual" req items={["Select option","Company","Individual"]}/><Select name="service" label="Required Service" req items={["Select service","Managed IT","IT Support","Data Center","Cybersecurity","Other"]}/><Field name="devices" label="Number of Devices or Users" req placeholder="e.g. 10, 50, 100"/><Select name="businessType" label="Business Type" req items={["Select business type","Corporate","Retail","Healthcare","Individual","Other"]}/><Text name="issues" label="Existing Issues (if any)"/><Select name="timeline" label="Expected Timeline" req items={["Select timeline","Immediately","This month","This quarter"]}/><Select name="budget" label="Budget Range" items={["Select budget range","Under AED 5,000","AED 5,000–20,000","AED 20,000+"]}/><Text name="details" label="Requirement Details" req/><UploadBox wide/><div className="sr-step-actions"><button disabled={busy} className="sr-submit">{busy?signedIn?"Submitting requirement…":"Creating account & requirement…":"Request Proposal"}<ArrowRight/></button></div></div>
  </div>
 </form>
}
function Field({name,label,req,type="text",placeholder,minLength}){return <label>{label}{req&&<sup>*</sup>}<input name={name} required={req} type={type} minLength={minLength} placeholder={placeholder||`Enter your ${label.toLowerCase()}`}/></label>}; function Select({name,label,req,items}){return <label>{label}{req&&<sup>*</sup>}<select name={name} required={req} defaultValue=""><option value="" disabled>{items[0]}</option>{items.slice(1).map(x=><option key={x}>{x}</option>)}</select></label>}; function Text({name,label,req}){return <label>{label}{req&&<sup>*</sup>}<textarea name={name} required={req} placeholder="Tell us more about your requirement..."/></label>}; function UploadBox({wide}) {const[names,setNames]=useState([]);return <label className={`sr-upload${wide?" sr-wide":""}`}>Attach Files <small>(Optional · up to 5 files, 10 MB each)</small><input className="sr-file-input" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx" onChange={e=>setNames([...e.target.files].map(f=>f.name))}/><span><Upload/>{names.length?<><b>{names.length} file{names.length>1?"s":""} selected</b><small>{names.join(", ")}</small></>:<>Drag & drop files here or <b>click to browse</b></>}</span></label>}
function Generic({type}){const d=generic[type]||generic.about; return <div className="info-site"><PublicHeader/><main><section className="ip-hero"><div><p>{d[0]}</p><h1>{d[1]}</h1><span>One accountable partner for planning, delivery, support and continuous improvement of your technology environment.</span><a href="/contact">Talk to an expert <ArrowRight/></a></div><img src="/images/wefyx-service-hero.png" alt="Wefyx enterprise infrastructure"/></section></main><PublicFooter/></div>}
