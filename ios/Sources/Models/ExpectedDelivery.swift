import Foundation

struct ExpectedDelivery: Identifiable, Hashable {
    let id: UUID
    let orderID: String
    let item: String
    let carrier: String
    var received: Bool

    init(id: UUID = UUID(),
         orderID: String,
         item: String,
         carrier: String = "Amazon",
         received: Bool = false) {
        self.id = id
        self.orderID = orderID
        self.item = item
        self.carrier = carrier
        self.received = received
    }
}
