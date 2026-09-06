import type { Media } from "@/content/types";

type ProjectHeroMedia = Media & {
  sourceType: "real";
  sourceHref?: string;
  photographer?: string;
  licenseHref?: string;
};

/** Presentation assets only. Generated alternatives remain archived and unwired. */
export const projectHeroMedia: Readonly<Record<string, ProjectHeroMedia>> = {
  "/projects/pavescan-ai": {
    src: "/media/projects/pavescan-toronto-ortho.webp",
    alt: "Toronto aerial photography showing a road junction and the surrounding neighbourhood",
    width: 1280, height: 720, sourceType: "real",
    caption: "Toronto orthophotography. Contains information licensed under the Open Government Licence – Toronto.",
  },
  "/projects/civic-data-pipeline": {
    src: "/media/projects/civic-toronto-night.webp",
    alt: "NASA nighttime imagery of Toronto, the Great Lakes and eastern North America",
    width: 800, height: 450, sourceType: "real",
    caption: "Toronto and the Great Lakes at night. NASA Earth imagery; regional crop.",
  },
  "/projects/localflow": {
    src: "/media/projects/localflow-michal-balog.webp",
    alt: "A microphone and pop filter in front of a keyboard on a real home-office desk",
    width: 1600, height: 1067, sourceType: "real",
    caption: "Photo by Michal Balog on Unsplash. Illustrative workspace, not my actual hardware.",
    photographer: "Michal Balog",
    sourceHref: "https://unsplash.com/photos/black-and-silver-microphone-beside-black-computer-keyboard-j2C_bAFXhD8",
    licenseHref: "https://unsplash.com/license",
  },
  "/projects/pop-up-chapel": {
    src: "/media/projects/chapel-micah-sammie-chaffin.webp",
    alt: "A coordinated wedding stationery suite photographed on cream paper with eucalyptus leaves",
    width: 1600, height: 1067, sourceType: "real",
    caption: "Photo by Micah & Sammie Chaffin on Unsplash. Illustrative wedding stationery, not the client’s documents.",
    photographer: "Micah & Sammie Chaffin",
    sourceHref: "https://unsplash.com/photos/wedding-invitations-and-stationery-displayed-with-greenery-5ZribvTyQVQ",
    licenseHref: "https://unsplash.com/license",
  },
};
