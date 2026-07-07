import { defineConfig } from "wxt";
import vueDevTools from "vite-plugin-vue-devtools";
import pkg from "./package.json";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import "dotenv/config";

const githubRepositoryUrl = "https://github.com/xlch88/YouTubeTweak";
const localDevDomain = "192.168.233.245.local-dev.yttweak.com";
const localDevCertPath = "build/local-dev.yttweak.com.pem";
const localDevKeyPath = "build/local-dev.yttweak.com.key";
const useLocalDevHttps = process.env.LOCAL_DEV_HTTPS === "1";

if (useLocalDevHttps && (!fs.existsSync(localDevCertPath) || !fs.existsSync(localDevKeyPath))) {
	throw new Error(`Missing local dev certificate. Run npm run cert:local-dev before npm run dev:safari.`);
}

function commandOutput(command: string, args: string[]) {
	try {
		return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
	} catch {
		return "";
	}
}

function normalizeGitRemoteUrl(remoteUrl: string) {
	const trimmedUrl = remoteUrl.trim();
	if (!trimmedUrl) return "";

	const sshMatch = trimmedUrl.match(/^git@github\.com:(.+?)(?:\.git)?$/);
	if (sshMatch) return `https://github.com/${sshMatch[1]}`;

	const httpsMatch = trimmedUrl.match(/^(https:\/\/github\.com\/.+?)(?:\.git)?$/);
	if (httpsMatch) return httpsMatch[1];

	return trimmedUrl.replace(/\.git$/, "");
}

function getBuildInfo() {
	const commitId = commandOutput("git", ["rev-parse", "--short=7", "HEAD"]) || "unknown";
	const repositoryUrl = normalizeGitRemoteUrl(commandOutput("git", ["config", "--get", "remote.origin.url"])) || githubRepositoryUrl;

	return {
		build: new Date().toISOString(),
		commit: {
			id: commitId,
			url: commitId === "unknown" ? repositoryUrl : `${repositoryUrl}/commit/${commitId}`,
		},
	};
}

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: "src",
	modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons"],

	autoIcons: {
		baseIconPath: "assets/img/logo.svg",
		grayscaleOnDevelopment: false,
		sizes: [16, 32, 64, 128, 256, 512, 1024],
	},

	webExt: {
		keepProfileChanges: true,
		chromiumProfile: process.env.CHROME_PROFILE,
		firefoxProfile: process.env.FIREFOX_PROFILE,
		startUrls: ["https://www.youtube.com/watch?v=zczjerfFrSI"],
	},

	dev: {
		server: {
			host: useLocalDevHttps ? "0.0.0.0" : undefined,
			origin: useLocalDevHttps ? `https://${localDevDomain}` : undefined,
		},
	},

	manifest: ({ browser, manifestVersion, mode, command }) => {
		return {
			name: "__MSG_manifest_name__",
			description: "__MSG_manifest_description__",
			short_name: "YouTubeTweak",
			default_locale: browser === "edge" ? "en" : "zh_CN",
			permissions: ["storage", "tabs"],
			host_permissions: ["*://*.youtube.com/*"],
			key:
				browser === "edge"
					? undefined
					: fs
							.readFileSync("src/assets/public.pem", "utf8")
							.trim()
							.split("\n")
							.slice(1, -1)
							.map((v) => v.trim())
							.join(""),
			browser_specific_settings: {
				gecko: {
					id: "youtubetweak@dark495.me",
					strict_min_version: "88.0",
					data_collection_permissions: {
						required: ["websiteContent", "browsingActivity"],
						optional: [],
					},
				},
			},
		};
	},
	vite: (env) => ({
		build: {
			sourcemap: "inline",
			minify: false,
		},
		server: {
			cors: {
				origin: [/^safari-web-extension:\/\//, /^chrome-extension:\/\//, /^moz-extension:\/\//],
			},
			...(useLocalDevHttps && env.command === "serve"
				? {
						https: {
							cert: fs.readFileSync(localDevCertPath),
							key: fs.readFileSync(localDevKeyPath),
						},
						hmr: {
							protocol: "wss",
							host: localDevDomain,
						},
					}
				: {}),
		},
		define: {
			__APP_INFO__: JSON.stringify({
				...getBuildInfo(),
				version: pkg.version,
			}),
			__IS_DEV__: env.mode === "development",
		},
		plugins:
			env.mode !== "production"
				? [
						vueDevTools({
							launchEditor: "vscode",
							appendTo: "/src/entrypoints/popup/main.js",
						}),
					]
				: [],
	}),
});
