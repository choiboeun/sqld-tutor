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
            // Mermaid injects style="max-width: Xpx" inline — override so SVG
            // scales to its container instead of clipping inside overflow-y scroll areas.
            const svgEl = ref.current.querySelector("svg");
            if (svgEl) {
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
