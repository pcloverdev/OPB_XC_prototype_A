import Foundation

/// Fault-tolerance buffer for the heuristic.
///
/// MediaPipe can drop or low-confidence a landmark for a few frames during fast
/// motion / motion blur. Per the spec, if a wrist (or any tracked landmark) is
/// lost for fewer than `maxMissingFrames`, we interpolate its position from the
/// last known value + velocity instead of resetting the state machine. If it stays
/// lost at or beyond that threshold we give up and signal a reset.
final class PoseResolver {

    /// Landmark indices the heuristic needs: nose, wrists, hips.
    static let indices = [0, 15, 16, 23, 24]

    private let maxMissingFrames = 5
    private let visibilityThreshold: Float = 0.5

    private struct Track {
        var last: Landmark
        var velocity: (x: Float, y: Float, z: Float) = (0, 0, 0)
        var missing: Int = 0
    }

    private var tracks: [Int: Track] = [:]

    func reset() {
        tracks.removeAll()
    }

    /// Resolve one frame's raw observations (only landmarks that were actually
    /// present with sufficient visibility should be supplied in `raw`).
    ///
    /// - Returns: a full set of the five tracked landmarks (observed or
    ///   interpolated), or `nil` if any required landmark has been missing for
    ///   `maxMissingFrames` or longer (caller should reset the state machine).
    func resolve(raw: [Int: Landmark]) -> [Int: Landmark]? {
        var out: [Int: Landmark] = [:]

        for idx in PoseResolver.indices {
            if let observed = raw[idx], observed.visibility >= visibilityThreshold {
                // Fresh observation: update the track and its velocity estimate.
                if var t = tracks[idx] {
                    t.velocity = (observed.x - t.last.x,
                                  observed.y - t.last.y,
                                  observed.z - t.last.z)
                    t.last = observed
                    t.missing = 0
                    tracks[idx] = t
                } else {
                    tracks[idx] = Track(last: observed)
                }
                out[idx] = observed
            } else {
                // Missing this frame. Interpolate if we've seen it recently enough.
                guard var t = tracks[idx] else {
                    // Never observed — cannot interpolate from nothing.
                    return nil
                }
                t.missing += 1
                if t.missing >= maxMissingFrames {
                    tracks[idx] = t
                    return nil // lost too long → tell caller to reset
                }
                // Linear extrapolation from last known position + velocity.
                let predicted = Landmark(
                    x: t.last.x + t.velocity.x,
                    y: t.last.y + t.velocity.y,
                    z: t.last.z + t.velocity.z,
                    visibility: t.last.visibility
                )
                t.last = predicted
                tracks[idx] = t
                out[idx] = predicted
            }
        }

        return out
    }
}
