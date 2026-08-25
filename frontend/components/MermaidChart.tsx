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
              // Mermaid underestimates text width for mixed Korean/ASCII labels.
              // Expand the viewBox to fit the true rendered bounding box so text
              // isn't clipped at the SVG boundary. Don't touch size attributes —
              // keep Mermaid's original width/max-width so the diagram stays small.
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
