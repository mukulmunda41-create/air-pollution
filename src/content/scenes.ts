// The Creative Director's prompt library. Rev 1 of every prompt comes from here; the studio snapshots
// it into the manifest on first use, so editing this file never rewrites your history.
import type { AssetKind, PromptFields } from '../studio/types.ts';

type Alternate = { label: string; why: string; image: Partial<PromptFields>; video: Partial<PromptFields> };

export type SceneSeed = {
  id: string;
  chapter: number;
  title: string;
  description: string;
  direction: string;
  use: string;
  required: AssetKind[]; // kinds the scene needs before it counts as approved
  delivery: {
    image: { filename: string; spec: string };
    video: { filename: string; spec: string };
  };
  asset3d: string;
  image: PromptFields;
  video: PromptFields;
  alternates: Alternate[];
};

const STILL_STYLE =
  'Photoreal large-format documentary photography, Alexa 65 look, Master Prime optics, fine natural film grain, true-to-life textures, restrained and unstylized, the realism of a BBC or National Geographic environmental documentary.';
const MOVING_STYLE =
  'Photoreal large-format documentary cinematography, Alexa 65 look, 24 fps with a natural 180 degree shutter, fine film grain, physically plausible motion, the restraint of a BBC or National Geographic environmental documentary.';
const GRADE =
  'Filmic low-contrast grade with deep clean blacks, soft highlight roll-off, muted saturation, a slight teal bias in shadow and warmth only where real light is warm.';
const NEGATIVE =
  'text, captions, subtitles, watermark, logos, brand names, signage with readable words, UI, frames, borders, cartoon, illustration, anime, video game look, CGI plastic look, oversaturation, neon, HDR halos, purple gradients, lens flare spam';
const NEGATIVE_MOTION =
  'camera shake, whip pans, fast zoom, jump cuts, scene changes, morphing, warping geometry, flicker, frame blending artifacts, looping seams, music, dialogue, sound';
const ASPECT = '16:9 widescreen, delivered at 1920x1080 or larger. Keep the essential subject inside the center 56% so the film can crop to a phone.';
const STILL = 'Single still image, no motion.';
const CLIP = '8 seconds, one continuous unbroken shot, no audio.';

const palette = (extra: string) =>
  `Film palette anchors: deep black #030507, atmospheric blue #7FB8E8, pollution gray #8C8A80, subtle orange #E8792B. ${extra}`;

const stillSpec = 'PNG, WebP or JPG. 16:9, at least 1920x1080. Up to 30 MB.';
const clipSpec = 'MP4 (H.264 or H.265). 16:9, at least 1280x720, 24 fps, 8 s, no audio. Up to 500 MB.';

const delivery = (id: string) => ({
  image: { filename: `${id}_image.png`, spec: stillSpec },
  video: { filename: `${id}_video.mp4`, spec: clipSpec },
});

