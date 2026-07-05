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

@main
struct YouTubeTweakExtensionApp: App {
    var body: some Scene {
        WindowGroup {
            YouTubeTweakHomeView()
        }
    }
}

private struct YouTubeTweakHomeView: View {
    @Environment(\.openURL) private var openURL
    @State private var statusText: String?
    @State private var isOpeningSafari = false

    var body: some View {
        #if os(macOS)
        MacInstallView(
            statusText: statusText,
            isOpeningSafari: isOpeningSafari,
            openSafariExtensionSettings: openSafariExtensionSettings
        )
        #else
        IOSInstallView(
            statusText: statusText,
            isOpeningSafari: isOpeningSafari,
            openSafariExtensionSettings: openSafariExtensionSettings
        )
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
                    statusText = "无法打开 Safari 扩展设置：\(error.localizedDescription)"
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
        statusText = "请在设置中打开 Safari 扩展，并在访问 youtube.com 时按提示授权。"
        #endif
    }
}

#if os(macOS)
private struct MacInstallView: View {
    let statusText: String?
    let isOpeningSafari: Bool
    let openSafariExtensionSettings: () -> Void

    var body: some View {
        HStack(spacing: 38) {
            ExtensionIconView(size: 132, cornerRadius: 24)

            VStack(alignment: .leading, spacing: 18) {
                Text("YouTubeTweak")
                    .font(.system(size: 30, weight: .semibold))

                VStack(alignment: .leading, spacing: 8) {
                    Text("首次安装后，请点击按钮启用本扩展。")
                    Text("随后打开 youtube.com，并根据 Safari 提示授权 youtube.com 域名。")
                    Text("如有疑问，请查看功能说明或报告问题。")
                }
                .font(.system(size: 15))
                .foregroundStyle(Color(red: 0.42, green: 0.42, blue: 0.42))
                .lineSpacing(4)

                Button("启用 YouTubeTweak 扩展") {
                    openSafariExtensionSettings()
                }
                .buttonStyle(InstallButtonStyle())
                .disabled(isOpeningSafari)
                .frame(width: 320)
                .padding(.top, 4)

                UnderlinedTextButton("进入 YouTubeTweak 扩展设置") {
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

                FooterLinksView()

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
    let openSafariExtensionSettings: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 180)

            ExtensionIconView(size: 128, cornerRadius: 22)
                .padding(.bottom, 74)

            Button("启用 YouTubeTweak 扩展") {
                openSafariExtensionSettings()
            }
            .buttonStyle(InstallButtonStyle())
            .disabled(isOpeningSafari)
            .padding(.horizontal, 34)
            .padding(.bottom, 36)

            VStack(spacing: 8) {
                Text("首次安装后，请点击上面的按钮启用本扩展。")
                Text("随后打开 youtube.com，并根据 Safari 提示\n授权 youtube.com 域名。")
                Text("如有疑问，请点击这里，查看视频教程。")
            }
            .font(.system(size: 16, weight: .regular))
            .foregroundStyle(Color(red: 0.46, green: 0.46, blue: 0.46))
            .lineSpacing(4)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 34)
            .padding(.bottom, 42)

            UnderlinedTextButton("进入 YouTubeTweak 扩展设置") {
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

            FooterLinksView()
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
        guard let iconURL else { return nil }
        return NSImage(contentsOf: iconURL)
    }
    #else
    private var extensionIconImage: UIImage? {
        guard let iconURL else { return nil }
        return UIImage(contentsOfFile: iconURL.path)
    }
    #endif

    private var iconURL: URL? {
        guard let plugInsURL = Bundle.main.builtInPlugInsURL else { return nil }
        let extensionURL = plugInsURL.appendingPathComponent("YouTubeTweakExtension.appex")
        return Bundle(url: extensionURL)?
            .url(forResource: "128", withExtension: "png", subdirectory: "icons")
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
    var body: some View {
        HStack(spacing: 14) {
            FooterLink("GitHub", url: "https://github.com/xlch88/YouTubeTweak")
            FooterLink("报告问题", url: "https://github.com/xlch88/YouTubeTweak/issues")
            FooterLink("功能说明", url: "https://yttweak.com/FUNCTIONS.md")
            FooterLink("更新日志", url: "https://yttweak.com/CHANGELOG.md")
            FooterLink("Website", url: "https://yttweak.com")
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
