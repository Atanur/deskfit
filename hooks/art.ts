// Drawings, all generated from code so they need no image files or licences.
// One skeleton rig drives every exercise: a pair of poses per move, drawn as an
// animated SVG (desktop, vscode, mobile) or as two braille frames (terminal).

import { AI_ART } from './art-ai'
import { WG_ART, WG_EVEN } from './art-wg'
import type { IllustrationArt } from './art-ai'
import { byId } from './catalog'

type Pt = [number, number]
type Joint = 'head' | 'sh' | 'hip' | 'eN' | 'hN' | 'eF' | 'hF' | 'kN' | 'fN' | 'kF' | 'fF'
type Pose = Record<Joint, Pt>
type Scene = 'none' | 'chair' | 'desk' | 'wall' | 'far' | 'mat' | 'bar' | 'wallR'

const J: Joint[] = ['head', 'sh', 'hip', 'eN', 'hN', 'eF', 'hF', 'kN', 'fN', 'kF', 'fF']

const p = (o: Partial<Pose>, base: Pose): Pose => ({ ...base, ...o })

const STAND: Pose = {
  head: [60, 17], sh: [60, 28], hip: [60, 52],
  eN: [60, 40], hN: [60, 52], eF: [58, 40], hF: [58, 52],
  kN: [60, 71], fN: [63, 90], kF: [60, 71], fF: [57, 90],
}

const ARMS_UP = p({ eN: [66, 18], hN: [64, 6], eF: [54, 18], hF: [56, 6] }, STAND)
const WIDE_JACK = p(
  { eN: [66, 18], hN: [64, 6], eF: [54, 18], hF: [56, 6], kN: [65, 71], fN: [71, 90], kF: [55, 71], fF: [49, 90] },
  STAND,
)
const SQUAT: Pose = {
  head: [55, 34], sh: [52, 44], hip: [43, 64],
  eN: [64, 45], hN: [77, 45], eF: [63, 46], hF: [76, 46],
  kN: [62, 69], fN: [61, 90], kF: [62, 69], fF: [57, 90],
}
const JUMP = p(
  {
    head: [60, 7], sh: [60, 18], hip: [60, 42], eN: [72, 20], hN: [84, 18], eF: [71, 21], hF: [83, 19],
    kN: [62, 60], fN: [58, 78], kF: [60, 60], fF: [54, 78],
  },
  STAND,
)
const CALF_UP = p(
  {
    head: [60, 12], sh: [60, 23], hip: [60, 47], eN: [60, 35], hN: [60, 47], eF: [58, 35], hF: [58, 47],
    kN: [60, 66], fN: [63, 90], kF: [60, 66], fF: [57, 90],
  },
  STAND,
)
const GLUTE = p({ head: [59, 17], sh: [59, 28], hip: [63, 52], hN: [64, 52], hF: [62, 52], kN: [61, 71] }, STAND)

const WALL_STAND: Pose = {
  head: [32, 17], sh: [32, 28], hip: [32, 52],
  eN: [34, 40], hN: [35, 52], eF: [33, 40], hF: [34, 52],
  kN: [32, 71], fN: [34, 90], kF: [32, 71], fF: [30, 90],
}
const WALL_SIT: Pose = {
  head: [32, 31], sh: [32, 42], hip: [32, 66],
  eN: [42, 54], hN: [50, 64], eF: [41, 55], hF: [49, 65],
  kN: [54, 66], fN: [54, 90], kF: [54, 66], fF: [50, 90],
}
const ANGEL_DOWN = p({ head: [32, 17], eN: [30, 40], hN: [30, 52], eF: [30, 40], hF: [30, 52] }, WALL_STAND)
const ANGEL_UP = p({ eN: [29, 18], hN: [29, 6], eF: [29, 18], hF: [29, 6] }, WALL_STAND)

const LUNGE: Pose = {
  head: [61, 25], sh: [60, 36], hip: [58, 60],
  eN: [62, 48], hN: [58, 58], eF: [60, 48], hF: [56, 58],
  kN: [74, 66], fN: [73, 90], kF: [44, 78], fF: [30, 90],
}

const PUSH_UP: Pose = {
  head: [89, 57], sh: [78, 60], hip: [46, 72],
  eN: [78, 74], hN: [78, 88], eF: [77, 74], hF: [77, 88],
  kN: [30, 80], fN: [14, 88], kF: [30, 80], fF: [14, 88],
}
const PUSH_DOWN: Pose = {
  head: [89, 76], sh: [78, 78], hip: [46, 83],
  eN: [64, 84], hN: [78, 88], eF: [63, 84], hF: [77, 88],
  kN: [30, 86], fN: [14, 88], kF: [30, 86], fF: [14, 88],
}
const DESK_UP: Pose = {
  head: [90, 34], sh: [78, 40], hip: [48, 65],
  eN: [80, 49], hN: [83, 57], eF: [79, 49], hF: [82, 57],
  kN: [34, 77], fN: [20, 90], kF: [34, 77], fF: [20, 90],
}
const DESK_DOWN: Pose = {
  head: [92, 46], sh: [80, 50], hip: [48, 71],
  eN: [70, 56], hN: [83, 57], eF: [69, 56], hF: [82, 57],
  kN: [34, 81], fN: [20, 90], kF: [34, 81], fF: [20, 90],
}
const PLANK: Pose = {
  head: [89, 67], sh: [78, 70], hip: [46, 78],
  eN: [78, 86], hN: [92, 86], eF: [77, 86], hF: [91, 86],
  kN: [30, 83], fN: [14, 88], kF: [30, 83], fF: [14, 88],
}
const PLANK_HIGH = p({ hip: [46, 74], head: [89, 66], sh: [78, 69] }, PLANK)
const KNEE_PLANK: Pose = {
  head: [89, 67], sh: [78, 70], hip: [52, 78],
  eN: [78, 86], hN: [92, 86], eF: [77, 86], hF: [91, 86],
  kN: [36, 87], fN: [22, 87], kF: [36, 87], fF: [22, 87],
}
const KNEE_PLANK_HIGH = p({ hip: [52, 75] }, KNEE_PLANK)
const CLIMB_A = p({ kN: [30, 80], fN: [14, 88], kF: [64, 72], fF: [58, 86] }, PUSH_UP)
const CLIMB_B = p({ kN: [64, 72], fN: [58, 86], kF: [30, 80], fF: [14, 88] }, PUSH_UP)

const SIT: Pose = {
  head: [41, 31], sh: [40, 42], hip: [40, 66],
  eN: [49, 54], hN: [56, 62], eF: [48, 55], hF: [55, 63],
  kN: [58, 66], fN: [58, 90], kF: [57, 66], fF: [55, 90],
}
const SIT_KNEE = p({ sh: [38, 43], head: [39, 32], eN: [46, 56], hN: [44, 66], kN: [57, 57], fN: [53, 76] }, SIT)
const SIT_ARCH = p({ head: [48, 31], sh: [44, 42], hN: [56, 62] }, SIT)
const SIT_ROUND = p({ head: [37, 37], sh: [36, 43], eN: [46, 54], hN: [56, 62] }, SIT)
const SIT_TWIST_A = p({ eN: [52, 42], hN: [64, 40], eF: [51, 43], hF: [63, 42] }, SIT)
const SIT_TWIST_B = p({ eN: [34, 40], hN: [24, 34], eF: [35, 41], hF: [26, 38], head: [38, 31] }, SIT)

const DIP_UP: Pose = {
  head: [32, 34], sh: [33, 45], hip: [42, 70],
  eN: [31, 56], hN: [30, 67], eF: [32, 56], hF: [31, 67],
  kN: [60, 76], fN: [78, 88], kF: [60, 76], fF: [78, 88],
}
const DIP_DOWN: Pose = {
  head: [32, 47], sh: [33, 58], hip: [42, 80],
  eN: [24, 64], hN: [30, 67], eF: [25, 64], hF: [31, 67],
  kN: [60, 82], fN: [78, 88], kF: [60, 82], fF: [78, 88],
}

const HINGE: Pose = {
  head: [80, 41], sh: [70, 44], hip: [48, 54],
  eN: [60, 50], hN: [50, 54], eF: [59, 50], hF: [49, 54],
  kN: [54, 72], fN: [58, 90], kF: [54, 72], fF: [55, 90],
}
const HANDS_HIPS = p({ eN: [52, 40], hN: [58, 52], eF: [51, 40], hF: [57, 52] }, STAND)

const NECK_FWD = p({ head: [66, 22], sh: [60, 28] }, STAND)
const NECK_BACK = p({ head: [54, 13], sh: [60, 28] }, STAND)
const TUCK_FWD = p({ head: [68, 18] }, STAND)
const TUCK_BACK = p({ head: [57, 18] }, STAND)
const SHRUG_A = p({ sh: [64, 23], head: [62, 12], eN: [64, 36], hN: [64, 48], eF: [62, 36] }, STAND)
const SHRUG_B = p({ sh: [55, 32], head: [57, 21], eN: [55, 44], hN: [55, 56], eF: [53, 44] }, STAND)
const WRIST_UP = p({ eN: [70, 36], hN: [80, 29], eF: [69, 37], hF: [79, 30] }, STAND)
const WRIST_DOWN = p({ eN: [70, 36], hN: [80, 45], eF: [69, 37], hF: [79, 46] }, STAND)
const PRAYER_A = p({ eN: [68, 40], hN: [74, 30], eF: [67, 41], hF: [73, 31] }, STAND)
const PRAYER_B = p({ eN: [70, 40], hN: [82, 42], eF: [69, 41], hF: [81, 43] }, STAND)
const MARCH_A = p({ kN: [74, 56], fN: [72, 73], eN: [54, 40], hN: [50, 50], eF: [66, 38], hF: [72, 44] }, STAND)
const MARCH_B = p({ kF: [74, 56], fF: [72, 73], eF: [54, 40], hF: [50, 50], eN: [66, 38], hN: [72, 44] }, STAND)
const CRUNCH_A = p({ eN: [52, 18], hN: [58, 16], eF: [52, 18], hF: [57, 17] }, STAND)
const CRUNCH_B = p(
  { sh: [63, 30], head: [64, 19], eN: [58, 36], hN: [62, 24], eF: [58, 36], hF: [61, 25], kN: [74, 56], fN: [70, 74] },
  CRUNCH_A,
)
const EYE_NEAR = p({ head: [61, 18] }, STAND)


