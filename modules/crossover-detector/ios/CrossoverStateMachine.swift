import Foundation

/// A single pose landmark in MediaPipe normalized image space.
/// Origin is the top-left corner; `x`/`y` are in [0, 1] and `y` GROWS DOWNWARD
/// (so "below the hips" means a larger `y`).
struct Landmark {
    var x: Float
    var y: Float
    var z: Float
    var visibility: Float
}

/// The five landmarks the crossover heuristic operates on, already resolved
/// (each is either directly observed or interpolated by the fault-tolerance buffer).
struct PoseSnapshot {
    var nose: Landmark        // index 0
    var leftWrist: Landmark   // index 15
    var rightWrist: Landmark  // index 16
    var leftHip: Landmark     // index 23
    var rightHip: Landmark    // index 24
}

/// The 3-step state machine described in the spec. Completion (State 3) is modeled
/// as an instantaneous transition that registers a rep and drops straight back to
/// State 1 with the ball now in the receiving hand, so a continuous dribble keeps
/// counting without passing back through Idle.
enum CrossoverState: Int {
    case idle = 0        // State 0 — wrists above the hips / static
    case initiation = 1  // State 1 — one wrist is low on its own side of the midline
    case cross = 2       // State 2 — that low wrist has crossed the midline
}

private enum Hand { case left, right }

/// Pure geometric heuristic. Fed one resolved `PoseSnapshot` per frame; emits a
/// callback whenever a crossover rep completes. Holds no ML / camera state, which
/// keeps it trivially unit-testable.
final class CrossoverStateMachine {

    // MARK: Tunables (all in normalized [0,1] image units)

    /// How far past the midline the carrying wrist must travel to count as "crossed".
    private let crossHysteresis: Float = 0.03
    /// How close the receiving wrist must get to the pass point to complete the rep.
    private let completionRadius: Float = 0.15
    /// Extra drop below the hip line required before a wrist is considered "low".
    private let hipMargin: Float = 0.0

    // MARK: Public read-only state

    private(set) var state: CrossoverState = .idle
    private(set) var totalReps: Int = 0

    /// Fired on State 3 (completion). `duration` is the time in seconds for the rep
    /// that just completed (from when its carrying hand first went low).
    var onRepComplete: ((_ totalReps: Int, _ duration: Double) -> Void)?

    // MARK: Private working state

    private var activeHand: Hand?      // the hand currently carrying the ball low
    private var passPoint: (x: Float, y: Float)?  // where the ball crossed the midline
    private var repStartMs: Double = 0

    // MARK: Lifecycle

    /// Reset the machine (e.g. tracking lost) without clearing the total count.
    func reset() {
        state = .idle
        activeHand = nil
        passPoint = nil
    }

    /// Reset everything including the rep counter (new session / user tapped reset).
    func resetAll() {
        reset()
        totalReps = 0
    }

    // MARK: Core update

    func update(with pose: PoseSnapshot, timestampMs: Double) {
        // Dynamic vertical midline = midpoint between the two hips.
        let midlineX = (pose.leftHip.x + pose.rightHip.x) / 2
        let hipY = (pose.leftHip.y + pose.rightHip.y) / 2

        let lw = pose.leftWrist
        let rw = pose.rightWrist

        // "Below the hips" — remember y grows downward.
        func isLow(_ w: Landmark) -> Bool { w.y > hipY + hipMargin }
        // Which side of the midline a wrist is on (image-space).
        func side(_ w: Landmark) -> Hand { w.x >= midlineX ? .right : .left }

        switch state {
        case .idle:
            // State 0 → 1: a wrist drops below the hips on its own side of the midline.
            if isLow(rw) && side(rw) == .right {
                enterInitiation(hand: .right, timestampMs: timestampMs)
            } else if isLow(lw) && side(lw) == .left {
                enterInitiation(hand: .left, timestampMs: timestampMs)
            }

        case .initiation:
            guard let hand = activeHand else { reset(); return }
            let carrying = (hand == .right) ? rw : lw
            // If the carrying hand lifts back above the hips, the move was aborted.
            if !isLow(carrying) { reset(); return }
            // State 1 → 2: the low carrying wrist crosses the midline to the far side.
            let crossed = (hand == .right)
                ? (carrying.x < midlineX - crossHysteresis)
                : (carrying.x > midlineX + crossHysteresis)
            if crossed {
                passPoint = (carrying.x, carrying.y)
                state = .cross
            }

        case .cross:
            guard let hand = activeHand, let pass = passPoint else { reset(); return }
            // State 2 → 3: the OPPOSITE wrist drops to meet the (x,y) where the ball
            // was passed. That completes the crossover.
            let receivingHand: Hand = (hand == .right) ? .left : .right
            let receiving = (receivingHand == .right) ? rw : lw
            let dx = receiving.x - pass.x
            let dy = receiving.y - pass.y
            let dist = (dx * dx + dy * dy).squareRoot()
            if isLow(receiving) && dist < completionRadius {
                totalReps += 1
                let duration = max(0, (timestampMs - repStartMs) / 1000.0)
                onRepComplete?(totalReps, duration)
                // Reset to State 1: the ball now lives in the receiving hand, already
                // low on the opposite side — ready for the next crossover.
                enterInitiation(hand: receivingHand, timestampMs: timestampMs)
            }
        }
    }

    private func enterInitiation(hand: Hand, timestampMs: Double) {
        activeHand = hand
        passPoint = nil
        repStartMs = timestampMs
        state = .initiation
    }
}
