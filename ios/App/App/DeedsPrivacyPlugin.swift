import Capacitor
import LocalAuthentication

@objc(DeedsPrivacyPlugin)
public class DeedsPrivacyPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeedsPrivacyPlugin"
    public let jsName = "DeedsPrivacy"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    private let enabledKey = "deeds.privacyLockEnabled"

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
}
