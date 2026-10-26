# OPB Crossover — on-device basketball crossover counter (prototype)

Validates a computer-vision heuristic: detecting and counting basketball
crossovers **on-device** using Google MediaPipe **Pose Landmarker**, with all
frame extraction, inference, and heuristic logic implemented **natively (Swift)**
so nothing heavy crosses the React Native bridge.

> Platform: **iOS** (Swift). Android was intentionally out of scope for this
> prototype — the machine it was built on had no JDK, and iOS is the natural
> target for the native ML + VisionCamera frame-processor path.

## Stack (deliberately pinned)

| Piece | Version | Why |
|------|---------|-----|
| Expo SDK | 54 (RN 0.81) | Proven, stable base for the native frame-processor path |
| react-native-vision-camera | **4.7.3** | v4 keeps the documented native `FrameProcessorPlugin` API. v5 (Nitro) removed it. |
| react-native-worklets-core | 1.6.3 | Required by VisionCamera v4 frame processors |
| MediaPipeTasksVision | 0.10.21 | On-device Pose Landmarker (`pose_landmarker_lite.task` bundled) |
| expo-image-picker | for the Local Video mode |

## Architecture

The whole hot path is native. React Native only ever receives lightweight
`onRepComplete: { totalReps, duration }` pulses.

```
                 ┌──────────────────────── native (Swift) ────────────────────────┐
 Live camera ──► VisionCamera frame ─► CrossoverFrameProcessorPlugin ─┐            │
 (worklet thread)                                                     ▼            │
                                                        PoseInferenceEngine        │
 Local video ──► AVAssetReader frames ──────────────────────────────►(MediaPipe)  │
                                                                     │             │
                                                     PoseResolver (interp. buffer) │
                                                                     ▼             │
                                                     CrossoverStateMachine         │
                 └───────────────────────────────────────────────────┬────────────┘
                                                                      │ onRepComplete
                                                                      ▼
                                             React Native UI (rep counter)
```

### Native module (`modules/crossover-detector/ios/`)

- **`PoseInferenceEngine.swift`** — owns the MediaPipe `PoseLandmarker`. Two entry
  points sharing one heuristic:
  - `processLiveFrame(...)` → `.liveStream` mode, async delegate (camera).
  - `processVideo(url:)` → `.video` mode via `AVAssetReader` (local video).
- **`PoseResolver.swift`** — the fault-tolerance buffer. If a landmark is lost to
  motion blur for **< 5 frames** it is interpolated from last position + velocity;
  at ≥ 5 frames it signals the state machine to reset.
- **`CrossoverStateMachine.swift`** — the pure heuristic (see below).
- **`CrossoverFrameProcessorPlugin.swift`** — VisionCamera plugin (`detectCrossover`)
  running on the camera worklet thread; forwards frames to the engine, returns `nil`.
- **`CrossoverDetectorModule.swift`** — Expo module: registers the plugin, forwards
  rep events to JS, exposes `startLiveSession` / `stopLiveSession` / `resetCount` /
  `processVideo`.

### The heuristic (`CrossoverStateMachine`)

Landmarks used: nose (0), left_wrist (15), right_wrist (16), left_hip (23),
right_hip (24). A **dynamic midline** is the midpoint between the hips.

- **State 0 – Idle**: wrists above the hips.
- **State 1 – Initiation**: one wrist drops below hip height on its own side.
- **State 2 – Cross**: that low wrist crosses the midline to the far side
  (the crossing point is remembered as the "pass point").
- **State 3 – Completion**: the *opposite* wrist drops to meet the pass point
  → **+1 rep**, emit event, and fall back to State 1 with the ball now in the
  receiving hand (so a continuous dribble keeps counting).

Thresholds (`crossHysteresis`, `completionRadius`, `hipMargin`) are tunable
constants at the top of the file.

## App structure (UI)

Navigation is React Navigation (native stack). The code is organized like a real
app rather than a single screen:

```
App.tsx                       # NavigationContainer + theme
src/
  navigation/                 # RootNavigator + typed param list
  screens/
    HomeScreen                # landing: workout categories
    CategoryScreen            # workouts within a category
    CrossoverDrillScreen      # the live/video crossover drill
    ComingSoonScreen          # placeholder for not-yet-built workouts
  components/                 # CategoryCard, WorkoutRow, ModeToggle,
                              #   RepCounter, CompletionOverlay,
                              #   LiveCameraView, VideoPickerView
  hooks/
    useCrossoverReps          # mirrors native rep events → state (+ goal)
    useCompletionFeedback      # completion chime (expo-audio) + success haptic
  workouts/catalog.ts         # typed data: categories + drills
  theme/colors.ts
```

**Flow:** Home → category (Ball Handling / Shooting / Weight Room / Plyometrics)
→ workout. Only **Ball Handling → Crossover Counter** is wired to the CV drill;
the rest route to a "coming soon" placeholder (Weight Room / Plyometrics are
marked as no-camera workouts). Adding a real workout is just a new entry in
`catalog.ts` plus a screen.

**Goal + completion:** each rep-based drill has a `goal` (Crossover Counter = 10).
When the native counter reaches it, `CrossoverDrillScreen` freezes capture and
shows `CompletionOverlay` — an animated checkmark + confetti (RN `Animated`, no
extra deps) with a synthesized chime (`assets/sounds/complete.wav`) and a success
haptic. "Do it again" resets the native counter; "Finish" pops back.

## Running it

Requires Xcode + CocoaPods (already installed & `pod install` already run).

```bash
# Live camera needs a REAL device (simulators have no camera).
npx expo run:ios --device

# Local-video mode works on a simulator too, if the library has a video.
npx expo run:ios
```

In the app: toggle **Live Camera** / **Local Video** at the bottom; the big number
is the live rep count; **Reset** zeroes it.

### Notes / prototype limitations

- **Model**: `pose_landmarker_lite.task` is bundled for speed (60 FPS goal). Swap
  the resource in `CrossoverDetector.podspec` for `full`/`heavy` for accuracy.
- Live camera uses `pixelFormat="rgb"` (BGRA) so MediaPipe's `MPImage` ingests
  frames directly.
- The heuristic assumes a roughly front-on, upright athlete; it is a starting
  point for validation, not a tuned classifier.
```