// ----------------------------------------------------------------- new moves
const shift = (pose: Pose, dx: number, dy = 0): Pose =>
  Object.fromEntries(J.map(j => [j, [pose[j][0] + dx, pose[j][1] + dy] as Pt])) as Pose

// office
const LEG_OUT = p({ kN: [58, 66], fN: [79, 64] }, SIT)
const FOUR_A = SIT
const FOUR_B = p({ kN: [66, 60], fN: [54, 64], sh: [46, 44], head: [49, 33], eN: [56, 56], hN: [60, 62] }, SIT)
const QUAD_B = p({ kN: [60, 72], fN: [42, 64], hN: [44, 63], eN: [58, 52] }, STAND)
const KICK_B = p({ kN: [47, 64], fN: [34, 76], sh: [62, 28], head: [63, 17] }, STAND)
const WALL_PU_A: Pose = {
  head: [80, 34], sh: [74, 42], hip: [64, 66],
  eN: [86, 42], hN: [98, 42], eF: [86, 43], hF: [98, 43],
  kN: [60, 78], fN: [56, 90], kF: [60, 78], fF: [55, 90],
}
const WALL_PU_B: Pose = {
  head: [95, 40], sh: [88, 46], hip: [72, 68],
  eN: [88, 58], hN: [98, 42], eF: [88, 59], hF: [98, 43],
  kN: [64, 79], fN: [56, 90], kF: [64, 79], fF: [55, 90],
}
const CHEST_A = shift(STAND, 16)
const CHEST_B = p({ eN: [98, 30], hN: [98, 14], sh: [78, 28], head: [78, 17] }, shift(STAND, 18))
const REACH_B = p({ eN: [62, 17], hN: [60, 5], eF: [58, 17], hF: [60, 5], head: [60, 15], sh: [60, 26] }, ARMS_UP)

const CALF_A: Pose = {
  head: [78, 34], sh: [72, 44], hip: [58, 66],
  eN: [84, 46], hN: [97, 44], eF: [84, 47], hF: [97, 45],
  kN: [70, 78], fN: [76, 90], kF: [46, 78], fF: [36, 90],
}
const CALF_B = p({ head: [84, 36], sh: [78, 45], hip: [62, 66], eN: [88, 47], hN: [98, 44], eF: [88, 48], hF: [98, 45], kF: [50, 78], fF: [40, 90] }, CALF_A)
const SQUEEZE_A = p({ eN: [50, 52], hN: [60, 50], eF: [49, 53], hF: [59, 51] }, SIT)
const SQUEEZE_B = p({ eN: [32, 52], hN: [46, 50], eF: [31, 53], hF: [45, 51] }, SIT)
const Y_A = p({ eN: [62, 44], hN: [66, 54], eF: [61, 44], hF: [65, 55] }, STAND)
const Y_B = p({ eN: [66, 18], hN: [72, 6], eF: [64, 18], hF: [70, 6] }, STAND)

// home: on the floor (head left), y = 86 so the body rests on the ground line
const SUPINE: Pose = {
  head: [14, 84], sh: [28, 86], hip: [56, 86],
  eN: [38, 86], hN: [50, 86], eF: [38, 87], hF: [50, 87],
  kN: [76, 66], fN: [86, 86], kF: [76, 66], fF: [86, 86],
}
const BRIDGE_UP = p({ hip: [54, 64], sh: [28, 84], head: [14, 83], kN: [76, 62], kF: [76, 62], eN: [38, 85], hN: [50, 84] }, SUPINE)
const CRUNCH_A2 = p({ eN: [24, 76], hN: [17, 81], eF: [24, 77], hF: [17, 82] }, SUPINE)
const CRUNCH_B2 = p({ sh: [36, 78], head: [34, 66], eN: [30, 70], hN: [27, 66], eF: [30, 71], hF: [27, 67] }, SUPINE)
const BIKE_A = p(
  { sh: [37, 78], head: [34, 68], eN: [31, 70], hN: [28, 66], eF: [31, 71], hF: [28, 67], kN: [66, 64], fN: [76, 74], kF: [76, 80], fF: [96, 76] },
  SUPINE,
)
const BIKE_B = p({ kF: [66, 64], fF: [76, 74], kN: [76, 80], fN: [96, 76] }, BIKE_A)
const LEGS_FLAT = p({ kN: [76, 86], fN: [96, 86], kF: [76, 87], fF: [96, 87] }, SUPINE)
const LEGS_UP = p({ kN: [57, 64], fN: [58, 42], kF: [58, 64], fF: [59, 42] }, SUPINE)
const SITUP_A = p({ eN: [24, 76], hN: [17, 81], eF: [24, 77], hF: [17, 82] }, SUPINE)
const SITUP_B = p({ sh: [50, 62], head: [47, 52], eN: [57, 52], hN: [50, 48], eF: [57, 53], hF: [50, 49] }, SUPINE)
const PRONE: Pose = {
  head: [90, 84], sh: [70, 86], hip: [42, 86],
  eN: [80, 86], hN: [94, 86], eF: [80, 87], hF: [94, 87],
  kN: [26, 86], fN: [10, 86], kF: [26, 87], fF: [10, 87],
}
const SUPER_B = p({ head: [92, 72], sh: [70, 82], eN: [82, 76], hN: [96, 72], eF: [82, 77], hF: [96, 73], kN: [26, 82], fN: [10, 74], kF: [26, 82], fF: [10, 75] }, PRONE)
const QUAD: Pose = {
  head: [78, 56], sh: [66, 60], hip: [34, 60],
  eN: [66, 74], hN: [66, 88], eF: [66, 74], hF: [66, 88],
  kN: [34, 86], fN: [18, 88], kF: [34, 86], fF: [18, 88],
}
const BIRD_B = p({ hF: [96, 58], eF: [82, 59], fF: [6, 58], kF: [20, 59], head: [80, 54] }, QUAD)
const CHILD_A = p(
  { head: [64, 70], sh: [52, 70], hip: [24, 76], eN: [66, 78], hN: [82, 86], eF: [66, 79], hF: [82, 87], kN: [42, 88], fN: [14, 88], kF: [42, 88], fF: [14, 88] },
  STAND,
)
const CHILD_B = p({ head: [70, 80], sh: [56, 78], eN: [74, 84], hN: [94, 88], eF: [74, 85], hF: [94, 88] }, CHILD_A)
const DOG_A: Pose = {
  head: [82, 70], sh: [74, 60], hip: [52, 48],
  eN: [80, 76], hN: [84, 88], eF: [79, 76], hF: [83, 88],
  kN: [41, 68], fN: [30, 88], kF: [41, 68], fF: [29, 88],
}
const DOG_B = p({ kN: [44, 66], fN: [34, 76] }, DOG_A)
const KPU_A: Pose = {
  head: [89, 57], sh: [78, 60], hip: [52, 72],
  eN: [78, 74], hN: [78, 88], eF: [77, 74], hF: [77, 88],
  kN: [34, 86], fN: [18, 76], kF: [34, 86], fF: [18, 76],
}
const KPU_B = p({ head: [89, 76], sh: [78, 78], hip: [52, 82], eN: [64, 84], eF: [63, 84], fN: [18, 80], fF: [18, 80] }, KPU_A)
const TAP_B = p({ eN: [84, 66], hN: [80, 56] }, PUSH_UP)
const INCH_A: Pose = {
  head: [76, 72], sh: [68, 62], hip: [50, 40],
  eN: [76, 76], hN: [84, 88], eF: [75, 76], hF: [83, 88],
  kN: [48, 64], fN: [46, 88], kF: [48, 64], fF: [45, 88],
}
const HK_A = p({ kN: [76, 50], fN: [74, 66], eN: [54, 40], hN: [50, 50], eF: [66, 38], hF: [72, 44] }, STAND)
const HK_B = p({ kF: [76, 50], fF: [74, 66], eF: [54, 40], hF: [50, 50], eN: [66, 38], hN: [72, 44] }, STAND)

// with equipment
const CURL_A = p({ hN: [61, 52], hF: [59, 52] }, STAND)
const CURL_B = p({ eN: [62, 40], hN: [71, 31], eF: [60, 40], hF: [69, 31] }, STAND)
const PRESS_A = p({ eN: [67, 38], hN: [67, 26], eF: [55, 38], hF: [55, 26] }, STAND)
const GOBLET_A = p({ eN: [66, 38], hN: [69, 32], eF: [65, 39], hF: [68, 33] }, STAND)
const GOBLET_B = p({ eN: [62, 52], hN: [69, 44], eF: [61, 53], hF: [68, 45] }, SQUAT)
const ROW_A = p({ eN: [71, 56], hN: [72, 68], eF: [70, 56], hF: [71, 68] }, HINGE)
const ROW_B = p({ eN: [58, 50], hN: [66, 52], eF: [57, 51], hF: [65, 53] }, HINGE)
const RDL_A = p({ hN: [63, 54], hF: [62, 54] }, STAND)
const RDL_B = p({ eN: [66, 60], hN: [62, 74], eF: [65, 61], hF: [61, 75] }, HINGE)
const TRI_A = p({ eN: [64, 14], hN: [54, 20], eF: [62, 14], hF: [54, 22] }, STAND)
const FLOOR_SIT: Pose = {
  head: [35, 51], sh: [34, 62], hip: [34, 86],
  eN: [46, 66], hN: [60, 70], eF: [46, 67], hF: [60, 71],
  kN: [54, 86], fN: [74, 86], kF: [54, 87], fF: [74, 87],
}
const BAND_ROW_A = p({ eN: [52, 74], hN: [72, 80], eF: [52, 75], hF: [72, 81] }, FLOOR_SIT)
const BAND_ROW_B = p({ eN: [26, 72], hN: [40, 74], eF: [26, 73], hF: [40, 75] }, FLOOR_SIT)
const BAND_CURL_B = p({ eN: [62, 40], hN: [71, 31], eF: [60, 40], hF: [69, 31] }, STAND)
const KB_A = p({ eN: [64, 62], hN: [60, 70], eF: [63, 62], hF: [59, 71] }, HINGE)
const KB_B = p({ eN: [72, 30], hN: [84, 30], eF: [71, 31], hF: [83, 31] }, STAND)
const HANG_A: Pose = {
  head: [60, 22], sh: [60, 32], hip: [60, 58],
  eN: [62, 20], hN: [62, 8], eF: [58, 20], hF: [58, 8],
  kN: [60, 74], fN: [62, 88], kF: [60, 74], fF: [58, 88],
}
const PULL_B = p({ head: [60, 6], sh: [60, 16], hip: [60, 42], eN: [66, 12], hN: [63, 8], eF: [54, 12], hF: [57, 8], kN: [60, 58], fN: [62, 72], kF: [60, 58], fF: [58, 72] }, HANG_A)
const HANG_B = p({ sh: [60, 29], head: [60, 20] }, HANG_A)

