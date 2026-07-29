import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        routePendingVoiceTask()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    private func routePendingVoiceTask(attempt: Int = 0) {
        guard let task = UserDefaults.standard.string(forKey: DeedsNativeCapture.pendingTaskKey),
              !task.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return
        }

        guard let bridgeController = window?.rootViewController as? CAPBridgeViewController,
              let webView = bridgeController.bridge?.webView else {
            if attempt < 8 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    self.routePendingVoiceTask(attempt: attempt + 1)
                }
            }
            return
        }

        var components = URLComponents(string: "https://p-n-p.vercel.app/")
        components?.queryItems = [
            URLQueryItem(name: "capture", value: "Task"),
            URLQueryItem(name: "text", value: task),
            URLQueryItem(name: "source", value: "siri")
        ]
        guard let url = components?.url else {
            return
        }

        UserDefaults.standard.removeObject(forKey: DeedsNativeCapture.pendingTaskKey)
        webView.load(URLRequest(url: url))
    }

}
