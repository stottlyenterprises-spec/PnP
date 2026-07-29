import AppIntents
import Foundation

@available(iOS 16.0, *)
struct AddDeedsTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Add a D.E.E.D.S. Task"
    static var description = IntentDescription("Dictate a task, review it in D.E.E.D.S., then choose where it belongs.")
    static var openAppWhenRun = true

    @Parameter(title: "Task")
    var task: String

    static var parameterSummary: some ParameterSummary {
        Summary("Add \(\.$task) to D.E.E.D.S.")
    }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let text = task.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else {
            return .result(dialog: "Tell me what task you want to add.")
        }

        UserDefaults.standard.set(text, forKey: DeedsNativeCapture.pendingTaskKey)
        return .result(dialog: "Opening D.E.E.D.S. so you can review the task.")
    }
}

@available(iOS 16.0, *)
struct DeedsAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddDeedsTaskIntent(),
            phrases: [
                "Add a task to \(.applicationName)",
                "Create a task in \(.applicationName)",
                "Tell \(.applicationName) to add a task"
            ],
            shortTitle: "Add D.E.E.D.S. Task",
            systemImageName: "checklist"
        )
    }
}

enum DeedsNativeCapture {
    static let pendingTaskKey = "deeds.pendingVoiceTask"
}
