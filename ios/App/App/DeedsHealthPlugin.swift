import Capacitor
import HealthKit
import UIKit

@objc(DeedsHealthPlugin)
public class DeedsHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeedsHealthPlugin"
    public let jsName = "DeedsHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readRecent", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()
    private let requestedKey = "deeds.healthkit.requested"

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleep)
        }
        if let weight = HKObjectType.quantityType(forIdentifier: .bodyMass) {
            types.insert(weight)
        }
        return types
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(state())
    }

    @objc func requestAccess(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(state(message: "Apple Health is not available on this device."))
            return
        }
        store.requestAuthorization(toShare: [], read: readTypes) { success, error in
            if success {
                UserDefaults.standard.set(true, forKey: self.requestedKey)
            }
            DispatchQueue.main.async {
                call.resolve(self.state(
                    authorized: success,
                    message: success
                        ? "Apple Health access is ready."
                        : error?.localizedDescription ?? "Apple Health access was not granted."
                ))
            }
        }
    }

    @objc func readRecent(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(state(message: "Apple Health is not available on this device.", days: []))
            return
        }
        let requestedDays = max(1, min(30, call.getInt("days") ?? 14))
        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -requestedDays, to: end) ?? end
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictEndDate)
        let group = DispatchGroup()
        var sleepSamples: [HKCategorySample] = []
        var weightSamples: [HKQuantitySample] = []
        var queryError: Error?

        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            store.execute(HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: true)]
            ) { _, samples, error in
                sleepSamples = samples as? [HKCategorySample] ?? []
                queryError = queryError ?? error
                group.leave()
            })
        }

        if let weightType = HKObjectType.quantityType(forIdentifier: .bodyMass) {
            group.enter()
            store.execute(HKSampleQuery(
                sampleType: weightType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: true)]
            ) { _, samples, error in
                weightSamples = samples as? [HKQuantitySample] ?? []
                queryError = queryError ?? error
                group.leave()
            })
        }

        group.notify(queue: .main) {
            if let error = queryError {
                call.reject(error.localizedDescription)
                return
            }
            UserDefaults.standard.set(true, forKey: self.requestedKey)
            call.resolve(self.state(
                authorized: true,
                message: "Apple Health refreshed.",
                days: self.dailyResults(sleep: sleepSamples, weight: weightSamples)
            ))
        }
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

    private func state(
        authorized: Bool? = nil,
        message: String? = nil,
        days: [[String: Any]]? = nil
    ) -> [String: Any] {
        var result: [String: Any] = [
            "provider": "Apple Health",
            "available": HKHealthStore.isHealthDataAvailable(),
            "authorized": authorized ?? UserDefaults.standard.bool(forKey: requestedKey)
        ]
        if let message = message { result["message"] = message }
        if let days = days { result["days"] = days }
        return result
    }

    private func dailyResults(
        sleep: [HKCategorySample],
        weight: [HKQuantitySample]
    ) -> [[String: Any]] {
        let formatter = DateFormatter()
        formatter.calendar = .current
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"

        var sleepByDayAndSource: [String: [DateInterval]] = [:]
        for sample in sleep where isAsleep(sample.value) {
            let date = formatter.string(from: sample.endDate)
            let source = sample.sourceRevision.source.name
            sleepByDayAndSource["\(date)|\(source)", default: []].append(
                DateInterval(start: sample.startDate, end: sample.endDate)
            )
        }

        var bestSleep: [String: (hours: Double, source: String)] = [:]
        for (key, intervals) in sleepByDayAndSource {
            let parts = key.split(separator: "|", maxSplits: 1).map(String.init)
            guard parts.count == 2 else { continue }
            let hours = mergedDuration(intervals) / 3600
            if hours > (bestSleep[parts[0]]?.hours ?? 0) {
                bestSleep[parts[0]] = (hours, parts[1])
            }
        }

        var latestWeight: [String: (pounds: Double, source: String, date: Date)] = [:]
        let pounds = HKUnit.pound()
        for sample in weight {
            let date = formatter.string(from: sample.endDate)
            if sample.endDate > (latestWeight[date]?.date ?? .distantPast) {
                latestWeight[date] = (
                    sample.quantity.doubleValue(for: pounds),
                    sample.sourceRevision.source.name,
                    sample.endDate
                )
            }
        }

        return Set(bestSleep.keys).union(latestWeight.keys).sorted().map { date in
            var day: [String: Any] = ["date": date]
            if let value = bestSleep[date], value.hours > 0 {
                day["sleepHours"] = value.hours
                day["sleepSource"] = "Apple Health"
                day["sleepDeviceSource"] = value.source
            }
            if let value = latestWeight[date], value.pounds > 0 {
                day["weightPounds"] = value.pounds
                day["weightSource"] = "Apple Health"
                day["weightDeviceSource"] = value.source
            }
            return day
        }
    }

    private func isAsleep(_ value: Int) -> Bool {
        if value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue { return true }
        if #available(iOS 16.0, *) {
            return value == HKCategoryValueSleepAnalysis.asleepCore.rawValue
                || value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue
                || value == HKCategoryValueSleepAnalysis.asleepREM.rawValue
        }
        return false
    }

    private func mergedDuration(_ intervals: [DateInterval]) -> TimeInterval {
        let sorted = intervals.sorted { $0.start < $1.start }
        guard var current = sorted.first else { return 0 }
        var total: TimeInterval = 0
        for interval in sorted.dropFirst() {
            if interval.start <= current.end {
                current = DateInterval(start: current.start, end: max(current.end, interval.end))
            } else {
                total += current.duration
                current = interval
            }
        }
        return total + current.duration
    }
}
