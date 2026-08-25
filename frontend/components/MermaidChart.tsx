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
            if (svgEl) {
              // Mermaid underestimates text width for mixed Korean/ASCII labels,
              // causing the SVG viewBox to clip content. Measure the true bounding
              // box of all rendered content and expand the viewBox to fit.
              try {
                const bbox = (svgEl as SVGSVGElement).getBBox();
                if (bbox.width > 0 && bbox.height > 0) {
                  const pad = 12;
                  svgEl.setAttribute(
                    "viewBox",
                    `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
                  );
                }
              } catch {
                // getBBox may fail in hidden/detached contexts — ignore
              }
              // Override Mermaid's inline max-width so SVG scales to its container.
              svgEl.style.maxWidth = "100%";
              svgEl.style.width = "100%";
              svgEl.style.height = "auto";
            }
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
