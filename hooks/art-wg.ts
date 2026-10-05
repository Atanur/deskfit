// Exercise line art from Workout Guide (https://github.com/bryllim/workout-guide) by Bryl Lim, built on Everkinetic artwork.
// Licensed under CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/ . Changes: path data rounded to two decimals and
// re-written compactly, the fill is taken from the theme at draw time. See NOTICE.md. Written by scripts/art/wg-build.mjs: do not edit.
// Each move has up to three frames of path data in a 512 x 512 box.
import { WG_1 } from './art-wg-1'
import { WG_2 } from './art-wg-2'
import { WG_3 } from './art-wg-3'
import { WG_4 } from './art-wg-4'
import { WG_5 } from './art-wg-5'
import { WG_6 } from './art-wg-6'
import { WG_7 } from './art-wg-7'

export const WG_ART: Record<string, string[]> = { ...WG_1, ...WG_2, ...WG_3, ...WG_4, ...WG_5, ...WG_6, ...WG_7 }

// moves drawn with an image model: their frames already share one line weight
export const WG_EVEN: string[] = ["band-curl","calf-stretch","cat-cow-seated","chair-squat","chair-twist","chin-tuck","downward-dog","eye-20","figure-four","glute-bridge-stand","glute-kickback","hip-hinge","knee-plank","march","neck-roll","overhead-reach","prayer-stretch","scapula-squeeze","seated-leg-extension","shoulder-roll","sit-up","standing-crunch","wall-angel","wrist-circles","y-raise"]
