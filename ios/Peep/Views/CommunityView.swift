import SwiftUI

/// Community — neighborhood feed. Header strip with neighborhood stats,
/// filter chips, then a calm feed of post cards. Each card shows the author,
/// time, body, an optional Peep-verified strip when the post came from a
/// camera event, and a row of reactions + comments.
struct CommunityView: View {
    @State private var filter: Filter = .all

    enum Filter: String, CaseIterable {
        case all, alerts, discussion, lost

        var label: String {
            switch self {
            case .all:        return "All"
            case .alerts:     return "Alerts"
            case .discussion: return "Discussion"
            case .lost:       return "Lost & Found"
            }
        }
    }

    private var filteredPosts: [CommunityPost] {
        switch filter {
        case .all:        return CommunitySeed.posts
        case .alerts:     return CommunitySeed.posts.filter { $0.kind == .alert }
        case .discussion: return CommunitySeed.posts.filter { $0.kind == .discussion }
        case .lost:       return CommunitySeed.posts.filter { $0.kind == .lost }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.peepBg.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Title
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Community")
                                .font(.system(size: 28, weight: .medium))
                                .foregroundStyle(Color.peepText)
                            Text("\(CommunitySeed.neighborhoodName) · \(CommunitySeed.neighborCount) neighbors · \(CommunitySeed.peepCameraCount) Peep cameras")
                                .font(.system(size: 13))
                                .foregroundStyle(Color.peepTextSec)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 8)

                        // Filter chips
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Filter.allCases, id: \.self) { f in
                                    FilterChip(label: f.label, active: filter == f) { filter = f }
                                }
                            }
                            .padding(.horizontal, 20)
                        }

                        // Feed
                        VStack(spacing: 12) {
                            ForEach(filteredPosts) { post in
                                PostCard(post: post)
                            }
                        }
                        .padding(.horizontal, 16)

                        Spacer(minLength: 100)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}

// ───── Filter chip ───────────────────────────────────────────────
private struct FilterChip: View {
    let label: String
    let active: Bool
    let tap: () -> Void

    var body: some View {
        Button(action: tap) {
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(active ? Color.peepBg : Color.peepText)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(
                    Capsule().fill(active ? Color.peepText : Color.peepSurface)
                )
                .overlay(
                    Capsule().strokeBorder(Color.peepSep, lineWidth: active ? 0 : 0.5)
                )
        }
        .buttonStyle(.plain)
    }
}

// ───── Post card ─────────────────────────────────────────────────
private struct PostCard: View {
    let post: CommunityPost
    @State private var reactedTo: String? = nil
    @State private var commentCount: Int

    init(post: CommunityPost) {
        self.post = post
        self._reactedTo = State(initialValue: post.myReaction)
        self._commentCount = State(initialValue: post.commentCount)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Author row
            HStack(alignment: .center, spacing: 12) {
                Avatar(initials: post.author.initials, color: post.author.avatarColor)
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(post.author.name)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.peepText)
                        if post.sharedByPeep {
                            Text("Verified")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Color.peepAccent)
                        }
                    }
                    Text("\(post.author.distance) · \(post.time)")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.peepTextSec)
                }
                Spacer()
            }

            // Body
            Text(post.body)
                .font(.system(size: 15))
                .foregroundStyle(Color.peepText)
                .fixedSize(horizontal: false, vertical: true)

            // Peep-verified strip (only if came from a camera event)
            if let eventType = post.eventType, let conf = post.confidence {
                HStack(spacing: 8) {
                    Text("\(eventType.label) · \(Int((conf * 100).rounded()))% confidence")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.peepTextSec)
                    if post.corroborations > 1 {
                        Text("·")
                            .foregroundStyle(Color.peepTextTer)
                        Text("\(post.corroborations) cameras corroborate")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color.peepAccent)
                    }
                }
            }

            Divider().background(Color.peepSep)

            // Reactions + comments
            HStack(spacing: 16) {
                ForEach(post.reactions, id: \.name) { r in
                    Button {
                        reactedTo = (reactedTo == r.name) ? nil : r.name
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: r.sfSymbol)
                                .font(.system(size: 13, weight: .medium))
                            Text("\(r.count + (reactedTo == r.name ? 1 : 0))")
                                .font(.system(size: 13, weight: .medium))
                        }
                        .foregroundStyle(reactedTo == r.name ? Color.peepAccent : Color.peepTextSec)
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
                Button {
                    // would open comments sheet — leave for follow-up
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "bubble.left")
                            .font(.system(size: 13, weight: .medium))
                        Text("\(commentCount)")
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundStyle(Color.peepTextSec)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.peepSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color.peepSep, lineWidth: 0.5)
        )
    }
}

// ───── Avatar ────────────────────────────────────────────────────
private struct Avatar: View {
    let initials: String
    let color: Color

    var body: some View {
        ZStack {
            Circle().fill(color.opacity(0.18))
            Text(initials)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(color)
        }
        .frame(width: 36, height: 36)
        .overlay(Circle().strokeBorder(Color.peepSep, lineWidth: 0.5))
    }
}

#Preview {
    CommunityView()
        .preferredColorScheme(.light)
}
