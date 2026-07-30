import Capacitor
import EventKit
import UIKit

@objc(DeedsApplePlugin)
public class DeedsApplePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeedsApplePlugin"
    public let jsName = "DeedsApple"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestCalendarAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readCalendar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    private let store = EKEventStore()

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(state())
    }

    @objc func requestCalendarAccess(_ call: CAPPluginCall) {
        let completion: (Bool, Error?) -> Void = { granted, error in
            DispatchQueue.main.async {
                call.resolve(self.state(
                    authorized: granted,
                    message: granted
                        ? "Apple Calendar is connected. Calendars already linked to this device, including iCloud, are available."
                        : error?.localizedDescription ?? "Calendar access was not granted."
                ))
            }
        }

        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents(completion: completion)
        } else {
            store.requestAccess(to: .event, completion: completion)
        }
    }

    @objc func readCalendar(_ call: CAPPluginCall) {
        guard isAuthorized else {
            call.resolve(state(message: "Connect Apple Calendar before refreshing events.", events: []))
            return
        }
        guard
            let startValue = call.getString("start"),
            let endValue = call.getString("end"),
            let start = Self.dayFormatter.date(from: startValue),
            let endDay = Self.dayFormatter.date(from: endValue),
            let end = Calendar.current.date(byAdding: .day, value: 1, to: endDay)
        else {
            call.reject("A valid calendar date range is required.")
            return
        }

        let predicate = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        let events = store.events(matching: predicate).map { event -> [String: Any] in
            let startValue = event.isAllDay
                ? Self.dayFormatter.string(from: event.startDate)
                : Self.isoFormatter.string(from: event.startDate)
            let endValue = event.isAllDay
                ? Self.dayFormatter.string(from: event.endDate)
                : Self.isoFormatter.string(from: event.endDate)
            return [
                "id": event.eventIdentifier ?? UUID().uuidString,
                "summary": event.title?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
                    ? event.title!
                    : "Untitled event",
                "start": startValue,
                "end": endValue,
                "htmlLink": "calshow:\(event.startDate.timeIntervalSinceReferenceDate)",
                "calendar": event.calendar.title,
                "allDay": event.isAllDay
            ]
        }

        call.resolve(state(
            authorized: true,
            message: "Apple Calendar refreshed.",
            events: events
        ))
    }

    @objc func openSettings(_ call: CAPPluginCall) {
        guard let url = URL(string: UIApplication.openSettingsURLString) else {
            call.resolve()
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url) { _ in call.resolve() }
        }
    }

    private var isAuthorized: Bool {
        let status = EKEventStore.authorizationStatus(for: .event)
        if #available(iOS 17.0, *) {
            return status == .fullAccess
        }
        return status == .authorized
    }

    private func state(
        authorized: Bool? = nil,
        message: String? = nil,
        events: [[String: Any]]? = nil
    ) -> [String: Any] {
        var result: [String: Any] = [
            "provider": "Apple iCloud",
            "available": true,
            "authorized": authorized ?? isAuthorized
        ]
        if let message = message { result["message"] = message }
        if let events = events { result["events"] = events }
        return result
    }

    private static let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