type Held = { kind: 'dumbbell' | 'kettlebell'; joints: Joint[] }
type Art = { a: Pose; b: Pose; scene: Scene; extra?: string; speed?: number; held?: Held; link?: [Joint, Joint] }

const ART: Record<string, Art> = {
  'chair-squat': { a: STAND, b: SQUAT, scene: 'chair' },
  squat: { a: STAND, b: SQUAT, scene: 'none' },
  'jump-squat': { a: SQUAT, b: JUMP, scene: 'none', speed: 1.4 },
  'calf-raise': { a: STAND, b: CALF_UP, scene: 'none', speed: 1.4 },
  'wall-sit': { a: WALL_STAND, b: WALL_SIT, scene: 'wall' },
  'reverse-lunge': { a: STAND, b: LUNGE, scene: 'none' },
  'glute-bridge-stand': { a: STAND, b: GLUTE, scene: 'none', speed: 1.5 },
  'desk-pushup': { a: DESK_UP, b: DESK_DOWN, scene: 'desk' },
  pushup: { a: PUSH_UP, b: PUSH_DOWN, scene: 'none' },
  'diamond-pushup': { a: PUSH_UP, b: PUSH_DOWN, scene: 'none' },
  'chair-dip': { a: DIP_UP, b: DIP_DOWN, scene: 'chair' },
  'wall-angel': { a: ANGEL_DOWN, b: ANGEL_UP, scene: 'wall' },
  plank: { a: PLANK, b: PLANK_HIGH, scene: 'none', speed: 3 },
  'knee-plank': { a: KNEE_PLANK, b: KNEE_PLANK_HIGH, scene: 'none', speed: 3 },
  'seated-knee-lift': { a: SIT, b: SIT_KNEE, scene: 'chair' },
  'mountain-climber': { a: CLIMB_A, b: CLIMB_B, scene: 'none', speed: 0.6 },
  'standing-crunch': { a: CRUNCH_A, b: CRUNCH_B, scene: 'none' },
  'chair-twist': { a: SIT_TWIST_A, b: SIT_TWIST_B, scene: 'chair' },
  'cat-cow-seated': { a: SIT_ARCH, b: SIT_ROUND, scene: 'chair' },
  'hip-hinge': { a: HANDS_HIPS, b: HINGE, scene: 'none' },
  'neck-roll': { a: NECK_FWD, b: NECK_BACK, scene: 'none', speed: 1.6 },
  'chin-tuck': { a: TUCK_FWD, b: TUCK_BACK, scene: 'none', speed: 1.6 },
  'shoulder-roll': { a: SHRUG_A, b: SHRUG_B, scene: 'none', speed: 1.4 },
  'wrist-circles': { a: WRIST_UP, b: WRIST_DOWN, scene: 'none', speed: 0.8 },
  'prayer-stretch': { a: PRAYER_A, b: PRAYER_B, scene: 'none', speed: 1.6 },
  'eye-20': { a: EYE_NEAR, b: STAND, scene: 'far', speed: 2 },
  'jumping-jacks': { a: STAND, b: WIDE_JACK, scene: 'none', speed: 0.6 },
  march: { a: MARCH_A, b: MARCH_B, scene: 'none', speed: 0.7 },
  burpee: { a: STAND, b: PUSH_UP, scene: 'none', speed: 1.5 },
}

type CueKind = 'arrow' | 'circle' | 'pulse'
type Cue = { joint: Joint; kind: CueKind }

/** What to point at for each move: an arrow along the motion, a circle for rotations, a pulse for holds. */
const CUES: Record<string, Cue> = {
  'neck-roll': { joint: 'head', kind: 'circle' },
  'chin-tuck': { joint: 'head', kind: 'arrow' },
  'shoulder-roll': { joint: 'sh', kind: 'circle' },
  'wrist-circles': { joint: 'hN', kind: 'circle' },
  'prayer-stretch': { joint: 'hN', kind: 'arrow' },
  'calf-raise': { joint: 'head', kind: 'arrow' },
  'glute-bridge-stand': { joint: 'hip', kind: 'pulse' },
  plank: { joint: 'hip', kind: 'pulse' },
  'knee-plank': { joint: 'hip', kind: 'pulse' },
  'wall-sit': { joint: 'hip', kind: 'arrow' },
  'wall-angel': { joint: 'hN', kind: 'arrow' },
  march: { joint: 'kN', kind: 'arrow' },
  'chair-twist': { joint: 'hN', kind: 'arrow' },
  'cat-cow-seated': { joint: 'head', kind: 'arrow' },
  'figure-four': { joint: 'hip', kind: 'pulse' },
  'quad-stretch': { joint: 'kN', kind: 'pulse' },
  'wall-chest-stretch': { joint: 'sh', kind: 'pulse' },
  'overhead-reach': { joint: 'hN', kind: 'arrow' },
  'calf-stretch': { joint: 'hN', kind: 'pulse' },
  'scapula-squeeze': { joint: 'eN', kind: 'arrow' },
  'y-raise': { joint: 'hN', kind: 'arrow' },
  'childs-pose': { joint: 'hip', kind: 'pulse' },
  'downward-dog': { joint: 'hip', kind: 'pulse' },
  'dead-hang': { joint: 'sh', kind: 'pulse' },
  'glute-bridge': { joint: 'hip', kind: 'arrow' },
  superman: { joint: 'hN', kind: 'arrow' },
  'bird-dog': { joint: 'hF', kind: 'arrow' },
  'leg-raise': { joint: 'fN', kind: 'arrow' },
  'sit-up': { joint: 'head', kind: 'arrow' },
  crunch: { joint: 'head', kind: 'arrow' },
  'bicycle-crunch': { joint: 'kN', kind: 'arrow' },
}

Object.assign(ART, {
  // office
  'seated-leg-extension': { a: SIT, b: LEG_OUT, scene: 'chair' },
  'figure-four': { a: FOUR_A, b: FOUR_B, scene: 'chair', speed: 0.8 },
  'quad-stretch': { a: STAND, b: QUAD_B, scene: 'none', speed: 0.8 },
  'glute-kickback': { a: STAND, b: KICK_B, scene: 'none' },
  'wall-pushup': { a: WALL_PU_A, b: WALL_PU_B, scene: 'wallR' },
  'wall-chest-stretch': { a: CHEST_A, b: CHEST_B, scene: 'wallR', speed: 0.8 },
  'overhead-reach': { a: STAND, b: REACH_B, scene: 'none', speed: 0.9 },
  'calf-stretch': { a: CALF_A, b: CALF_B, scene: 'wallR', speed: 1.6 },
  'scapula-squeeze': { a: SQUEEZE_A, b: SQUEEZE_B, scene: 'chair', speed: 1.2 },
  'y-raise': { a: Y_A, b: Y_B, scene: 'none', speed: 1 },
  // home
  'glute-bridge': { a: SUPINE, b: BRIDGE_UP, scene: 'mat' },
  crunch: { a: CRUNCH_A2, b: CRUNCH_B2, scene: 'mat' },
  'bicycle-crunch': { a: BIKE_A, b: BIKE_B, scene: 'mat', speed: 1.2 },
  'leg-raise': { a: LEGS_FLAT, b: LEGS_UP, scene: 'mat' },
  'sit-up': { a: SITUP_A, b: SITUP_B, scene: 'mat' },
  superman: { a: PRONE, b: SUPER_B, scene: 'mat' },
  'bird-dog': { a: QUAD, b: BIRD_B, scene: 'mat' },
  'childs-pose': { a: CHILD_A, b: CHILD_B, scene: 'mat', speed: 0.7 },
  'downward-dog': { a: DOG_A, b: DOG_B, scene: 'mat', speed: 0.8 },
  'knee-pushup': { a: KPU_A, b: KPU_B, scene: 'mat' },
  'shoulder-taps': { a: PUSH_UP, b: TAP_B, scene: 'mat', speed: 1.4 },
  inchworm: { a: INCH_A, b: PUSH_UP, scene: 'mat', speed: 0.8 },
  'forward-lunge': { a: STAND, b: LUNGE, scene: 'none' },
  'high-knees': { a: HK_A, b: HK_B, scene: 'none', speed: 2 },
  // equipment
  'db-curl': { a: CURL_A, b: CURL_B, scene: 'none', held: { kind: 'dumbbell', joints: ['hN', 'hF'] } },
  'db-press': { a: PRESS_A, b: ARMS_UP, scene: 'none', held: { kind: 'dumbbell', joints: ['hN', 'hF'] } },
  'db-goblet-squat': { a: GOBLET_A, b: GOBLET_B, scene: 'none', held: { kind: 'dumbbell', joints: ['hN'] } },
  'db-row': { a: ROW_A, b: ROW_B, scene: 'none', held: { kind: 'dumbbell', joints: ['hN', 'hF'] } },
  'db-rdl': { a: RDL_A, b: RDL_B, scene: 'none', held: { kind: 'dumbbell', joints: ['hN', 'hF'] } },
  'db-tricep-ext': { a: TRI_A, b: ARMS_UP, scene: 'none', held: { kind: 'dumbbell', joints: ['hN'] } },
  'band-row': { a: BAND_ROW_A, b: BAND_ROW_B, scene: 'mat', link: ['hN', 'fN'] },
  'band-curl': { a: CURL_A, b: BAND_CURL_B, scene: 'none', link: ['hN', 'fN'] },
  'kb-swing': { a: KB_A, b: KB_B, scene: 'none', speed: 1.6, held: { kind: 'kettlebell', joints: ['hN'] } },
  pullup: { a: HANG_A, b: PULL_B, scene: 'bar' },
  'dead-hang': { a: HANG_A, b: HANG_B, scene: 'bar', speed: 1.8 },
} satisfies Record<string, Art>)

