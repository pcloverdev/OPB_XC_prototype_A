import VisionCamera
import CoreMedia
import UIKit

/// VisionCamera native frame processor plugin.
///
/// Registered under the name `"detectCrossover"` (see `CrossoverDetectorModule`).
/// Runs on VisionCamera's dedicated frame-processor worklet thread — NOT the JS
/// thread — so the heavy MediaPipe inference never touches the RN bridge. It simply
/// forwards each camera frame to the shared inference engine and returns `nil`; the
/// only thing that ever crosses to JS is the debounced rep event.
@objc(CrossoverFrameProcessorPlugin)
public class CrossoverFrameProcessorPlugin: FrameProcessorPlugin {

    public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]? = [:]) {
        super.init(proxy: proxy, options: options)
    }

    public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
        PoseInferenceEngine.shared.processLiveFrame(
            sampleBuffer: frame.buffer,
            orientation: frame.orientation
        )
        return nil
    }
}
