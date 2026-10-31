export function shopProduct(product) {
  return {code:product.code,name:product.name,category:product.category,brand:product.brand||"",specs:product.specification||"",price:Number(product.buyPrice),image:product.imageUrl,stock:product.stockQuantity>0?`${product.stockQuantity} available`:"Out of stock",stockQuantity:product.stockQuantity,featured:product.featured};
}
export function rentalProduct(product) {
  return [product.name,product.specification,`AED ${Number(product.rentalPrice).toLocaleString("en-AE")} / month`,product.category,product.imageUrl,product.code,product.stockQuantity,product.featured,Number(product.rentalPrice)];
}
export function refreshCartProducts(items,products) {
  const byCode=new Map(products.map(product=>[product.code,product]));
  return items.map(item=>{
    const product=byCode.get(item.productId||item.id),mode=item.mode||"RENT";
    if(!product||!product.active||!(mode==="BUY"?product.purchasable:product.rentable))return {...item,unavailable:true};
    return {...item,name:product.name,spec:product.specification||"",image:product.imageUrl,price:Number(mode==="BUY"?product.buyPrice:product.rentalPrice),monthlyPrice:Number(product.rentalPrice),stockQuantity:product.stockQuantity,unavailable:product.stockQuantity<Number(item.quantity||1)};
  });
}
