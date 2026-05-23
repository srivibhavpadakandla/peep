import Foundation
import SwiftUI

/// A neighbor's profile inside a community post.
struct CommunityAuthor: Hashable {
    let name: String
    let initials: String
    let avatarColor: Color
    /// "2 doors down", "around the corner", "3 cameras agreed" — the contextual proximity.
    let distance: String
}

enum CommunityPostKind: String, CaseIterable {
    case alert, discussion, lost

    var filterLabel: String {
        switch self {
        case .alert:      return "Alerts"
        case .discussion: return "Discussion"
        case .lost:       return "Lost & Found"
        }
    }
}

/// One row in the community feed. `sharedByPeep` flags posts that came from a
/// camera event the neighbor explicitly shared (vs. typed manually).
struct CommunityPost: Identifiable, Hashable {
    let id: UUID
    let kind: CommunityPostKind
    let author: CommunityAuthor
    let time: String
    let body: String
    let sharedByPeep: Bool
    let eventType: EventType?
    let confidence: Double?
    /// Map of reaction kind → count, in stable order.
    let reactions: [(name: String, sfSymbol: String, count: Int)]
    let myReaction: String?
    let commentCount: Int
    /// Number of independent Peep cameras that confirmed the same incident.
    let corroborations: Int

    init(id: UUID = UUID(),
         kind: CommunityPostKind,
         author: CommunityAuthor,
         time: String,
         body: String,
         sharedByPeep: Bool = false,
         eventType: EventType? = nil,
         confidence: Double? = nil,
         reactions: [(String, String, Int)] = [],
         myReaction: String? = nil,
         commentCount: Int = 0,
         corroborations: Int = 0) {
        self.id = id
        self.kind = kind
        self.author = author
        self.time = time
        self.body = body
        self.sharedByPeep = sharedByPeep
        self.eventType = eventType
        self.confidence = confidence
        self.reactions = reactions.map { ($0.0, $0.1, $0.2) }
        self.myReaction = myReaction
        self.commentCount = commentCount
        self.corroborations = corroborations
    }

    // Hashable conformance — only id matters since the rest is value content.
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
    static func == (lhs: CommunityPost, rhs: CommunityPost) -> Bool { lhs.id == rhs.id }
}

/// Seed data for the feed — derived from the design prototype's mock posts.
enum CommunitySeed {
    static let neighborhoodName = "West End"
    static let neighborCount = 142
    static let peepCameraCount = 18

    static let posts: [CommunityPost] = [
        CommunityPost(
            kind: .alert,
            author: .init(name: "Anna L.", initials: "AL",
                          avatarColor: Color(red: 0.69, green: 0.52, blue: 0.78),
                          distance: "2 doors down"),
            time: "12 min ago",
            body: "Heads up — looks like the same person who was loitering on my porch yesterday is back on Linden. Peep flagged 8 sec of pacing at 2:08 PM.",
            sharedByPeep: true,
            eventType: .personLoitering,
            confidence: 0.84,
            reactions: [
                ("Saw it",   "eye",                14),
                ("Care",     "heart",              6),
                ("Concerned","exclamationmark.triangle", 3),
            ],
            myReaction: "Saw it",
            commentCount: 7,
            corroborations: 3
        ),
        CommunityPost(
            kind: .alert,
            author: .init(name: "Peep Network", initials: "P",
                          avatarColor: Color.peepAccent,
                          distance: "3 cameras agreed"),
            time: "38 min ago",
            body: "Multi-camera verification: 3 Peep cameras on Linden St between #136–#148 spotted the same individual within 6 minutes.",
            sharedByPeep: true,
            eventType: .multipleLoitering,
            confidence: 0.91,
            reactions: [
                ("Saw it",   "eye",                     22),
                ("Concerned","exclamationmark.triangle", 9),
            ],
            commentCount: 11,
            corroborations: 3
        ),
        CommunityPost(
            kind: .lost,
            author: .init(name: "Jordan T.", initials: "JT",
                          avatarColor: Color(red: 0.69, green: 0.52, blue: 0.78),
                          distance: "4 doors down"),
            time: "2 hr ago",
            body: "Lost: brown tabby cat, answers to Miso. Missing since this morning. Microchipped, green collar.",
            reactions: [
                ("Saw it", "eye",   18),
                ("Care",   "heart", 4),
            ],
            commentCount: 3
        ),
        CommunityPost(
            kind: .discussion,
            author: .init(name: "Brad V.", initials: "BV",
                          avatarColor: Color(red: 0.38, green: 0.55, blue: 0.66),
                          distance: "around the corner"),
            time: "3 hr ago",
            body: "Streetlight at the corner of Linden & 5th is out again. Reported it on 311, ticket #SR-449281.",
            reactions: [
                ("Care",     "heart",     11),
                ("Helpful",  "lightbulb",  4),
            ],
            commentCount: 1
        ),
        CommunityPost(
            kind: .alert,
            author: .init(name: "Sami K.", initials: "SK",
                          avatarColor: Color.severityCritical,
                          distance: "across the street"),
            time: "Yesterday",
            body: "Peep caught a package theft at my front door. Already filed the Amazon refund automatically. Posting in case it was the same person.",
            sharedByPeep: true,
            eventType: .packageTaken,
            confidence: 0.94,
            reactions: [
                ("Saw it",   "eye",                     31),
                ("Care",     "heart",                   12),
                ("Concerned","exclamationmark.triangle", 6),
            ],
            commentCount: 14,
            corroborations: 1
        ),
        CommunityPost(
            kind: .discussion,
            author: .init(name: "Maya J.", initials: "MJ",
                          avatarColor: Color(red: 0.41, green: 0.60, blue: 0.44),
                          distance: "two blocks east"),
            time: "Yesterday",
            body: "Raccoon family hanging out near my garage at 4 AM — Peep correctly flagged as animal, not person. Cute, but knocking over compost bins.",
            sharedByPeep: true,
            eventType: .animalDetected,
            confidence: 0.91,
            reactions: [
                ("Care",     "heart",     8),
                ("Helpful",  "lightbulb", 2),
            ],
            commentCount: 5
        ),
    ]
}
