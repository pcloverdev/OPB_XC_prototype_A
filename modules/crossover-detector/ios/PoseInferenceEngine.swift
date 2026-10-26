import Foundation
import AVFoundation
import CoreMedia
import UIKit
import MediaPipeTasksVision

/// Owns the on-device MediaPipe Pose Landmarker and drives the crossover heuristic.
///
/// This is the performance-critical layer. It runs entirely native: MediaPipe
/// inference + the `PoseResolver` interpolation buffer + the `CrossoverStateMachine`.
/// Nothing here touches the JS bridge — the only thing that escapes to React Native
/// is a lightweight rep event via `stateMachine.onRepComplete` (wired up by the
/// Expo module).
final class PoseInferenceEngine: NSObject {

    static let shared = PoseInferenceEngine()

    /// Shared heuristic so both the live frame processor and the video path feed the
    /// same counter, and the Expo module can attach its event callback once.
    let stateMachine = CrossoverStateMachine()
    private let resolver = PoseResolver()

    private var liveLandmarker: PoseLandmarker?
    private var lastLiveTimestampMs = 0
    private let videoQueue = DispatchQueue(label: "com.opb.crossover.video")

    private override init() { super.init() }

    // MARK: - Model / options

    private func modelPath() throws -> String {
        guard let path = Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task") else {
            throw NSError(domain: "Crossover", code: 404,
                          userInfo: [NSLocalizedDescriptionKey: "pose_landmarker_lite.task missing from app bundle"])
        }
        return path
    }

    private func makeOptions(runningMode: RunningMode) throws -> PoseLandmarkerOptions {
        let options = PoseLandmarkerOptions()
        options.baseOptions.modelAssetPath = try modelPath()
        options.runningMode = runningMode
        options.numPoses = 1
        options.minPoseDetectionConfidence = 0.5
        options.minPosePresenceConfidence = 0.5
        options.minTrackingConfidence = 0.5
        return options
    }

    // MARK: - Live camera session (liveStream mode, async delegate)

    func startLiveSession() throws {
        stopLiveSession()
        resolver.reset()
        stateMachine.reset()
        lastLiveTimestampMs = 0

        let options = try makeOptions(runningMode: .liveStream)
        options.poseLandmarkerLiveStreamDelegate = self
        liveLandmarker = try PoseLandmarker(options: options)
    }

    func stopLiveSession() {
        liveLandmarker = nil
    }

    /// Called from the VisionCamera frame processor on the camera worklet thread.
    /// Hands the frame straight to MediaPipe; results arrive on the delegate.
    func processLiveFrame(sampleBuffer: CMSampleBuffer, orientation: UIImage.Orientation) {
        guard let landmarker = liveLandmarker else { return }

        // liveStream mode requires strictly-increasing millisecond timestamps.
        var ts = Int(CACurrentMediaTime() * 1000)
        if ts <= lastLiveTimestampMs { ts = lastLiveTimestampMs + 1 }
        lastLiveTimestampMs = ts

        do {
            let image = try MPImage(sampleBuffer: sampleBuffer, orientation: orientation)
            try landmarker.detectAsync(image: image, timestampInMilliseconds: ts)
        } catch {
            NSLog("[Crossover] live detectAsync failed: \(error.localizedDescription)")
        }
    }

    // MARK: - Local video (video mode, synchronous per-frame)

    /// Decode a local video with AVAssetReader and run pose + heuristic on every
    /// frame natively. Calls `completion` with the final rep count when finished.
    func processVideo(url: URL, completion: @escaping (Int, Error?) -> Void) {
        videoQueue.async { [weak self] in
            guard let self = self else { return }
            self.resolver.reset()
            self.stateMachine.reset()

            do {
                let landmarker = try PoseLandmarker(options: self.makeOptions(runningMode: .video))
                let asset = AVURLAsset(url: url)
                guard let track = asset.tracks(withMediaType: .video).first else {
                    throw NSError(domain: "Crossover", code: 2,
                                  userInfo: [NSLocalizedDescriptionKey: "No video track in asset"])
                }

                let reader = try AVAssetReader(asset: asset)
                let output = AVAssetReaderTrackOutput(
                    track: track,
                    outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
                )
                output.alwaysCopiesSampleData = false
                reader.add(output)
                reader.startReading()

                var lastMs = -1
                while reader.status == .reading {
                    guard let sample = output.copyNextSampleBuffer() else { break }
                    autoreleasepool {
                        let pts = CMSampleBufferGetPresentationTimeStamp(sample)
                        var ms = Int(CMTimeGetSeconds(pts) * 1000)
                        if ms <= lastMs { ms = lastMs + 1 }
                        lastMs = ms

                        if let pixelBuffer = CMSampleBufferGetImageBuffer(sample),
                           let image = try? MPImage(pixelBuffer: pixelBuffer),
                           let result = try? landmarker.detect(videoFrame: image, timestampInMilliseconds: ms) {
                            self.handle(result: result, timestampMs: Double(ms))
                        }
                        CMSampleBufferInvalidate(sample)
                    }
                }

                if reader.status == .failed {
                    throw reader.error ?? NSError(domain: "Crossover", code: 3,
                                                  userInfo: [NSLocalizedDescriptionKey: "Video read failed"])
                }
                completion(self.stateMachine.totalReps, nil)
            } catch {
                completion(0, error)
            }
        }
    }

    // MARK: - Shared result handling

    private func handle(result: PoseLandmarkerResult, timestampMs: Double) {
        // Collect only sufficiently-visible observations; the resolver fills the rest.
        var raw: [Int: Landmark] = [:]
        if let pose = result.landmarks.first {
            for idx in PoseResolver.indices where idx < pose.count {
                let lm = pose[idx]
                raw[idx] = Landmark(x: lm.x, y: lm.y, z: lm.z,
                                    visibility: lm.visibility?.floatValue ?? 1.0)
            }
        }

        guard let resolved = resolver.resolve(raw: raw),
              let nose = resolved[0], let lWrist = resolved[15], let rWrist = resolved[16],
              let lHip = resolved[23], let rHip = resolved[24] else {
            // Tracking lost beyond the tolerance window — reset the machine.
            stateMachine.reset()
            return
        }

        stateMachine.update(
            with: PoseSnapshot(nose: nose, leftWrist: lWrist, rightWrist: rWrist,
                               leftHip: lHip, rightHip: rHip),
            timestampMs: timestampMs
        )
    }
}

// MARK: - Live stream delegate

extension PoseInferenceEngine: PoseLandmarkerLiveStreamDelegate {
    func poseLandmarker(_ poseLandmarker: PoseLandmarker,
                        didFinishDetection result: PoseLandmarkerResult?,
                        timestampInMilliseconds: Int,
                        error: Error?) {
        if let error = error {
            NSLog("[Crossover] live detection error: \(error.localizedDescription)")
            return
        }
        guard let result = result else { return }
        handle(result: result, timestampMs: Double(timestampInMilliseconds))
    }
}
