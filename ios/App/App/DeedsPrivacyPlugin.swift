import Capacitor
import LocalAuthentication
import Security

@objc(DeedsPrivacyPlugin)
public class DeedsPrivacyPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeedsPrivacyPlugin"
    public let jsName = "DeedsPrivacy"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "secureSet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "secureGet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "secureRemove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "queueCapture", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "nextCapture", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "acknowledgeCapture", returnType: CAPPluginReturnPromise)
    ]

    private let enabledKey = "deeds.privacyLockEnabled"
    private let captureQueueKey = "offline_capture_queue"
    private let keychainService = "com.stottly.deeds.secure"
    private let maximumCaptureCount = 50

    @objc func status(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
        call.resolve([
            "available": available,
            "enabled": UserDefaults.standard.bool(forKey: enabledKey),
            "biometricType": biometricName(context.biometryType)
        ])
    }

    @objc func setEnabled(_ call: CAPPluginCall) {
        let enabled = call.getBool("enabled") ?? false
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)

        guard !enabled || available else {
            call.reject(error?.localizedDescription ?? "Device authentication is not available.")
            return
        }

        UserDefaults.standard.set(enabled, forKey: enabledKey)
        call.resolve([
            "available": available,
            "enabled": enabled,
            "biometricType": biometricName(context.biometryType)
        ])
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        context.localizedCancelTitle = "Not now"
        let reason = call.getString("reason") ?? "Unlock your private D.E.E.D.S. information"
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            call.reject(error?.localizedDescription ?? "Device authentication is not available.")
            return
        }

        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, evaluationError in
            DispatchQueue.main.async {
                if success {
                    call.resolve(["authenticated": true])
                } else {
                    call.reject(evaluationError?.localizedDescription ?? "Authentication was not completed.")
                }
            }
        }
    }

    @objc func secureSet(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("A storage key is required.")
            return
        }
        guard setSecureValue(call.getString("value") ?? "", for: key) else {
            call.reject("Secure device storage is unavailable.")
            return
        }
        call.resolve()
    }

    @objc func secureGet(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("A storage key is required.")
            return
        }
        call.resolve(["value": (secureValue(for: key) as Any?) ?? NSNull()])
    }

    @objc func secureRemove(_ call: CAPPluginCall) {
        if let key = call.getString("key"), !key.isEmpty {
            removeSecureValue(for: key)
        }
        call.resolve()
    }

    @objc func queueCapture(_ call: CAPPluginCall) {
        guard let text = call.getString("text")?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty else {
            call.reject("Capture text is required.")
            return
        }
        var queue = captureQueue()
        queue.append([
            "queueId": UUID().uuidString,
            "kind": normalizedKind(call.getString("kind")),
            "text": text,
            "createdAt": ISO8601DateFormatter().string(from: Date())
        ])
        if queue.count > maximumCaptureCount {
            queue.removeFirst(queue.count - maximumCaptureCount)
        }
        saveCaptureQueue(queue)
        call.resolve(["pending": queue.count])
    }

    @objc func nextCapture(_ call: CAPPluginCall) {
        let queue = captureQueue()
        call.resolve([
            "pending": queue.count,
            "capture": queue.first as Any
        ])
    }

    @objc func acknowledgeCapture(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        let queue = captureQueue().filter { ($0["queueId"] as? String) != id }
        saveCaptureQueue(queue)
        call.resolve(["pending": queue.count])
    }

    private func biometricName(_ type: LABiometryType) -> String {
        if type == .faceID {
            return "Face ID"
        }
        if type == .touchID {
            return "Touch ID"
        }
        if #available(iOS 17.0, *), type == .opticID {
            return "Optic ID"
        }
        return "Device authentication"
    }

    private func normalizedKind(_ kind: String?) -> String {
        return kind == "Journal" || kind == "Note" ? kind! : "Task"
    }

    private func captureQueue() -> [[String: Any]] {
        guard
            let raw = secureValue(for: captureQueueKey),
            let data = raw.data(using: .utf8),
            let queue = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else { return [] }
        return queue
    }

    private func saveCaptureQueue(_ queue: [[String: Any]]) {
        guard
            let data = try? JSONSerialization.data(withJSONObject: queue),
            let raw = String(data: data, encoding: .utf8)
        else { return }
        _ = setSecureValue(raw, for: captureQueueKey)
    }

    private func secureValue(for key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func setSecureValue(_ value: String, for key: String) -> Bool {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key
        ]
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            return SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil) == errSecSuccess
        }
        return status == errSecSuccess
    }

    private func removeSecureValue(for key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
