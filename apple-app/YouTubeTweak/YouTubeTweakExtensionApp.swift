import Foundation
import SwiftUI
import SafariServices

#if os(macOS)
import AppKit
#elseif os(iOS)
import UIKit
#endif

private let safariExtensionIdentifier = "me.dark495.yttweak.Extension"
private let appVersion = "1.1.9"
private let buildNumber = "1109"

private enum L10n {
    private static let supportedLanguages = [
        "ar-SA",
        "bn-BD",
        "de-DE",
        "en-US",
        "es-ES",
        "fa-IR",
        "fr-FR",
        "hi-IN",
        "id-ID",
        "it-IT",
        "ja-JP",
        "ko-KR",
        "mr-IN",
        "ms-MY",
        "pa-PK",
        "pt-BR",
        "ru-RU",
        "ta-IN",
        "te-IN",
        "th-TH",
        "tr-TR",
        "uk-UA",
        "vi-VN",
        "zh-CN",
        "zh-TW",
    ]

    static let defaultLanguageCode = preferredLanguageCode()
    static let languageOptions = supportedLanguages.map { (code: $0, title: $0) }

    private static let fallbackLanguage = "zh-CN"
    private static let bundledStrings = Dictionary(
        uniqueKeysWithValues: supportedLanguages.compactMap { language -> (String, [String: String])? in
            guard let strings = loadStrings(for: language) else { return nil }
            return (language, strings)
        }
    )
    private static let fallbackStrings = bundledStrings[fallbackLanguage] ?? [:]

    static func t(_ key: String, language: String? = nil) -> String {
        let language = language ?? defaultLanguageCode
        return bundledStrings[language]?[key] ?? fallbackStrings[key] ?? key
    }

    static func format(_ key: String, language: String? = nil, _ arguments: CVarArg...) -> String {
        String(format: t(key, language: language), arguments: arguments)
    }

    private static func loadStrings(for language: String) -> [String: String]? {
        guard let url = Bundle.main.url(
            forResource: language,
            withExtension: "json",
            subdirectory: "assets/i18n"
        ) else {
            return nil
        }

        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([String: String].self, from: data)
        } catch {
            NSLog("Failed to load app localization %@: %@", language, error.localizedDescription)
            return nil
        }
    }

    private static func preferredLanguageCode() -> String {
        for rawLanguage in Locale.preferredLanguages {
            let normalized = rawLanguage.replacingOccurrences(of: "_", with: "-")

            if supportedLanguages.contains(normalized) {
                return normalized
            }

            if normalized.hasPrefix("zh-Hant") || normalized.hasPrefix("zh-TW") || normalized.hasPrefix("zh-HK") {
                return "zh-TW"
            }

            if normalized.hasPrefix("zh-Hans") || normalized.hasPrefix("zh-CN") {
                return "zh-CN"
            }

            let languageCode = normalized.split(separator: "-").first.map(String.init) ?? normalized
            if languageCode == "zh" {
                return "zh-CN"
            }

            if languageCode == "pt" {
                return "pt-BR"
            }

            if let matchedLanguage = supportedLanguages.first(where: { $0.hasPrefix("\(languageCode)-") }) {
                return matchedLanguage
            }
        }

        return fallbackLanguage
    }
}

@main
struct YouTubeTweakExtensionApp: App {
    #if os(macOS)
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    #endif

    var body: some Scene {
        WindowGroup {
            YouTubeTweakHomeView()
        }
    }
}

#if os(macOS)
private final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        if let image = bundleIconImage {
            NSApplication.shared.applicationIconImage = image
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    private var bundleIconImage: NSImage? {
        let iconNames = ["CFBundleIconFile", "CFBundleIconName"]
            .compactMap { Bundle.main.object(forInfoDictionaryKey: $0) as? String }

        for iconName in iconNames {
            let resourceName = iconName.hasSuffix(".icns")
                ? String(iconName.dropLast(5))
                : iconName

            if let iconURL = Bundle.main.url(forResource: resourceName, withExtension: "icns"),
               let image = NSImage(contentsOf: iconURL) {
                return image
            }
        }

        return NSImage(named: NSImage.applicationIconName)
    }
}
#endif