const FALLBACK: Art = { a: STAND, b: ARMS_UP, scene: 'none' }

export const hasArt = (id: string): boolean => id in ART

/** The scene and gear of a move in words, for prompts to an image model. */
export const describeSetting = (id: string): string[] => {
  const art = ART[id]
  const scene: Record<Scene, string | null> = {
    none: null,
    chair: 'a simple chair with a backrest',
    desk: 'a desk edge at hip height',
    wall: 'a plain wall',
    wallR: 'a plain wall',
    far: 'a distant hill on the horizon',
    mat: 'an exercise mat on the floor',
    bar: 'a horizontal pull-up bar above the head',
  }
  const out: string[] = []
  const place = art ? scene[art.scene] : null

  if (place) out.push(place)
  if (art?.held) out.push(art.held.kind === 'kettlebell' ? 'a kettlebell' : 'a dumbbell in each hand')
  if (art?.link) out.push('a resistance band stretched between the hands and the feet')

  return out
}

/** Whether a hand-drawn illustration (from the image pipeline) exists for this move. */
export const hasIllustration = (id: string): boolean => id in AI_ART

// Monochrome by default. Colours are CSS variables defined inside every drawing,
// switching with the viewer's light or dark scheme, so no drawing needs the theme passed in.
const THEMES = {
  signal: { body: 'var(--c-main)', limb: 'var(--c-limb)', shirt: 'var(--c-main)', accent: 'var(--c-sig)' },
  mono: { body: 'var(--c-main)', limb: 'var(--c-limb)', shirt: 'var(--c-main)', accent: 'var(--c-strong)' },
  teal: { body: '#14b8a6', limb: '#2dd4bf', shirt: '#0f766e', accent: '#f59e0b' },
  violet: { body: '#8b5cf6', limb: '#a78bfa', shirt: '#6d28d9', accent: '#f59e0b' },
  rose: { body: '#f43f5e', limb: '#fb7185', shirt: '#be123c', accent: '#14b8a6' },
  blue: { body: '#3b82f6', limb: '#60a5fa', shirt: '#1d4ed8', accent: '#f59e0b' },
  amber: { body: '#f59e0b', limb: '#fbbf24', shirt: '#b45309', accent: '#14b8a6' },
  // plain black strokes on white, for the reference sheets sent to an image model (scripts/art)
  ref: { body: '#000000', limb: '#222222', shirt: '#000000', accent: '#000000', prop: '#000000', soft: '#e5e5e5' },
}

const STYLE =
  '<style>:root{color-scheme:light dark;--c-strong:#16140f;--c-main:#3a352b;--c-limb:#8c8473;--c-mute:#665f53;--c-soft:#8c847333;--c-on:#fff;--c-sig:#d9532a}' +
  '@media (prefers-color-scheme:dark){:root{--c-strong:#f1ede3;--c-main:#d9d3c5;--c-limb:#8c8473;--c-mute:#a39c8d;--c-soft:#a39c8d33;--c-on:#12110e;--c-sig:#ff7a4d}}</style>'

export type ThemeName = keyof typeof THEMES

const COLORS = {
  ...THEMES.signal,
  prop: 'var(--c-mute)',
  soft: 'var(--c-soft)',
  on: 'var(--c-on)',
}

/** Picks the accent colour every later drawing uses. */
export const setTheme = (name: string): void => {
  Object.assign(COLORS, { prop: 'var(--c-mute)', soft: 'var(--c-soft)' }, THEMES[(name in THEMES ? name : 'signal') as ThemeName])
}

const n = (v: number): string => (Math.round(v * 10) / 10).toString()

const scene = (s: Scene): string => {
  const ground = `<line x1="4" y1="91" x2="116" y2="91" stroke="${COLORS.prop}" stroke-width="2" stroke-linecap="round"/>`
  const chair = `<path d="M26 44 V90 M26 68 H50 M48 68 V90" stroke="${COLORS.prop}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  const desk = `<path d="M76 58 H114 M112 58 V90" stroke="${COLORS.prop}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  const wall = `<path d="M24 4 V90" stroke="${COLORS.prop}" stroke-width="3" stroke-linecap="round"/><path d="M18 14 l6 -6 M18 28 l6 -6 M18 42 l6 -6 M18 56 l6 -6 M18 70 l6 -6 M18 84 l6 -6" stroke="${COLORS.prop}" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>`
  const mat = `<rect x="6" y="88.5" width="108" height="3.5" rx="1.75" fill="${COLORS.soft}" stroke="${COLORS.prop}" stroke-width="1"/>`
  const bar = `<path d="M24 6 H96 M24 6 V22 M96 6 V22" stroke="${COLORS.prop}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  const wallR = `<path d="M101 4 V90" stroke="${COLORS.prop}" stroke-width="3" stroke-linecap="round"/><path d="M107 14 l-6 6 M107 28 l-6 6 M107 42 l-6 6 M107 56 l-6 6 M107 70 l-6 6 M107 84 l-6 6" stroke="${COLORS.prop}" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>`
  const far = `<path d="M92 91 l10 -22 l8 12 l6 -8 l0 18 z" fill="${COLORS.soft}" stroke="${COLORS.prop}" stroke-width="1.5" stroke-linejoin="round"/>`

  return ground + (s === 'chair' ? chair : s === 'desk' ? desk : s === 'wall' ? wall : s === 'far' ? far : s === 'mat' ? mat : s === 'bar' ? bar : s === 'wallR' ? wallR : '')
}

const BONES: [Joint, Joint, 'far' | 'near' | 'core'][] = [
  ['sh', 'eF', 'far'], ['eF', 'hF', 'far'], ['hip', 'kF', 'far'], ['kF', 'fF', 'far'],
  ['sh', 'hip', 'core'], ['sh', 'head', 'core'],
  ['sh', 'eN', 'near'], ['eN', 'hN', 'near'], ['hip', 'kN', 'near'], ['kN', 'fN', 'near'],
]

const keys = 'calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"'

const anim = (attr: string, from: number, to: number, dur: number): string =>
  from === to ? '' : `<animate attributeName="${attr}" values="${n(from)};${n(to)};${n(from)}" dur="${dur}s" repeatCount="indefinite" ${keys}/>`

const cueSvg = (id: string, art: Art, dur: number): string => {
  const cue = CUES[id] ?? { joint: AREA_JOINT[byId(id)?.area ?? ''] ?? 'hip', kind: 'arrow' as const }
  const [x0, y0] = art.a[cue.joint]
  const [x1, y1] = art.b[cue.joint]
  const dist = Math.hypot(x1 - x0, y1 - y0)
  const stroke = `stroke="${COLORS.accent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"`

  if (cue.kind === 'pulse') {
    return (
      `<circle cx="${n(x0)}" cy="${n(y0)}" r="9" ${stroke}><animate attributeName="r" values="8;14;8" dur="1.8s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite"/></circle>`
    )
  }

  if (cue.kind === 'circle') {
    const cx = (x0 + x1) / 2 + 2
    const cy = (y0 + y1) / 2
    const r = cue.joint === 'head' ? 14 : 12

    const cxy = `${n(cx)} ${n(cy)}`

    return (
      `<g><path d="M${n(cx - r)} ${n(cy)} A${r} ${r} 0 1 1 ${n(cx)} ${n(cy + r)}" ${stroke} stroke-dasharray="3 3"/>` +
      `<path d="M${n(cx - 3)} ${n(cy + r - 5)} L${n(cx + 1)} ${n(cy + r)} L${n(cx - 4)} ${n(cy + r + 3)}" ${stroke}/>` +
      `<animateTransform attributeName="transform" type="rotate" values="0 ${cxy};360 ${cxy}" dur="${n(dur * 1.5)}s" repeatCount="indefinite"/></g>`
    )
  }

  if (dist < 6) return ''

  // an arrow from the first pose to the second, bowed a little so it reads as motion
  const dx = (x1 - x0) / dist
  const dy = (y1 - y0) / dist
  const mx = (x0 + x1) / 2 - dy * 7
  const my = (y0 + y1) / 2 + dx * 7
  const hx = x1 - dx * 3
  const hy = y1 - dy * 3
  const a1 = `${n(hx - dx * 5 - dy * 4)} ${n(hy - dy * 5 + dx * 4)}`
  const a2 = `${n(hx - dx * 5 + dy * 4)} ${n(hy - dy * 5 - dx * 4)}`

  return (
    `<path d="M${n(x0)} ${n(y0)} Q${n(mx)} ${n(my)} ${n(hx)} ${n(hy)}" ${stroke} stroke-dasharray="3 3" opacity=".8">` +
    `<animate attributeName="stroke-dashoffset" values="0;-12" dur="1s" repeatCount="indefinite"/></path>` +
    `<path d="M${a1} L${n(hx)} ${n(hy)} L${a2}" ${stroke} opacity=".8"/>`
  )
}

/** Which bones do the work, by body area: the bold look paints them in the strong colour and the rest soft. */
const HOT: Record<string, string[]> = {
  legs: ['hip-kN', 'kN-fN', 'hip-kF', 'kF-fF'],
  core: ['sh-hip'],
  back: ['sh-hip'],
  upper: ['sh-eN', 'eN-hN', 'sh-eF', 'eF-hF'],
  wrists: ['eN-hN', 'eF-hF'],
  neck: ['sh-head'],
  eyes: ['sh-head'],
  full: ['hip-kN', 'kN-fN', 'hip-kF', 'kF-fF', 'sh-hip', 'sh-eN', 'eN-hN', 'sh-eF', 'eF-hF'],
}

const AREA_JOINT: Record<string, Joint> = {
  legs: 'kN', core: 'hip', upper: 'sh', back: 'sh', neck: 'head', wrists: 'hN', eyes: 'head', full: 'hip',
}

/** The pose halfway between two poses. */
const midPose = (a: Pose, b: Pose): Pose =>
  Object.fromEntries(J.map(j => [j, [(a[j][0] + b[j][0]) / 2, (a[j][1] + b[j][1]) / 2] as Pt])) as Pose

/** Whether the line-art library has this move. */
export const hasLineArt = (id: string): boolean => id in WG_ART

/** Line art (Workout Guide, CC BY-SA 4.0): up to three frames played one, two, three, two, in the theme's strong colour. */
const lineArtSvg = (id: string, width: number, frame: 0 | 0.5 | 1 | undefined, isAnimated: boolean): string => {
  const frames = WG_ART[id]

  if (!frames || frames.length === 0) return ''

  const order = frames.length >= 3 ? [0, 1, 2, 1] : frames.map((_, i) => i)
  const still = frame !== undefined || !isAnimated
  const shown = frame === 1 ? frames.length - 1 : frame === 0.5 ? Math.floor(frames.length / 2) : 0
  const paint = (d: string, k: number): string => {
    const pulse = still
      ? ''
      : `<animate attributeName="opacity" calcMode="discrete" dur="${n(order.length * 0.7)}s" repeatCount="indefinite" ` +
        `keyTimes="${order.map((_, i) => n(i / order.length)).join(';')}" values="${order.map(f => (f === k ? 1 : 0)).join(';')}"/>`

    // the middle frame of the library is the original, bolder drawing: a thin outline on the others keeps the line weight even
    const weight = k === 1 || WG_EVEN.includes(id) ? '' : ` stroke="${COLORS.accent}" stroke-width="2.5" stroke-linejoin="round"`

    return `<path fill-rule="evenodd" fill="${COLORS.accent}"${weight} opacity="${still ? (k === shown ? 1 : 0) : k === order[0] ? 1 : 0}" d="${d}">${pulse}</path>`
  }
  // a still picture needs only the frame it shows; the others would just add weight
  const paths = frames.map((d, k) => (still && k !== shown ? '' : paint(d, k))).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${width}" height="${width}">${STYLE}${paths}</svg>`
}

