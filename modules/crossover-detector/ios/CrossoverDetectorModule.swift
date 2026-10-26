import ExpoModulesCore
import VisionCamera

/// The React Native bridge for the crossover detector.
///
/// Responsibilities (kept intentionally thin — all the real work is native):
///  1. Register the `detectCrossover` VisionCamera frame processor plugin at startup.
///  2. Forward the native heuristic's rep events to JS as `onRepComplete` pulses.
///  3. Expose start/stop/reset + the local-video processing entry point to JS.
public class CrossoverDetectorModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CrossoverDetector")

        // Lightweight event pulses sent to React Native. `onRepComplete` is the one
        // the spec cares about: { totalReps: Int, duration: Double }.
        Events("onRepComplete", "onVideoComplete", "onError")

        OnCreate {
            // Register the native frame processor plugin with VisionCamera. Doing this
            // in OnCreate (which runs when the module is first required in JS) means it
            // is in place before the camera screen calls initFrameProcessorPlugin().
            FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectCrossover") { proxy, options in
                CrossoverFrameProcessorPlugin(proxy: proxy, options: options)
            }

            // Bridge the native heuristic → JS. This is the ONLY per-rep data that
            // crosses the bridge; coordinates never do.
            PoseInferenceEngine.shared.stateMachine.onRepComplete = { [weak self] totalReps, duration in
                self?.sendEvent("onRepComplete", [
                    "totalReps": totalReps,
                    "duration": duration
                ])
            }
        }

        // Start the live-camera MediaPipe session (liveStream mode).
        AsyncFunction("startLiveSession") {
            try PoseInferenceEngine.shared.startLiveSession()
        }

        // Tear down the live session.
        Function("stopLiveSession") {
            PoseInferenceEngine.shared.stopLiveSession()
        }

        // Reset the rep counter and heuristic state (new drill).
        Function("resetCount") {
            PoseInferenceEngine.shared.stateMachine.resetAll()
        }

        // Process a local video file end-to-end natively. Resolves with the final
        // rep count; also emits per-rep onRepComplete events as it decodes.
        AsyncFunction("processVideo") { (uri: String, promise: Promise) in
            let url = uri.hasPrefix("file://")
                ? (URL(string: uri) ?? URL(fileURLWithPath: uri))
                : URL(fileURLWithPath: uri)

            PoseInferenceEngine.shared.processVideo(url: url) { [weak self] totalReps, error in
                if let error = error {
                    self?.sendEvent("onError", ["message": error.localizedDescription])
                    promise.reject("ERR_VIDEO", error.localizedDescription)
                } else {
                    self?.sendEvent("onVideoComplete", ["totalReps": totalReps])
                    promise.resolve(totalReps)
                }
            }
        }
    }
}
