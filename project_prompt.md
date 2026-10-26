# Role & Context
You are an expert React Native and Native (Swift/Kotlin) mobile engineer. I am building a prototype for a sports analytics application. The goal of this prototype is strictly to validate a computer vision heuristic: detecting and counting basketball crossovers on-device at 60 FPS using Google's MediaPipe Pose Landmarker.

# Core Requirements

1. **Framework:** React Native using Expo (with Custom Dev Client / Prebuild). Do not use Expo Go, as we require native modules. To scaffold the app, use the npx command to set it up with typescript.
2. **Inputs:** The user must be able to toggle between two modes:
   * **Live Camera:** Using `react-native-vision-camera`.
   * **Local Video:** Selecting a pre-recorded video from the device library.
3. **Model:** The MediaPipe Pose Landmarker `.task` or `.tflite` model is downloaded locally. Do NOT use cloud APIs. Inference must happen strictly on the edge. You can find the models available at /Users/patrickclover/Repos/MediaPipe. 
4. **Performance Constraint:** The React Native JavaScript bridge is too slow for 60 FPS coordinate processing. The frame extraction, MediaPipe inference, and the crossover heuristic logic **must** be implemented natively (C++, Swift, or Kotlin). The native side should only send lightweight event pulses (e.g., `onRepComplete: { totalReps: integer, duration: float }`) back to React Native.

# The Heuristic (State Machine Logic)
Implement the following logic natively to define a crossover:
1. Extract the $(x, y, z)$ coordinates for `nose` (0), `left_wrist` (15), `right_wrist` (16), `left_hip` (23), and `right_hip` (24).
2. Establish a dynamic vertical `midline` by calculating the midpoint between the `left_hip` and `right_hip`.
3. Implement a 3-step state machine:
   * **State 0 (Idle):** Wrists are above the hips or static.
   * **State 1 (Initiation):** One wrist drops below the hip height on its respective side of the midline (e.g., right wrist is low on the right side).
   * **State 2 (The Cross):** The low wrist crosses the `midline` to the opposite side.
   * **State 3 (Completion):** The opposite wrist drops to meet the approximate $(x,y)$ coordinate where the ball was passed. Register 1 Rep, send event to JS, and reset to State 1.
4. Add a fault-tolerance buffer: If a wrist is lost due to motion blur for < 5 frames, interpolate its position rather than resetting the state machine.

# Implementation Steps
Please provide the implementation in the following order:

1. **Setup & Dependencies:** Provide the `package.json` additions and app configuration (plugins) needed for `react-native-vision-camera` and native ML execution.
2. **Native Module Structure:** Draft the Swift (iOS) or Kotlin (Android) frame processor or native module bridging code that initializes MediaPipe locally.
3. **Heuristic Code:** Write the native C++/Swift/Kotlin logic for the state machine described above.
4. **React Native UI:** Provide the TypeScript code for the main screen, including the camera view, video picker toggle, and a simple large UI text element displaying the rep count received from the native bridge.

# Output Constraints
Do not worry about UI polish, styling, or persistent databases. Focus entirely on the architectural bridge between the React Native UI and the highly performant native ML execution layer.