/** Two hand-drawn poses (vector paths from the image pipeline) that fade into each other. */
const illustrationSvg = (art: IllustrationArt, width: number, frame: 0 | 0.5 | 1 | undefined, isAnimated: boolean): string => {
  const w = art.w
  const h = art.h
  const fill = `fill="${COLORS.accent}"`
  const cycle = 'dur="2.4s" repeatCount="indefinite" calcMode="linear"'
  const fade = (values: string) => `<animate attributeName="opacity" values="${values}" keyTimes="0;.38;.5;.88;1" ${cycle}/>`
  const still = frame !== undefined || !isAnimated
  const showB = frame === 1
  const pa = `<path d="${art.a}" ${fill} opacity="${still && showB ? 0 : 1}">${still ? '' : fade('1;1;0;0;1')}</path>`
  const pb = `<path d="${art.b}" ${fill} opacity="${still && showB ? 1 : 0}">${still ? '' : fade('0;0;1;1;0')}</path>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${width}" height="${Math.round((width * h) / w)}">${STYLE}` +
    `${pa}${pb}</svg>`
  )
}

/** An animated skeleton for one exercise, `width` css pixels wide. */
export const figureSvg = (id: string, width = 240, frame?: 0 | 0.5 | 1, isAnimated = true, style: 'drawn' | 'stick' | 'bold' | 'line' = 'drawn'): string => {
  // line art: a move without a drawing shows none, on purpose
  if (style === 'line') return lineArtSvg(id, width, frame, isAnimated)

  const drawn = style === 'drawn' ? AI_ART[id] : undefined

  if (drawn) return illustrationSvg(drawn, width, frame, isAnimated)

  const art = ART[id] ?? FALLBACK
  const dur = 2.2 / (art.speed ?? 1)
  const move = isAnimated && frame === undefined
  const a = frame === 1 ? art.b : frame === 0.5 ? midPose(art.a, art.b) : art.a
  const b = move ? art.b : a
  const a2 = (attr: string, from: number, to: number): string => (move ? anim(attr, from, to, dur) : '')

  const lines = BONES.map(([from, to, side]) => {
    const [x1, y1] = a[from]
    const [x2, y2] = a[to]
    const [bx1, by1] = b[from]
    const [bx2, by2] = b[to]
    const isTorso = from === 'sh' && to === 'hip'
    const isBold = style === 'bold'
    const hot = isBold && (HOT[byId(id)?.area ?? 'full'] ?? []).includes(`${from}-${to}`)
    const width = isBold ? (isTorso ? 13 : side === 'core' ? 5 : 8.5) : isTorso ? 9 : side === 'core' ? 4 : 4.5
    const color = isBold ? (hot ? COLORS.accent : COLORS.limb) : isTorso ? COLORS.shirt : side === 'core' ? COLORS.shirt : COLORS.limb
    const opacity = side === 'far' ? (isBold ? ' opacity=".55"' : ' opacity=".5"') : ''

    return (
      `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${opacity}>` +
      a2('x1', x1, bx1) + a2('y1', y1, by1) + a2('x2', x2, bx2) + a2('y2', y2, by2) +
      '</line>'
    )
  }).join('')

  const shoe = (j: 'fN' | 'fF'): string => {
    const [x, y] = a[j]
    const [bx, by] = b[j]

    return (
      `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x + 5)}" y2="${n(y)}" stroke="${style === 'bold' ? COLORS.limb : COLORS.accent}" stroke-width="${style === 'bold' ? 8.5 : 4.5}" stroke-linecap="round"${j === 'fF' ? ' opacity=".6"' : ''}>` +
      a2('x1', x, bx) + a2('y1', y, by) + a2('x2', x + 5, bx + 5) + a2('y2', y, by) + '</line>'
    )
  }

  // gear: dumbbells and kettlebells ride on the hands, a band is a line between two joints
  const gear = (art.held?.joints ?? [])
    .map((j, idx) => {
      const [x0, y0] = a[j]
      const [x1, y1] = b[j]
      const shape =
        art.held?.kind === 'kettlebell'
          ? `<circle cx="0" cy="4" r="6" fill="${COLORS.accent}"/><path d="M-3.5 -1 Q0 -8 3.5 -1" fill="none" stroke="${COLORS.accent}" stroke-width="2.2" stroke-linecap="round"/>`
          : `<rect x="-7" y="-3" width="14" height="6" rx="2" fill="${COLORS.accent}"/><rect x="-9.5" y="-5.5" width="3.5" height="11" rx="1.2" fill="${COLORS.accent}"/><rect x="6" y="-5.5" width="3.5" height="11" rx="1.2" fill="${COLORS.accent}"/>`
      const moving =
        move && (x0 !== x1 || y0 !== y1)
          ? `<animateTransform attributeName="transform" type="translate" values="${n(x0)} ${n(y0)};${n(x1)} ${n(y1)};${n(x0)} ${n(y0)}" dur="${dur}s" repeatCount="indefinite" ${keys}/>`
          : ''

      return `<g transform="translate(${n(x0)} ${n(y0)})"${idx > 0 ? ' opacity=".6"' : ''}>${shape}${moving}</g>`
    })
    .join('')
  const band = art.link
    ? (() => {
        const [j1, j2] = art.link
        const [x1, y1] = a[j1]
        const [x2, y2] = a[j2]
        const [bx1, by1] = b[j1]
        const [bx2, by2] = b[j2]

        return (
          `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${COLORS.accent}" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 0">` +
          a2('x1', x1, bx1) + a2('y1', y1, by1) + a2('x2', x2, bx2) + a2('y2', y2, by2) + '</line>'
        )
      })()
    : ''

  const [hx, hy] = a.head
  const [bhx, bhy] = b.head
  const headHot = style === 'bold' && ['neck', 'eyes'].includes(byId(id)?.area ?? '')
  const head =
    `<circle cx="${n(hx)}" cy="${n(hy)}" r="${style === 'bold' ? 8 : 6.5}" fill="${style === 'bold' ? (headHot ? COLORS.accent : COLORS.limb) : COLORS.accent}">` + a2('cx', hx, bhx) + a2('cy', hy, bhy) + '</circle>'

  const focus = AREA_JOINT[byId(id)?.area ?? ''] ?? 'hip'
  const [fx, fy] = a[focus]
  const [bfx, bfy] = b[focus]
  const glow =
    `<circle cx="${n(fx)}" cy="${n(fy)}" r="8" fill="${COLORS.accent}" opacity=".28">` +
    a2('cx', fx, bfx) + a2('cy', fy, bfy) +
    (move
      ? `<animate attributeName="r" values="7;11;7" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;.1;.35" dur="1.6s" repeatCount="indefinite"/>`
      : '') +
    '</circle>'

  const eye =
    id === 'eye-20'
      ? `<line x1="${n(hx + 4)}" y1="${n(hy)}" x2="${n(hx + 20)}" y2="${n(hy + 14)}" stroke="${COLORS.accent}" stroke-width="1.5" stroke-dasharray="3 3" opacity=".9">` +
        (move
          ? `<animate attributeName="x2" values="${n(hx + 20)};118;${n(hx + 20)}" dur="${dur}s" repeatCount="indefinite" ${keys}/>` +
            `<animate attributeName="y2" values="${n(hy + 14)};${n(hy)};${n(hy + 14)}" dur="${dur}s" repeatCount="indefinite" ${keys}/>`
          : '') +
        '</line>'
      : ''

  const mid = J.reduce((sum, j) => sum + a[j][0], 0) / J.length
  const shadow = `<ellipse cx="${n(mid)}" cy="91" rx="24" ry="2.6" fill="${COLORS.prop}" opacity=".28"/>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="${width}" height="${Math.round((width * 100) / 120)}">${STYLE}` +
    scene(art.scene) + shadow + (style === 'bold' ? '' : glow) + lines + shoe('fF') + shoe('fN') + band + gear + head + eye + (move ? cueSvg(id, art, dur) : '') + '</svg>'
  )
}

