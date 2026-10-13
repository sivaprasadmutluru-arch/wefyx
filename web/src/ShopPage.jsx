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
import { get } from "./api";

const shopIds = {
  "Dell Latitude 5550 Business Laptop": "dell-latitude-5550", "Lenovo ThinkPad T14 Gen 4": "thinkpad-t14",
  "Apple MacBook Air 13” M3": "macbook-air-m3", "HP Pro Tower 400 G9 Desktop": "hp-pro-tower-400-g9",
  "Dell 27” QHD USB-C Hub Monitor – P2723DE": "dell-monitor-p2723d", "Cisco Catalyst 2960X Gigabit Switch": "cisco-2960x",
  "Ubiquiti UniFi 6 Pro Access Point": "unifi-6-pro", "Hikvision 4MP DarkFighter Turret IP Camera": "hikvision-4mp",
  "Synology DiskStation DS923+ 4-Bay NAS": "synology-ds923", "APC Smart-UPS 1500VA LCD 230V": "apc-ups-1500",
  "Canon imageCLASS MF446dw All-in-One Printer": "canon-mf446dw", "Epson EB-FH52 Full HD Wireless Projector": "epson-fh52"
};

export default function ShopPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [liveProducts, setLiveProducts] = useState(null);
  const [cartItems, setCartItems] = useState(loadCart);

  const products = [
    {
      name: "Dell Latitude 5550 Business Laptop",
      category: "Laptop",
      brand: "Dell",
      specs: "15.6” FHD | Intel Core i7-1365U | 16GB RAM | 512GB NVMe SSD | Windows 11 Pro",
      price: 3899,
      image: "/images/product-laptop.png",
      warranty: "3 Years ProSupport",
      stock: "In Stock"
    },
    {
      name: "Lenovo ThinkPad T14 Gen 4",
      category: "Laptop",
      brand: "Lenovo",
      specs: "14” WUXGA | Intel Core i7 | 16GB DDR5 | 512GB SSD | Fingerprint & IR Camera",
      price: 4199,
      image: "/images/product-thinkpad-v2.png",
      warranty: "3 Years Premier Support",
      stock: "In Stock"
    },
    {
      name: "Apple MacBook Air 13” M3",
      category: "Laptop",
      brand: "Apple",
      specs: "13.6” Liquid Retina | Apple M3 8-Core | 8GB Unified | 256GB SSD | Space Gray",
      price: 4299,
      image: "/images/product-ultrabook-v2.png",
      warranty: "1 Year AppleCare",
      stock: "In Stock"
    },
    {
      name: "HP Pro Tower 400 G9 Desktop",
      category: "Desktop",
      brand: "HP",
      specs: "Intel Core i5-13500 | 16GB RAM | 512GB SSD | Keyboard & Mouse | Windows 11 Pro",
      price: 2699,
      image: "/images/product-desktop.png",
      warranty: "3 Years On-Site",
      stock: "In Stock"
    },
    {
      name: "Dell 27” QHD USB-C Hub Monitor – P2723DE",
      category: "Monitor",
      brand: "Dell",
      specs: "27” QHD (2560x1440) | IPS | 99% sRGB | RJ45 Ethernet | 90W USB-C Power",
      price: 1399,
      image: "/images/product-monitor.png",
      warranty: "3 Years Advanced Exchange",
      stock: "In Stock"
    },
    {
      name: "Cisco Catalyst 2960X Gigabit Switch",
      category: "Networking",
      brand: "Cisco",
      specs: "24-Port Gigabit Ethernet PoE+ | 4x 1G SFP Uplinks | LAN Base Managed",
      price: 2899,
      image: "/images/product-switch.png",
      warranty: "Enhanced Limited Lifetime",
      stock: "In Stock"
    },
    {
      name: "Ubiquiti UniFi 6 Pro Access Point",
      category: "Networking",
      brand: "Ubiquiti",
      specs: "Dual-Band Wi-Fi 6 (802.11ax) | 5.3 Gbps Aggregate Rate | 300+ Client Capacity",
      price: 699,
      image: "/images/product-access-point-v2.png",
      warranty: "2 Years UAE Warranty",
      stock: "In Stock"
    },
    {
      name: "Hikvision 4MP DarkFighter Turret IP Camera",
      category: "Security",
      brand: "Hikvision",
      specs: "4MP @ 30fps | 2.8mm Lens | AcuSense Deep Learning | IP67 Weatherproof | PoE",
      price: 349,
      image: "/images/product-camera-v2.png",
      warranty: "2 Years SIRA Certified",
      stock: "In Stock"
    },
    {
      name: "Synology DiskStation DS923+ 4-Bay NAS",
      category: "Servers",
      brand: "Synology",
      specs: "AMD Ryzen R1600 Dual-Core | 4GB ECC RAM (expandable to 32GB) | M.2 NVMe Slots",
      price: 2499,
      image: "/images/product-nas-v2.png",
      warranty: "3 Years Warranty",
      stock: "In Stock"
    },
    {
      name: "APC Smart-UPS 1500VA LCD 230V",
      category: "UPS",
      brand: "APC Schneider",
      specs: "1500VA / 1000W | Pure Sine Wave | SmartConnect Cloud Monitoring | 8x IEC Outlets",
      price: 2199,
      image: "/images/product-ups-v2.png",
      warranty: "2 Years Warranty",
      stock: "In Stock"
    },
    {
      name: "Canon imageCLASS MF446dw All-in-One Printer",
      category: "Printer",
      brand: "Canon",
      specs: "Monochrome Laser | 38 ppm | Auto Duplex | Wi-Fi Direct & Gigabit Ethernet",
      price: 1299,
      image: "/images/product-printer.png",
      warranty: "1 Year Official Warranty",
      stock: "In Stock"
    },
    {
      name: "Epson EB-FH52 Full HD Wireless Projector",
      category: "AV",
      brand: "Epson",
      specs: "4,000 Lumens | Full HD 1080p | 3LCD Technology | Miracast & Built-in Wi-Fi",
      price: 3499,
      image: "/images/product-projector-v2.png",
      warranty: "2 Years On-Site",
      stock: "In Stock"
    }
  ];
  useEffect(() => { const categories={Laptops:"Laptop",Desktops:"Desktop",Monitors:"Monitor",Printers:"Printer",Projectors:"AV",Power:"UPS"};get("/catalog/products").then(rows => setLiveProducts(rows.filter(x => x.purchasable).map(x => ({ code:x.code,name:x.name,category:categories[x.category]||x.category,brand:x.brand,specs:x.specification,price:Number(x.buyPrice),image:x.imageUrl,warranty:"Wefyx business warranty",stock:x.stockQuantity>0?`${x.stockQuantity} available`:"Out of stock",stockQuantity:x.stockQuantity })))).catch(() => {}); }, []);
  const catalogProducts = liveProducts || products;
  const cartQuantity = cartCount(cartItems);
  const cartKeyFor = (product) => `${product.code || shopIds[product.name]}:BUY`;
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

  const categories = [
    { name: "All", label: "All Products" },
    { name: "Laptop", label: "Laptops & Notebooks" },
    { name: "Desktop", label: "Desktops & Workstations" },
    { name: "Monitor", label: "Monitors & Displays" },
    { name: "Servers", label: "Servers & Storage (NAS)" },
    { name: "Networking", label: "Switches & Firewalls" },
    { name: "Security", label: "CCTV & Biometric Access" },
    { name: "UPS", label: "UPS Power Systems" },
    { name: "Printer", label: "Printers & Scanners" },
    { name: "AV", label: "Meeting Room AV & Screens" }
  ];

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
    const code = product.code || shopIds[product.name];
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

        {/* Products Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((prod) => {
            const addedQuantity = cartQuantityFor(prod);
            return (
            <div
              key={prod.name}
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
                        {money(prod.price)} <span className="text-[10px] font-normal text-slate-400">+ VAT</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right">
                      <div className="font-semibold text-emerald-700">{prod.warranty}</div>
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
                          disabled={prod.stockQuantity > 0 && addedQuantity >= prod.stockQuantity}
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
                      href="/rent"
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
