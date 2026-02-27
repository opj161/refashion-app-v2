// src/lib/prompt-options.ts
// Extracted from prompt-builder.ts — all option constants and derived union types.

// --- Types ---
export interface OptionWithPromptSegment {
  value: string;
  displayLabel: string;
  promptSegment: string;
  basePrompt?: string; // Only for top-level style options in image generation
}

// =========================================================================
// IMAGE GENERATION OPTIONS
// =========================================================================

export const FASHION_STYLE_OPTIONS = [
  { value: "default_style", displayLabel: "Default (General Fashion)", basePrompt: "Fashion photograph: A {gender} model, {modelDetails}, {poseStyleDetails} stylishly wearing this clothing item.", promptSegment: "A general, high-quality fashion photograph focusing on accurately depicting the model and clothing." },
  { value: "high_fashion_editorial", displayLabel: "High-Fashion Editorial", basePrompt: "High-fashion editorial photograph: A {gender} model, {modelDetails}, {poseStyleDetails} stylishly wearing this clothing item.", promptSegment: "This image should have strong artistic expression, a conceptual narrative, and dramatic flair typical of high-fashion editorials." },
  { value: "lifestyle_street", displayLabel: "Lifestyle / Street Style", basePrompt: "Street style photograph: A {gender} model, {modelDetails}, captured in a candid moment {poseStyleDetails} stylishly wearing this clothing item.", promptSegment: "Aim for authenticity and a natural, candid feel, showcasing fashion in a real-world urban or everyday environment." },
  { value: "ecommerce_product", displayLabel: "E-commerce / Product Focus", basePrompt: "E-commerce product photograph: The clothing item is clearly showcased on a {gender} model, {modelDetails}, {poseStyleDetails}.", promptSegment: "Focus on clear, appealing depiction of the garment, ensuring accurate representation of color, texture, and fit, usually against a clean background." },
  { value: "creative_conceptual", displayLabel: "Creative / Conceptual", basePrompt: "Conceptual fashion portrait: A {gender} model, {modelDetails}, {poseStyleDetails} stylishly wearing this clothing item, embodying an abstract concept.", promptSegment: "Push creative boundaries with unique visual metaphors, experimental styling, and symbolic imagery." },
] as const satisfies readonly OptionWithPromptSegment[];

export const GENDER_OPTIONS = [
  { value: "female", displayLabel: "Female", promptSegment: "female" },
  { value: "male", displayLabel: "Male", promptSegment: "male" },
  { value: "non_binary", displayLabel: "Non-binary", promptSegment: "non-binary" },
] as const satisfies readonly OptionWithPromptSegment[];

export const AGE_RANGE_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "early_20s", displayLabel: "Early 20s", promptSegment: "in their early 20s" },
  { value: "late_20s", displayLabel: "Late 20s", promptSegment: "in their late 20s" },
  { value: "mid_30s", displayLabel: "Mid 30s", promptSegment: "in their mid-30s" },
  { value: "mid_40s", displayLabel: "Mid 40s", promptSegment: "in their mid-40s" },
  { value: "50_plus", displayLabel: "50+", promptSegment: "aged 50 or older" },
] as const satisfies readonly OptionWithPromptSegment[];

export const ETHNICITY_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "ambiguous_multiracial", displayLabel: "Multiracial Heritage", promptSegment: "of multiracial ethnicity" },
  { value: "white", displayLabel: "White", promptSegment: "of White ethnicity" },
  { value: "black", displayLabel: "Black", promptSegment: "of Black ethnicity" },
  { value: "east_asian", displayLabel: "East Asian", promptSegment: "of East Asian descent" },
  { value: "south_asian", displayLabel: "South Asian", promptSegment: "of South Asian descent" },
  { value: "latine", displayLabel: "Latina / Latino / Latine", promptSegment: "of Latino ethnicity" },
  { value: "middle_eastern_north_african", displayLabel: "Middle Eastern", promptSegment: "of Middle Eastern descent" },
  { value: "indigenous", displayLabel: "Indigenous", promptSegment: "of Indigenous descent" },
] as const satisfies readonly OptionWithPromptSegment[];

