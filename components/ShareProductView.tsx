"use client";

// ── Client wrapper for shared extractions — owns selection state so the
// server component never has to pass event handlers across the boundary. ──────

import { useState } from "react";
import type { ProductRecord, SpecDocument } from "@/lib/types";
import ProductsTab from "@/components/ProductsTab";
import ProductDetailDrawer from "@/components/ProductDetailDrawer";

export default function ShareProductView({ spec }: { spec: SpecDocument }) {
  const [selected, setSelected] = useState<ProductRecord | null>(null);

  return (
    <>
      <ProductsTab spec={spec} onSelect={setSelected} />
      <ProductDetailDrawer
        product={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
