"use client";

import Image from "next/image";
import { useState } from "react";

const requestedCan = "https://img.redbull.com/images/c_limit,w_4000/e_trim:0:transparent/c_limit,w_200/q_auto,f_auto/redbullcom/2026/3/19/v1jtfllxhmgpliwnhxhl/red-bull-energy-drink";

export function CanFeatureImage() {
  const [source, setSource] = useState(requestedCan);
  return (
    <a className="hero-can-link" href="https://www.redbull.com/za-en/energydrink" target="_blank" rel="noreferrer" aria-label="Visit Red Bull Energy Drink">
      <Image className="hero-can-image" src={source} alt="Red Bull Energy Drink can" fill sizes="(max-width: 720px) 70vw, (max-width: 1000px) 28vw, 24vw" unoptimized onError={() => setSource("/images/red-bull-xero.png")} />
    </a>
  );
}
