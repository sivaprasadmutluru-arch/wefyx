import test from 'node:test';
import assert from 'node:assert/strict';
import {shopProduct,rentalProduct,refreshCartProducts} from './catalog.js';
const product={code:'admin-product',name:'Admin product',category:'Custom category',specification:'Configured specs',imageUrl:'/images/admin.webp',brand:'Admin brand',buyPrice:150.75,rentalPrice:20.55,stockQuantity:3,active:true,purchasable:true,rentable:true,featured:true};
test('shop and rental mappings preserve admin prices, arbitrary categories and images',()=>{
 const shop=shopProduct(product),rental=rentalProduct(product);
 assert.equal(shop.price,150.75);assert.equal(shop.category,'Custom category');assert.equal(shop.image,product.imageUrl);assert.equal(shop.stockQuantity,3);
 assert.equal(rental[8],20.55);assert.equal(rental[4],product.imageUrl);assert.equal(rental[5],product.code);assert.equal(rental[7],true);
});
test('cart replaces stale prices and metadata with current catalog data',()=>{
 const lines=refreshCartProducts([{id:product.code,mode:'BUY',price:1,name:'Old name',quantity:2},{id:product.code,mode:'RENT',price:1,quantity:1}],[product]);
 assert.equal(lines[0].price,150.75);assert.equal(lines[0].name,product.name);assert.equal(lines[0].image,product.imageUrl);assert.equal(lines[1].price,20.55);assert.equal(lines[0].unavailable,false);
});
test('removed, disabled, or insufficient-stock products remain visible but unavailable in cart',()=>{
 for(const catalog of [[],[{...product,active:false}],[{...product,purchasable:false}],[{...product,stockQuantity:0}]]){
  const lines=refreshCartProducts([{id:product.code,mode:'BUY',quantity:1}],catalog);assert.equal(lines.length,1);assert.equal(lines[0].unavailable,true);
 }
});
test('reducing quantity restores availability against current stock',()=>{
 const line=refreshCartProducts([{id:product.code,mode:'BUY',quantity:4}],[product])[0];assert.equal(line.unavailable,true);
 assert.equal(refreshCartProducts([{...line,quantity:2}],[product])[0].unavailable,false);
});
test('empty catalog produces no sample products',()=>{assert.deepEqual(refreshCartProducts([],[]),[])});
