import { useEffect, useMemo, useState } from "react";
import UnifiedHeader from "./UnifiedHeader";
import { ArrowLeft, ArrowRight, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Cloud, CreditCard, Heart, Headphones, Laptop, MapPin, Menu, Monitor, Network, Package, Printer, Projector, Search, Server, ShieldCheck, ShoppingCart, SlidersHorizontal, Smartphone, Truck, Wifi, X, FileText, UsersRound } from "lucide-react";
import { addToCart, cartCount, clearCart, loadCart, saveCart } from "./cart";
import { get, send, sendPublic } from "./api";
import useCatalog from "./useCatalog";
import {rentalProduct,refreshCartProducts} from "./catalog";
import PromoCodeBox from "./PromoCodeBox";
import { useShopOffers } from "./OffersPage";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";

const LinkedInIcon = ({size=18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96C2 21.32 2.69 22 3.55 22h16.9c.86 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.31 2 20.45 2ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.52 2.79-1.52 2.99 0 3.55 1.97 3.55 4.53v5.24Z"/></svg>
);
const YouTubeIcon = ({size=13}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
);
const InstagramIcon = ({size=13}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
);

const todayInput = () => new Date().toISOString().slice(0,10);
const rentalPeriodCode = period => period==="Daily"?"DAY":period==="Weekly"?"WEEK":"MONTH";
const rentalUnitPrice = (monthly, period="MONTH") => {
  const value=Number(monthly||0);
  if(period==="DAY") return Math.max(1,Math.ceil(value/30*100)/100);
  if(period==="WEEK") return Math.max(1,Math.ceil(value/4*100)/100);
  return value;
};
const rentalUnitLabel = period => period==="DAY"?"day":period==="WEEK"?"week":"month";
const rentalDurationLabel = period => period==="DAY"?"Days":period==="WEEK"?"Weeks":"Months";
const phoneCountries = [
  ["🇦🇪", "+971", "UAE"],
  ["🇮🇳", "+91", "India"],
  ["🇸🇦", "+966", "Saudi Arabia"],
  ["🇶🇦", "+974", "Qatar"],
  ["🇴🇲", "+968", "Oman"],
  ["🇰🇼", "+965", "Kuwait"],
  ["🇧🇭", "+973", "Bahrain"],
];
const paymentOptions = [
  ["CARD", "Card", "Pay securely by card through Stripe."],
  ["APPLE_PAY", "Apple Pay", "Fast mobile wallet payment after confirmation through the payment link."],
  ["GOOGLE_PAY", "Google Pay", "Pay with a saved card after the secure payment link is issued."],
  ["PAY_ON_DELIVERY", "Pay on delivery", "Pay after confirmation when equipment is delivered or installed."],
  ["CASH_ON_DELIVERY", "Cash on delivery", "Cash payment can be collected during delivery or installation."],
  ["CARD_ON_DELIVERY", "Card on delivery", "Pay by card machine at delivery or installation where available."],
  ["BANK_TRANSFER", "Bank transfer", "Use the invoice number as transfer reference after order confirmation."],
  ["PAYMENT_LINK", "Payment link", "Open secure Stripe Checkout."],
];
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;
const paymentIconPath={APPLE_PAY:["apple-pay.svg"],GOOGLE_PAY:["google-pay.svg"],SAMSUNG_PAY:["samsung-pay.svg"],PAYPAL:["paypal.svg"],TAMARA:["tamara.svg"],CARD:["visa.svg","mastercard.svg"]};
function PaymentBrand({type}){const fallback={PAY_ON_DELIVERY:"COD",CASH_ON_DELIVERY:"AED",CARD_ON_DELIVERY:"POS",BANK_TRANSFER:"BANK",TABBY:"tabby",PAYMENT_LINK:"LINK"};const icons=paymentIconPath[type];return <span className={`rp-pay-brand ${type.toLowerCase().replaceAll("_","-")}`}>{icons?icons.map(icon=><img key={icon} src={`/payment-icons/${icon}`} alt="" loading="lazy"/>):fallback[type]||"PAY"}</span>}
function StripeCardBox({busy,onPay}){const stripe=useStripe(),elements=useElements();const[message,setMessage]=useState("");const[cardReady,setCardReady]=useState(false);const[cardError,setCardError]=useState("");
  if (!stripePromise) return (
    <div className="rp-stripe-box" role="status">
      <div className="rp-stripe-head"><b>Card payment unavailable</b></div>
      <p>Card payments are not available yet. Please choose another payment method to continue.</p>
    </div>
  );
  async function pay(){setMessage("");setCardError("");if(!cardReady){setCardError("Enter complete card details.");return}await onPay(async(order)=>{if(Number(order.amountDue)===0)return;if(!order.paymentClientSecret)throw new Error("Stripe payment was not created.");const card=elements.getElement(CardElement);const result=await stripe.confirmCardPayment(order.paymentClientSecret,{payment_method:{card}});if(result.error)throw new Error(result.error.message||"Card payment failed.");await send(`/orders/${order.id}/stripe/confirm`,"POST",{paymentIntentId:result.paymentIntent.id});setMessage("Card payment approved.");})}return <div className="rp-stripe-box"><div className="rp-stripe-head"><span><b>Card payment</b><small>Secure card checkout powered by Stripe Elements.</small></span><span className="rp-stripe-logos"><img src="/payment-icons/visa.svg" alt="Visa"/><img src="/payment-icons/mastercard.svg" alt="Mastercard"/></span></div><div className="rp-stripe-control"><label htmlFor="stripe-card-element">Card details</label><div id="stripe-card-element" className={`rp-stripe-field ${cardError?"has-error":""}`}><CardElement onChange={event=>{setCardReady(event.complete);setCardError(event.error?.message||"")}} options={{hidePostalCode:true,style:{base:{fontSize:"15px",color:"#123d2b",fontFamily:"Inter, system-ui, sans-serif",fontSmoothing:"antialiased","::placeholder":{color:"#8aa99c"},iconColor:"#008553"},invalid:{color:"#b91c1c",iconColor:"#b91c1c"}}}}/></div>{cardError&&<small className="rp-stripe-error">{cardError}</small>}</div><small className="rp-stripe-secure"><ShieldCheck size={14}/> Card details are encrypted by Stripe and never stored by Wefyx.</small>{message&&<p>{message}</p>}<button disabled={busy||!stripe||!elements} className="rp-primary" type="button" onClick={pay}>{busy?"Processing payment...":"Pay by Card"} <ArrowRight/></button></div>}

export function PublicHeader(props) {
  return <UnifiedHeader {...props} />;
}
export function PublicFooter() {
  return <><section className="rp-promises">{[[Headphones,"24/7 Expert Support","We’re always here to help"],[ShieldCheck,"Certified Engineers","Professional setup & support"],[CalendarDays,"Flexible Rentals","Short or long term options"],[Truck,"UAE-Wide Delivery","Fast & reliable logistics"],[Package,"Business-Friendly Service","Trusted by 500+ businesses"]].map(([I,t,s])=><div key={t}><I/><span><b>{t}</b><small>{s}</small></span></div>)}</section><footer className="rp-footer"><div className="rp-footer-brand"><a className="rp-logo" href="/">Wefyx<span>.pro</span><small>Smarter IT. Stronger Business.</small></a><p>Your trusted partner for IT services in the UAE. Reliable. Secure. Always On.</p><div className="rp-socials"><a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><LinkedInIcon size={18}/></a><a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><YouTubeIcon size={18}/></a><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon size={18}/></a></div></div><div><b>Services</b><a href="/services">IT Services</a><a href="/services">Managed Services</a><a href="/data-center">Data Center</a><a href="/services">AMC</a><a href="/rent">Rent Equipment</a></div><div><b>Company</b><a href="/about">About Us</a><a href="/about">Our Approach</a><a href="/register/employee">Employee Registration</a><a href="/register/vendor">Vendor Registration</a><a href="/contact">Contact Us</a></div><div><b>Support</b><a href="/account">Customer Account</a><a href="/services#requirement">Request a Quote</a><a href="/contact">FAQs</a></div><div className="rp-subscribe-col"><b>Stay Updated</b><p>Get the latest insights, offers and updates.</p><div className="rp-sub"><input placeholder="Enter your email address" aria-label="Email"/><button type="button" className="rp-sub-btn">Subscribe</button></div></div></footer><div className="rp-bottom-bar"><div className="rp-bottom-inner"><span>© 2026 Wefyx.pro. All rights reserved.</span><span>Crafted & Built by Prabha Technologies | prabhatech.com</span></div></div></>;
}
function Periods() { return <div className="rp-periods"><button>Daily</button><button>Weekly</button><button className="on">Monthly</button><button>Long Term</button></div> }
function ProductCard({p,index}) { const Icon=p[3]==="Mobility"?Smartphone:p[3]==="Security"?Camera:p[3]==="Projector"?Projector:p[3]==="Accessories"?Headphones:Wifi; const code=p[5],available=p[6]>0;const add=(event)=>{event.preventDefault();if(!available)return;addToCart({id:code,productId:code,name:p[0],spec:p[1],image:p[4],price:p[8],monthlyPrice:p[8],mode:"RENT",lockedMode:true,quantity:1,months:1});window.location.assign("/cart")};return <article className="rp-product"><div className="rp-product-img">{p[4]?<img src={p[4]} alt={p[0]}/>:<Icon className="rp-product-icon" aria-label={p[3]}/>}{p[7]&&<label>Featured</label>}<Heart/></div><h3><a href={`/rent/${encodeURIComponent(code)}`}>{p[0]}</a></h3><p>{p[1]}</p><b>{p[2]}</b><Periods/><a href={available?"/cart":"#"} onClick={add} aria-disabled={!available}><ShoppingCart/> {available?"Rent Now":"Out of stock"}</a></article> }

export function RentalCatalog() {
  const {products:catalog,loading,error,reload}=useCatalog();
  const [filter,setFilter]=useState(()=>new URLSearchParams(window.location.search).get("cat")||"All"),[search,setSearch]=useState(""),[inStock,setInStock]=useState(false),[sort,setSort]=useState("featured");
  const products=useMemo(()=>catalog.filter(product=>product.rentable).map(rentalProduct),[catalog]);
  const categories=Array.from(new Set(products.map(product=>product[3]))).sort();
  const shown=products.filter(product=>(filter==="All"||product[3]===filter)&&(!inStock||product[6]>0)&&`${product[0]} ${product[1]}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==="price"?a[8]-b[8]:Number(b[7])-Number(a[7])||a[0].localeCompare(b[0]));
  function reset(){setFilter("All");setSearch("");setInStock(false)}
  return <div className="rental-site"><PublicHeader/><main><section className="rp-rent-hero"><div><p>FLEXIBLE. AFFORDABLE. RELIABLE.</p><h1>Rent IT Equipment<br/>for Your Business</h1><span>Browse available equipment, current prices and rental options.</span><div className="rp-hero-advantages"><b><CalendarDays/> Flexible<br/>Rental Periods</b><b><Truck/> UAE Wide<br/>Delivery</b><b><Headphones/> Technical<br/>Support</b></div></div></section>
    <section className="rp-categories"><button onClick={()=>setFilter("All")}><Package/><span>All Categories</span></button>{categories.map(name=><button key={name} onClick={()=>setFilter(name)}><Package/><span>{name}</span></button>)}</section>
    <section className="rp-catalog"><aside className="rp-filters"><div><b>Filters</b><button onClick={reset}>Clear All</button></div><label className="rp-filter-search"><Search/><input aria-label="Search rental products" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."/></label><h4>Category</h4>{categories.map(name=><label key={name}><input type="checkbox" checked={filter===name} onChange={()=>setFilter(filter===name?"All":name)}/>{name} <small>({products.filter(product=>product[3]===name).length})</small></label>)}<h4>Availability</h4><label><input type="checkbox" checked={inStock} onChange={e=>setInStock(e.target.checked)}/>In stock only</label></aside>
    <div className="rp-products-area"><p className="rp-bread">Home &nbsp;›&nbsp; Rent Equipment</p><div className="rp-list-title"><div><h2>Rental Equipment</h2><p>Current equipment, pricing and availability.</p></div><select aria-label="Sort rental products" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="price">Lowest price</option></select></div><p className="rp-count">{shown.length} products</p>{loading?<p role="status">Loading products…</p>:error?<div role="alert"><p>{error}</p><button onClick={reload}>Retry</button></div>:!shown.length?<p>{products.length?"No products match your filters.":"No rental products available yet."}</p>:<div className="rp-products">{shown.map(product=><ProductCard p={product} key={product[5]}/>)}</div>}</div></section>
  </main><PublicFooter/></div>;
}

export function RentalDetail() {
  const {products,loading,error:catalogError}=useCatalog();
  const code=decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop());
  const product=products.find(item=>item.code===code&&item.rentable);
  const error=catalogError||(!loading&&!product?"This product is not available for rental.":"");
  const [period,setPeriod]=useState("Monthly"),[quantity,setQuantity]=useState(1),[months,setMonths]=useState(1),[startDate,setStartDate]=useState(todayInput());
  const [message,setMessage]=useState("");
  const monthlyRate=Number(product?.rentalPrice??0),periodCode=rentalPeriodCode(period),rate=rentalUnitPrice(monthlyRate,periodCode),stock=Number(product?.stockQuantity??0);
  function addRental(goToCart){
    setMessage("");const existing=loadCart().filter(item=>item.id===product.code).reduce((sum,item)=>sum+Number(item.quantity||1),0);
    if(quantity+existing>stock){setMessage(`Only ${stock} units are available; ${existing} already in your cart.`);return}
    if(startDate<todayInput()){setMessage("Choose today or a future start date.");return}
    addToCart({id:product.code,productId:product.code,name:product.name,spec:product.specification,image:product.imageUrl,price:monthlyRate,monthlyPrice:monthlyRate,mode:"RENT",lockedMode:true,quantity,months:periodCode==="MONTH"?months:1,rentalPeriod:periodCode,rentalDuration:months,startDate});
    if(goToCart)window.location.assign("/cart");else setMessage("Added to cart.");
  }
  return <div className="rental-site detail-site"><PublicHeader/><main className="rp-detail">
    {loading?<p role="status">Loading product…</p>:error?<div role="alert"><h1>Product unavailable</h1><p>{error}</p><a href="/rent">Back to rental catalog</a></div>:<>
      <p className="rp-bread"><a href="/rent">Rent Equipment</a> &nbsp;›&nbsp; {product.category} &nbsp;›&nbsp; {product.name}</p>
      <section className="rp-detail-main">
        <div className="rp-gallery"><div className="rp-gallery-stage">{product.imageUrl?<img src={product.imageUrl} alt={product.name}/>:<Package size={96} aria-label="Product image unavailable"/>}</div></div>
        <div className="rp-copy"><div className="rp-stock-row"><label>{stock>0?`${stock} available`:"Out of stock"}</label></div><h1>{product.name}</h1><h2>{product.specification}</h2><p>{product.description}</p>{product.brand&&<p>Brand: {product.brand}</p>}</div>
        <aside className="rp-price"><h2>Rental Price</h2><div className="rp-price-tabs">{["Daily","Weekly","Monthly","Long Term"].map(value=><button key={value} onClick={()=>{setPeriod(value);setMonths(1)}} className={period===value?"on":""}>{value}</button>)}</div><h1>{period==="Long Term"?"Request a quote":`AED ${rate} / ${rentalUnitLabel(periodCode)}`}</h1>
          <div className="rp-price-info"><b>AED {rentalUnitPrice(monthlyRate,"DAY")}<small>/ day</small></b><b>AED {rentalUnitPrice(monthlyRate,"WEEK")}<small>/ week</small></b><b>AED {monthlyRate}<small>/ month</small></b></div>
          <div className="rp-input-grid"><label>Quantity <span className="rp-detail-qty"><button aria-label="Reduce quantity" disabled={quantity<=1} onClick={()=>setQuantity(quantity-1)}>−</button>{quantity}<button aria-label="Increase quantity" disabled={quantity>=stock} onClick={()=>setQuantity(quantity+1)}>+</button></span></label><label>{rentalDurationLabel(periodCode)} <select value={months} onChange={e=>setMonths(Number(e.target.value))}>{(periodCode==="MONTH"?[1,3,6,12]:periodCode==="WEEK"?[1,2,4,8,12]:[1,2,3,7,14,30]).map(n=><option value={n} key={n}>{n} {periodCode==="DAY"?"Day(s)":periodCode==="WEEK"?"Week(s)":"Month(s)"}</option>)}</select></label><label>Start Date <input type="date" min={todayInput()} value={startDate} onChange={e=>setStartDate(e.target.value)}/></label></div>
          <p className="rp-security"><ShieldCheck/> Refundable Security Deposit <b>20%</b></p>{message&&<p role="status">{message}</p>}
          {period==="Long Term"?<a href="/services#requirement" className="rp-primary">Request Quote</a>:<button type="button" disabled={stock===0} onClick={()=>addRental(true)} className="rp-primary"><ShoppingCart/> {stock===0?"Out of stock":"Rent Now"}</button>}
          <button type="button" disabled={stock===0||period==="Long Term"} onClick={()=>addRental(false)} className="rp-outline"><ShoppingCart/> Add to Cart</button>
        </aside>
      </section>
      <section className="rp-detail-bottom"><div className="rp-description"><h2>Product Description</h2><p>{product.description||"Contact our team for further product details."}</p><h2>Specifications</h2><p>{product.specification||"Contact our team for specifications."}</p></div><aside className="rp-install"><h2>Need Setup or Managed IT Support?</h2><p>Ask our team about installation and support for your rental.</p><a href="/services#site-visit" className="rp-primary">Add Installation Service</a></aside></section>
    </>}
  </main><PublicFooter/></div>;
}

export function CartPage() {
  const [items,setItems]=useState(loadCart);
  const [busy,setBusy]=useState(false),[checkoutError,setCheckoutError]=useState("");
  const emptyAddress={label:"Office",contactName:"",phone:"",addressLine:"",emirate:"Dubai",country:"United Arab Emirates",latitude:null,longitude:null,defaultAddress:false};
  const [addresses,setAddresses]=useState([]);
  const [selectedAddressId,setSelectedAddressId]=useState("");
  const [addressForm,setAddressForm]=useState(emptyAddress);
  const [addressConfirmed,setAddressConfirmed]=useState(false);
  const [showAddressForm,setShowAddressForm]=useState(false);
  const [editingAddressId,setEditingAddressId]=useState(null);
  const [phoneCode,setPhoneCode]=useState("+971");
  const [addressNotice,setAddressNotice]=useState("");
  const [locating,setLocating]=useState(false);
  const [onlinePaymentAvailable,setOnlinePaymentAvailable]=useState(false);
  useEffect(()=>{get("/bookings/catalog").then(catalog=>setOnlinePaymentAvailable(catalog.checkoutAvailable)).catch(()=>{})},[]);
  const [paymentMethod,setPaymentMethod]=useState("PAY_ON_DELIVERY");
  const [termsAccepted,setTermsAccepted]=useState(false);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const offers=useShopOffers();
  const [promoCode,setPromoCode]=useState(()=>sessionStorage.getItem("wefyx-promo-code")||"");
  const [serverPricing,setServerPricing]=useState(null);
  const [pricingError,setPricingError]=useState("");
  const [pricingLoading,setPricingLoading]=useState(false);
  const {products:catalog,loading:catalogLoading,error:catalogError}=useCatalog();
  useEffect(()=>{if(!catalogLoading&&!catalogError)setItems(current=>refreshCartProducts(current,catalog))},[catalog,catalogLoading,catalogError]);
  const suggestions=catalog.filter(product=>product.stockQuantity>0&&(product.purchasable||product.rentable)&&!items.some(item=>item.id===product.code)).slice(0,5).map(product=>({id:product.code,productId:product.code,name:product.name,spec:product.specification,image:product.imageUrl,price:Number(product.purchasable?product.buyPrice:product.rentalPrice),monthlyPrice:Number(product.rentalPrice),mode:product.purchasable?"BUY":"RENT"}));
  useEffect(()=>{saveCart(items)},[items]);
  async function loadAddresses(){
    if(!localStorage.getItem("wefyx-token"))return;
    try{
      const rows=await get("/profile/addresses");
      const list=Array.isArray(rows)?rows:[];
      setAddresses(list);
      const chosen=list.find(item=>item.defaultAddress)||list[0];
      setSelectedAddressId(current=>list.some(item=>String(item.id)===current)?current:chosen?String(chosen.id):"");
      setAddressConfirmed(list.length>0);
    }catch{}
  }
  useEffect(()=>{loadAddresses()},[]);
  const update=(id,mode,change)=>setItems(current=>{const next=current.map(item=>item.id===id&&item.mode===mode?{...item,...change}:item);return catalogLoading||catalogError?next:refreshCartProducts(next,catalog)});
  const selected=items.filter(item=>item.selected);
  const catalogReady=!catalogLoading&&!catalogError&&!selected.some(item=>item.unavailable);
  const itemPeriod=item=>item.rentalPeriod||"MONTH";
  const itemDuration=item=>Math.max(1,Number(item.rentalDuration||item.months||1));
  const itemUnit=item=>item.mode==="BUY"?Number(item.price||0):rentalUnitPrice(Number(item.monthlyPrice||item.price||0),itemPeriod(item));
  const itemTotal=item=>itemUnit(item)*Number(item.quantity||1)*(item.mode==="BUY"?1:itemDuration(item));
  const cartSubtotal=selected.reduce((sum,item)=>sum+itemTotal(item),0);
  const pricingItems=selected.map(item=>({productId:item.productId||item.id,mode:item.mode||"RENT",quantity:Number(item.quantity||1),months:Number(item.months||1),rentalPeriod:itemPeriod(item),rentalDuration:itemDuration(item),startDate:item.startDate||todayInput()}));
  const pricingKey=JSON.stringify({items:pricingItems,promoCode,catalogVersion:catalog.map(product=>[product.code,product.version])});
  useEffect(()=>{
    let cancelled=false;
    sessionStorage.setItem("wefyx-promo-code",promoCode);
    setPricingError("");
    if(!pricingItems.length){setServerPricing(null);setPricingLoading(false);return}
    setPricingLoading(true);
    sendPublic("/orders/preview","POST",JSON.parse(pricingKey)).then(quote=>{if(!cancelled)setServerPricing({...quote,key:pricingKey})}).catch(error=>{if(!cancelled){setServerPricing(null);setPricingError(error.message||"Unable to check this offer.")}}).finally(()=>{if(!cancelled)setPricingLoading(false)});
    return ()=>{cancelled=true};
  },[pricingKey]);
  const quoteReady=catalogReady&&serverPricing?.key===pricingKey;
  const subtotal=quoteReady?Number(serverPricing.subtotal):cartSubtotal;
  const discountAmount=quoteReady?Number(serverPricing.discountAmount):0;
  const vat=quoteReady?Number(serverPricing.vat):Math.round((subtotal-discountAmount)*5)/100;
  const securityDeposit=quoteReady?Number(serverPricing.securityDeposit):selected.filter(item=>item.mode==="RENT").reduce((sum,item)=>sum+itemTotal(item),0)*.20;
  const totalAmount=quoteReady?Number(serverPricing.amountDue):subtotal-discountAmount+vat+securityDeposit;
  const money=value=>`AED ${value.toLocaleString("en-AE",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const allSelected=items.length>0&&items.every(item=>item.selected);
  const addSuggestion=item=>setItems(current=>current.some(x=>x.id===item.id&&x.mode===item.mode)?current:[...current,{...item,quantity:1,months:1,rentalPeriod:"MONTH",rentalDuration:1,startDate:todayInput(),selected:true}]);
  const selectedAddress=addresses.find(item=>String(item.id)===selectedAddressId);
  const addressReady=!!selectedAddress;
  const fieldAddress=(key,value)=>{setAddressForm(current=>({...current,[key]:value}));setAddressNotice("");};
  const phoneLocalValue=addressForm.phone.startsWith(phoneCode)?addressForm.phone.slice(phoneCode.length).trim():addressForm.phone.replace(/^\+\d+\s*/,"");
  const updatePhoneCode=(code)=>{setPhoneCode(code);setAddressForm(current=>({...current,phone:`${code} ${String(current.phone||"").replace(/^\+\d+\s*/,"").trim()}`.trim()}));setAddressNotice("");};
  const updatePhoneNumber=(value)=>fieldAddress("phone",`${phoneCode} ${value.replace(/\D/g, "").slice(0, 10)}`.trim());
  function editAddress(address){
    const phone=String(address.phone||"").replace(/[^+0-9]/g, "");
    const code=[...phoneCountries].sort((a,b)=>b[1].length-a[1].length).find(([,prefix])=>phone.startsWith(prefix))?.[1]||"+971";
    setPhoneCode(code);
    setAddressForm({...emptyAddress,...address,phone:phone.startsWith(code)?`${code} ${phone.slice(code.length)}`:`${code} ${phone}`});
    setEditingAddressId(address.id);
    setAddressConfirmed(false);
    setShowAddressForm(true);
    setCheckoutError("");
    setAddressNotice("");
  }
  async function saveAddress(){if(!localStorage.getItem("wefyx-token")){window.location.assign(`/login?returnTo=${encodeURIComponent("/cart")}`);return}if(!addressForm.contactName.trim()){setCheckoutError("Enter the contact name.");return}if(!/^\d{10}$/.test(phoneLocalValue)){setCheckoutError("Enter a 10-digit phone number, excluding the country code.");return}if(!addressForm.addressLine.trim()){setCheckoutError("Enter a delivery address before saving.");return}setBusy(true);setCheckoutError("");try{const saved=await send(editingAddressId?`/profile/addresses/${editingAddressId}`:"/profile/addresses",editingAddressId?"PUT":"POST",addressForm);setAddresses(current=>[saved,...current.filter(item=>item.id!==saved.id)]);setSelectedAddressId(String(saved.id));setAddressForm(emptyAddress);setEditingAddressId(null);setAddressNotice("Delivery address saved.");setShowAddressForm(false);setAddressConfirmed(true);await loadAddresses();}catch(error){setCheckoutError(error.message||"Unable to save address.")}finally{setBusy(false)}}
  function useCurrentLocation(){setAddressNotice("");setCheckoutError("");if(!navigator.geolocation){setCheckoutError("Current location is not supported in this browser.");return}setLocating(true);navigator.geolocation.getCurrentPosition(async(position)=>{const latitude=position.coords.latitude,longitude=position.coords.longitude;try{const resolved=await get(`/profile/reverse-geocode?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`);setAddressForm(current=>({...current,latitude,longitude,addressLine:resolved.addressLine||current.addressLine||`Current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,emirate:resolved.emirate||current.emirate,country:resolved.country||current.country}));setAddressNotice("Current location address added. Add flat, building, or office details if needed before checkout.");}catch(error){setAddressForm(current=>({...current,latitude,longitude,addressLine:current.addressLine||`Current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}));setCheckoutError(error.message||"Location found, but address lookup failed. Please add address details manually.");}finally{setLocating(false);}},()=>{setLocating(false);setCheckoutError("Unable to get current location. Please allow location access or enter the address manually.");},{enableHighAccuracy:true,timeout:10000});}
  async function checkout(confirmStripe){if(pricingLoading||!quoteReady){setCheckoutError(pricingError||"Wait for your order total to be checked.");return}if(!selected.length){setCheckoutError("Select at least one cart item.");return}if(!localStorage.getItem("wefyx-token")){window.location.assign(`/login?returnTo=${encodeURIComponent("/cart")}`);return}if(!addressReady){setCheckoutError("Choose or enter a delivery address before checkout.");return}if(!termsAccepted){setCheckoutError("Accept the rental, refund, delivery and VAT terms before checkout.");return}if(paymentMethod==="CARD"&&totalAmount>0&&!confirmStripe){setCheckoutError("Enter card details before placing the order.");return}const deliveryAddress=selectedAddress?{id:selectedAddress.id}:addressForm;const billingAddress=selectedAddress?{label:selectedAddress.label,contactName:selectedAddress.contactName,phone:selectedAddress.phone,addressLine:selectedAddress.addressLine,emirate:selectedAddress.emirate,country:selectedAddress.country}:addressForm;setBusy(true);setCheckoutError("");try{const order=await send("/orders","POST",{deliveryAddress,billingAddress,paymentMethod,termsAccepted,promoCode:serverPricing.promoCode,termsVersion:"2026-10-08",items:selected.map(item=>({productId:item.productId||item.id,name:item.name,mode:item.mode||"RENT",unitPrice:itemUnit(item),quantity:item.quantity,months:item.mode==="BUY"?1:(itemPeriod(item)==="MONTH"?itemDuration(item):1),rentalPeriod:item.mode==="BUY"?null:itemPeriod(item),rentalDuration:item.mode==="BUY"?1:itemDuration(item),startDate:item.mode==="BUY"?null:(item.startDate||todayInput()),lineTotal:null}))});if(confirmStripe)await confirmStripe(order);clearCart();sessionStorage.removeItem("wefyx-promo-code");setItems([]);if(order.checkoutUrl){window.location.assign(order.checkoutUrl);return}window.location.assign(`/account/orders?created=${encodeURIComponent(order.reference)}`)}catch(error){setCheckoutError(error.message||"Checkout failed. Please try again.")}finally{setBusy(false)}}
  return <div className="rental-site cart-site"><PublicHeader cartCount={cartCount(items)}/><main className="rp-cart">
    <p className="rp-bread">Home &nbsp;›&nbsp; Cart</p>
    <div className="rp-cart-heading"><div><h1>Your Cart</h1><p>Review your items, choose buy or rent, and proceed to checkout.</p></div><a href="/rent"><ArrowLeft size={15}/> Continue Shopping</a></div>
    <div className="rp-cart-layout"><div className="rp-cart-main"><section className={`rp-address-step ${addressConfirmed?"is-confirmed":""}`} id="cart-delivery" aria-label="Delivery address">
      <header className="rp-address-step-head"><span className="rp-step-number">1</span><div><h2>Delivery Address {addressConfirmed&&<Check size={17}/>}</h2>{addressConfirmed&&selectedAddress&&<p><b>{selectedAddress.contactName}</b> · {selectedAddress.phone}<br/>{selectedAddress.addressLine}, {selectedAddress.emirate}</p>}</div>{addressConfirmed&&<button type="button" onClick={()=>setAddressConfirmed(false)}>Change</button>}</header>
      {!addressConfirmed&&<div className="rp-address-step-body">
        <div className="rp-address-options">{addresses.map(address=>{
          const active=String(address.id)===selectedAddressId&&!showAddressForm;
          return <div key={address.id} className={`rp-address-option ${active?"is-active":""}`}>
            <label><input type="radio" name="delivery-address" checked={active} onChange={()=>{setSelectedAddressId(String(address.id));setAddressConfirmed(true);setShowAddressForm(false);setCheckoutError("")}}/><span><span className="rp-address-person"><b>{address.contactName}</b><small>{address.label}</small><b>{address.phone}</b></span><span className="rp-address-lines">{address.addressLine}, {address.emirate}, {address.country}</span>{address.defaultAddress&&<span className="rp-address-default">Default address</span>}</span></label>
            <button type="button" className="rp-edit-address" aria-label={`Edit address for ${address.contactName}`} onClick={()=>editAddress(address)}>Edit</button>

          </div>
        })}</div>
        {!showAddressForm?<button type="button" className="rp-add-address" onClick={()=>{setEditingAddressId(null);setAddressForm(emptyAddress);setShowAddressForm(true);setCheckoutError("");setAddressNotice("")}}><span>＋</span> Add a new address</button>:<form className="rp-new-address" onSubmit={event=>{event.preventDefault();saveAddress()}}>
          <h3>{editingAddressId?"Edit address":"Add a new address"}</h3>
          <button disabled={locating} className="rp-location-button" type="button" onClick={useCurrentLocation}><MapPin size={15}/>{locating?"Locating…":"Use my current location"}</button>
          <div className="rp-address-form-grid">
            <label>Full name<input required autoComplete="name" value={addressForm.contactName} onChange={e=>fieldAddress("contactName",e.target.value)} placeholder="Contact name"/></label>
            <label>Mobile number<span className="rp-phone-field"><select aria-label="Country code" value={phoneCode} onChange={e=>updatePhoneCode(e.target.value)}>{phoneCountries.map(([flag,code,name])=><option value={code} key={code}>{flag} {code} {name}</option>)}</select><input required type="tel" inputMode="numeric" autoComplete="tel-national" aria-label="Phone number (10 digits)" maxLength={10} pattern="[0-9]{10}" value={phoneLocalValue} onChange={e=>updatePhoneNumber(e.target.value)} placeholder="10-digit phone number"/></span></label>
            <label className="rp-address-wide">Address (building, office and street)<textarea required rows="3" autoComplete="street-address" value={addressForm.addressLine} onChange={e=>fieldAddress("addressLine",e.target.value)} placeholder="Building, flat or office, street and landmark"/></label>
            <label>City / Emirate<input required autoComplete="address-level1" value={addressForm.emirate} onChange={e=>fieldAddress("emirate",e.target.value)}/></label>
            <label>Country<input required autoComplete="country-name" value={addressForm.country} onChange={e=>fieldAddress("country",e.target.value)}/></label>
          </div>
          <fieldset className="rp-address-type"><legend>Address type</legend>{[...new Set(["Home","Office",addressForm.label].filter(Boolean))].map(type=><label key={type}><input type="radio" name="address-type" value={type} checked={addressForm.label===type} onChange={()=>fieldAddress("label",type)}/>{type}</label>)}</fieldset>
          <label className="rp-address-default-toggle"><input type="checkbox" checked={addressForm.defaultAddress} onChange={e=>fieldAddress("defaultAddress",e.target.checked)}/> Make this my default address</label>
          <div className="rp-address-form-actions"><button className="rp-deliver-button" disabled={busy} type="submit">{busy?"Saving…":"Save and deliver here"}</button><button type="button" onClick={()=>{setShowAddressForm(false);setEditingAddressId(null);setAddressForm(emptyAddress);setCheckoutError("")}}>Cancel</button></div>
          {addressNotice&&<p role="status">{addressNotice}</p>}
        </form>}
        {checkoutError&&!checkoutOpen&&<p className="rp-checkout-error" role="alert">{checkoutError}</p>}
      </div>}
    </section><section className="rp-cart-items" id="cart-order-review">
      <header><label><input type="checkbox" checked={allSelected} onChange={e=>setItems(current=>current.map(item=>({...item,selected:e.target.checked})))}/> Select All Items ({items.length})</label><span className="rp-cart-selected-count">{selected.length} selected</span></header>
      {items.map(item=><article key={`${item.id}:${item.mode}`}>
        <input className="rp-cart-check" aria-label={`Select ${item.name}`} type="checkbox" checked={item.selected} onChange={e=>update(item.id,item.mode,{selected:e.target.checked})}/>
        <img src={item.image} alt={item.name}/>
        <div className="rp-cart-item-name"><b>{item.name}</b><p>{item.spec}</p><small>{catalogLoading?"Checking availability…":item.unavailable?"Unavailable or quantity exceeds stock":`${item.stockQuantity} available`}</small></div>
        <div className="rp-toggle"><button type="button" className="on" disabled>{item.mode==="BUY"?"Buy":"Rent"}</button></div>
        <label className="rp-qty">Quantity <span><button type="button" onClick={()=>update(item.id,item.mode,{quantity:Math.max(1,item.quantity-1)})}>−</button>{item.quantity}<button type="button" disabled={catalogLoading||catalogError||item.quantity>=item.stockQuantity} onClick={()=>update(item.id,item.mode,{quantity:item.quantity+1})}>+</button></span></label>
        <label className="rp-duration">{item.mode==="BUY"?"Purchase":"Rental"} {item.mode==="BUY"?<span className="mt-2 block">One-time</span>:<><select value={itemPeriod(item)} onChange={e=>update(item.id,item.mode,{rentalPeriod:e.target.value,rentalDuration:1,months:e.target.value==="MONTH"?1:1})}>{[["DAY","Daily"],["WEEK","Weekly"],["MONTH","Monthly"]].map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><input type="number" min="1" max={itemPeriod(item)==="MONTH"?36:365} value={itemDuration(item)} onChange={e=>update(item.id,item.mode,{rentalDuration:Math.max(1,Number(e.target.value||1)),months:itemPeriod(item)==="MONTH"?Math.max(1,Number(e.target.value||1)):1})}/><input type="date" value={item.startDate||todayInput()} onChange={e=>update(item.id,item.mode,{startDate:e.target.value})}/></>}</label>
        <strong>{money(itemUnit(item))}<small>{item.mode==="BUY"?"per item":`per ${rentalUnitLabel(itemPeriod(item))} / each`}</small><em>{item.mode==="BUY"?`Total (${item.quantity})`:`Total (${itemDuration(item)} ${rentalUnitLabel(itemPeriod(item))}${itemDuration(item)===1?"":"s"})`}</em>{money(itemTotal(item))}</strong>
        <button className="rp-remove" aria-label={`Remove ${item.name}`} onClick={()=>setItems(current=>current.filter(x=>!(x.id===item.id&&x.mode===item.mode)))}><X size={16}/></button>
      </article>)}
      {items.length===0&&<p className="rp-empty-cart">Your cart is empty. <a href="/rent">Explore rental equipment</a></p>}
      <aside className="rp-cart-service"><ShieldCheck/><span><b>Need Installation or Configuration?</b><small>Add professional setup, installation and on-site support for your rented equipment.</small></span><a href="/services#site-visit">＋ &nbsp; Add Services</a></aside>
</section></div><aside className="rp-checkout-teaser"><h2>Order Summary</h2>{catalogError&&<p role="alert">Unable to refresh products: {catalogError}</p>}<PromoCodeBox offers={offers} items={selected} code={promoCode} onApply={setPromoCode} discount={discountAmount} error={pricingError} loading={pricingLoading}/><p>Selected items <b>{selected.length}</b></p><p>Subtotal <b>{money(subtotal)}</b></p>{discountAmount>0&&<p className="rp-discount-line">Offer savings ({serverPricing.promoCode}) <b>−{money(discountAmount)}</b></p>}<p>VAT (5%) <b>{money(vat)}</b></p>{securityDeposit>0&&<p>Refundable deposit <b>{money(securityDeposit)}</b></p>}<strong>Total Amount <b>{money(totalAmount)}</b></strong>{checkoutError&&!checkoutOpen&&<p className="rp-checkout-error">{checkoutError}</p>}<button disabled={!selected.length||pricingLoading||!quoteReady} className="rp-primary" type="button" onClick={()=>{if(!selected.length){setCheckoutError("Select at least one cart item.");return}if(!localStorage.getItem("wefyx-token")){window.location.assign(`/login?returnTo=${encodeURIComponent("/cart")}`);return}if(!addressReady){setCheckoutError("Add a delivery address before continuing to payment.");document.getElementById("cart-delivery")?.scrollIntoView({behavior:"smooth",block:"start"});return}setCheckoutError("");setCheckoutOpen(true)}}>Continue to Payment <ArrowRight/></button><div className="rp-summary-actions"><a href="/services#requirement">Request a Quotation</a><button type="button" onClick={()=>saveCart(items)}>Save Cart</button></div></aside><div className={`rp-cart-side ${checkoutOpen?"is-open":""}`} role="dialog" aria-modal="true" aria-label="Checkout"><div className="rp-checkout-modal-head"><div><small>Secure checkout</small><h2>Payment & Summary</h2></div><button type="button" aria-label="Close checkout" onClick={()=>setCheckoutOpen(false)}><X size={18}/></button></div><aside className="rp-summary rp-payment-panel"><h2>Payment Method</h2>{!onlinePaymentAvailable&&<p className="mb-3 text-sm">Online payments are awaiting provider setup. You can use a delivery or bank-transfer payment option.</p>}<div className="grid gap-2">{paymentOptions.filter(([value])=>onlinePaymentAvailable||!["CARD","APPLE_PAY","GOOGLE_PAY","PAYMENT_LINK"].includes(value)).map(([value,title,detail])=><label key={value} className={`flex gap-3 rounded-lg border p-3 text-xs ${paymentMethod===value?"border-emerald-500 bg-emerald-50":"border-slate-200 bg-white"}`}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod===value} onChange={e=>setPaymentMethod(e.target.value)} className="mt-1 accent-emerald-600"/><span><b className="flex items-center gap-1"><PaymentBrand type={value}/>{title}</b><small className="mt-1 block leading-5 text-slate-600">{detail}</small></span></label>)}</div></aside><aside className="rp-summary rp-payment-summary"><h2>Order Summary</h2><div className="rp-delivery-review"><div><b>Deliver to {selectedAddress?.contactName}</b><p>{selectedAddress?.addressLine}, {selectedAddress?.emirate}</p></div><button type="button" onClick={()=>{setCheckoutOpen(false);setAddressConfirmed(false);document.getElementById("cart-delivery")?.scrollIntoView({behavior:"smooth",block:"start"})}}>Change</button></div><p>Items ({selected.length}) <b>{money(subtotal)}</b></p><p>Delivery <b>{money(0)}</b></p><p>Setup / Installation (Optional) <b>{money(0)}</b></p>{discountAmount>0&&<p className="rp-discount-line">Offer savings ({serverPricing.promoCode}) <b>−{money(discountAmount)}</b></p>}<p>VAT (5%) <b>{money(vat)}</b></p>{securityDeposit>0&&<p>Refundable security deposit <b>{money(securityDeposit)}</b></p>}<strong>Total Amount <b>{money(totalAmount)}</b></strong><label className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-600"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1 accent-emerald-600"/><span>I agree to the <a className="font-bold text-emerald-700" href="/rental-terms">rental terms</a>, <a className="font-bold text-emerald-700" href="/refund-policy">refund policy</a>, delivery terms, cancellation terms and VAT invoice details.</span></label>{checkoutError&&<p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{checkoutError}</p>}{paymentMethod==="CARD"&&totalAmount>0?<Elements stripe={stripePromise}><StripeCardBox busy={busy||!selected.length||pricingLoading||!quoteReady} onPay={checkout}/></Elements>:<button disabled={busy||!selected.length||pricingLoading||!quoteReady} className="rp-primary" type="button" onClick={() => checkout()}>{busy?"Placing order...":"Place Order"} <ArrowRight/></button>}<div className="rp-cart-or">OR</div><div className="rp-summary-actions"><a href="/services#requirement">Request a Quotation</a><button type="button" onClick={()=>saveCart(items)}>Save Cart</button></div></aside><aside className="rp-cart-assurance">{[[CalendarDays,"Flexible Rental Periods","Daily, Weekly, Monthly or Long-Term"],[Truck,"UAE Wide Delivery","Fast and reliable delivery across UAE"],[ShieldCheck,"Secure Transactions","Your data and payments are protected"],[Headphones,"Dedicated Support","Our team is here to help you"]].map(([Icon,title,detail])=><div key={title}><Icon/><span><b>{title}</b><small>{detail}</small></span></div>)}</aside></div></div>
    {suggestions.length>0&&<><div className="rp-related-heading"><h2>You Might Also Need</h2><a href="/rent">View All <ArrowRight size={14}/></a></div><div className="rp-cart-related">{suggestions.map(item=><article key={item.id}><img src={item.image} alt={item.name}/><h3>{item.name}</h3><p>{item.spec}</p><b>{money(item.price)}{item.mode==="RENT"?" / month":""}</b><button type="button" onClick={()=>addSuggestion(item)}><ShoppingCart size={15}/> {items.some(x=>x.id===item.id&&x.mode===item.mode)?"Added":"Add to Cart"}</button></article>)}</div></>}
  </main><PublicFooter/></div>;
}