// ---------------------------------------------------------------- braille

const BRAILLE_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

/** Two-frame text figure for terminals: `frame` 0 or 1, `cols` characters wide. */
export const figureText = (id: string, frame: 0 | 1, cols = 34): string[] => {
  const art = ART[id] ?? FALLBACK
  const pose = frame === 0 ? art.a : art.b
  const W = cols * 2
  const H = Math.round((W * 100) / 120)
  const rows = Math.ceil(H / 4)
  const grid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))
  const sx = W / 120
  const sy = H / 100

  const dot = (x: number, y: number) => {
    const cx = Math.round(x)
    const cy = Math.round(y)

    if (cx < 0 || cy < 0 || cx >= W || cy >= H) return

    const r = grid[cy >> 2]

    if (r) r[cx >> 1] = (r[cx >> 1] ?? 0) | (BRAILLE_BITS[cy & 3]?.[cx & 1] ?? 0)
  }

  const line = (a: Pt, b: Pt, thick = false) => {
    const steps = Math.max(Math.abs(b[0] - a[0]) * sx, Math.abs(b[1] - a[1]) * sy, 1) * 2

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = (a[0] + (b[0] - a[0]) * t) * sx
      const y = (a[1] + (b[1] - a[1]) * t) * sy

      dot(x, y)
      if (thick) dot(x + 1, y)
    }
  }

  line([4, 91], [116, 91])

  if (art.scene === 'chair') {
    line([26, 44], [26, 90]); line([26, 68], [50, 68]); line([48, 68], [48, 90])
  } else if (art.scene === 'desk') {
    line([76, 58], [114, 58]); line([112, 58], [112, 90])
  } else if (art.scene === 'wall') {
    line([24, 4], [24, 90])
  } else if (art.scene === 'mat') {
    line([6, 88], [114, 88])
  } else if (art.scene === 'bar') {
    line([24, 6], [96, 6]); line([24, 6], [24, 22]); line([96, 6], [96, 22])
  } else if (art.scene === 'wallR') {
    line([101, 4], [101, 90])
  } else if (art.scene === 'far') {
    line([92, 91], [102, 69]); line([102, 69], [110, 81]); line([110, 81], [116, 73])
  }

  for (const [from, to] of BONES) line(pose[from], pose[to], true)

  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dy * dy <= 10) dot(pose.head[0] * sx + dx, pose.head[1] * sy + dy)
    }
  }

  return grid.map(r => r.map(bits => String.fromCharCode(0x2800 + bits)).join(''))
}

// ------------------------------------------------------------------ charts

const font = 'font-family="system-ui, -apple-system, Segoe UI, sans-serif"'

const MONO = 'font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"'
const SEGMENT_GAP = 9 // degrees between the parts of the goal ring
const MAX_SEGMENTS = 16 // above this the goal ring is one smooth arc

const polar = (r: number, deg: number): string => `${n(60 + r * Math.cos((deg * Math.PI) / 180))} ${n(60 + r * Math.sin((deg * Math.PI) / 180))}`

/** Daily goal ring, one part per set of the goal, with the set count in the middle. */
export const ringSvg = (done: number, goal: number, size = 120, isAnimated = false): string => {
  const r = 46
  const total = Math.max(goal, 1)
  const reached = done >= total
  const parts = total > MAX_SEGMENTS || total === 1 ? 1 : total
  const gap = parts > 1 ? SEGMENT_GAP : 0
  const span = (360 - parts * gap) / parts
  const filled = parts === 1 ? 0 : Math.min(done, parts)
  const fraction = Math.min(done / total, 1)
  const c = 2 * Math.PI * r

  const arcs =
    parts === 1
      ? `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${COLORS.soft}" stroke-width="10"/>` +
        `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${COLORS.accent}" stroke-width="10" stroke-dasharray="${n(c * fraction)} ${n(c)}" transform="rotate(-90 60 60)"/>`
      : Array.from({ length: parts }, (_, i) => {
          const from = -90 + gap / 2 + i * (span + gap)
          const fade = isAnimated && i < filled ? `<animate attributeName="opacity" from="0" to="1" dur=".3s" begin="${n(i * 0.12)}s" fill="freeze"/>` : ''

          return (
            `<path d="M${polar(r, from)} A${r} ${r} 0 0 1 ${polar(r, from + span)}" fill="none" stroke-width="10" ` +
            `stroke="${i < filled ? COLORS.accent : COLORS.soft}">${fade}</path>`
          )
        }).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">${STYLE}` +
    arcs +
    `<text x="60" y="66" text-anchor="middle" font-size="${`${done}/${goal}`.length > 5 ? 19 : 26}" font-weight="700" fill="${COLORS.body}" ${MONO}>${done}/${goal}</text>` +
    `<text x="60" y="84" text-anchor="middle" font-size="9" letter-spacing=".6" fill="${COLORS.prop}" ${font}>${reached ? 'GOAL DONE' : 'SETS TODAY'}</text>` +
    '</svg>'
  )
}

/** Big level number with a thin progress bar to the next level. `label` is the small caption above the number. */
export const levelBarSvg = (level: number, frac: number, width = 170, label = 'LEVEL'): string => {
  const f = Math.max(0, Math.min(frac, 1))

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 64" width="${width}" height="${Math.round((width * 64) / 170)}">${STYLE}` +
    `<text x="0" y="11" font-size="10" letter-spacing=".8" fill="${COLORS.prop}" ${font}>${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` +
    `<text x="0" y="46" font-size="34" font-weight="700" fill="${COLORS.body}" ${MONO}>${level}</text>` +
    `<rect x="0" y="54" width="170" height="8" rx="4" fill="${COLORS.soft}"/>` +
    `<rect x="0" y="54" width="${n(170 * f)}" height="8" rx="4" fill="${COLORS.accent}"/></svg>`
  )
}