private struct YouTubeTweakHomeView: View {
    @Environment(\.openURL) private var openURL
    @State private var statusText: String?
    @State private var isOpeningSafari = false
    #if DEBUG
    @State private var selectedLanguageCode = L10n.defaultLanguageCode
    #endif

    var body: some View {
        content
            #if DEBUG
            .overlay(alignment: .topTrailing) {
                DebugLanguagePicker(selectedLanguageCode: $selectedLanguageCode)
                    .padding(12)
            }
            #endif
    }

    @ViewBuilder
    private var content: some View {
        #if os(macOS)
        MacInstallView(
            statusText: statusText,
            isOpeningSafari: isOpeningSafari,
            languageCode: activeLanguageCode,
            openSafariExtensionSettings: openSafariExtensionSettings
        )
        #else
        IOSInstallView(
            statusText: statusText,
            isOpeningSafari: isOpeningSafari,
            languageCode: activeLanguageCode,
            openSafariExtensionSettings: openSafariExtensionSettings
        )
        #endif
    }

    private var activeLanguageCode: String? {
        #if DEBUG
        selectedLanguageCode
        #else
        nil
        #endif
    }

    private func openSafariExtensionSettings() {
        isOpeningSafari = true
        statusText = nil

        #if os(macOS)
        SFSafariApplication.showPreferencesForExtension(withIdentifier: safariExtensionIdentifier) { error in
            DispatchQueue.main.async {
                isOpeningSafari = false

                if let error {
                    NSLog("Failed to open Safari extension preferences: %@", error.localizedDescription)
                    statusText = L10n.format(
                        "status.openSafariPreferencesFailed",
                        language: activeLanguageCode,
                        error.localizedDescription
                    )
                } else {
                    NSApplication.shared.terminate(nil)
                }
            }
        }
        #else
        if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
            openURL(settingsURL)
        }
        isOpeningSafari = false
        statusText = L10n.t("status.openIOSSettings", language: activeLanguageCode)
        #endif
    }
}

#if DEBUG
private struct DebugLanguagePicker: View {
    @Binding var selectedLanguageCode: String

    var body: some View {
        Picker("Language", selection: $selectedLanguageCode) {
            ForEach(L10n.languageOptions, id: \.code) { language in
                Text(language.title)
                    .tag(language.code)
            }
        }
        .labelsHidden()
        .pickerStyle(.menu)
        .controlSize(.small)
        .frame(width: 104)
        .background(
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(Color.white.opacity(0.92))
        )
        .accessibilityLabel("Language")
    }
}
#endif

#if os(macOS)
private struct MacInstallView: View {
    let statusText: String?
    let isOpeningSafari: Bool
    let languageCode: String?
    let openSafariExtensionSettings: () -> Void

    var body: some View {
        HStack(spacing: 38) {
            ExtensionIconView(size: 132, cornerRadius: 24)

            VStack(alignment: .leading, spacing: 18) {
                Text("YouTubeTweak")
                    .font(.system(size: 30, weight: .semibold))

                VStack(alignment: .leading, spacing: 8) {
                    Text(L10n.t("mac.instruction.enable", language: languageCode))
                    Text(L10n.t("mac.instruction.authorize", language: languageCode))
                    Text(L10n.t("mac.instruction.help", language: languageCode))
                }
                .font(.system(size: 15))
                .foregroundStyle(Color(red: 0.42, green: 0.42, blue: 0.42))
                .lineSpacing(4)

                Button(L10n.t("button.enableExtension", language: languageCode)) {
                    openSafariExtensionSettings()
                }
                .buttonStyle(InstallButtonStyle())
                .disabled(isOpeningSafari)
                .frame(width: 320)
                .padding(.top, 4)

                UnderlinedTextButton(L10n.t("button.openExtensionSettings", language: languageCode)) {
                    openSafariExtensionSettings()
                }
                .disabled(isOpeningSafari)

                if let statusText {
                    Text(statusText)
                        .font(.system(size: 12))
                        .foregroundStyle(.red)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 0)

                FooterLinksView(languageCode: languageCode)

                Text("YouTubeTweak V\(appVersion)(\(buildNumber))")
                    .font(.system(size: 14))
                    .foregroundStyle(Color(red: 0.46, green: 0.46, blue: 0.46))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 52)
        .padding(.vertical, 42)
        .frame(width: 760, height: 420)
        .background(Color.white)
        .background(WindowConfigurator())
    }
}
#endif

#if os(iOS)
private struct IOSInstallView: View {
    let statusText: String?
    let isOpeningSafari: Bool
    let languageCode: String?
    let openSafariExtensionSettings: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 180)

