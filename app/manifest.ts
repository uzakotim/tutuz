import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Tutuz",
        short_name: "Tutuz",
        description: "Daily Uzbek practice",
        start_url: "/",
        display: "standalone",
        background_color: "#F0F4FF",
        theme_color: "#4F46E5",
        icons: [
            {
                src: "/icon.png",
                sizes: "1024x1024",
                type: "image/png",
            },
        ],
    };
}