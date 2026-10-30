"use client";

import React, { useId, useSyncExternalStore } from "react";

type IconPalette = {
    fillStops: [string, string, string, string];
    fillOpacities: [number, number, number, number];
    specularStops: [number, number, number, number];
    borderStops: [string, string, string];
    borderOpacities: [number, number, number];
    innerStops: [string, string, string, string];
    innerOpacities: [number, number, number, number];
};

const DEFAULT_PALETTE: IconPalette = {
    fillStops: ["#3b82f6", "#60a5fa", "#1d4ed8", "#2563eb"],
    fillOpacities: [0.95, 0.9, 0.95, 0.95],
    specularStops: [0.5, 0.2, 0, 0],
    borderStops: ["#93c5fd", "#e2e8f0", "#93c5fd"],
    borderOpacities: [0.9, 0.6, 0.8],
    innerStops: ["#ffffff", "#93c5fd", "#3b82f6", "#ffffff"],
    innerOpacities: [0, 0.15, 0.1, 0],
};

const DONE_PALETTE: IconPalette = {
    fillStops: ["#4ade80", "#86efac", "#22c55e", "#bbf7d0"],
    fillOpacities: [0.95, 0.88, 0.9, 0.94],
    specularStops: [0.68, 0.32, 0.03, 0],
    borderStops: ["#f0fdf4", "#86efac", "#dcfce7"],
    borderOpacities: [0.42, 0.24, 0.3],
    innerStops: ["#ffffff", "#dcfce7", "#4ade80", "#ffffff"],
    innerOpacities: [0, 0.16, 0.08, 0],
};

const ERROR_PALETTE: IconPalette = {
    fillStops: ["#f87171", "#fca5a5", "#ef4444", "#fecaca"],
    fillOpacities: [0.95, 0.88, 0.9, 0.94],
    specularStops: [0.68, 0.32, 0.03, 0],
    borderStops: ["#fef2f2", "#fca5a5", "#fee2e2"],
    borderOpacities: [0.42, 0.24, 0.3],
    innerStops: ["#ffffff", "#fee2e2", "#f87171", "#ffffff"],
    innerOpacities: [0, 0.16, 0.08, 0],
};

type TintScale = [string, string, string, string, string, string];

function tintPalette([c100, c200, c300, c400, c500, c600]: TintScale): IconPalette {
    return {
        fillStops: [c500, c400, c600, c300],
        fillOpacities: [0.95, 0.88, 0.9, 0.94],
        specularStops: [0.68, 0.32, 0.03, 0],
        borderStops: [c100, c400, c200],
        borderOpacities: [0.42, 0.24, 0.3],
        innerStops: ["#ffffff", c200, c500, "#ffffff"],
        innerOpacities: [0, 0.16, 0.08, 0],
    };
}

const TINT_PALETTES = {
    sky: tintPalette(["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7"]),
    violet: tintPalette(["#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed"]),
    amber: tintPalette(["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706"]),
    pink: tintPalette(["#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899", "#db2777"]),
    teal: tintPalette(["#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488"]),
    indigo: tintPalette(["#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5"]),
} satisfies Record<string, IconPalette>;

export type MikeIconTint = keyof typeof TINT_PALETTES;

export const MIKE_ICON_TINTS = Object.keys(TINT_PALETTES) as MikeIconTint[];

const WHITE_PALETTE: IconPalette = {
    fillStops: ["#60a5fa", "#93c5fd", "#3b82f6", "#2563eb"],
    fillOpacities: [0.95, 0.85, 0.9, 0.95],
    specularStops: [0.7, 0.3, 0, 0],
    borderStops: ["#ffffff", "#cbd5e1", "#ffffff"],
    borderOpacities: [0.9, 0.6, 0.8],
    innerStops: ["#ffffff", "#e2e8f0", "#93c5fd", "#ffffff"],
    innerOpacities: [0, 0.1, 0.06, 0],
};

const themeListeners = new Set<() => void>();
let themeObserver: MutationObserver | null = null;