            ExtensionIconView(size: 128, cornerRadius: 22)
                .padding(.bottom, 74)

            Button(L10n.t("button.enableExtension", language: languageCode)) {
                openSafariExtensionSettings()
            }
            .buttonStyle(InstallButtonStyle())
            .disabled(isOpeningSafari)
            .padding(.horizontal, 34)
            .padding(.bottom, 36)

            VStack(spacing: 8) {
                Text(L10n.t("ios.instruction.enable", language: languageCode))
                Text(L10n.t("ios.instruction.authorize", language: languageCode))
                Text(L10n.t("ios.instruction.help", language: languageCode))
            }
            .font(.system(size: 16, weight: .regular))
            .foregroundStyle(Color(red: 0.46, green: 0.46, blue: 0.46))
            .lineSpacing(4)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 34)
            .padding(.bottom, 42)

            UnderlinedTextButton(L10n.t("button.openExtensionSettings", language: languageCode)) {
                openSafariExtensionSettings()
            }
            .disabled(isOpeningSafari)

            if let statusText {
                Text(statusText)
                    .font(.system(size: 12))
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 34)
                    .padding(.top, 18)
            }

            Spacer(minLength: 0)

            FooterLinksView(languageCode: languageCode)
                .padding(.bottom, 22)

            Text("YouTubeTweak V\(appVersion)(\(buildNumber))")
                .font(.system(size: 16))
                .foregroundStyle(Color(red: 0.46, green: 0.46, blue: 0.46))
                .padding(.bottom, 70)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.white)
    }
}
#endif

private struct ExtensionIconView: View {
    let size: CGFloat
    let cornerRadius: CGFloat

    var body: some View {
        Group {
            #if os(macOS)
            if let image = extensionIconImage {
                Image(nsImage: image)
                    .resizable()
                    .interpolation(.high)
                    .scaledToFit()
            } else {
                fallbackIcon
            }
            #else
            if let image = extensionIconImage {
                Image(uiImage: image)
                    .resizable()
                    .interpolation(.high)
                    .scaledToFit()
            } else {
                fallbackIcon
            }
            #endif
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }

    private var fallbackIcon: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Color(red: 0.91, green: 0.29, blue: 0.55))
    }

    #if os(macOS)
    private var extensionIconImage: NSImage? {
        ExtensionIconSource.nsImage
    }
    #else
    private var extensionIconImage: UIImage? {
        ExtensionIconSource.uiImage
    }
    #endif
}

private enum ExtensionIconSource {
    #if os(macOS)
    static var nsImage: NSImage? {
        for iconURL in iconURLs {
            if let image = NSImage(contentsOf: iconURL) {
                return image
            }
        }

        return NSImage(named: NSImage.applicationIconName)
    }
    #elseif os(iOS)
    static var uiImage: UIImage? {
        for iconURL in iconURLs {
            if let image = UIImage(contentsOfFile: iconURL.path) {
                return image
            }
        }

        return nil
    }
    #endif

    private static var iconURLs: [URL] {
        [
            bundledExtensionIconURL,
            outputIconURL,
        ].compactMap { $0 }
    }

    private static var outputIconURL: URL? {
        guard let iconsDirectory = outputIconsDirectory else { return nil }
        return preferredIconURL(in: iconsDirectory)
    }

    private static var outputIconsDirectory: URL? {
        let outputName: String
        #if DEBUG
        outputName = "safari-mv2-dev"
        #else
        outputName = "safari-mv2"
        #endif

        for projectRoot in localProjectRootCandidates {
            let iconsDirectory = projectRoot
                .appendingPathComponent(".output", isDirectory: true)
                .appendingPathComponent(outputName, isDirectory: true)
                .appendingPathComponent("icons", isDirectory: true)

            if FileManager.default.fileExists(atPath: iconsDirectory.path) {
                return iconsDirectory
            }
        }

        return nil
    }