/** One dot per day: filled when the daily goal was reached that day. */
export const weekDotsSvg = (hits: boolean[], dot = 10): string => {
  const gap = 5
  const w = Math.max(hits.length, 1) * (dot + gap) - gap
  const body = hits
    .map((hit, i) => {
      const color = hit ? COLORS.accent : COLORS.limb

      return `<circle cx="${n(i * (dot + gap) + dot / 2)}" cy="${n(dot / 2 + 1)}" r="${n(dot / 2 - 0.75)}" fill="${hit ? color : 'none'}" stroke="${color}" stroke-width="1.5"/>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${dot + 2}" width="${w}" height="${dot + 2}">${STYLE}${body}</svg>`
}

/** Countdown ring with mm:ss in the middle. */
export const timerSvg = (remaining: number, total: number, phase: 'ready' | 'running', size = 120): string => {
  const r = 46
  const c = 2 * Math.PI * r
  const frac = phase === 'ready' ? 1 : Math.max(0, Math.min(remaining / Math.max(total, 1), 1))
  const color = phase === 'running' && remaining <= 5 ? COLORS.accent : COLORS.body
  const secs = Math.max(remaining, 0)
  const label = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">${STYLE}` +
    `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${COLORS.soft}" stroke-width="9"/>` +
    `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" ` +
    `stroke-dasharray="${n(c * frac)} ${n(c)}" transform="rotate(-90 60 60)"/>` +
    `<text x="60" y="68" text-anchor="middle" font-size="26" font-weight="700" fill="${color}" ${font}>${label}</text>` +
    `<text x="60" y="86" text-anchor="middle" font-size="9" fill="${COLORS.prop}" ${font}>${phase === 'ready' ? 'ready' : 'keep going'}</text>` +
    '</svg>'
  )
}

/** Bars for the last days; with `goal` above 0 a dashed goal line and the bars that reach it stand out. */
export const barsSvg = (
  days: { label: string; sets: number }[],
  goal: number,
  width = 300,
  format: (v: number) => string = v => String(v),
): string => {
  const max = Math.max(goal, ...days.map(d => d.sets), 1)
  const bw = 26
  const gap = (280 - bw * days.length) / Math.max(days.length - 1, 1)
  const top = 14
  const base = 96
  const y = (v: number) => base - (v / max) * (base - top)
  const bars = days
    .map((d, i) => {
      const x = 10 + i * (bw + gap)
      const hit = goal > 0 && d.sets >= goal

      return (
        `<rect x="${n(x)}" y="${n(y(d.sets))}" width="${bw}" height="${n(Math.max(base - y(d.sets), d.sets > 0 ? 2 : 0))}" rx="5" fill="${hit ? COLORS.accent : COLORS.limb}"/>` +
        `<text x="${n(x + bw / 2)}" y="112" text-anchor="middle" font-size="9" fill="${COLORS.prop}" ${font}>${d.label}</text>` +
        (d.sets > 0 ? `<text x="${n(x + bw / 2)}" y="${n(y(d.sets) - 3)}" text-anchor="middle" font-size="9" fill="${COLORS.prop}" ${font}>${format(d.sets)}</text>` : '')
      )
    })
    .join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="${width}" height="${Math.round((width * 120) / 300)}">${STYLE}` +
    (goal > 0 ? `<line x1="6" y1="${n(y(goal))}" x2="294" y2="${n(y(goal))}" stroke="${COLORS.accent}" stroke-width="1" stroke-dasharray="4 4"/>` : '') +
    bars + '</svg>'
  )
}

/** Horizontal bars: how much of the week's work each body region got (bar) against its goal share (tick). Regions well behind stand out. */
export const regionBarsSvg = (
  rows: { label: string; actual: number; target: number; isFocus: boolean }[],
  hasWork: boolean,
  width = 320,
): string => {
  const top = Math.max(...rows.flatMap(r => [r.actual, r.target]), 0.01) * 1.15
  const x0 = 118
  const span = 150
  const h = 6 + rows.length * 22
  const body = rows
    .map((r, i) => {
      const y = 8 + i * 22
      const len = Math.max((r.actual / top) * span, r.actual > 0 ? 2 : 0)
      const behind = hasWork && r.actual < r.target * 0.6
      const tick = x0 + (r.target / top) * span

      return (
        `<text x="0" y="${y + 9}" font-size="11" fill="${COLORS.body}" ${font}${r.isFocus ? ' font-weight="700"' : ''}>${r.label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` +
        `<rect x="${x0}" y="${y}" width="${span}" height="12" rx="6" fill="${COLORS.soft}"/>` +
        `<rect x="${x0}" y="${y}" width="${n(len)}" height="12" rx="6" fill="${behind ? COLORS.accent : COLORS.limb}"/>` +
        `<line x1="${n(tick)}" y1="${y - 2}" x2="${n(tick)}" y2="${y + 14}" stroke="${COLORS.prop}" stroke-width="1.5"/>` +
        `<text x="${x0 + span + 8}" y="${y + 10}" font-size="10" fill="${COLORS.prop}" ${font}>${Math.round(r.actual * 100)}%</text>`
      )
    })
    .join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 ${h}" width="${width}" height="${Math.round((width * h) / 300)}">${STYLE}` +
    body + '</svg>'
  )
}

const BADGE_GLYPH: Record<string, string> = {
  'first-set': 'M60 30 l8 18 l20 2 l-15 13 l5 19 l-18 -10 l-18 10 l5 -19 l-15 -13 l20 -2 z',
  'streak-3': 'M60 28 c10 14 20 20 20 36 a20 20 0 0 1 -40 0 c0 -10 6 -14 8 -22 c4 4 6 8 8 10 c2 -8 2 -16 4 -24 z',
  'build-break': 'M44 36 h32 v8 h-8 v24 h8 v8 h-32 v-8 h8 v-24 h-8 z',
}

/** One badge medal with no label; it pops in when `isPopping`. */
export const medalSvg = (id: string, size = 56, isPopping = true): string => {
  const glyph = BADGE_GLYPH[id] ?? BADGE_GLYPH['first-set']
  const pop = isPopping
    ? `<animateTransform attributeName="transform" type="scale" values="0.2;1.18;1" keyTimes="0;.65;1" dur=".6s" repeatCount="1" additive="sum" calcMode="spline" keySplines=".2 .8 .2 1;.4 0 .6 1"/>`
    : ''

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="${size}" height="${size}">${STYLE}` +
    `<g transform-origin="40 40"><circle cx="40" cy="40" r="30" fill="${COLORS.soft}" stroke="${COLORS.accent}" stroke-width="3.5"/>` +
    `<path d="${glyph}" fill="${COLORS.accent}" transform="translate(40 40) scale(.6) translate(-60 -45)"/>${pop}</g></svg>`
  )
}

/** A grid of badge medals: earned ones in colour, locked ones faded. */
export const badgesSvg = (items: { id: string; name: string; earned: boolean }[], perRow = 4, width = 340): string => {
  const cell = 80
  const rows = Math.ceil(items.length / perRow)
  const body = items
    .map((b, i) => {
      const x = (i % perRow) * cell
      const y = Math.floor(i / perRow) * 92
      const color = b.earned ? COLORS.accent : COLORS.prop
      const glyph = BADGE_GLYPH[b.id] ?? BADGE_GLYPH['first-set']

      return (
        `<g transform="translate(${x} ${y})" opacity="${b.earned ? 1 : 0.4}">` +
        `<circle cx="40" cy="34" r="26" fill="${COLORS.soft}" stroke="${color}" stroke-width="3"/>` +
        `<path d="${glyph}" fill="${color}" transform="translate(40 34) scale(.55) translate(-60 -45)"/>` +
        `<text x="40" y="80" text-anchor="middle" font-size="9" fill="${COLORS.prop}" ${font}>${b.name.replace(/&/g, '&amp;')}</text></g>`
      )
    })
    .join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cell * perRow} ${rows * 92}" width="${width}" height="${Math.round((width * rows * 92) / (cell * perRow))}">${STYLE}` +
    body + '</svg>'
  )
}

/** Podium for the top three of a board. */
export const podiumSvg = (rows: { nickname: string; points: number }[], width = 300): string => {
  const order = [rows[1], rows[0], rows[2]]
  const heights = [44, 62, 32]
  const medal = [COLORS.body, COLORS.accent, COLORS.limb]
  const cells = order
    .map((r, i) => {
      if (!r) return ''

      const h = heights[i] ?? 30
      const x = 20 + i * 90
      const name = r.nickname.length > 11 ? `${r.nickname.slice(0, 10)}…` : r.nickname

      return (
        `<rect x="${x}" y="${100 - h}" width="80" height="${h}" rx="6" fill="${i === 1 ? COLORS.accent : COLORS.soft}" stroke="${medal[i]}" stroke-width="2"/>` +
        `<text x="${x + 40}" y="${100 - h + 20}" text-anchor="middle" font-size="16" font-weight="700" fill="${i === 1 ? COLORS.on : medal[i]}" ${MONO}>${i === 1 ? 1 : i === 0 ? 2 : 3}</text>` +
        `<text x="${x + 40}" y="${100 - h - 14}" text-anchor="middle" font-size="10" font-weight="600" fill="${COLORS.body}" ${font}>${name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` +
        `<text x="${x + 40}" y="${100 - h - 3}" text-anchor="middle" font-size="9" fill="${COLORS.prop}" ${font}>${r.points} pts</text>`
      )
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 108" width="${width}" height="${Math.round((width * 108) / 300)}">${STYLE}${cells}</svg>`
}

/** Thin progress bar, `frac` from 0 to 1. */
export const xpBarSvg = (frac: number, width = 180): string => {
  const f = Math.max(0, Math.min(frac, 1))

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 10" width="${width}" height="${Math.round(width / 18)}">${STYLE}` +
    `<rect x="0" y="1" width="180" height="8" rx="4" fill="${COLORS.soft}"/>` +
    `<rect x="0" y="1" width="${n(180 * f)}" height="8" rx="4" fill="${COLORS.accent}"/></svg>`
  )
}

/** A short burst of falling confetti for a reached goal. */
export const confettiSvg = (width = 300): string => {
  const palette = [COLORS.accent, COLORS.body, COLORS.limb, COLORS.prop]
  let seed = 7
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  const bits = Array.from({ length: 28 }, (_, i) => {
    const x = Math.round(rnd() * 290) + 5
    const size = 4 + Math.round(rnd() * 4)
    const delay = (rnd() * 1.2).toFixed(2)
    const dur = (1.6 + rnd() * 1.2).toFixed(2)
    const spin = Math.round(rnd() * 360)

    return (
      `<rect x="${x}" y="-10" width="${size}" height="${size * 1.6}" rx="1" fill="${palette[i % palette.length]}">` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(rnd() * 20 - 10)} 100" dur="${dur}s" begin="${delay}s" repeatCount="2"/>` +
      `<animate attributeName="opacity" values="1;1;0" dur="${dur}s" begin="${delay}s" repeatCount="2"/>` +
      `<animateTransform attributeName="transform" additive="sum" type="rotate" values="0;${spin}" dur="${dur}s" begin="${delay}s" repeatCount="2"/></rect>`
    )
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="${width}" height="${Math.round((width * 80) / 300)}">${STYLE}${bits}</svg>`
}

// ------------------------------------------------------------------- icons

const ICONS = {
  flame: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-8 1 1 2 2 3 4 1-2 1-5 0-8z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  trophy: 'M7 4h10v6a5 5 0 0 1-10 0z M7 6H4v2a3 3 0 0 0 3 3 M17 6h3v2a3 3 0 0 1-3 3 M12 15v4 M8 21h8',
  chart: 'M5 21V11 M12 21V4 M19 21v-7',
  sliders: 'M4 7h9 M17 7h3 M4 17h3 M11 17h9 M13 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0 M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  play: 'M7 4l13 8-13 8z',
  shuffle: 'M3 7h4c5 0 5 10 10 10h4 M3 17h4c2 0 3-1.5 4-3 M13 10c1-1.5 2-3 4-3h4 M18 4l3 3-3 3 M18 14l3 3-3 3',
  check: 'M5 12.5l4.5 4.5L19 7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  heart: 'M12 20s-8-5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01',
  medal: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.5 14L7 21l5-3 5 3-1.5-7',
  speaker: 'M4 9v6h4l5 4V5L8 9z M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
}

export type IconName = keyof typeof ICONS

/** The same glyphs as text, for surfaces that cannot draw an Svg. */
export const ICON_TEXT: Record<IconName, string> = {
  flame: '🔥', bolt: '⚡', trophy: '🏆', chart: '▤', sliders: '⚙', user: '☺', play: '▶', shuffle: '⇄',
  check: '✓', clock: '◷', heart: '♥', target: '◎', medal: '★', speaker: '♪', globe: '◍', shield: '⛨',
}

/** A 24x24 line icon in the current accent (or `color`); `slot` centres it in a larger square so icons line up. */
export const iconSvg = (name: IconName, size = 18, color?: string, slot?: number): string => {
  const box = slot ?? size
  const units = (box * 24) / size
  const d = (units - 24) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(-d)} ${n(-d)} ${n(units)} ${n(units)}" width="${box}" height="${box}" fill="none" stroke="${color ?? COLORS.body}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${STYLE}<path d="${ICONS[name]}"/></svg>`
}

// -------------------------------------------------------- design components

const hash = (text: string): number => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

const AVATAR_COLORS = ['#4b5563', '#6b7280', '#57534e', '#52525b', '#64748b', '#71717a']

/** A round avatar with the nickname's first letter, colour picked from the name. */
export const avatarSvg = (name: string, size = 28): string => {
  const color = AVATAR_COLORS[hash(name) % AVATAR_COLORS.length] ?? COLORS.body
  const letter = (name.trim()[0] ?? '?').toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">${STYLE}` +
    `<circle cx="20" cy="20" r="19" fill="${color}"/>` +
    `<text x="20" y="27" text-anchor="middle" font-size="19" font-weight="700" fill="#fff" ${font}>${letter}</text></svg>`
  )
}

/** Rank marker: gold, silver and bronze discs for 1-3, a quiet number after. */
export const rankSvg = (rank: number, size = 24): string => {
  const medal = [COLORS.accent, COLORS.body, COLORS.limb][rank - 1]

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">${STYLE}` +
    (medal ? `<circle cx="20" cy="20" r="18" fill="${medal}"/>` : `<circle cx="20" cy="20" r="18" fill="none" stroke="${COLORS.prop}" stroke-width="2"/>`) +
    `<text x="20" y="26" text-anchor="middle" font-size="18" font-weight="700" fill="${medal ? COLORS.on : COLORS.prop}" ${font}>${rank}</text></svg>`
  )
}

