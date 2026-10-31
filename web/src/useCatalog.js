import {useCallback,useEffect,useState,useRef} from "react";
import {get} from "./api";
export const CATALOG_EVENT="wefyx-catalog-changed";
export function catalogChanged(){localStorage.setItem(CATALOG_EVENT,String(Date.now()));window.dispatchEvent(new Event(CATALOG_EVENT))}
export default function useCatalog(){
  const mounted=useRef(false),request=useRef(0);
  const [products,setProducts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const reload=useCallback(()=>{const current=++request.current;get("/catalog/products").then(rows=>{if(!Array.isArray(rows))throw new Error("Invalid catalog response.");if(mounted.current&&current===request.current){setProducts(rows);setError("")}}).catch(e=>{if(mounted.current&&current===request.current){setProducts([]);setError(e.message||"Unable to load products.")}}).finally(()=>{if(mounted.current&&current===request.current)setLoading(false)})},[]);
  useEffect(()=>{mounted.current=true;reload();const refresh=()=>reload();const storage=e=>{if(e.key===CATALOG_EVENT)reload()};window.addEventListener("focus",refresh);window.addEventListener(CATALOG_EVENT,refresh);window.addEventListener("storage",storage);const timer=setInterval(refresh,30000);return()=>{mounted.current=false;request.current++;clearInterval(timer);window.removeEventListener("focus",refresh);window.removeEventListener(CATALOG_EVENT,refresh);window.removeEventListener("storage",storage)}},[reload]);
  return {products,loading,error,reload};
}