function subscribeToTheme(listener: () => void): () => void {
    themeListeners.add(listener);
    if (!themeObserver && typeof MutationObserver !== "undefined") {
        themeObserver = new MutationObserver(() => {
            themeListeners.forEach((notify) => notify());
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
    }

    return () => {
        themeListeners.delete(listener);
        if (themeListeners.size === 0) {
            themeObserver?.disconnect();
            themeObserver = null;
        }
    };
}

function readDarkTheme(): boolean {
    return (
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")
    );
}

function readDarkThemeOnServer(): boolean {
    return false;
}

function useDarkTheme(): boolean {
    return useSyncExternalStore(
        subscribeToTheme,
        readDarkTheme,
        readDarkThemeOnServer,
    );
}

export function MikeIcon({
    spin = false,
    done = false,
    error = false,
    mike = false,
    tint,
    size = 24,
    style,
}: {
    spin?: boolean;
    done?: boolean;
    error?: boolean;
    mike?: boolean;
    /** A colour for the mark; the status palettes take precedence. */
    tint?: MikeIconTint;
    size?: number;
    style?: React.CSSProperties;
}) {
    void mike;
    const id = useId().replace(/:/g, "");
    const darkTheme = useDarkTheme();
    const palette = error
        ? ERROR_PALETTE
        : done
          ? DONE_PALETTE
          : tint
            ? TINT_PALETTES[tint]
            : darkTheme
              ? WHITE_PALETTE
              : DEFAULT_PALETTE;

    const primaryColor = palette.fillStops[2];
    const accentColor = palette.fillStops[0];
    const beamColor = palette.borderStops[0];

    return (
        <span
            className="shrink-0 inline-flex items-center justify-center leading-none"
            style={{
                width: size,
                height: size,
                ...style,
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                width={size}
                height={size}
                fill="none"
                style={{ display: "block" }}
            >
                <defs>
                    <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={darkTheme ? "#1e293b" : "#0f172a"} />
                        <stop offset="100%" stopColor={darkTheme ? "#0f172a" : "#020617"} />
                    </linearGradient>
                    <linearGradient id={`${id}-beam`} x1="4" y1="10" x2="28" y2="10" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={beamColor} />
                        <stop offset="50%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor={beamColor} />
                    </linearGradient>
                    <linearGradient id={`${id}-pan`} x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={accentColor} />
                        <stop offset="100%" stopColor={primaryColor} />
                    </linearGradient>
                </defs>
                {/* Background Plaque */}
                <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill={`url(#${id}-bg)`} stroke={darkTheme ? "#475569" : "#334155"} strokeWidth="1.2" />

                {/* Central Justice Pillar */}
                <path d="M16 6.5 L17.5 9 L16.8 21.5 L15.2 21.5 L14.5 9 Z" fill={`url(#${id}-beam)`} />

                {/* Apex Diamond (spins when thinking / active) */}
                <g className={spin ? "animate-[spin_2s_linear_infinite] origin-[16px_7.2px]" : ""}>
                    <polygon points="16,4.8 18.2,7.2 16,9.6 13.8,7.2" fill={accentColor} />
                </g>

                {/* Balance Beam */}
                <path d="M6.5 11 C11 9.8 21 9.8 25.5 11" stroke={`url(#${id}-beam)`} strokeWidth="1.8" strokeLinecap="round" fill="none" />

                {/* Left Scale Pan */}
                <path d="M6.5 11 L4.5 17 L10.5 17 Z" fill={`url(#${id}-pan)`} opacity="0.95" />
                <path d="M4.5 17 Q7.5 19.5 10.5 17" stroke={beamColor} strokeWidth="1" fill="none" />

                {/* Right Scale Pan */}
                <path d="M25.5 11 L21.5 17 L27.5 17 Z" fill={`url(#${id}-pan)`} opacity="0.95" />
                <path d="M21.5 17 Q24.5 19.5 27.5 17" stroke={beamColor} strokeWidth="1" fill="none" />

                {/* Base Pedestal */}
                <path d="M11.5 22.5 L20.5 22.5 L22 25 L10 25 Z" fill={`url(#${id}-beam)`} />
            </svg>
        </span>
    );
}