/** Shield with the level number; the ring around it fills with progress to the next level. */
export const levelBadgeSvg = (level: number, frac: number, size = 64): string => {
  const r = 28
  const c = 2 * Math.PI * r

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="${size}" height="${size}">${STYLE}` +
    `<circle cx="36" cy="36" r="${r}" fill="none" stroke="${COLORS.soft}" stroke-width="5"/>` +
    `<circle cx="36" cy="36" r="${r}" fill="none" stroke="${COLORS.accent}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${n(c * Math.max(0, Math.min(frac, 1)))} ${n(c)}" transform="rotate(-90 36 36)"/>` +
    `<path d="M36 17l13 5v10c0 9-6 15-13 17-7-2-13-8-13-17V22z" fill="${COLORS.shirt}"/>` +
    `<text x="36" y="40" text-anchor="middle" font-size="16" font-weight="800" fill="${COLORS.on}" ${font}>${level}</text></svg>`
  )
}

/** A flame that flickers; taller for longer streaks. */
export const flameSvg = (streak: number, size = 40, isAnimated = true, slot?: number): string => {
  const box = slot ?? size
  const units = (box * 48) / size
  const d = (units - 48) / 2
  const hot = streak > 0
  const outer = hot ? COLORS.body : COLORS.limb
  const inner = hot ? COLORS.on : COLORS.soft
  const flicker = isAnimated && hot
    ? `<animateTransform attributeName="transform" type="scale" values="1 1;1.04 1.08;0.98 1;1 1" dur="1.4s" repeatCount="indefinite" additive="sum"/>`
    : ''

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(-d)} ${n(-d)} ${n(units)} ${n(units)}" width="${box}" height="${box}">${STYLE}` +
    `<g transform-origin="24 44">` +
    `<path d="M24 3c2 8 14 12 14 26a14 14 0 0 1-28 0c0-7 4-10 6-16 3 3 5 6 5 10 2-5 3-12 3-20z" fill="${outer}">${flicker}</path>` +
    `<path d="M24 22c1 5 7 7 7 13a7 7 0 0 1-14 0c0-4 3-6 4-9 1 1 2 3 3 4z" fill="${inner}"/></g></svg>`
  )
}

/** Dots for a flow of steps: done filled, current long pill, rest hollow. */
export const stepsSvg = (current: number, total: number, width = 160): string => {
  const gap = 18
  const items = Array.from({ length: total }, (_, i) => {
    const x = 6 + i * gap + (i > current ? 12 : 0)

    return i === current
      ? `<rect x="${x}" y="3" width="24" height="8" rx="4" fill="${COLORS.body}"/>`
      : `<circle cx="${x + 4}" cy="7" r="4" ${i < current ? `fill="${COLORS.body}"` : `fill="none" stroke="${COLORS.prop}" stroke-width="1.5"`}/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${6 + total * gap + 16} 14" width="${width}" height="${Math.round((width * 14) / (6 + total * gap + 16))}">${STYLE}${items}</svg>`
}

export type EmptyKind = 'board' | 'team' | 'offline' | 'rest' | 'new'

/** Friendly illustration for a screen with nothing in it yet. */
export const emptySvg = (kind: EmptyKind, width = 200): string => {
  const a = COLORS.body
  const b = COLORS.accent
  const g = COLORS.prop
  const scene: Record<EmptyKind, string> = {
    board:
      `<rect x="40" y="62" width="30" height="28" rx="5" fill="${COLORS.soft}" stroke="${g}" stroke-width="2"/>` +
      `<rect x="85" y="44" width="30" height="46" rx="5" fill="${COLORS.soft}" stroke="${b}" stroke-width="2"/>` +
      `<rect x="130" y="72" width="30" height="18" rx="5" fill="${COLORS.soft}" stroke="${g}" stroke-width="2"/>` +
      `<path d="M100 14l4 9 10 1-7.5 6.5 2.5 10-9-5.5-9 5.5 2.5-10L86 24l10-1z" fill="${b}"><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="2s" repeatCount="indefinite"/></path>`,
    team:
      `<circle cx="70" cy="48" r="13" fill="${a}"/><path d="M44 90a26 26 0 0 1 52 0z" fill="${a}" opacity=".85"/>` +
      `<circle cx="130" cy="52" r="11" fill="${b}"/><path d="M108 90a22 22 0 0 1 44 0z" fill="${b}" opacity=".85"/>`,
    offline:
      `<path d="M52 78a20 20 0 0 1 4-39 28 28 0 0 1 53-4 22 22 0 0 1 3 43z" fill="${COLORS.soft}" stroke="${g}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M92 56l-14 14M78 56l14 14" stroke="${b}" stroke-width="3.5" stroke-linecap="round"/>`,
    rest:
      `<circle cx="100" cy="52" r="26" fill="${COLORS.soft}" stroke="${a}" stroke-width="3"/>` +
      `<path d="M100 38v16l10 6" stroke="${a}" stroke-width="3.5" stroke-linecap="round" fill="none"/>` +
      `<path d="M150 24h14l-14 14h14M168 12h10l-10 10h10" stroke="${b}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    new:
      `<circle cx="100" cy="52" r="30" fill="${COLORS.soft}" stroke="${a}" stroke-width="3"/>` +
      `<path d="M100 38v28M86 52h28" stroke="${a}" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="56" cy="30" r="4" fill="${b}"/><circle cx="148" cy="76" r="5" fill="${b}"/><circle cx="150" cy="28" r="3" fill="${a}"/>`,
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="${width}" height="${Math.round(width / 2)}">${STYLE}` +
    `<line x1="20" y1="91" x2="180" y2="91" stroke="${g}" stroke-width="2" stroke-linecap="round"/>` + scene[kind] + '</svg>'
  )
}

/** App mark: a stylised figure in a rounded square. */
export const logoSvg = (size = 28): string => {
  // five-part goal ring, three parts reached, around a figure with its arms up
  const ring = Array.from({ length: 5 }, (_, i) => {
    const from = -90 + 8 + i * 72
    const at = (deg: number): string => `${n(32 + 23 * Math.cos((deg * Math.PI) / 180))} ${n(32 + 23 * Math.sin((deg * Math.PI) / 180))}`

    return `<path d="M${at(from)} A23 23 0 0 1 ${at(from + 56)}" fill="none" stroke-width="5.5" stroke="${i < 3 ? 'var(--c-sig)' : COLORS.on}"${i < 3 ? '' : ' stroke-opacity=".28"'}/>`
  }).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${STYLE}` +
    `<rect width="64" height="64" rx="16" fill="var(--c-strong)"/>${ring}` +
    `<circle cx="32" cy="22" r="4" fill="${COLORS.on}"/>` +
    `<path d="M32 28v9M22 25l10 7 10-7M26 46l6-9 6 9" fill="none" stroke="${COLORS.on}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  )
}

/** A burst behind a freshly earned badge or finished set. */
export const celebrateSvg = (size = 120): string => {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6

    return `<line x1="${n(60 + Math.cos(angle) * 34)}" y1="${n(60 + Math.sin(angle) * 34)}" x2="${n(60 + Math.cos(angle) * 50)}" y2="${n(60 + Math.sin(angle) * 50)}" stroke="${i % 2 ? COLORS.accent : COLORS.body}" stroke-width="4" stroke-linecap="round">` +
      `<animate attributeName="opacity" values="0;1;0.2" dur="1.2s" begin="${(i * 0.04).toFixed(2)}s" repeatCount="1" fill="freeze"/></line>`
  }).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">${STYLE}${rays}` +
    `<circle cx="60" cy="60" r="26" fill="${COLORS.body}"><animateTransform attributeName="transform" type="scale" values="0.2;1.15;1" keyTimes="0;.6;1" dur=".6s" repeatCount="1" additive="sum" calcMode="spline" keySplines=".2 .8 .2 1;.4 0 .6 1"/></circle>` +
    `<path d="M47 61l9 9 17-19" stroke="${COLORS.on}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  )
}

export const JOINTS = J