export const BODY_SHAPE_AND_SIZE_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "slim", displayLabel: "Slim", promptSegment: "with a slim and slender body frame" },
  { value: "athletic", displayLabel: "Athletic", promptSegment: "with an athletic and toned body build" },
  { value: "medium_build", displayLabel: "Medium Build", promptSegment: "with a well-proportioned, medium body build" },
  { value: "curvy", displayLabel: "Curvy", promptSegment: "with a curvy figure with a defined waist and hips" },
  { value: "plus_size", displayLabel: "Plus-Size", promptSegment: "with a plus-size body, full-figured and confident" },
  { value: "petite", displayLabel: "Petite", promptSegment: "with a petite body frame, shorter in stature with smaller proportions" },
  { value: "tall_and_slender", displayLabel: "Tall & Slender", promptSegment: "with a tall and slender frame with long limbs" },
] as const satisfies readonly OptionWithPromptSegment[];

export const HAIR_STYLE_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "long_wavy_cascading", displayLabel: "Long, Wavy, Cascading", promptSegment: "with long, wavy hair cascading over the shoulders" },
  { value: "sleek_bob_haircut", displayLabel: "Sleek Bob Haircut", promptSegment: "with a sleek bob haircut" },
  { value: "intricate_braided_updo", displayLabel: "Intricate Braided Updo", promptSegment: "with an intricate braided updo" },
  { value: "short_textured_pixie", displayLabel: "Short Textured Pixie Cut", promptSegment: "with a short, textured pixie cut with choppy layers" },
  { value: "shoulder_length_flowing", displayLabel: "Shoulder-Length, Flowing", promptSegment: "with shoulder-length, flowing hair" },
  { value: "chic_blonde_bob", displayLabel: "Chic Blonde Bob", promptSegment: "with a short, chic blonde bob" },
] as const satisfies readonly OptionWithPromptSegment[];

export const MODEL_EXPRESSION_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "neutral_professional", displayLabel: "Neutral, Professional", promptSegment: "with a neutral, professional expression, relaxed mouth" },
  { value: "gentle_smile", displayLabel: "Gentle Smile", promptSegment: "with a soft and gentle, closed-mouth smile, looking warm and approachable" },
  { value: "playful_smirk", displayLabel: "Playful Smirk", promptSegment: "with a playful and charming smirk, a hint of a fun-loving attitude" },
  { value: "joyful_laugh", displayLabel: "Joyful Laugh", promptSegment: "with a genuine, joyful laugh, looking happy and radiant" },
  { value: "confident_gaze", displayLabel: "Confident, Engaging Gaze", promptSegment: "with a warm, confident gaze, looking directly into the camera and connecting with the viewer" },
  { value: "soft_natural", displayLabel: "Soft, Natural Expression", promptSegment: "with a soft and natural expression, as if caught in a pleasant, fleeting thought" },
] as const satisfies readonly OptionWithPromptSegment[];

export const POSE_STYLE_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "natural_relaxed", displayLabel: "Natural, Relaxed", promptSegment: "a natural, relaxed pose" },
  { value: "candid_in_motion", displayLabel: "Candid, In Motion", promptSegment: "a candid pose capturing natural movement" },
  { value: "confident_stance", displayLabel: "Confident Stance", promptSegment: "a strong, confident stance" },
  { value: "playful_interactive", displayLabel: "Playful, Interactive", promptSegment: "a playful, interactive pose" },
  { value: "effortless_poise", displayLabel: "Effortless Poise", promptSegment: "an effortlessly chic and poised pose" },
  { value: "editorial_dramatic", displayLabel: "Editorial, Dramatic", promptSegment: "a bold, dramatic editorial pose" },
] as const satisfies readonly OptionWithPromptSegment[];

