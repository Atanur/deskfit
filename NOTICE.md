# Notices

## Exercise line art: Workout Guide, based on Everkinetic

The line drawings of exercises in `hooks/art-wg.ts` come from **Workout Guide** by Bryl Lim
(<https://github.com/bryllim/workout-guide>), whose pose artwork is built on **Everkinetic**
(<https://github.com/everkinetic/data>). The artwork is licensed under **Creative Commons Attribution-ShareAlike 4.0**
(<https://creativecommons.org/licenses/by-sa/4.0/>).

Changes made here: the vector path data was rounded to two decimals and rewritten compactly (checked pixel by pixel against the
originals), the fill colour is taken from the theme at draw time instead of being white, the lighter frames get a thin outline so
the line weight matches, and the three frames are played in sequence. Because of ShareAlike, `hooks/art-wg.ts` and the drawings it
contains stay under CC BY-SA 4.0 when you copy or change them. The rest of this project is not part of that licence.

The original licence and attribution texts are in `licenses/workout-guide/`. `scripts/art/wg-map.mjs` lists which of our moves use
which drawing, `scripts/art/wg-fetch.mjs` and `scripts/art/wg-build.mjs` repeat the download and the conversion.

## Calories

MET values are from the 2024 Adult Compendium of Physical Activities (<https://pacompendium.com>); see `hooks/calories.ts`.

## AI-drawn frames

Some moves that Workout Guide does not cover were drawn with an image model (Gemini), using a Workout Guide move as the style reference. Treat them as derivatives and share them under CC BY-SA 4.0 as well.
