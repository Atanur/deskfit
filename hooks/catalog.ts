import type { Exercise } from '../types'
import { metFor } from './calories'
import { effortOf, MUSCLES } from './muscles'

const e = (
  id: string,
  name: string,
  area: Exercise['area'],
  level: Exercise['level'],
  seconds: number,
  howto: string,
  o: Partial<Pick<Exercise, 'isQuiet' | 'isHighImpact' | 'needs' | 'avoidIf' | 'places' | 'equipment'>> = {},
): Exercise => {
  const [kind, pattern, main, assist] = MUSCLES[id] ?? ['strength', 'core', [], []]

  return {
  id,
  name,
  area,
  level,
  seconds,
  howto,
  isQuiet: o.isQuiet ?? true,
  isHighImpact: o.isHighImpact ?? false,
  needs: o.needs ?? [],
  avoidIf: o.avoidIf ?? [],
  places: o.places ?? ['office', 'home'],
  equipment: o.equipment ?? [],
  muscles: { main, assist },
  kind,
  pattern,
  effort: effortOf(metFor(id)),
  }
}

export const CATALOG: Exercise[] = [
  e('chair-squat', 'Chair squats', 'legs', 'beginner', 40, 'Stand in front of your chair, sit back until you touch it, stand up. Keep your chest tall.', { avoidIf: ['knees'] }),
  e('squat', 'Bodyweight squats', 'legs', 'intermediate', 40, 'Feet shoulder-width, sit back and down, thighs parallel, drive up through your heels.', { needs: ['squat'], avoidIf: ['knees'] }),
  e('jump-squat', 'Jump squats', 'legs', 'advanced', 30, 'Squat, then explode up and land softly. Reset between reps.', { isQuiet: false, isHighImpact: true, needs: ['squat', 'jump'], avoidIf: ['knees', 'back'], places: ['home'] }),
  e('calf-raise', 'Calf raises', 'legs', 'beginner', 40, 'Stand tall, rise onto your toes, lower slowly. Hold the desk for balance.'),
  e('wall-sit', 'Wall sit', 'legs', 'intermediate', 30, 'Back flat on the wall, thighs parallel to the floor. Hold.', { avoidIf: ['knees'] }),
  e('reverse-lunge', 'Reverse lunges', 'legs', 'intermediate', 40, 'Step back, lower the back knee toward the floor, push up. Alternate legs.', { needs: ['lunge'], avoidIf: ['knees'] }),
  e('glute-bridge-stand', 'Standing glute squeezes', 'legs', 'beginner', 30, 'Stand tall, squeeze your glutes hard for 3 seconds, release. Repeat.'),
  e('desk-pushup', 'Desk push-ups', 'upper', 'beginner', 30, 'Hands on the desk edge, body straight, lower your chest to the desk and press back.', { avoidIf: ['wrists', 'shoulders'] }),
  e('pushup', 'Push-ups', 'upper', 'intermediate', 30, 'Hands under shoulders, body in one line, chest to the floor, press up.', { needs: ['pushup'], avoidIf: ['wrists', 'shoulders'], places: ['home'] }),
  e('diamond-pushup', 'Diamond push-ups', 'upper', 'advanced', 30, 'Hands form a diamond under your chest. Lower slowly, press up.', { needs: ['pushup'], avoidIf: ['wrists', 'shoulders'], places: ['home'] }),
  e('chair-dip', 'Chair dips', 'upper', 'intermediate', 30, 'Hands on the seat edge, legs forward, lower your hips by bending the elbows, press up.', { avoidIf: ['wrists', 'shoulders'] }),
  e('wall-angel', 'Wall angels', 'upper', 'beginner', 40, 'Back and arms against a wall, slide your arms up and down like a snow angel.', { avoidIf: ['shoulders'] }),
  e('plank', 'Plank', 'core', 'intermediate', 30, 'Forearms down, body in one straight line, brace your core and breathe.', { needs: ['plank'], avoidIf: ['shoulders'], places: ['home'] }),
  e('knee-plank', 'Knee plank', 'core', 'beginner', 20, 'Same as a plank, but with knees on the floor. Keep hips in line.', { avoidIf: ['shoulders'], places: ['home'] }),
  e('seated-knee-lift', 'Seated knee lifts', 'core', 'beginner', 40, 'Sit tall, hold the seat, lift both knees toward your chest, lower slowly.', { avoidIf: ['back'] }),
  e('mountain-climber', 'Mountain climbers', 'core', 'advanced', 30, 'High plank, drive your knees to your chest in a quick run.', { isQuiet: false, isHighImpact: true, needs: ['plank'], avoidIf: ['wrists', 'shoulders'], places: ['home'] }),
  e('standing-crunch', 'Standing crunches', 'core', 'beginner', 40, 'Hands behind your head, lift one knee and bring the opposite elbow to it. Alternate.'),
  e('chair-twist', 'Seated twists', 'back', 'beginner', 40, 'Sit tall, rotate your torso gently left and right, hips facing forward.', { avoidIf: ['back'] }),
  e('cat-cow-seated', 'Seated cat-cow', 'back', 'beginner', 40, 'Hands on knees, arch your back and look up, then round it and tuck your chin.'),
  e('hip-hinge', 'Hip hinges', 'back', 'beginner', 40, 'Hands on hips, push your hips back with a flat spine, return upright.', { avoidIf: ['back'] }),
  e('neck-roll', 'Neck rolls', 'neck', 'beginner', 30, 'Slowly drop your ear to each shoulder, then chin to chest. No full circles.', { avoidIf: ['neck'] }),
  e('chin-tuck', 'Chin tucks', 'neck', 'beginner', 30, 'Draw your chin straight back as if making a double chin. Hold 3 seconds, release.', { avoidIf: ['neck'] }),
  e('shoulder-roll', 'Shoulder rolls', 'upper', 'beginner', 30, 'Roll your shoulders big and slow, forward then backward.'),
  e('wrist-circles', 'Wrist and finger stretch', 'wrists', 'beginner', 40, 'Circle your wrists both ways, then stretch fingers wide and make a soft fist.'),
  e('prayer-stretch', 'Prayer stretch', 'wrists', 'beginner', 30, 'Palms together at chest height, lower your hands slowly until you feel the forearm stretch.'),
  e('eye-20', '20-20-20 eye break', 'eyes', 'beginner', 20, 'Look at something 20 feet (6 m) away. Blink slowly and let your eyes relax.'),
  e('jumping-jacks', 'Jumping jacks', 'full', 'intermediate', 30, 'Jump feet out while raising your arms, jump back in. Keep a steady rhythm.', { isQuiet: false, isHighImpact: true, needs: ['jump'], avoidIf: ['knees'], places: ['home'] }),
  e('march', 'Marching in place', 'full', 'beginner', 40, 'Lift your knees to hip height and swing your arms. Keep it brisk.'),
  e('burpee', 'Burpees', 'full', 'advanced', 30, 'Squat, kick back to plank, push-up, jump in, jump up.', { isQuiet: false, isHighImpact: true, needs: ['pushup', 'squat', 'jump'], avoidIf: ['knees', 'back', 'wrists', 'shoulders'], places: ['home'] }),

  // ---- office: quiet, small, a chair, a desk or a wall is enough
  e('seated-leg-extension', 'Seated leg extensions', 'legs', 'beginner', 40, 'Sit tall, straighten one leg until it is level with the hip, hold a second, lower. Switch legs.', { avoidIf: ['knees'] }),
  e('figure-four', 'Seated figure-four stretch', 'legs', 'beginner', 40, 'Sit tall, rest one ankle on the opposite knee and lean forward gently until you feel the hip stretch. Switch sides.', { avoidIf: ['knees'] }),
  e('quad-stretch', 'Standing quad stretch', 'legs', 'beginner', 40, 'Hold the desk for balance, pull one heel toward your glutes with your knees together. Switch legs.', { avoidIf: ['knees'] }),
  e('glute-kickback', 'Standing glute kickbacks', 'legs', 'beginner', 40, 'Hold the desk, extend one leg straight back and squeeze your glute at the top. Switch legs.'),
  e('wall-pushup', 'Wall push-ups', 'upper', 'beginner', 30, 'Hands on the wall at chest height, body in one line. Bend your elbows to bring your chest to the wall, then press back.', { avoidIf: ['wrists', 'shoulders'] }),
  e('wall-chest-stretch', 'Wall chest stretch', 'upper', 'beginner', 30, 'Place one forearm on a wall or door frame and turn away until you feel your chest open. Switch arms.', { avoidIf: ['shoulders'] }),
  e('calf-stretch', 'Wall calf stretch', 'legs', 'beginner', 40, 'Hands on a wall, one foot back with the heel down and the leg straight. Lean in until you feel the calf stretch. Switch legs.'),
  e('scapula-squeeze', 'Shoulder-blade squeezes', 'back', 'beginner', 40, 'Sit tall with your elbows bent. Pull your elbows back and squeeze your shoulder blades together for 2 seconds, then release.'),
  e('y-raise', 'Standing Y raises', 'back', 'beginner', 40, 'Stand tall with your arms low in front. Lift them overhead in a Y shape, thumbs up, squeezing your shoulder blades, then lower slowly.', { avoidIf: ['shoulders'] }),
  e('overhead-reach', 'Overhead reach', 'back', 'beginner', 30, 'Interlace your fingers, press your palms to the ceiling and reach up tall. Breathe, lower and repeat.'),

  // ---- home: floor work and bigger moves
  e('glute-bridge', 'Glute bridges', 'legs', 'beginner', 40, 'Lie on your back, knees bent, feet flat. Press through your heels to lift your hips, squeeze, then lower slowly.', { places: ['home'] }),
  e('crunch', 'Crunches', 'core', 'beginner', 40, 'Lie on your back, knees bent, hands behind your head. Curl your shoulders off the floor, then lower slowly.', { places: ['home'], avoidIf: ['neck'] }),
  e('bicycle-crunch', 'Bicycle crunches', 'core', 'intermediate', 40, 'Lie back with your hands by your head. Bring one knee toward the opposite elbow while the other leg extends. Alternate smoothly.', { places: ['home'], avoidIf: ['neck', 'back'] }),
  e('leg-raise', 'Leg raises', 'core', 'intermediate', 30, 'Lie on your back with straight legs. Lift them to vertical, then lower slowly without arching your back.', { places: ['home'], avoidIf: ['back'] }),
  e('sit-up', 'Sit-ups', 'core', 'intermediate', 40, 'Lie on your back, knees bent. Curl all the way up to sitting, then lower with control.', { places: ['home'], avoidIf: ['back', 'neck'] }),
  e('superman', 'Supermans', 'back', 'beginner', 30, 'Lie face down with your arms forward. Lift arms, chest and legs a little off the floor, hold, then lower.', { places: ['home'], avoidIf: ['back'] }),
  e('bird-dog', 'Bird dogs', 'core', 'beginner', 40, 'On hands and knees, reach one arm forward and the opposite leg back. Hold a second, then switch. Keep your hips level.', { places: ['home'], avoidIf: ['wrists'] }),
  e('childs-pose', "Child's pose", 'back', 'beginner', 40, 'Kneel, sit back on your heels and reach your arms forward with your forehead down. Breathe slowly.', { places: ['home'], avoidIf: ['knees'] }),
  e('downward-dog', 'Downward dog', 'full', 'beginner', 40, 'Hands and feet on the floor, hips high in an upside-down V. Press the floor away and pedal your heels.', { places: ['home'], avoidIf: ['wrists', 'shoulders'] }),
  e('knee-pushup', 'Knee push-ups', 'upper', 'beginner', 30, 'Hands under shoulders, knees on the floor, body in one line from knees to head. Lower your chest, then press up.', { places: ['home'], avoidIf: ['wrists', 'shoulders'] }),
  e('shoulder-taps', 'Plank shoulder taps', 'core', 'intermediate', 30, 'High plank with feet wide. Tap one shoulder with the opposite hand while your hips stay still. Alternate.', { places: ['home'], needs: ['plank'], avoidIf: ['wrists', 'shoulders'] }),
  e('inchworm', 'Inchworms', 'full', 'intermediate', 40, 'Stand, fold forward, walk your hands out to a plank, walk them back and stand up.', { places: ['home'], needs: ['plank'], avoidIf: ['wrists', 'shoulders', 'back'] }),
  e('forward-lunge', 'Forward lunges', 'legs', 'intermediate', 40, 'Step forward, lower your back knee toward the floor, then push back to standing. Alternate legs.', { places: ['home'], needs: ['lunge'], avoidIf: ['knees'] }),
  e('high-knees', 'High knees', 'full', 'intermediate', 30, 'Run in place, driving your knees to hip height and pumping your arms.', { places: ['home'], isQuiet: false, isHighImpact: true, needs: ['jump'], avoidIf: ['knees'] }),

  // ---- with equipment (office or home, if you have it)
  e('db-curl', 'Dumbbell curls', 'upper', 'beginner', 40, 'Stand tall with your elbows at your sides. Curl the dumbbells to your shoulders and lower slowly.', { equipment: ['dumbbell'], places: ['home'] }),
  e('db-press', 'Dumbbell shoulder press', 'upper', 'intermediate', 40, 'Hold the dumbbells at shoulder height, press overhead until your arms are straight, then lower with control.', { equipment: ['dumbbell'], places: ['home'], avoidIf: ['shoulders'] }),
  e('db-goblet-squat', 'Goblet squats', 'legs', 'intermediate', 40, 'Hold one dumbbell at your chest, sit down between your knees with your chest tall, then stand up.', { equipment: ['dumbbell'], places: ['home'], needs: ['squat'], avoidIf: ['knees'] }),
  e('db-row', 'Bent-over dumbbell rows', 'back', 'intermediate', 40, 'Hinge forward with a flat back and the dumbbells hanging. Pull your elbows back and squeeze your shoulder blades.', { equipment: ['dumbbell'], places: ['home'], avoidIf: ['back'] }),
  e('db-rdl', 'Dumbbell Romanian deadlifts', 'back', 'intermediate', 40, 'Hold the dumbbells in front of your thighs. Push your hips back with a flat spine, lower to mid-shin, then stand tall.', { equipment: ['dumbbell'], places: ['home'], avoidIf: ['back'] }),
  e('db-tricep-ext', 'Overhead triceps extensions', 'upper', 'beginner', 40, 'Hold one dumbbell overhead with both hands. Bend your elbows to lower it behind your head, then extend.', { equipment: ['dumbbell'], places: ['home'], avoidIf: ['shoulders'] }),
  e('band-row', 'Seated band rows', 'back', 'beginner', 40, 'Sit with your legs out and a band around your feet. Pull the band to your ribs, squeeze your shoulder blades, return slowly.', { equipment: ['band'] }),
  e('band-curl', 'Band curls', 'upper', 'beginner', 40, 'Stand on the band with your elbows at your sides. Curl your hands to your shoulders and lower slowly.', { equipment: ['band'] }),
  e('kb-swing', 'Kettlebell swings', 'full', 'advanced', 30, 'Hinge at the hips and hike the kettlebell back, then snap your hips forward to swing it to chest height.', { equipment: ['kettlebell'], places: ['home'], isQuiet: false, needs: ['squat'], avoidIf: ['back'] }),
  e('pullup', 'Pull-ups', 'back', 'advanced', 30, 'Hang from the bar with straight arms. Pull until your chin passes the bar, then lower under control.', { equipment: ['bar'], places: ['home'], avoidIf: ['shoulders'] }),
  e('dead-hang', 'Dead hang', 'back', 'beginner', 30, 'Hang from the bar with relaxed shoulders and a firm grip. Breathe and let your spine lengthen.', { equipment: ['bar'], places: ['home'], avoidIf: ['shoulders'] }),
]

export const byId = (id: string): Exercise | undefined => CATALOG.find(x => x.id === id)
