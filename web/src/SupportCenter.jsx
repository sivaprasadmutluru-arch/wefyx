import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Headphones, MessageCircle, Plus, RefreshCw, Search, Send, Ticket, X } from "lucide-react";
import { get, send } from "./api";
import "./support-center.css";

const statuses = ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"];
const label = value => String(value || "").toLowerCase().replaceAll("_", " ").replace(/\b\w/g, x => x.toUpperCase());
const date = value => value ? new Date(value).toLocaleString("en-AE", {dateStyle:"medium",timeStyle:"short"}) : "—";
const initialForm = {requirementId:"",subject:"",description:"",category:"General support",priority:"HIGH"};
const finished = ticket => ["RESOLVED", "CLOSED"].includes(ticket.status);

export default function SupportCenter({tickets, requirements, onRefresh}) {
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("ALL");
  const [selectedId,setSelectedId]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState(initialForm);
  const [messages,setMessages]=useState([]);
  const [reply,setReply]=useState("");
  const [busy,setBusy]=useState(false);
  const [messagesLoading,setMessagesLoading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const requestVersion=useRef(0);
  const selected=tickets.find(ticket=>ticket.id===selectedId);
  const visible=tickets.filter(ticket=>(filter==="ALL"||(filter==="ACTIVE"&&["IN_PROGRESS","PENDING"].includes(ticket.status))||(filter==="DONE"&&finished(ticket))||ticket.status===filter)&&[ticket.reference,ticket.subject,ticket.description,ticket.category].some(value=>String(value||"").toLowerCase().includes(query.toLowerCase())));
  const counts=[
    ["All tickets",tickets.length,Ticket,"ALL"],
    ["Open",tickets.filter(t=>t.status==="OPEN").length,Headphones,"OPEN"],
    ["In progress",tickets.filter(t=>["IN_PROGRESS","PENDING"].includes(t.status)).length,Clock3,"ACTIVE"],
    ["Resolved",tickets.filter(finished).length,CheckCircle2,"DONE"],
  ];
  useEffect(()=>{
    const version=++requestVersion.current;
    setMessages([]);setReply("");setError("");
    if(!selectedId)return;
    setMessagesLoading(true);
    get(`/tickets/${selectedId}/messages`).then(rows=>{if(version===requestVersion.current)setMessages(rows||[])}).catch(err=>{if(version===requestVersion.current)setError(err.message||"Unable to load conversation.")}).finally(()=>{if(version===requestVersion.current)setMessagesLoading(false)});
    return ()=>{requestVersion.current++};
  },[selectedId]);
  async function create(event){
    event.preventDefault();if(busy)return;setBusy(true);setError("");setNotice("");
    try{
      const ticket=await send("/tickets","POST",{...form,subject:form.subject.trim(),description:form.description.trim(),requirementId:form.requirementId?Number(form.requirementId):null});
      await onRefresh();setForm(initialForm);setShowForm(false);setSelectedId(ticket.id);setNotice(`${ticket.reference} created. You can follow updates and reply below.`);
    }catch(err){setError(err.message||"Unable to create ticket.")}finally{setBusy(false)}
  }
  async function sendReply(event){
    event.preventDefault();if(!reply.trim()||busy||!selected)return;
    const id=selected.id;const version=requestVersion.current;const text=reply.trim();setBusy(true);setError("");
    try{const message=await send(`/tickets/${id}/messages`,"POST",{message:text});if(version===requestVersion.current){setMessages(current=>[...current,message]);setReply("")}}
    catch(err){setError(err.message||"Unable to send reply.")}finally{setBusy(false)}
  }
  async function reopen(){
    if(!selected||busy)return;setBusy(true);setError("");
    try{await send(`/tickets/${selected.id}/reopen`,"PATCH",{});await onRefresh();setNotice("Ticket reopened. The support team has been notified.")}
    catch(err){setError(err.message||"Unable to reopen ticket.")}finally{setBusy(false)}
  }
  async function refresh(){
    setBusy(true);setError("");
    try{await onRefresh();if(selectedId)setMessages(await get(`/tickets/${selectedId}/messages`))}
    catch(err){setError(err.message||"Unable to refresh tickets.")}finally{setBusy(false)}
  }
  const filtered=visible;
  const field=(name,value)=>setForm(current=>({...current,[name]:value}));
  return <section className="sc-center">
    <header className="sc-heading"><div><span className="sc-eyebrow">WEFYX SUPPORT</span><h1>How can we help?</h1><p>Track your requests, talk to your support team, and get back to business.</p></div><div className="sc-heading-actions"><button type="button" className="sc-secondary" disabled={busy} onClick={refresh}><RefreshCw size={16}/>Refresh</button><button type="button" className="sc-primary" onClick={()=>{setShowForm(true);setSelectedId(null);setError("");setNotice("")}}><Plus size={18}/>New ticket</button></div></header>
    <div className="sc-stats">{counts.map(([title,count,Icon,key])=><button type="button" key={key} className={filter===key?"is-active":""} onClick={()=>setFilter(key)}><span className="sc-stat-icon"><Icon size={21}/></span><span><b>{count}</b><small>{title}</small></span></button>)}</div>
    {notice&&<p className="sc-notice" role="status"><CheckCircle2 size={18}/>{notice}</p>}
    {error&&<p className="sc-error" role="alert">{error}</p>}
    <div className={`sc-workspace ${showForm||selected?"has-panel":""}`}>
      <div className="sc-ticket-list"><div className="sc-list-toolbar"><h2>Your tickets <span>{filtered.length}</span></h2><div className="sc-search"><Search size={17}/><input aria-label="Search tickets" placeholder="Search subject or ticket ID" value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="Filter ticket status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">In progress / pending</option><option value="DONE">Resolved / closed</option>{statuses.map(status=><option key={status} value={status}>{label(status)}</option>)}</select></div>
        {!filtered.length?<div className="sc-empty"><Headphones size={34}/><h3>{tickets.length?"No matching tickets":"You’re all caught up"}</h3><p>{tickets.length?"Try a different search or status filter.":"Need a hand? Create a ticket and describe what’s happening."}</p><button type="button" className="sc-secondary" onClick={()=>tickets.length?(setQuery(""),setFilter("ALL")):setShowForm(true)}>{tickets.length?"Clear filters":"Create your first ticket"}</button></div>:filtered.map(ticket=><button type="button" key={ticket.id} className={`sc-ticket-row ${selectedId===ticket.id?"is-selected":""}`} onClick={()=>{setSelectedId(ticket.id);setShowForm(false);setNotice("")}}><div className="sc-ticket-top"><span className="sc-reference">{ticket.reference}</span><span className={`sc-status status-${ticket.status.toLowerCase()}`}>{label(ticket.status)}</span></div><h3>{ticket.subject}</h3><p>{ticket.description||"View ticket details and conversation."}</p><div className="sc-ticket-meta"><span>{ticket.category||"General support"}</span><span><Clock3 size={13}/>{date(ticket.updatedAt||ticket.createdAt)}</span></div><div className="sc-ticket-bottom"><span>{ticket.assignee&&ticket.assignee!=="Unassigned"?`Assigned to ${ticket.assignee}`:"Awaiting assignment"}</span><span>View conversation <MessageCircle size={15}/></span></div></button>)}
      </div>
      {showForm&&<aside className="sc-panel"><header><div><h2>Raise a support ticket</h2><p>Tell us what you need help with.</p></div><button type="button" className="sc-icon-button" aria-label="Close new ticket" onClick={()=>setShowForm(false)}><X size={20}/></button></header><form onSubmit={create}>
        <label>Related requirement <small>Optional</small><select value={form.requirementId} onChange={e=>field("requirementId",e.target.value)}><option value="">General support issue</option>{requirements.map(r=><option key={r.id} value={r.id}>{r.reference||`REQ-${r.id}`} · {r.title}</option>)}</select></label>
        {form.requirementId?<p className="sc-form-hint">The subject and description will be taken from your selected requirement.</p>:<><label>Subject<input required maxLength={255} placeholder="e.g. Unable to connect to office Wi-Fi" value={form.subject} onChange={e=>field("subject",e.target.value)}/></label><label>Description<textarea required maxLength={4000} rows={5} placeholder="What happened? Include any error messages and steps you’ve already tried." value={form.description} onChange={e=>field("description",e.target.value)}/></label></>}
        <label>Category<select value={form.category} onChange={e=>field("category",e.target.value)}>{["General support","Hardware & devices","Network & connectivity","Software & applications","Orders & delivery","Billing & payments","Account & access"].map(c=><option key={c}>{c}</option>)}</select></label><p className="sc-form-hint">Avoid sharing passwords or card details in your ticket.</p><button className="sc-primary" disabled={busy} type="submit"><Send size={16}/>{busy?"Creating…":"Create support ticket"}</button>
      </form></aside>}
      {selected&&!showForm&&<aside className="sc-panel sc-detail"><header><div><span className="sc-reference">{selected.reference}</span><h2>{selected.subject}</h2></div><button type="button" className="sc-icon-button" aria-label="Close ticket details" onClick={()=>setSelectedId(null)}><X size={20}/></button></header><div className="sc-detail-body"><div className="sc-detail-tags"><span className={`sc-status status-${selected.status.toLowerCase()}`}>{label(selected.status)}</span></div><p className="sc-description">{selected.description}</p><dl><div><dt>Support specialist</dt><dd>{selected.assignee||"Awaiting assignment"}</dd></div><div><dt>Created</dt><dd>{date(selected.createdAt)}</dd></div><div><dt>Category</dt><dd>{selected.category||"General support"}</dd></div></dl>{selected.resolution&&<div className="sc-resolution"><b><CheckCircle2 size={16}/>Resolution</b><p>{selected.resolution}</p></div>}<div className="sc-conversation-heading"><h3>Conversation</h3><button type="button" disabled={busy||messagesLoading} onClick={refresh} aria-label="Refresh conversation"><RefreshCw size={15}/></button></div><div className="sc-conversation" aria-live="polite">{messagesLoading?<p>Loading conversation…</p>:messages.length?messages.map(message=><article key={message.id} className={`sc-message ${message.senderRole==="CUSTOMER"?"is-customer":""}`}><header><b>{message.senderRole==="CUSTOMER"?"You":message.senderName||"Support team"}</b><time>{date(message.createdAt)}</time></header><p>{message.message}</p></article>):<p className="sc-form-hint">No replies yet. Add more details here or check back for updates from your support team.</p>}</div>{finished(selected)?<div className="sc-reopen"><p>Still need help with this issue?</p><button type="button" className="sc-secondary" disabled={busy} onClick={reopen}>Reopen ticket</button></div>:<form className="sc-reply" onSubmit={sendReply}><label htmlFor="ticket-reply">Reply to your support team</label><textarea id="ticket-reply" required maxLength={3000} rows={3} placeholder="Add an update or ask a question…" value={reply} onChange={e=>setReply(e.target.value)}/><button className="sc-primary" type="submit" disabled={busy||messagesLoading||!reply.trim()}><Send size={16}/>{busy?"Sending…":"Send reply"}</button></form>}</div></aside>}
    </div>
  </section>;
}
