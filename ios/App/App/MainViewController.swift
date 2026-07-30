import Capacitor
import UIKit

final class MainViewController: CAPBridgeViewController {
    private let deedsBackground = UIColor(
        red: 14.0 / 255.0,
        green: 32.0 / 255.0,
        blue: 25.0 / 255.0,
        alpha: 1
    )

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = deedsBackground
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .lightContent
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(DeedsPrivacyPlugin())
        bridge?.registerPluginInstance(DeedsHealthPlugin())
        bridge?.registerPluginInstance(DeedsApplePlugin())
        bridge?.webView?.isOpaque = false
        bridge?.webView?.backgroundColor = deedsBackground
        bridge?.webView?.scrollView.backgroundColor = deedsBackground
        bridge?.webView?.scrollView.contentInsetAdjustmentBehavior = .never
    }
}
