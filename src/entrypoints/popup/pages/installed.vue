<template>
	<section id="page-installed" :class="{ 'macos-user-agent': isMacOSUserAgent, 'ipad-user-agent': isIPadUserAgent }">
		<div class="installed">
			<img src="@/assets/img/logo.svg" alt="logo" />
			<p class="title">YouTube Tweak</p>
			<p class="version">
				v{{ APP_INFO.version }}<br /><span>Build at {{ APP_INFO.build }}</span>
			</p>

			<h1>{{ $t("installed.title") }}</h1>
			<p>{{ $t("installed.line1") }}</p>
			<p>{{ $t("installed.line2") }}</p>
			<p>{{ $t("installed.line3") }}</p>
		</div>

		<svg
			xmlns="http://www.w3.org/2000/svg"
			shape-rendering="geometricPrecision"
			text-rendering="geometricPrecision"
			image-rendering="optimizeQuality"
			fill-rule="evenodd"
			clip-rule="evenodd"
			viewBox="0 0 511.999 414.537"
			id="arrow"
		>
			<path
				fill-rule="nonzero"
				fill="#bababa"
				d="M272.672 106.83c35.974-29.622 93.074-70.771 124.026-101.724C404.401.483 413.074-.958 421.124.61c8.291 1.606 15.868 6.316 21.079 13.928l1.587 2.598 68.209 134.816-23.269 11.733c-6.285-12.42-46.018-93.326-61.794-123.347-8.421 113.201-50.941 202.355-119.111 265.333C232.553 375.215 126.272 412.448.41 414.537L0 388.52c119.332-1.982 219.658-36.875 290.177-102.028 64.084-59.205 103.813-143.79 111.061-251.776l-112.032 92.217-16.534-20.103z"
			/>
		</svg>

		<svg
			id="extension-icon-hint"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				d="M9 4C9 2.89543 9.89543 2 11 2C12.1046 2 13 2.89543 13 4V6H18V11H20C21.1046 11 22 11.8954 22 13C22 14.1046 21.1046 15 20 15H18V20H13V18C13 16.8954 12.1046 16 11 16C9.89543 16 9 16.8954 9 18V20H4V15H6C7.10457 15 8 14.1046 8 13C8 11.8954 7.10457 11 6 11H4V6H9V4Z"
				fill="#828282"
			/>
		</svg>

		<svg
			id="ipad-extension-icon-hint"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 80 80"
			aria-hidden="true"
		>
			<path
				d="M57.25 28.27C60.62 28.44 62.91 26.86 66.34 28.89C72.18 32.35 71.59 40.96 66.19 44.46C63.2 46.4 60.06 44.51 57.08 45.25C55.1 49.58 57.96 54.73 53.41 58.17C50.88 60.08 47.2 59.39 44.25 59.39C36.92 59.4 29.58 59.47 22.25 59.46C18.83 59.45 14.78 59.23 13.26 55.51C12.12 52.74 11.63 39.75 14.96 38.72C18.02 37.77 26.75 44.78 26.79 36.76C26.84 27.81 17.78 35.4 14.85 34.39C11.71 33.3 12.25 20.54 13.07 17.78C14.13 14.21 18.63 13.45 21.75 13.42C29.08 13.35 36.42 13.44 43.75 13.44C47.23 13.45 51.05 12.98 53.97 15.28C58.19 18.6 54.91 24.4 57.25 28.27ZM17.58 45.25C16.72 47.67 16.3 52.77 18.87 54.38C21.79 56.22 35.2 54.95 39.25 54.95C42.26 54.95 47.01 55.84 49.79 54.59C55.01 52.24 48.65 42.23 53.39 39.15C56.28 37.26 66.42 45.69 65.95 36.25C65.52 27.75 56.34 35.95 53.55 34.2C48.96 31.33 54.32 20.59 50.02 18.74C45.98 17.01 32.18 18.17 27.25 18.17C24.73 18.17 21.29 17.53 19 18.75C16.29 20.2 16.56 25.93 17.84 28.25C20.34 28.33 22.37 26.86 24.97 27.78C32.06 30.28 33.56 40.15 27.1 44.34C23.99 46.35 20.72 44.39 17.58 45.25Z"
				fill="#2d2f33"
				fill-rule="evenodd"
				stroke="#2d2f33"
				stroke-linejoin="round"
				stroke-width="0.25"
			/>
		</svg>
	</section>
</template>

<script setup lang="ts">
import { markChangelogVersionRead } from "@/util/versionNotice";

const APP_INFO = window.__APP_INFO__;
const isIPadUserAgent = /iPad/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const isMacOSUserAgent = /Macintosh|Mac OS X/.test(navigator.userAgent) && !isIPadUserAgent;

markChangelogVersionRead().catch(() => {});
</script>

<style lang="scss">
.installed {
	text-align: center;
	display: flex;
	width: 100vw;
	height: 100vh;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: center;

	img {
		width: 150px;
		height: 150px;
	}

	p {
		margin: 10px 0;
		text-align: center;

		&.title {
			font-size: 20px;
			font-weight: bolder;
			margin-top: 10px;
		}

		&.version {
			font-size: 15px;
			margin-bottom: 50px;

			span {
				color: rgba(#000, 0.5);
			}
		}
	}
}

#arrow {
	position: fixed;
	right: 100px;
	top: 50px;
	width: 150px;
}

#extension-icon-hint {
	position: fixed;
	right: 207px;
	top: 74px;
	width: 42px;
	height: 42px;
}

#ipad-extension-icon-hint {
	display: none;
}

#page-installed {
	&.macos-user-agent {
		#arrow {
			right: auto;
			left: 310px;
			top: 30px;
			width: 280px;
		}

		#extension-icon-hint {
			display: none;
		}

		#ipad-extension-icon-hint {
			display: block;
			position: fixed;
			right: auto;
			left: 332px;
			top: 74px;
			width: 79px;
			height: 79px;
		}
	}

	&.ipad-user-agent {
		#arrow {
			right: auto;
			left: 47vw;
			top: 10px;
			width: 240px;
		}

		#extension-icon-hint {
			display: none;
		}

		#ipad-extension-icon-hint {
			display: block;
			position: fixed;
			right: auto;
			left: 60.8vw;
			top: 61px;
			width: 28px;
			height: 28px;
		}
	}
}
</style>
