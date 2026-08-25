"use client";

import { useEffect, useRef, useId } from "react";

interface Props {
  code: string;
}

export default function MermaidChart({ code }: Props) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        er: { useMaxWidth: true, diagramPadding: 16 },
        fontFamily: "inherit",
      });

      mermaid
        .render(`mermaid-${uid}`, code.trim())
        .then(({ svg }) => {
          if (!cancelled && ref.current) {
            ref.current.innerHTML = svg;
            const svgEl = ref.current.querySelector("svg");
            if (!svgEl) return;

            // getBBox() must run AFTER fonts are loaded — Korean text metrics
            // are wrong if measured before the font is ready, causing the
            // viewBox to be set too narrow and the label to stay clipped.
            document.fonts.ready.then(() => {
              if (cancelled || !svgEl.isConnected) return;
              try {
                const bbox = (svgEl as SVGSVGElement).getBBox();
                if (bbox.width > 0 && bbox.height > 0) {
                  const pad = 16;
                  svgEl.setAttribute(
                    "viewBox",
                    `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
                  );
                }
              } catch {
                // ignore — getBBox fails in detached/hidden contexts
              }
            });
          }
        })
        .catch(() => {
          if (!cancelled && ref.current) {
            ref.current.textContent = code;
          }
        });
    });

    return () => { cancelled = true; };
  }, [code, uid]);

  return (
    <div
      ref={ref}
      className="my-3 overflow-x-auto text-sm"
    />
  );
}
