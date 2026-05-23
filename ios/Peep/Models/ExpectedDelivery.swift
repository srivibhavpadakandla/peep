import Foundation

struct ExpectedDelivery: Identifiable, Hashable {
    let id: UUID
    let orderID: String
    let item: String
    var received: Bool

    init(id: UUID = UUID(), orderID: String, item: String, received: Bool = false) {
        self.id = id
        self.orderID = orderID
        self.item = item
        self.received = received
    }
}
