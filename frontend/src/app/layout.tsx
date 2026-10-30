import type { Metadata } from "next";
// Self-hosted Inter and EB Garamond; sets --font-inter and --font-eb-garamond.
import "./fonts/fonts.css";
import "./globals.css";
import { Providers } from "@/app/components/providers";

export const metadata: Metadata = {
    metadataBase: new URL("https://legalex.ai"),
    title: "Legalex - Open Legal AI Platform",
    description:
        "AI-powered legal document review, contract analysis, and global case law research platform.",
    icons: {
        icon: [
            { url: "/icon.svg", type: "image/svg+xml" },
            { url: "/favicon.ico" },
        ],
        apple: "/apple-touch-icon.png",
    },
    openGraph: {
        type: "website",
        url: "https://legalex.ai",
        siteName: "Legalex",
        title: "Legalex - Open Legal AI Platform",
        description:
            "AI-powered legal document review, contract analysis, and global case law research platform.",
        images: [
            {
                url: "/link-image.jpg",
                width: 1200,
                height: 651,
                alt: "Legalex",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Legalex - Open Legal AI Platform",
        description:
            "AI-powered legal document review, contract analysis, and global case law research platform.",
        images: ["/link-image.jpg"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className="font-sans antialiased"
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