export const scenes: SceneSeed[] = [
  {
    id: 'earth-opening',
    chapter: 1,
    title: 'A world that could breathe',
    description: 'Earth floating in deep space, slowly rotating, its atmosphere a thin blue glow. Peaceful and unhurried.',
    direction:
      'The first breath of the film. The 3D Earth already plays this scene in the browser, so this asset is optional: an accepted image replaces the poster shown to visitors without WebGL, and it sets the reference look for the whole film. Think of the last photograph you would want taken of a healthy planet: quiet, enormous, and very thin at the edge.',
    use: 'Optional. Accepted image becomes the no-WebGL poster for Chapter 1. The live 3D Earth stays the main picture.',
    required: [],
    delivery: delivery('earth-opening'),
    asset3d:
      'Already built in code from CC BY 4.0 Solar System Scope textures. To upgrade: 8K day, night and cloud equirectangular maps (2:1, sRGB day and night, linear clouds) as JPG under 3 MB each. Keep ocean and land albedo free of baked sunlight.',
    image: {
      scene: 'Planet Earth seen from deep space, a large sunlit crescent with the night side falling into darkness and faint warm city lights along the terminator. A razor-thin luminous blue atmosphere wraps the limb. Real weather systems, not painted clouds.',
      style: STILL_STYLE,
      cameraAngle: 'Eye level with the planet, 85 mm equivalent, from far enough that the curve dominates the right side of frame.',
      cameraMove: 'None. The composition should imply slow rotation and stillness.',
      lighting: 'Single hard sun from camera left, slightly behind the planet. No fill at all: the shadow side is true black except for city lights and a whisper of earthshine.',
      composition: 'Earth occupies the right 55% of frame and bleeds off the right edge. The left 45% is empty starfield, kept calm for a large title. Horizon arc runs top right to bottom center.',
      environment: 'Deep space with a sparse, realistic starfield. No nebula, no galaxy band, no planets, no moon.',
      palette: palette('Atmosphere reads as blue #7FB8E8 fading to black within a hair-thin band. Only the terminator gets a trace of orange.'),
      grade: GRADE,
      vfx: 'Physically correct Rayleigh scattering at the limb. Soft sun bloom only where the sun touches the limb. No stylized glow.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, nebula, galaxy clouds, oversized stars, fantasy space art, fake cyan rim, moon, spacecraft`,
      continuity: 'This frame sets the reference for Earth in Chapter 7. Keep this exact sun direction and atmosphere color for the finale.',
    },
    video: {
      scene: 'Earth from deep space, slowly rotating, clouds drifting almost imperceptibly while the terminator creeps forward. City lights flicker very faintly along the night side.',
      style: MOVING_STYLE,
      cameraAngle: 'Level with the planet, long lens compression, Earth filling the right of frame.',
      cameraMove: 'An extremely slow push-in, no more than 6% over the whole clip, as steady as an orbit. No rotation of the camera itself.',
      lighting: 'Single hard sun from camera left, slightly behind the planet, with true black shadows. The light does not change during the shot.',
      composition: 'Earth right of center, left 45% of frame stays empty starfield for typography throughout the clip.',
      environment: 'Deep space with sparse, realistic stars. Stars hold still relative to the camera.',
      palette: palette('Keep the blue confined to the thin limb.'),
      grade: GRADE,
      vfx: 'Cloud motion only over the planet surface, slow and continuous. Rayleigh limb glow stays stable with no pulsing.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, spinning planet, fast clouds, stars streaking`,
      continuity: 'Use the approved earth-opening image as the first frame. The final frame should still be calm enough to hold on.',
    },
    alternates: [
      {
        label: 'Thin crescent',
        why: 'Pushes the sun further behind the planet, so most of Earth is night and the atmosphere becomes the subject.',
        image: {
          lighting: 'Sun almost directly behind the planet: only a thin bright crescent remains, the rest is night with scattered city lights.',
          composition: 'A thin bright arc from upper right to lower center. Almost everything else in frame is black, so the arc alone carries the image.',
        },
        video: {
          lighting: 'Sun almost directly behind the planet, leaving a thin crescent. The light does not change during the shot.',
          cameraMove: 'A very slow lateral drift, as if orbiting, moving the crescent a few percent across frame.',
        },
      },
      {
        label: 'Daylit blue marble',
        why: 'Brighter and warmer, showing more continents and weather, for a more hopeful opening.',
        image: {
          lighting: 'Sun over the camera left shoulder. Most of the visible disc is in soft daylight, with the terminator only at the far right edge.',
          composition: 'A full disc, slightly right of center, cropped by the right edge. Oceans, clouds and a continent readable.',
        },
        video: {
          lighting: 'Sun over the camera left shoulder, most of the visible disc in soft daylight.',
          cameraMove: 'A slow push-in of about 5%, with the planet rotating gently underneath.',
        },
      },
    ],
  },
  {
    id: 'atmosphere',
    chapter: 2,
    title: 'The invisible enemy',
    description: 'The camera has entered the atmosphere. The blue begins to change. Particulate pollution becomes visible and the air turns gray.',
    direction:
      'This is the moment the film turns, so nothing dramatic happens: the air just stops being clean. A shot from high in the sky at low sun. The horizon band is the story, a dirty amber line where the sky should be blue. The particles are almost too small to see, which is the point.',
    use: 'Plays in the canvas behind 3D clouds and particles in Chapter 2. Video time follows scroll.',
    required: ['image', 'video'],
    delivery: delivery('atmosphere'),
    asset3d:
      'Optional. A seamless tiling cloud or haze puff sprite sheet: 2048x2048 PNG, 4x4 grid, straight alpha, soft edges with no hard silhouettes, neutral gray so the shader can tint it.',
    image: {
      scene: 'High altitude view above a broken cloud deck at low sun. Clean deep blue overhead gives way, toward the horizon, to a thick dirty amber and gray band of pollution lying over the land. Fine particulate haze is just visible in the slanting light.',
      style: STILL_STYLE,
      cameraAngle: 'Looking toward the horizon from about 9,000 m, slight downward tilt, 35 mm equivalent, like a window seat with no window.',
      cameraMove: 'None. Compose with forward depth so the eye travels toward the horizon.',
      lighting: 'A single low sun, 5 degrees above the horizon and slightly right of center, weakened and reddened by the haze. Backlight rims the clouds in dull gold.',
      composition: 'Horizon at the lower third. The left 45% of the sky stays calm and dark enough for large white text. Clouds lead in from the lower corners.',
      environment: 'Layered stratocumulus below, thin cirrus above, and a visible brown-gray inversion layer sitting on the distant landscape.',
      palette: palette('Top of frame blue, fading through desaturated gray to dirty amber at the horizon. Keep overall exposure low.'),
      grade: `${GRADE} Slightly lifted, dirty shadows near the horizon, where the air is thickest.`,
      vfx: 'Real atmospheric perspective with distance. Barely visible fine dust motes in the sun shafts, never bokeh confetti.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, airplane wing, window frame, fantasy sky, god rays as a pattern, orange sunset poster, clean white clouds only`,
      continuity: 'Same sun direction as the end of the Earth dive: low and ahead. The horizon line stays at the lower third, because the 3D cloud deck matches it.',
    },
    video: {
      scene: 'The camera descends slowly through broken cloud at low sun. As it sinks, the color drains from clean blue to gray and the air thickens with fine particulate haze, until the sun is a dull disc in dirty air.',
      style: MOVING_STYLE,
      cameraAngle: 'Toward the horizon with a slight downward tilt, 35 mm equivalent.',
      cameraMove: 'A slow forward and downward drift, as smooth as a glider, about 10% of frame travel over the clip. No turns, no roll.',
      lighting: 'A low sun ahead that weakens and reddens as the haze thickens across the clip. The change is gradual and continuous.',
      composition: 'Horizon holds at the lower third until the haze swallows it. Left side stays calm for text.',
      environment: 'Passing through thin cloud layers into a thick brown-gray inversion layer.',
      palette: palette('Starts blue, ends gray with a dim amber sun. The transition is the whole shot.'),
      grade: GRADE,
      vfx: 'Volumetric cloud parting naturally around the camera, with soft edges. Fine particulate becomes slowly more visible, drifting with the wind.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, turbulence, cloud tunnel effect, speed lines, snow-like particles`,
      continuity: 'Use the approved atmosphere image as the first frame. The last frame, thick gray air with a dim sun, becomes the first frame reference for polluted-city.',
    },
    alternates: [
      {
        label: 'Sun behind the haze',
        why: 'Makes the sun itself the indicator of pollution, a pale disc you can look straight at.',
        image: {
          lighting: 'Sun higher, about 25 degrees up, reduced to a pale white disc you could look straight at, with no rays.',
          palette: palette('Mostly gray with a cold blue remaining only at the very top of frame.'),
        },
        video: {
          lighting: 'A pale sun disc, unchanged in position, that dims through the clip as haze rises to cover it.',
          cameraMove: 'Almost no forward motion: a slow vertical sink only, about 8% of frame.',
        },
      },
      {
        label: 'Over the coast',
        why: 'Adds geography below the deck, so the viewer senses a populated place before the city appears.',
        image: {
          environment: 'A coastline far below through gaps in the cloud, with a river delta and the gray smudge of a distant urban area under an inversion layer.',
          composition: 'Horizon at the upper third, more ground visible, a hazy city smudge in the distance just right of center. Left side stays calm.',
        },
        video: {
          environment: 'A coastline and river delta through cloud gaps, with a gray urban smudge growing slowly ahead.',
          cameraMove: 'A slow forward and downward drift toward the gray smudge, about 10% of frame travel.',
        },
      },
    ],
  },
  {
    id: 'polluted-city',
    chapter: 3,
    title: 'The cost of progress',
    description: 'An industrial city under smog: factories, smoke, traffic, construction dust, urban pollution, industrial emissions.',
    direction:
      'No villain, no apocalypse. A working city at the end of a working day, doing what cities do, and that is exactly what makes it uncomfortable. Every source named in the chapter should be findable in one frame: stacks, traffic, cranes and dust. Keep it beautiful. The ugliness should arrive slowly.',
    use: 'The whole of Chapter 3. Video time follows scroll, the source labels sit beside what they name, and it ends in haze.',
    required: ['image', 'video'],
    delivery: delivery('polluted-city'),
    asset3d: 'None. The film uses the image and video.',
    image: {
      scene: 'A vast industrial city at dusk under heavy smog, seen from above. Smokestacks and a cooling tower release slow plumes, an elevated highway full of headlights cuts through the middle, tower cranes stand over a construction site raising pale dust, and dense apartment blocks fade into brown haze.',
      style: STILL_STYLE,
      cameraAngle: 'Aerial, 120 m above the rooftops, gentle downward angle, 50 mm equivalent for slight compression.',
      cameraMove: 'None. Layer foreground, midground and background so depth reads strongly.',
      lighting: 'Last light from a low sun behind the haze, plus practical sodium street lights, window lights and red aviation lights beginning to show. A dull orange flare stack burns in the distance.',
      composition: 'Upper 35% of frame is hazy sky, left clear for a title at top left. Stacks on the right third, highway on a lead-in diagonal, construction dust at lower left, all sources readable in one frame.',
      environment: 'Generic, unidentifiable industrial megacity, with no recognizable landmarks, no real company names, mixed residential and heavy industry.',
      palette: palette('Brown-gray haze, sodium orange points of light, cold blue only in deep shadow.'),
      grade: `${GRADE} Haze lifts the far blacks, so distance reads as lost contrast.`,
      vfx: 'Plumes rise and flatten against an inversion layer, as they really do. Smoke is soft, volumetric and wind-sheared, not cartoon puffs.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, apocalyptic ruins, fire everywhere, dystopian sci-fi towers, flying vehicles, recognizable skyline, tilt-shift miniature look`,
      continuity: 'The sun position matches the end of the atmosphere clip. Haze color matches the atmosphere last frame so the cut is invisible.',
    },
    video: {
      scene: 'The camera moves forward over an industrial city at dusk under smog. Stack plumes rise slowly and flatten, traffic flows along an elevated highway, cranes stand over a construction site raising dust, and lights come on across the district.',
      style: MOVING_STYLE,
      cameraAngle: 'Aerial, 120 m above the rooftops, gentle downward angle.',
      cameraMove: 'A slow steady forward glide with a very slight descent, about 12% of frame travel, with stacks passing on the right. No yaw, no roll.',
      lighting: 'Fading dusk behind haze, with practical sodium lights and red aviation lights. Light changes only through small windows turning on.',
      composition: 'Hazy sky band stays at top left for a title. Highway diagonal stays as the lead-in.',
      environment: 'Generic industrial megacity with no recognizable landmarks.',
      palette: palette('Brown-gray haze, sodium orange, cold blue shadow.'),
      grade: GRADE,
      vfx: 'Slow volumetric plumes with real wind shear. Tiny moving traffic lights. Construction dust hanging low. All of it continuous.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, fast traffic blur, timelapse, smoke running in fast motion, apocalyptic fire`,
      continuity: 'Use the approved polluted-city image as the first frame. Reference the last frame of the atmosphere clip for haze color and sun position.',
    },
    alternates: [
      {
        label: 'Street level',
        why: 'Trades the overview for a human eye line, so the pollution is felt rather than observed.',
        image: {
          cameraAngle: 'Street level on a pedestrian overpass, 28 mm equivalent, looking down a wide road toward stacks at the end of it.',
          composition: 'A one-point perspective down the road, traffic filling lower frame, stacks at the vanishing point, clear hazy sky above for a title.',
        },
        video: {
          cameraAngle: 'Street level on a pedestrian overpass, 28 mm equivalent.',
          cameraMove: 'A slow forward dolly of about 6%, traffic moving below, with the plume rising at the vanishing point.',
        },
      },
      {
        label: 'Blue hour',
        why: 'Darker and more graphic, with pollution lit from below by the city itself.',
        image: {
          lighting: 'Blue hour after sunset. The smog glows from beneath in sodium orange, with plumes lit from below by the plant lights.',
          palette: palette('Deep blue sky above a glowing dirty orange dome of light over the city.'),
        },
        video: {
          lighting: 'Blue hour, with the smog dome lit from below by sodium light. Plant lights illuminate rising plumes.',
          cameraMove: 'A slow lateral glide of about 8%, passing stacks in the foreground for strong parallax.',
        },
      },
    ],
  },
  {
    id: 'nose',
    chapter: 4,
    title: 'Breathed in',
    description: 'The same child, in profile against the smog, breathing in. One glowing particle among thousands drifts toward the nose, and the camera goes in with it.',
    direction:
      'Calm, not frightening. A child doing the most ordinary thing there is, in air that is not ordinary. Always a dark silhouette with a thin rim of light, so there is no identifiable face. The child is not coughing and is not in distress. The danger is only in how quietly the particles go in.',
    use: 'Opens Chapter 4, with the title beside it. Video time follows scroll and ends in black, where the film moves inside the airway.',
    required: ['image', 'video'],
    delivery: delivery('nose'),
    asset3d: 'None. The film uses the image and video.',
    image: {
      scene: 'A school-age child in profile, facing left, breathing in on a smoggy city street, seen as a dark silhouette against a low sun. Only the outline of the forehead, nose, lips and chin catches the light. The face itself stays in deep shadow with no visible features. Thousands of fine particles hang in the air, lit by the sun, drifting toward the nose, with one small glowing orange particle among them.',
      style: STILL_STYLE,
      cameraAngle: 'Exact side view at face height, level horizon, 85 mm equivalent.',
      cameraMove: 'None.',
      lighting: 'A low sun directly behind, just in front of the bridge of the nose, giving a thin warm rim along the profile and a soft red glow through the tip of the nose and the lips. No light on the face from the front.',
      composition: 'Head on the right of the frame, filling it from top to bottom, cut off by the right edge. Nose tip about 58% across and just above mid-height. The left half of the frame is empty soft haze for a title and text.',
      environment: 'The same street behind, thrown far out of focus: soft gray tower shapes only. The collar of the same navy jacket at the bottom edge.',
      palette: palette('Brown-gray haze, warm amber rim, near-black silhouette, one orange particle.'),
      grade: GRADE,
      vfx: 'Fine airborne particles of varied size in the light, sharp near the nose and soft elsewhere. No smoke plumes.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, visible eyes, visible facial detail, front-lit face, identifiable person, portrait lighting, distress, coughing, tears, face mask, adult face, beard, glasses`,
      continuity: 'Attach the approved child-city image as the reference for the hair, the jacket and the color of the air. The same child at the same moment, now seen from the side.',
    },
    video: {
      scene: 'One continuous shot starting exactly on the attached image. The child breathes in slowly. The particles are pulled toward the nose, faster as they get closer, and the glowing orange particle goes in first. The camera follows it, closing on the nostril until its darkness fills the whole frame.',
      style: MOVING_STYLE,
      cameraAngle: 'Starts exactly as the attached image: exact side view at face height.',
      cameraMove: 'A slow push-in that builds steadily, centered on the nostril, from the full profile to the inside of the nostril. The last second is completely black. No cuts, no shake, no roll.',
      lighting: 'The same low sun behind. The rim of light slides off the edges of the frame as the camera closes in.',
      composition: 'The nostril holds its place on screen and grows until it fills the frame. The left half stays empty haze until the push-in takes it.',
      environment: 'The same out-of-focus street. The child does not turn, walk or change expression.',
      palette: palette('Brown-gray haze, warm amber rim, near-black silhouette, one orange particle.'),
      grade: GRADE,
      vfx: 'Particles speed up along curved paths with the inhale, like dust drawn toward a vent. The air stays calm everywhere else.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, visible eyes, visible facial detail, front-lit face, skin pores, nose hair, wet surfaces, mucus, gore, distress, coughing, face turning`,
      continuity: 'First frame: the attached nose image, exactly. Last frame: pure black, because the film continues from black inside the airway.',
    },
    alternates: [
      {
        label: 'Further back',
        why: 'Some tools redraw a face when it fills the frame. A silhouette holds better from further away.',
        image: {
          cameraAngle: 'Exact side view at face height, level horizon, 135 mm equivalent, from further away.',
          composition: 'Head and shoulders on the right of the frame, the nose tip about 62% across. The left half is empty soft haze.',
        },
        video: {
          cameraMove: 'A long slow push-in from head and shoulders to the nostril, building steadily. The last second is completely black. No cuts.',
        },
      },
      {
        label: 'Paper-cut silhouette',
        why: 'If the rim light keeps revealing facial detail, a flatter silhouette removes the detail altogether.',
        image: {
          lighting: 'Flat bright haze behind, with no rim at all, so the profile reads as a clean black shape. A faint glow only at the tip of the nose.',
        },
        video: {
          lighting: 'Flat bright haze behind the black profile throughout. The frame darkens only as the nostril takes it over.',
        },
      },
    ],
  },
  {
    id: 'windpipe',
    chapter: 4,
    title: 'Down the windpipe',
    description: 'Inside the airway, following the particle past the cartilage rings to the place where the windpipe divides.',
    direction:
      'The same medical visualization as the lungs that follow it: clean, translucent and anatomically faithful, closer to a museum exhibit than to a body. No blood, no wet flesh, no tunnel from a horror film. The rings are C-shaped, as they are in life, and the soft membrane runs along the back.',
    use: 'Between the nose and the lungs in Chapter 4. Video time follows scroll, starts and ends in black.',
    required: ['image', 'video'],
    delivery: delivery('windpipe'),
    asset3d: 'None. The film uses the image and video.',
    image: {
      scene: 'Looking straight down the inside of a human windpipe. Translucent C-shaped cartilage rings recede into darkness one after another, open at the back where a soft membrane runs between them. Far ahead the tube divides at the carina into two dark openings. Cold blue air streams flow along the walls, and one tiny glowing orange particle floats ahead at the vanishing point.',
      style: 'Premium scientific visualization in the manner of a museum exhibit or a Nature cover, photoreal translucent tissue rendered like a scanning electron micrograph colored for clarity. Calm and clinical, not a horror image.',
      cameraAngle: 'First-person inside the airway, centered, 24 mm equivalent, stable horizon with the soft membrane at the bottom.',
      cameraMove: 'None.',
      lighting: 'Soft dark-field lighting, so the translucent rings glow at their edges against black. The particle gives a small warm light on the nearest walls.',
      composition: 'The vanishing point sits about 60% across and at mid-height, so the left third stays darker and calmer for a title and text. The rings frame it in a perspective that reads at once.',
      environment: 'Inside the airway only. Smooth, dry, pale walls. Pure black beyond the rings.',
      palette: palette('Pale desaturated rose-ivory tissue, cold blue air streams, a single orange particle.'),
      grade: `${GRADE} Very clean blacks, as in a microscope image.`,
      vfx: 'Thin laminar airflow streaks, barely visible. Fine particles drifting along the airflow.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, blood, gore, wet organs, surgical photo, endoscopy photo, mucus, slime, horror tunnel, cave look, stone texture, disease, labels, arrows`,
      continuity: 'Attach the approved human-lungs image as the look reference: the same tissue color, the same black, the same blue air and orange particle. The windpipe at the top of that image is this one, seen from the inside.',
    },
    video: {
      scene: 'One continuous flight down the inside of the windpipe, starting exactly on the attached image and following the glowing orange particle. The rings pass steadily on every side, the carina opens ahead with its two dark openings, and the camera follows the particle into the wider one until the frame is black.',
      style: 'Premium scientific visualization in motion, museum-grade, translucent tissue rendered like a scanning electron micrograph colored for clarity. Calm and clinical, no wet surfaces.',
      cameraAngle: 'Starts exactly as the attached image: first-person inside the airway, stable horizon.',
      cameraMove: 'A smooth forward glide at constant speed, centered on the particle, drifting gently toward the wider opening at the end. No cuts, no shake, no roll.',
      lighting: 'Soft self-illuminated tissue, with translucent walls glowing faintly and the warm particle lighting the nearby walls as it passes. The dark of the opening takes over at the end.',
      composition: 'The particle stays at the vanishing point with the rings converging on it. The left third stays calmer for a title.',
      environment: 'Inside the airway only. Smooth, dry, pale walls with visible C-shaped rings, then the carina and its two openings.',
      palette: palette('Pale rose-ivory walls, cold blue air streaks, a single orange particle.'),
      grade: GRADE,
      vfx: 'Fine laminar airflow streaks moving with the camera. Other small particles drift past, slower than the orange one. No mucus, no fluid.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, blood, gore, wet organic surfaces, mucus, tentacles, horror tunnel, cave look, stone texture, disease, labels`,
      continuity: 'First frame: the attached windpipe image, exactly. Last frame: pure black, because the film comes out of black onto the whole pair of lungs.',
    },
    alternates: [
      {
        label: 'Pure line of light',
        why: 'Abstracts the rings into light, for tools that drift toward wet tissue or a cave.',
        image: {
          style: 'Abstract scientific light sculpture: the C-shaped rings drawn only in fine glowing filaments, like a fiber-optic model in a dark museum.',
        },
        video: {
          style: 'Abstract scientific light sculpture in motion, the rings drawn in glowing filaments, like flying through a fiber-optic model.',
        },
      },
      {
        label: 'Only the rings',
        why: 'Some tools struggle with the fork. Dropping it leaves a simple tube, and the film fades it to black anyway.',
        image: {
          scene: 'Looking straight down the inside of a human windpipe. Translucent C-shaped cartilage rings recede into pure darkness, open at the back where a soft membrane runs between them. Cold blue air streams flow along the walls, and one tiny glowing orange particle floats ahead at the vanishing point.',
        },
        video: {
          scene: 'One continuous flight down the inside of the windpipe, starting exactly on the attached image and following the glowing orange particle. The rings pass steadily on every side while the darkness ahead slowly grows until the frame is black.',
        },
      },
    ],
  },
  {
    id: 'human-lungs',
    chapter: 4,
    title: 'Every breath matters',
    description: 'Following a pollution particle through the nose, trachea, bronchi and lungs, with airflow and fine airborne particles. Scientifically responsible.',
    direction:
      'A medical visualization you could show a doctor and a classroom, never a horror film. Clean, translucent and anatomically faithful, closer to a scanning electron micrograph or a museum exhibit than to a body. No blood, no wet flesh, no disease imagery. The air moves, the particles follow it, and the branching gets finer and finer until there is nowhere further to go. That is the deepest point of the film.',
    use: 'Follows the windpipe in Chapter 4. Video time follows scroll, and the hold at the alveolus is where the film turns.',
    required: ['image', 'video'],
    delivery: delivery('human-lungs'),
    asset3d:
      'Bronchial tree GLB under 1.5 MB with Draco: anatomically faithful trachea with C-shaped cartilage rings, carina, two main bronchi, to 5 or 6 branching generations, with a separate alveolar sac cluster mesh. Single material, clean UVs, no baked lighting.',
    image: {
      scene: 'A scientifically accurate visualization of a human bronchial tree and lungs, suspended in darkness: translucent trachea with C-shaped cartilage rings, the carina dividing into two main bronchi, branching into finer bronchioles that end in grape-like alveolar clusters. A stream of tiny glowing particles follows the airflow down the airway.',
      style: 'Premium scientific visualization in the manner of a museum exhibit or a Nature cover, photoreal translucent tissue rendered like a scanning electron micrograph colored for clarity. Calm and clinical, not a horror image.',
      cameraAngle: 'Frontal, centered on the carina, 70 mm equivalent, no perspective distortion.',
      cameraMove: 'None. Depth comes from translucent layers and soft focus falloff.',
      lighting: 'Soft dark-field lighting from behind and above, so translucent walls glow at their edges against a black background. A small warm light travels with the particles.',
      composition: 'Airway centered and slightly right, branching downward and outward, the left third calm and dark for labels and a title. Generous black negative space around the anatomy.',
      environment: 'Pure black void. No body, no skin, no ribs, no medical equipment.',
      palette: palette('Pale desaturated rose-ivory tissue, cold blue air streams, tiny orange particles as the only accent.'),
      grade: `${GRADE} Very clean blacks, as in a microscope image.`,
      vfx: 'Fine particles of varied size, with the largest stopping early in the branches and the smallest going deepest. Thin laminar airflow streaks, barely visible.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, blood, gore, wet organs, surgical photo, tumors, disease, skull, skeleton, full human body, horror, slime, labels, arrows, diagram annotations`,
      continuity: 'Tissue color and black background stay identical to the fly-through video. Particle color matches the ember particle already in the film, #E8792B.',
    },
    video: {
      scene: 'A continuous fly-through following one tiny glowing particle along the airflow: down the trachea past C-shaped cartilage rings, through the carina into a main bronchus, along narrowing bronchioles, and finally into a delicate alveolar sac where it slows and holds.',
      style: 'Premium scientific visualization in motion, museum-grade, translucent tissue rendered like a scanning electron micrograph colored for clarity. Calm and clinical, no wet surfaces.',
      cameraAngle: 'First-person inside the airway, centered on the particle, 24 mm equivalent, stable horizon.',
      cameraMove: 'A smooth forward glide following the particle at constant speed, gently curving with the branches, easing to a complete stop by the final second.',
      lighting: 'Soft self-illuminated tissue, translucent walls glowing faintly, with the warm particle lighting nearby walls as it passes.',
      composition: 'The particle stays near center with the airway converging on it. Each new branch opens ahead symmetrically.',
      environment: 'Inside the airway only. Smooth, dry, pale walls with visible cartilage rings, then finer branches, then thin alveolar walls with a faint capillary network.',
      palette: palette('Pale rose-ivory walls, cold blue air streaks, a single orange particle.'),
      grade: GRADE,
      vfx: 'Fine laminar airflow streaks moving with the camera. Other small particles drift past, slower than the hero particle. No mucus, no fluid.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, blood, gore, wet organic surfaces, mucus, tentacles, horror tunnel, cave look, stone texture, disease, diagrams, labels`,
      continuity: 'Use the approved human-lungs image for tissue look. The last frame must hold still inside the alveolus, because the film stops there and pulls back out to the child.',
    },
    alternates: [
      {
        label: 'Pure line of light',
        why: 'Abstracts the anatomy into light, for tools that struggle with realistic tissue or drift toward gore.',
        image: {
          style: 'Abstract scientific light sculpture, the bronchial tree drawn only in fine glowing filaments, like a fiber-optic model in a dark museum.',
          palette: palette('Cold blue filaments on black, with orange particles.'),
        },
        video: {
          style: 'Abstract scientific light sculpture in motion, the airway drawn in glowing filaments, like flying through a fiber-optic model.',
          environment: 'Inside a tube of glowing filaments that follow the true branching of an airway. No surfaces at all.',
        },
      },
      {
        label: 'Exterior pull',
        why: 'Replaces the interior fly-through with a slow exterior move, which most tools render far more cleanly.',
        image: {
          cameraAngle: 'Three-quarter view from slightly above, 85 mm equivalent, the whole tree in frame.',
        },
        video: {
          cameraAngle: 'Exterior, starting wide on the whole bronchial tree.',
          cameraMove: 'A slow continuous push-in from the whole tree toward one alveolar cluster at lower right, ending in a macro close-up. No cuts.',
          environment: 'Black void around the translucent tree, with particles visibly travelling inside the branches.',
        },
      },
    ],
  },
  {
    id: 'child-city',
    chapter: 5,
    title: 'The future we face',
    description: 'A child in a polluted urban environment. Atmospheric lighting, realistic environmental details, cinematic composition.',
    direction:
      'The airway we just flew through was this child’s. Everything is still. We never see the face, because this is not one child, it is any child: seen from behind, looking at a city swallowed by haze, a dull orange sun in front of them. No tears, no cough, no drama, no pleading look. Dignity and quiet. The question on screen does the rest. Generate this with care: an ordinary, fully dressed school-age child on an ordinary street.',
    use: 'Full frame plate in Chapter 5, right after the pull-back through the chest. Video time follows scroll.',
    required: ['image', 'video'],
    delivery: delivery('child-city'),
    asset3d:
      'None needed. If the image cannot be solved, the film falls back on a soft silhouette standing in 3D haze, built in code.',
    image: {
      scene: 'A school-age child, around nine years old, stands still on an empty city sidewalk seen entirely from behind, wearing an ordinary jacket and a school backpack, looking out at distant apartment towers dissolving into thick gray-brown smog. A dull orange sun hangs low in the haze.',
      style: STILL_STYLE,
      cameraAngle: 'Low, at the child’s shoulder height, directly behind and slightly left, 50 mm equivalent, shallow depth of field.',
      cameraMove: 'None. Absolute stillness.',
      lighting: 'Soft flat directionless smog light with a weak orange sun disc as the only warm note, a faint warm rim on the jacket and hair. No artificial light.',
      composition: 'Child in the lower center third, small against the frame, back to camera. The upper center is open haze for one line of large text. Towers dissolve with distance.',
      environment: 'An ordinary wet sidewalk, a low wall and a bare young street tree, with distant towers fading out. No crowds, no vehicles close by, no debris or ruins.',
      palette: palette('Gray-brown haze filling the frame, a muted navy jacket, one small orange sun.'),
      grade: `${GRADE} Slightly lifted blacks from haze, nothing crushed.`,
      vfx: 'Real volumetric haze with depth. Very fine suspended particles in the air between camera and child, almost invisible.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, visible face, profile, child looking back, crying, coughing, distress, gas mask, ruins, war zone, dirty or ragged clothing, sentimental poster look, dramatic pose, crowd`,
      continuity: 'This street and this exact camera position return in future-city, with the same framing and clean air. Lock the composition now, because Chapter 6 depends on it.',
    },
    video: {
      scene: 'A school-age child, seen entirely from behind, stands still on a city sidewalk looking at towers dissolving into smog. The child does not turn around. A faint breeze moves the jacket hem and a few strands of hair. Haze drifts slowly past the towers.',
      style: MOVING_STYLE,
      cameraAngle: 'Low, at the child’s shoulder height, directly behind and slightly left, 50 mm equivalent, shallow depth of field.',
      cameraMove: 'An imperceptibly slow push-in, under 4% across the whole clip. The child stays the same place in frame.',
      lighting: 'Soft flat smog light with a weak orange sun disc, unchanging.',
      composition: 'Child in lower center third, back to camera, with open haze above for text throughout.',
      environment: 'Ordinary wet sidewalk, low wall, bare young street tree, distant towers fading out.',
      palette: palette('Gray-brown haze, muted navy jacket, one small orange sun.'),
      grade: GRADE,
      vfx: 'Slow-drifting volumetric haze and very fine suspended particles. Only the hem, hair and haze move.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, turning head, visible face, walking, crying, coughing, distress, gas mask, hands morphing, body warping`,
      continuity: 'Use the approved child-city image as the first frame. The last frame is the reference for the first frame of future-city.',
    },
    alternates: [
      {
        label: 'Wider and smaller',
        why: 'Makes the child much smaller in frame, in case closer framings produce unwanted anatomy or a sentimental feel.',
        image: {
          cameraAngle: 'Further back, 35 mm equivalent, child about one eighth of frame height, still seen from behind.',
          composition: 'A very small figure at lower center, with the city and smog taking up almost the whole frame.',
        },
        video: {
          cameraAngle: 'Further back, 35 mm equivalent, the child small in frame and seen from behind.',
          vfx: 'Slow-drifting haze is the main motion. The small figure barely moves.',
        },
      },
      {
        label: 'Silhouette against the sun',
        why: 'Reduces the child to a dark shape, which removes face risk entirely and strengthens the poster.',
        image: {
          lighting: 'Strong backlight from the dull sun in the haze, the child a near-solid silhouette with a soft edge.',
          composition: 'The silhouette stands directly under the sun disc, on the center line.',
        },
        video: {
          lighting: 'Strong haze-softened backlight holding the child as a near-solid silhouette, unchanging.',
          vfx: 'Haze drifts in front of the sun, dimming and restoring it very slowly. The silhouette holds still.',
        },
      },
    ],
  },
  {
    id: 'future-city',
    chapter: 6,
    title: 'The world can still change',
    description: 'The environment transforms. Pollution gradually disappears. Trees, cleaner transportation, solar energy and wind energy become visible. The sky clears.',
    direction:
      'The same street, with the same camera, the same child if your tool can hold them, and a future that already exists somewhere. No glass domes, no flying cars, no utopia. A tram, bicycles, street trees, solar on ordinary roofs, turbines on the far ridge. It should look like a good city on a good morning, so that a visitor thinks: that is just a decision.',
    use: 'Full frame plate in Chapter 6, directly continuing the child shot. Video time follows scroll, so scrolling literally clears the air.',
    required: ['image', 'video'],
    delivery: delivery('future-city'),
    asset3d:
      'Low-poly GLB kit under 1.5 MB with Draco: 2 street tree variants, 1 tram, 1 rooftop solar array, 1 wind turbine with the rotor as a separate object at its pivot. Under 5k triangles each, no baked lighting.',
    image: {
      scene: 'The same city street as the previous scene, now under clear blue morning air. Young street trees in leaf line the sidewalk, an electric tram passes in the middle distance, cyclists use a protected lane, ordinary apartment roofs carry solar panels, and wind turbines turn on a distant ridge. A school-age child, seen from behind, looks out at it.',
      style: STILL_STYLE,
      cameraAngle: 'Identical to child-city: low, at shoulder height, directly behind and slightly left, 50 mm equivalent.',
      cameraMove: 'None.',
      lighting: 'Clean early morning sun from the same direction as before, now clear and warm, with soft real shadows and blue sky fill.',
      composition: 'Identical framing to child-city, with the child in lower center third. Sky takes the upper third for a large title. Distant towers now sharp, with visible detail.',
      environment: 'The same towers and sidewalk, realistic and achievable. Ordinary buildings, retrofit solar, real street trees, a modern tram. No futuristic architecture.',
      palette: palette('Atmospheric blue #7FB8E8 sky, fresh natural greens, warm morning light. Bright, but keep a filmic restraint.'),
      grade: `${GRADE} Open shadows and clean, true color.`,
      vfx: 'Crisp distant detail that proves the air is clean. No haze except natural morning softness.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, visible face, futuristic domes, flying cars, sci-fi skyscrapers, floating gardens, fantasy utopia, oversaturated greens, stock photo smiles, crowds, solar panels covering everything`,
      continuity: 'Use the approved child-city image as a structure and composition reference, so the street, camera and child position match exactly. Only the air and the additions change.',
    },
    video: {
      scene: 'One continuous shot of the same street, as the smog slowly lifts. The gray haze thins, the sun brightens from dull orange to clear gold, blue sky opens overhead, distant towers sharpen, and wind turbines become visible on the ridge. Tree leaves stir and a tram passes.',
      style: MOVING_STYLE,
      cameraAngle: 'Identical to child-city: low, at shoulder height, directly behind and slightly left, 50 mm equivalent.',
      cameraMove: 'Locked off, with no camera movement at all, so that only the air changes.',
      lighting: 'A continuous transition from flat smog light to clear morning sun from the same direction, with shadows gradually appearing.',
      composition: 'Identical framing throughout. Child in lower center third.',
      environment: 'The same street, gaining street trees in leaf, a tram, rooftop solar and distant turbines as the haze lifts to reveal them.',
      palette: palette('Starts gray-brown, ends clear atmospheric blue with fresh greens.'),
      grade: GRADE,
      vfx: 'Slow volumetric clearing from the top of frame downward. No wipe, no flash. Natural, with continuous change across the whole clip.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, visible face, futuristic domes, flying cars, sudden changes, objects popping in, plants growing unnaturally fast`,
      continuity: 'First frame: the last frame of the child-city clip. Last frame: the approved future-city image. Use first-and-last-frame mode if your tool has one (Flow, Veo, Kling).',
    },
    alternates: [
      {
        label: 'Step by step',
        why: 'Makes a staged clearing, for tools that find a single large transformation hard to keep consistent.',
        image: {
          environment: 'The same street at a midpoint: thin haze remaining in the far distance, foreground already clear and bright, trees in leaf.',
        },
        video: {
          vfx: 'Haze retreats from foreground to background in one slow wave, as if a wind arrived from behind the camera.',
          environment: 'The same street, already with trees and tram. Only the haze changes, retreating to reveal solar roofs, then far turbines.',
        },
      },
      {
        label: 'Wide across the city',
        why: 'Drops the child and shows the whole district, in case holding the same child across frames fails.',
        image: {
          scene: 'The same city from the same aerial position as polluted-city, under clear morning air: rooftop solar, a tram corridor where the highway was, street trees, retired stacks, distant turbines.',
          cameraAngle: 'Aerial, 120 m above the rooftops, gentle downward angle, 50 mm equivalent.',
          composition: 'Matches the polluted-city framing, so the two can be compared directly. Upper third clear sky for a title.',
        },
        video: {
          cameraAngle: 'Aerial, 120 m above the rooftops, matching polluted-city.',
          cameraMove: 'A slow forward glide of about 8%, retracing the polluted-city move.',
          continuity: 'Use the approved polluted-city image as a composition reference, so stacks and streets line up.',
        },
      },
    ],
  },
  {
    id: 'earth-ending',
    chapter: 7,
    title: 'The next breath is ours',
    description: 'Return to Earth from space with a blue atmospheric glow. The camera slowly moves away.',
    direction:
      'The exhale. The same planet, the same light as the opening, slightly further away every second. Nothing has been solved on screen and nothing is falling apart. It should feel like being handed something fragile. As with the opening, the live 3D Earth carries this, so this asset is optional.',
    use: 'Optional. Accepted image becomes the no-WebGL poster for Chapter 7. The 3D Earth stays the main picture.',
    required: [],
    delivery: delivery('earth-ending'),
    asset3d: 'Uses the same Earth as earth-opening. Nothing further is needed.',
    image: {
      scene: 'Planet Earth seen from far out in space, smaller in frame than the opening shot, its thin blue atmosphere glowing around the lit crescent, surrounded by a great deal of darkness.',
      style: STILL_STYLE,
      cameraAngle: 'Level with the planet, 135 mm equivalent, from much further away than the opening.',
      cameraMove: 'None. The empty space around the planet should imply distance and departure.',
      lighting: 'The same single hard sun from camera left as earth-opening, with true black shadows.',
      composition: 'Earth smaller, in the upper center of frame, taking about a third of the height. The lower half is empty for large text and a call to action.',
      environment: 'Deep space with a sparse, realistic starfield. Nothing else.',
      palette: palette('Blue #7FB8E8 limb, deep black everywhere else, the smallest trace of orange at the terminator.'),
      grade: GRADE,
      vfx: 'Physically correct Rayleigh scattering. No stylized glow.',
      aspect: ASPECT,
      duration: STILL,
      negative: `${NEGATIVE}, nebula, galaxy clouds, moon, spacecraft, oversized stars, fantasy space art`,
      continuity: 'Same sun direction and atmosphere color as the approved earth-opening image. It should feel like the same photograph, taken later and further away.',
    },
    video: {
      scene: 'Earth seen from space while the camera slowly drifts away. The planet shrinks gradually, with clouds moving almost imperceptibly.',
      style: MOVING_STYLE,
      cameraAngle: 'Level with the planet, long lens.',
      cameraMove: 'A very slow, perfectly smooth pull-back. The planet reduces by about 15% across the clip. No rotation of the camera.',
      lighting: 'The same single hard sun from camera left as the opening, unchanging.',
      composition: 'Earth upper center throughout. Lower half stays empty for text.',
      environment: 'Deep space with a sparse starfield that holds still.',
      palette: palette('Blue limb on deep black.'),
      grade: GRADE,
      vfx: 'Stable limb glow and slow cloud drift only.',
      aspect: ASPECT,
      duration: CLIP,
      negative: `${NEGATIVE}, ${NEGATIVE_MOTION}, spinning planet, stars streaking, fast zoom`,
      continuity: 'Use the approved earth-ending image as the first frame, and match the approved earth-opening image for look.',
    },
    alternates: [
      {
        label: 'Earth at the bottom',
        why: 'Puts the planet low and the emptiness above, so the title sits in the void rather than under the planet.',
        image: {
          composition: 'Only the top arc of Earth rises from the bottom of frame, with blue limb glowing, and the top 70% of the frame empty black.',
        },
        video: {
          composition: 'The top arc of Earth rises from the bottom of frame, slowly sinking as the camera lifts away.',
          cameraMove: 'A slow vertical lift away from the planet, with the arc sinking about 10% of frame height.',
        },
      },
      {
        label: 'Pale dot',
        why: 'Takes the pull-back to an extreme, for a quieter and more humbling ending.',
        image: {
          composition: 'Earth is very small, about one tenth of the frame height, at upper center, with vast darkness all around.',
          cameraAngle: 'Level with the planet, extreme telephoto, from very far away.',
        },
        video: {
          cameraMove: 'A slow steady pull-back. The planet reduces by about 35% across the clip, ending as a small bright crescent.',
        },
      },
    ],
  },
];

export const sceneById = Object.fromEntries(scenes.map((s) => [s.id, s]));
export const sceneIds = scenes.map((s) => s.id);
