import { useShopOffers, offerCopy } from "./OffersPage";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Headphones,
  Heart,
  Laptop,
  Monitor,
  Network,
  Package,
  Printer,
  Projector,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Truck,
  Wifi,
  X
} from "lucide-react";
import UnifiedHeader from "./UnifiedHeader";
import { PublicFooter } from "./RentalPages";
import AIQuotationModal from "./AIQuotationModal";
import { addToCart, cartCount, loadCart, saveCart, CART_EVENT } from "./cart";
import useCatalog from "./useCatalog";
import {shopProduct} from "./catalog";

export default function ShopPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState(()=>new URLSearchParams(window.location.search).get("q")||"");
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const {products:liveProducts,loading:catalogLoading,error:catalogError,reload:reloadCatalog}=useCatalog();
  const [cartItems, setCartItems] = useState(loadCart);
  const offers=useShopOffers().filter(offer=>offer.mode!=="RENT");

  const catalogProducts = useMemo(()=>liveProducts.filter(product=>product.purchasable).map(shopProduct),[liveProducts]);
  const cartQuantity = cartCount(cartItems);
  const cartKeyFor = (product) => `${product.code}:BUY`;
  const cartQuantityFor = (product) => {
    const key = cartKeyFor(product);
    return cartItems.filter((item) => `${item.id}:${item.mode || "RENT"}` === key).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  };
  const updateProductQuantity = (product, change) => {
    const key = cartKeyFor(product);
    const nextCart = loadCart()
      .map((item) => {
        const itemKey = `${item.id}:${item.mode || "RENT"}`;
        if (itemKey !== key) return item;
        return { ...item, quantity: Math.max(0, Number(item.quantity || 1) + change), selected: true };
      })
      .filter((item) => Number(item.quantity || 0) > 0);
    setCartItems(saveCart(nextCart));
  };
  const removeProduct = (product) => {
    const key = cartKeyFor(product);
    const nextCart = loadCart().filter((item) => `${item.id}:${item.mode || "RENT"}` !== key);
    setCartItems(saveCart(nextCart));
  };

  const categories = [{name:"All",label:"All Products"},...Array.from(new Set(catalogProducts.map(product=>product.category))).sort().map(name=>({name,label:name}))];

  const filtered = useMemo(() => {
    return catalogProducts.filter((p) => {
      const matchCat = filter === "All" || p.category === filter;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.specs.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [filter, search, catalogProducts]);

  const money = (v) =>
    `AED ${v.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`;

  const addProduct = (product) => {
    if(cartQuantityFor(product)>=product.stockQuantity)return;
    const code = product.code;
    const nextCart = addToCart({ id: code, productId: code, name: product.name, spec: product.specs, image: product.image, price: product.price, mode: "BUY", lockedMode: true, quantity: 1, months: 1 });
    setCartItems(nextCart);
    setSelectedProduct(product.name);
    setTimeout(() => setSelectedProduct(null), 2500);
  };
  useEffect(() => {
    const refreshCart = (event) => setCartItems(Array.isArray(event.detail) ? event.detail : loadCart());
    window.addEventListener(CART_EVENT, refreshCart);
    window.addEventListener("storage", refreshCart);
    return () => {
      window.removeEventListener(CART_EVENT, refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <UnifiedHeader cartCount={cartQuantity} onOpenQuote={() => setShowQuoteModal(true)} />

      {offers.length>0&&<section className="mx-auto flex max-w-[1500px] flex-wrap gap-3 px-4 py-4 sm:px-6 lg:px-8" aria-label="Shop offers">{offers.map(offer=><a key={offer.code} href="/cart" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><b>{offer.title}</b><span className="ml-2">{offerCopy(offer)}</span><span className="ml-2 font-bold">Use {offer.code}</span>{offer.productCodes?.length>0&&<small className="ml-2">Selected products only</small>}</a>)}</section>}
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#09482e] via-[#0c5d3b] to-[#09482e] py-12 text-white sm:py-16">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <Package size={13} /> AUTHORIZED UAE IT HARDWARE DISTRIBUTOR
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Enterprise Electronics &amp; Hardware Sales
              </h1>
              <p className="mt-2 text-xs text-slate-300 max-w-xl sm:text-sm">
                Procure 100% genuine enterprise hardware with full UAE manufacturer warranty, on-site setup, and optional AMC coverage.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/rent"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
              >
                <span>Switch to Rental Catalog</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Category Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setFilter(c.name)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                filter === c.name
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by model, brand, or specification..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
            <span>Showing <strong>{filtered.length}</strong> products</span>
            {cartQuantity > 0 && <a href="/cart" className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">{cartQuantity} in cart</a>}
            <button
              onClick={() => {
                setFilter("All");
                setSearch("");
              }}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {catalogLoading?<p role="status" className="mt-8">Loading products…</p>:catalogError?<div role="alert" className="mt-8"><p>{catalogError}</p><button onClick={reloadCatalog}>Retry</button></div>:!filtered.length?<p className="mt-8">{catalogProducts.length?"No products match your search.":"No products available yet."}</p>:null}
        {/* Products Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((prod) => {
            const addedQuantity = cartQuantityFor(prod);
            return (
            <div
              key={prod.code}
              className={`group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-xl ${addedQuantity ? "border-emerald-500 ring-1 ring-emerald-100" : "border-slate-200"}`}
            >
              <div className="relative flex h-48 w-full items-center justify-center rounded-xl bg-slate-50 p-4">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="max-h-40 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm border border-slate-200">
                  {prod.brand}
                </span>
                <span className="absolute right-3 top-3 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {prod.stock}
                </span>
              </div>

              <div className="mt-4 flex-1 flex flex-col">
                <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                  {prod.category}
                </div>
                <h3 className="mt-1 text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition line-clamp-1">
                  {prod.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2 flex-1 leading-relaxed">
                  {prod.specs}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Selling Price</div>
                      <div className="text-base font-extrabold text-[#09482e]">
                        {money(prod.price)} <span className="text-[10px] font-normal text-slate-400">+ VAT</span>{offers.filter(offer=>!offer.productCodes?.length||offer.productCodes.includes(prod.code)).map(offer=><small key={offer.code} className="mt-2 block text-xs font-semibold text-emerald-700">{offerCopy(offer)} · {offer.code}</small>)}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right">
                      <div className="font-semibold text-emerald-700"></div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {addedQuantity ? (
                      <div className="flex flex-1 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                        <button
                          type="button"
                          onClick={() => updateProductQuantity(prod, -1)}
                          className="grid w-10 place-items-center border-r border-emerald-200 text-base font-black transition hover:bg-white"
                          aria-label={`Remove one ${prod.name}`}
                        >
                          −
                        </button>
                        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 text-xs font-extrabold">
                          <Check size={13} />
                          <span>{addedQuantity} in cart</span>
                        </div>
                        <button
                          type="button"
                          disabled={addedQuantity >= prod.stockQuantity}
                          onClick={() => updateProductQuantity(prod, 1)}
                          className="grid w-10 place-items-center border-l border-emerald-200 text-base font-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Add one more ${prod.name}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={prod.stockQuantity === 0}
                        onClick={() => addProduct(prod)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <ShoppingCart size={14} />
                        <span>{prod.stockQuantity === 0 ? "Out of stock" : selectedProduct === prod.name ? "Added" : "Add to cart"}</span>
                      </button>
                    )}
                    {addedQuantity ? (
                      <button
                        type="button"
                        onClick={() => removeProduct(prod)}
                        className="inline-flex w-11 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50"
                        title="Remove from cart"
                        aria-label={`Remove ${prod.name} from cart`}
                      >
                        <X size={16} />
                      </button>
                    ) : null}
                    <a
                      href={`/rent/${encodeURIComponent(prod.code)}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                      title="Rent this equipment"
                    >
                      Rent
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      </main>

      <PublicFooter />
      <AIQuotationModal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} />
    </div>
  );
}