export const BACKGROUND_OPTIONS = [
  // --- Core & Studio ---
  { value: "default", displayLabel: "Default Background", promptSegment: "" },
  { value: "studio_white", displayLabel: "Studio - Clean White", promptSegment: "a professional studio with a seamless white background" },
  { value: "studio_colored", displayLabel: "Studio - Colored / Textured", promptSegment: "a modern studio setting with a colored or textured backdrop" },
  // --- Outdoor - Urban ---
  { value: "urban_street_day", displayLabel: "Urban - Daytime Street", promptSegment: "a modern city street with interesting architecture" },
  { value: "urban_rooftop", displayLabel: "Urban - Rooftop View", promptSegment: "a city rooftop with a panoramic urban skyline view" },
  { value: "urban_industrial", displayLabel: "Urban - Industrial Setting", promptSegment: "a raw industrial space" },
  // --- Outdoor - Nature ---
  { value: "nature_beach", displayLabel: "Nature - Sunlit Beach", promptSegment: "a vibrant beach with sand dunes and ocean waves" },
  { value: "nature_forest", displayLabel: "Nature - Lush Forest", promptSegment: "a lush, dense forest with a path and a rich canopy" },
  { value: "nature_field", displayLabel: "Nature - Open Field / Meadow", promptSegment: "an open field or meadow with tall grass and wildflowers" },
  { value: "nature_desert", displayLabel: "Nature - Dramatic Desert", promptSegment: "a stark desert landscape with dramatic rock formations or sand dunes" },
  { value: "nature_botanical_garden", displayLabel: "Nature - Botanical Garden", promptSegment: "a lush botanical garden with diverse, exotic plants" },
  { value: "nature_waterfall", displayLabel: "Nature - Mossy Waterfall", promptSegment: "a scenic waterfall with moss-covered rocks and lush foliage" },
  { value: "nature_jungle", displayLabel: "Nature - Tropical Jungle", promptSegment: "a dense tropical jungle with large leaves and hanging vines" },
] as const satisfies readonly OptionWithPromptSegment[];

export const TIME_OF_DAY_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "golden_hour_warm_glow", displayLabel: "Golden Hour (Warm Glow)", promptSegment: "during the golden hour, with warm, low, and directional sunlight casting long, soft shadows" },
  { value: "blue_hour_cool_ambiance", displayLabel: "Blue Hour (Cool Ambiance)", promptSegment: "during the blue hour, with cool, soft ambient light just before sunrise or after sunset" },
  { value: "moody_twilight_dusk_mysterious", displayLabel: "Moody Twilight/Dusk (Mysterious)", promptSegment: "at moody twilight or dusk, creating a mysterious and atmospheric feel" },
  { value: "bright_midday_sun_clear_sky", displayLabel: "Bright Midday Sun (Clear Sky)", promptSegment: "under bright midday sun on a clear day, creating strong highlights and defined shadows" },
  { value: "overcast_day_soft_diffused_light", displayLabel: "Overcast Day (Soft, Diffused Light)", promptSegment: "on an overcast day, providing soft, diffused, and even light" },
  { value: "night_time_artificial_city_glow", displayLabel: "Night Time (Artificial/City Glow)", promptSegment: "at night, illuminated by artificial lights, neon signs, or the ambient glow of a city" },
] as const satisfies readonly OptionWithPromptSegment[];