    private static var bundledExtensionIconURL: URL? {
        guard let plugInsURL = Bundle.main.builtInPlugInsURL else { return nil }
        let extensionURL = plugInsURL.appendingPathComponent("YouTubeTweakExtension.appex")
        guard let iconsDirectory = Bundle(url: extensionURL)?
            .resourceURL?
            .appendingPathComponent("icons", isDirectory: true)
        else {
            return nil
        }

        return preferredIconURL(in: iconsDirectory)
    }

    private static var localProjectRootCandidates: [URL] {
        var roots: [URL] = []
        let startURLs = [
            URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true),
            Bundle.main.executableURL,
            Bundle.main.bundleURL,
            Bundle.main.resourceURL,
        ].compactMap { $0 }

        for startURL in startURLs {
            var currentURL = startURL

            for _ in 0..<12 {
                if currentURL.lastPathComponent == "apple-app" {
                    roots.append(currentURL.deletingLastPathComponent())
                    break
                }

                let parentURL = currentURL.deletingLastPathComponent()
                if parentURL.path == currentURL.path {
                    break
                }
                currentURL = parentURL
            }
        }

        return roots.reduce(into: []) { uniqueRoots, root in
            if !uniqueRoots.contains(where: { $0.standardizedFileURL == root.standardizedFileURL }) {
                uniqueRoots.append(root)
            }
        }
    }

    private static func preferredIconURL(in iconsDirectory: URL) -> URL? {
        for iconSize in ["1024", "512", "256", "128", "64", "48", "32", "16"] {
            let url = iconsDirectory.appendingPathComponent("\(iconSize).png")
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
        }

        return nil
    }
}

#if os(macOS)
private struct WindowConfigurator: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async {
            configure(window: view.window)
        }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        DispatchQueue.main.async {
            configure(window: nsView.window)
        }
    }

    private func configure(window: NSWindow?) {
        guard let window else { return }

        let contentSize = NSSize(width: 760, height: 420)
        window.title = "YouTubeTweak"
        window.contentMinSize = contentSize
        window.contentMaxSize = contentSize
        window.setContentSize(contentSize)
        window.center()
    }
}
#endif

private struct InstallButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(Color(red: 0.12, green: 0.12, blue: 0.12))
            .frame(maxWidth: .infinity, minHeight: 36)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(Color(red: 0.98, green: 0.985, blue: 0.99))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .stroke(Color(red: 0.86, green: 0.86, blue: 0.86), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.72 : 1)
    }
}

private struct UnderlinedTextButton: View {
    let title: String
    let action: () -> Void

    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .underline()
                .foregroundStyle(Color(red: 0.38, green: 0.38, blue: 0.38))
        }
        .buttonStyle(.plain)
    }
}

private struct FooterLinksView: View {
    let languageCode: String?

    var body: some View {
        HStack(spacing: 14) {
            FooterLink(L10n.t("footer.github", language: languageCode), url: "https://github.com/xlch88/YouTubeTweak")
            FooterLink(L10n.t("footer.reportIssue", language: languageCode), url: "https://github.com/xlch88/YouTubeTweak/issues")
            FooterLink(L10n.t("footer.functions", language: languageCode), url: "https://github.com/xlch88/YouTubeTweak/blob/main/FUNCTIONS.md")
            FooterLink(L10n.t("footer.changelog", language: languageCode), url: "https://github.com/xlch88/YouTubeTweak/blob/main/CHANGELOG.md")
            FooterLink(L10n.t("footer.website", language: languageCode), url: "https://yttweak.com")
        }
    }
}

private struct FooterLink: View {
    @Environment(\.openURL) private var openURL
    let title: String
    let url: String

    init(_ title: String, url: String) {
        self.title = title
        self.url = url
    }

    var body: some View {
        Button(title) {
            if let url = URL(string: url) {
                openURL(url)
            }
        }
        .buttonStyle(.plain)
        .font(.system(size: 14))
        .foregroundStyle(Color(red: 0.0, green: 0.48, blue: 1.0))
    }
}
