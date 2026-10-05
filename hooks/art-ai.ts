// Illustrations drawn with an image model, traced to vector paths (CC BY-SA 4.0, see NOTICE.md). The tool that wrote this file is no longer in the repository: do not edit by hand.
// Each move has two poses (a, b) as SVG path data in a w x h box, filled with the theme colour at draw time.
export type IllustrationArt = { w: number; h: number; a: string; b: string }

export const AI_ART: Record<string, IllustrationArt> = {}