export const OVERALL_MOOD_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "cinematic_elegance_sophistication", displayLabel: "Cinematic Elegance, Sophistication", promptSegment: "The overall mood should be one of cinematic elegance and sophistication." },
  { value: "playful_vibrant_energetic_joyful", displayLabel: "Playful, Vibrant, Energetic, Joyful", promptSegment: "The overall mood should be playful, vibrant, and exude joyful energy." },
  { value: "serene_calm_understated_luxury", displayLabel: "Serene, Calm, Unders. Luxury", promptSegment: "The overall mood should be serene, calm, with an aura of understated luxury." },
  { value: "bold_rebellious_edgy_attitude", displayLabel: "Bold, Rebellious, Edgy Attitude", promptSegment: "The overall mood should be bold and rebellious, conveying an edgy attitude." },
  { value: "dreamy_romantic_ethereal_soft", displayLabel: "Dreamy, Romantic, Ethereal, Soft", promptSegment: "The overall mood should be dreamy, romantic, and ethereal, with a soft quality." },
  { value: "powerful_confident_assertive_strong", displayLabel: "Powerful, Confident, Assertive", promptSegment: "The overall mood should be powerful, confident, and assertive." },
  { value: "mysterious_enigmatic_intriguing", displayLabel: "Mysterious, Enigmatic, Intriguing", promptSegment: "The overall mood should be mysterious and enigmatic, creating a sense of intrigue." },
] as const satisfies readonly OptionWithPromptSegment[];

export const LIGHTING_TYPE_OPTIONS = [
  { value: "default", displayLabel: "Default (Style Driven)", promptSegment: "" },
  { value: "natural_available_light", displayLabel: "Natural Available Light", promptSegment: "Utilizing natural, available light characteristic of the chosen time and setting." },
  { value: "studio_softbox_even", displayLabel: "Studio Softbox (Even & Flattering)", promptSegment: "Professional studio lighting with large softboxes for even, flattering illumination and minimal harsh shadows." },
  { value: "studio_ring_light_defined_catchlight", displayLabel: "Studio Ring Light (Defined Catchlight)", promptSegment: "Using a ring light to create a defined, circular catchlight in the eyes and a focused illumination." },
  { value: "studio_three_point_sculpting", displayLabel: "Studio Three-Point (Sculpting)", promptSegment: "A classic three-point lighting setup (key, fill, back/rim light) to sculpt the subject and add dimension." },
  { value: "high_key_lighting_bright_airy", displayLabel: "High-Key Lighting (Bright & Airy)", promptSegment: "High-key lighting with a predominantly white or very light background, creating a bright and airy feel." },
  { value: "low_key_lighting_dark_dramatic", displayLabel: "Low-Key Lighting (Dark & Dramatic)", promptSegment: "Low-key lighting with deep shadows and a dark background, creating a dramatic and moody atmosphere." },
  { value: "rim_lighting_subject_separation", displayLabel: "Rim Lighting (Subject Separation)", promptSegment: "Using rim lighting to create a bright outline around the subject, separating them from the background." },
  { value: "cinematic_volumetric_light_rays", displayLabel: "Cinematic Volumetric Light Rays", promptSegment: "Cinematic lighting featuring volumetric effects like visible light rays or atmospheric haze." },
  { value: "chiaroscuro_strong_contrast_lighting", displayLabel: "Chiaroscuro (Strong Contrast)", promptSegment: "Chiaroscuro lighting with strong contrasts between light and shadow, creating a dramatic, painterly effect." },
  { value: "beauty_dish_focused_soft", displayLabel: "Beauty Dish (Focused Soft)", promptSegment: "Using a beauty dish for a focused yet soft light, often used for beauty and portrait shots." },
] as const satisfies readonly OptionWithPromptSegment[];

export const LIGHT_QUALITY_OPTIONS = [
  { value: "default", displayLabel: "Default", promptSegment: "" },
  { value: "warm_golden_inviting", displayLabel: "Warm, Golden, Inviting", promptSegment: "The light quality is warm, golden, and inviting." },
  { value: "cool_blue_crisp", displayLabel: "Cool, Blue, Crisp", promptSegment: "The light quality is cool, blue, and crisp." },
  { value: "soft_diffused_ethereal", displayLabel: "Soft, Diffused, Ethereal", promptSegment: "The light quality is soft, diffused, and ethereal, wrapping gently around the subject." },
  { value: "hard_direct_graphic_shadows", displayLabel: "Hard, Direct, Graphic Shadows", promptSegment: "The light is hard and direct, creating crisp, well-defined, graphic shadows." },
  { value: "glowing_radiant_luminous", displayLabel: "Glowing, Radiant, Luminous", promptSegment: "The light appears glowing, radiant, or luminous, perhaps with a slight bloom effect." },
] as const satisfies readonly OptionWithPromptSegment[];

