"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function VendorCta(){
  const pathname=usePathname();
  if(pathname!=="/") return null;
  return <Link className="vendor-cta" href="/vendor/register">For Restaurants & Vendors <span>Register your business →</span><style jsx>{`.vendor-cta{position:fixed;right:24px;bottom:24px;z-index:30;display:flex;align-items:center;gap:12px;padding:12px 15px;background:#faf9f5;color:#314d3b;border:1px solid #dedbd2;box-shadow:0 10px 30px #18181318;text-decoration:none;font:700 10px Arial;letter-spacing:.2px}.vendor-cta span{background:#314d3b;color:#fff;padding:8px 10px;font-size:9px}@media(max-width:560px){.vendor-cta{left:14px;right:14px;bottom:14px;justify-content:space-between}.vendor-cta span{white-space:nowrap}}`}</style></Link>;
}