export const LENS_EFFECT_OPTIONS = [
  { value: "default", displayLabel: "Default (Standard Perspective)", promptSegment: "Photographed with a standard lens perspective, offering a natural field of view." },
  { value: "portrait_lens_85mm_f1_8_bokeh", displayLabel: "Portrait Lens (85mm f/1.8 Style)", promptSegment: "Shot as if with an 85mm f/1.8 lens, creating a classic portrait compression and beautiful subject separation with creamy bokeh." },
  { value: "environmental_lens_35mm_context", displayLabel: "Environmental Lens (35mm Style)", promptSegment: "Shot as if with a 35mm lens, capturing more of the surroundings and providing context, good for street style or lifestyle." },
  { value: "wide_angle_lens_24mm_expansive_minimal_distortion", displayLabel: "Wide-Angle (24mm Expansive)", promptSegment: "Captured with a wide-angle lens perspective (around 24mm), showcasing an expansive scene or dramatic perspective, with minimal optical distortion." },
  { value: "macro_lens_intricate_detail", displayLabel: "Macro Lens (Intricate Detail)", promptSegment: "Using a macro lens effect for extreme close-up detail on textures, embroidery, stitching, or small accessories." },
  { value: "telephoto_lens_compression_subject_isolation", displayLabel: "Telephoto Lens (Compression & Isolation)", promptSegment: "Utilizing a telephoto lens (e.g., 200mm) compression effect, which flattens perspective and strongly isolates the subject from a distant, blurred background." },
] as const satisfies readonly OptionWithPromptSegment[];

export const DEPTH_OF_FIELD_OPTIONS = [
  { value: "default", displayLabel: "Default (Balanced Focus)", promptSegment: "" },
  { value: "shallow_dof_creamy_bokeh_f1_8_style", displayLabel: "Shallow DoF (Creamy Bokeh, f/1.8 Style)", promptSegment: "Achieving a shallow depth of field (simulating an f/1.8 aperture) with a creamy, beautifully blurred bokeh background, making the subject pop." },
  { value: "deep_dof_all_sharp_f16_style", displayLabel: "Deep DoF (All Sharp, f/16 Style)", promptSegment: "Employing a deep depth of field (simulating an f/16 aperture) where both the subject and the background are in sharp focus, ideal for detailed environmental shots." },
  { value: "moderate_dof_subject_context_f5_6_style", displayLabel: "Moderate DoF (Subject & Context, f/5.6 Style)", promptSegment: "Using a moderate depth of field (simulating an f/5.6 aperture) to keep the subject sharp while retaining some recognizable detail in the background context." },
] as const satisfies readonly OptionWithPromptSegment[];

export const MODEL_ANGLE_OPTIONS = [
  { value: "front_facing", displayLabel: "Default (Front-Facing)", promptSegment: "" },
  { value: "slight_oblique", displayLabel: "Slight Angle (Oblique)", promptSegment: ", photographed from a slight oblique angle" },
  { value: "three_quarter", displayLabel: "Three-Quarter View", promptSegment: ", photographed from a three-quarter angle" },
  { value: "profile", displayLabel: "Profile View (Side Shot)", promptSegment: ", photographed in profile" },
] as const satisfies readonly OptionWithPromptSegment[];

// =========================================================================
// ASPECT RATIOS (shared between Creative and Studio modes)
// =========================================================================

export const ASPECT_RATIOS = [
  { value: "auto", label: "Auto (Match Input)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "9:16", label: "9:16 (Portrait/Story)" },
  { value: "16:9", label: "16:9 (Cinematic)" },
  { value: "3:4", label: "3:4 (Editorial)" },
  { value: "4:3", label: "4:3 (Landscape)" },
  { value: "2:3", label: "2:3 (Classic Portrait)" },
  { value: "3:2", label: "3:2 (Classic Landscape)" },
  { value: "4:5", label: "4:5 (Social Portrait)" },
  { value: "5:4", label: "5:4 (Social Landscape)" },
  { value: "21:9", label: "21:9 (Ultrawide)" },
] as const satisfies readonly { value: string; label: string }[];

// =========================================================================
// VIDEO GENERATION OPTIONS
// =========================================================================

export const PREDEFINED_PROMPTS = [
  { value: 'walks_toward_camera_pullback', displayLabel: 'Walks Toward', promptSegment: 'The model takes two slow, deliberate steps directly toward the camera, as the camera performs a smooth, subtle pull-back.' },
  { value: 'walks_away_from_camera', displayLabel: 'Walks Away', promptSegment: 'The model begins walking in a slow, continuous motion on a diagonal path away from the camera. The camera remains completely static, letting her recede into the scene.' },
  { value: 'step_sideways_camera_follows', displayLabel: 'Side Step', promptSegment: 'The model takes one single, deliberate step to the side, and the camera performs a smooth, slight pan to follow her, keeping her centered in the frame.' },
  { value: 'turn_to_profile', displayLabel: 'Turn to Profile', promptSegment: 'The model gracefully turns her body 90 degrees to the side, holding the final pose. The camera remains static throughout the movement.' },
  { value: '180_turn_camera_follows', displayLabel: '180° Turn', promptSegment: 'The model performs a slow, fluid half-turn (180 degrees)' },
  { value: 'slow_zoom_in_detail', displayLabel: 'Zoom In', promptSegment: 'The model slowly shifts her weight from one foot to the other in a subtle, continuous motion, as the camera performs a slow, graceful push-in.' },
] as const satisfies readonly OptionWithPromptSegment[];

export const MODEL_MOVEMENT_OPTIONS = [
  { value: 'effortless_poise', displayLabel: 'Effortless Poise', promptSegment: 'settles into a composed, graceful pose with minimal movement' },
  { value: 'living_stillness', displayLabel: 'Living Stillness', promptSegment: 'maintains a poised presence with nearly imperceptible, natural micro-movements, appearing alive and present' },
  { value: 'subtle_posture_shift', displayLabel: 'Subtle Posture Shift', promptSegment: 'makes a slight, elegant shift in posture or weight distribution' },
  { value: 'engaging_gaze_shift', displayLabel: 'Engaging Gaze Shift', promptSegment: 's gaze softly meets the camera or drifts thoughtfully to the side' },
  { value: 'gentle_hair_sway', displayLabel: 'Gentle Hair Sway', promptSegment: 's hair subtly catches the light or sways gently as if from a light breeze' },
  { value: 'pose_for_feature_highlight', displayLabel: 'Pose for Feature Highlight', promptSegment: 'adjusts their pose subtly, drawing attention to a specific garment feature' },
  { value: 'elegant_turn_profile', displayLabel: 'Elegant Turn/Profile', promptSegment: 'executes a smooth, elegant turn or pivots slightly to showcase their profile' },
  { value: 'gentle_stride_initiation', displayLabel: 'Gentle Stride Initiation', promptSegment: 'initiates a slow, graceful step forward or to the side, as if about to walk' },
  { value: 'tactile_garment_adjustment', displayLabel: 'Tactile Garment Adjustment', promptSegment: 'lightly touches, smooths, or subtly adjusts a part of their attire' },
  { value: 'expressive_hand_gesture', displayLabel: 'Expressive Hand/Arm Gesture', promptSegment: 's hands make a soft, expressive gesture or arms shift into a new elegant position' },
] as const satisfies readonly OptionWithPromptSegment[];

export const FABRIC_MOTION_OPTIONS_VIDEO = [
  { value: 'fabric_settles_naturally', displayLabel: 'Fabric Settles Naturally', promptSegment: 'fabric settles or drapes naturally according to gravity and the model\'s form' },
  { value: 'soft_flow_with_movement', displayLabel: 'Soft Flow with Movement', promptSegment: 'fabric flows softly in response to the model\'s movement' },
  { value: 'light_play_on_surface', displayLabel: 'Light Play on Surface', promptSegment: 'fabric catches and plays with the light, creating subtle shimmers or highlights on its surface' },
  { value: 'gentle_ripple_or_crease', displayLabel: 'Gentle Ripple or Crease', promptSegment: 'fabric ripples or creases delicately, showing texture or lightness' },
  { value: 'airy_billow_subtle', displayLabel: 'Subtle Airy Billow', promptSegment: 'fabric billows lightly and subtly, as if touched by a soft, almost imperceptible breeze' },
  { value: 'structured_form_hold', displayLabel: 'Structured Form Hold', promptSegment: 'fabric holds its intended structure and silhouette with minimal flex' },
  { value: 'texture_emphasis_shift', displayLabel: 'Texture Emphasis (Subtle Shift)', promptSegment: 'fabric makes a very subtle shift or crease, highlighting its inherent texture and material quality' },
] as const satisfies readonly OptionWithPromptSegment[];

export const CAMERA_ACTION_OPTIONS = [
  { value: 'composed_static_shot', displayLabel: 'Composed Static Shot', promptSegment: 'camera maintains a steady, well-composed shot, focusing attention on the model and garment details' },
  { value: 'gentle_camera_breathe', displayLabel: 'Gentle Camera Breathe', promptSegment: 'camera has a very subtle, almost imperceptible "breathing" motion, adding a touch of life to a seemingly static frame' },
  { value: 'smooth_upward_pan_along_figure', displayLabel: 'Smooth Upward Pan (Along Figure)', promptSegment: 'camera smoothly pans upwards along the model, accentuating the full length of the outfit and their stance' },
  { value: 'slow_zoom_to_garment_detail', displayLabel: 'Slow Zoom to Garment Detail', promptSegment: 'camera performs a slow, deliberate zoom towards a key garment detail or texture' },
  { value: 'gentle_orbit_around_model', displayLabel: 'Gentle Orbit Around Model', promptSegment: 'camera executes a gentle, smooth orbiting motion around the model, showcasing the look from multiple angles' },
  { value: 'focus_shift_to_model', displayLabel: 'Focus Shift to Model', promptSegment: 'camera shifts focus from a softly blurred background to bring the model and outfit into sharp clarity' },
  { value: 'subtle_drift_and_reframe', displayLabel: 'Subtle Drift & Reframe', promptSegment: 'camera makes a slow, subtle drift or arc, slightly reframing the model within the shot' },
  { value: 'close_up_follow_detail_motion', displayLabel: 'Close-up Follow Detail in Motion', promptSegment: 'camera moves into a close-up and gently follows a specific detail, like a hand gesture or an accessory, as it moves' },
  { value: 'dolly_in_for_engagement', displayLabel: 'Dolly In for Engagement', promptSegment: 'camera slowly dollies in towards the model, creating a more intimate and engaging perspective' },
  { value: 'pull_back_for_wider_context', displayLabel: 'Pull Back for Wider Context', promptSegment: 'camera slowly pulls back from the initial full-body shot, widening the view to include more of the surrounding context or environment' },
] as const satisfies readonly OptionWithPromptSegment[];

export const AESTHETIC_VIBE_OPTIONS = [
  { value: 'natural_effortless_style', displayLabel: 'Natural & Effortless Style', promptSegment: 'Exudes a natural and effortless style.' },
  { value: 'timeless_chic_sophistication', displayLabel: 'Timeless Chic & Sophistication', promptSegment: 'Timelessly chic and sophisticated.' },
  { value: 'modern_sleek_edge', displayLabel: 'Modern Sleek Edge', promptSegment: 'Modern, sleek, with a sharp, contemporary edge.' },
  { value: 'dreamy_aspirational_escape', displayLabel: 'Dreamy Aspirational Escape', promptSegment: 'Ethereal and soft, like a dreamy, aspirational escape.' },
  { value: 'vibrant_confident_statement', displayLabel: 'Vibrant Confident Statement', promptSegment: 'Bold, vibrant, and confident, making a memorable statement.' },
  { value: 'warm_golden_hour_glow', displayLabel: 'Warm Golden Hour Glow', promptSegment: 'Bathed in the warm, magical glow of golden hour light.' },
  { value: 'artistic_indie_film_cool', displayLabel: 'Artistic Indie Film Cool', promptSegment: 'Effortlessly cool, with an artistic indie film aesthetic.' },
  { value: 'clean_studio_polish', displayLabel: 'Clean Studio Polish', promptSegment: 'Polished and sharp, with a clean, professional studio aesthetic.' },
  { value: 'bright_outdoor_freshness', displayLabel: 'Bright Outdoor Freshness', promptSegment: 'Bright, airy, and fresh, capturing a vibrant outdoor ambiance.' },
] as const satisfies readonly OptionWithPromptSegment[];

// =========================================================================
// DERIVED UNION TYPES
// =========================================================================

// Image generation value types
export type FashionStyleValue = typeof FASHION_STYLE_OPTIONS[number]['value'];
export type GenderValue = typeof GENDER_OPTIONS[number]['value'];
export type AgeRangeValue = typeof AGE_RANGE_OPTIONS[number]['value'];
export type EthnicityValue = typeof ETHNICITY_OPTIONS[number]['value'];
export type BodyShapeAndSizeValue = typeof BODY_SHAPE_AND_SIZE_OPTIONS[number]['value'];
export type HairStyleValue = typeof HAIR_STYLE_OPTIONS[number]['value'];
export type ModelExpressionValue = typeof MODEL_EXPRESSION_OPTIONS[number]['value'];
export type PoseStyleValue = typeof POSE_STYLE_OPTIONS[number]['value'];
export type BackgroundValue = typeof BACKGROUND_OPTIONS[number]['value'];
export type TimeOfDayValue = typeof TIME_OF_DAY_OPTIONS[number]['value'];
export type OverallMoodValue = typeof OVERALL_MOOD_OPTIONS[number]['value'];
export type LightingTypeValue = typeof LIGHTING_TYPE_OPTIONS[number]['value'];
export type LightQualityValue = typeof LIGHT_QUALITY_OPTIONS[number]['value'];
export type LensEffectValue = typeof LENS_EFFECT_OPTIONS[number]['value'];
export type DepthOfFieldValue = typeof DEPTH_OF_FIELD_OPTIONS[number]['value'];
export type ModelAngleValue = typeof MODEL_ANGLE_OPTIONS[number]['value'];

// Shared
export type AspectRatioValue = typeof ASPECT_RATIOS[number]['value'];
export type StudioFitValue = 'slim' | 'regular' | 'relaxed';

// Video generation value types
export type PredefinedPromptValue = typeof PREDEFINED_PROMPTS[number]['value'];
export type ModelMovementValue = typeof MODEL_MOVEMENT_OPTIONS[number]['value'];
export type FabricMotionVideoValue = typeof FABRIC_MOTION_OPTIONS_VIDEO[number]['value'];
export type CameraActionValue = typeof CAMERA_ACTION_OPTIONS[number]['value'];
export type AestheticVibeValue = typeof AESTHETIC_VIBE_OPTIONS[number]['value'];
