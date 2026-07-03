# Changelog

[中文](/docs/zh-cn/CHANGELOG.md) | [English](/CHANGELOG.md) | [日本語](/docs/ja/CHANGELOG.md)

All release version update records are listed in this file.

If you have questions, bug reports, or feature suggestions, please submit them on the [GitHub Issues page](https://github.com/xlch88/YouTubeTweak/issues).

## [1.1.8] - 2026-07-03

### Updated

- **Settings UI:** Improved the prompt display for configuration import/export and update check results.
- **Player controls:** Improved how the player control bar is shown when using custom controls such as speed, rotation, and mirroring.

### Added

- **Speed control:** Added a speed slider, with support for continuous drag-based speed adjustment, mouse wheel speed adjustment, and custom wheel step sizes.
- **Video zoom:** Added video zoom with the mouse wheel. After zooming in, the video can be dragged to move the view.
- **Player function buttons:** Added a video screenshot button, with support for saving the current video frame as a PNG image.
- **Player buttons:** Added player button display modes, with support for automatic, hidden, and force-enabled states.
- **Custom CSS:** Added a custom CSS editor, with support for injecting custom styles into YouTube.
- **Configuration management:** Added options to export/import memory data, with support for migrating per-channel speed, subtitle, and other memories together with settings.

## [1.1.7] - 2026-06-12

### Updated

- **Ad blocking:** Added blocking rules for YouTube shopping recommendation shelf elements.
- **Disable pause:** Improved detection for the "Video paused. Continue playing?" dialog to avoid closing unrelated popups.
- **Memory storage:** Batched repeated writes within 500ms to reduce unnecessary storage updates.
- **Mini player:** Simplified mini player size labels in the popup window.
- **i18n:** Updated translations related to the new player and rollback settings.
- **Dependencies:** Updated WXT/build tooling and removed legacy browser global variable compatibility code.

### Added

- **Mini player:** Added a scrolling mini player, with support for size, position, screen margin, and trigger distance settings.
- **Volume booster:** Added real volume boosting, with support for in-player controls and custom boost levels.
- **Comment translation:** Added an option to show translations line by line for multi-line comments.
- **Player UI:** Added an option to hide YouTube's mini player button.
- **Rollback:** Added an option to restore the old YouTube player page layout.

### Fixed

- **Mini player:** Improved stacking order and layout restoration when entering/exiting mini player mode.
- **Rollback:** Fixed non-16:9 videos being forced into a 16:9 shell after enabling the old player page layout.

## [1.1.5] - 2026-04-11

### Updated

- **Ad blocking:** Added two new blocking rules.

### Added

- **Disable pause:** Prevents automatic pausing after playback continues for a while (the "Video paused. Continue watching?" prompt).

### Fixed

- **Comment translation:** Fixed an issue where translated content was not updated after changing the comment sort order.

## [1.1.4] - 2025-12-03

### Fixed

- **XMLHttpRequest Hooker:** Fixed an issue where XMLHttpRequest Hooker could not initialize normally.

## [1.1.3] - 2025-12-03

### Updated

- **Popup window:** Made some layout changes. Added a "Translation" page and moved the old "Comments" page features to other locations.

### Added

- **Popup window:** Added a warning prompt on the "General" page to remind users that some features may affect normal page behavior.
- **Bilingual subtitles:** When enabled, automatically uses Google to translate subtitle content and displays the translation above the original subtitles.

### Fixed

- **Comment translation:** Fixed abnormal translation display when switching comment sort order.

## [1.1.2] - 2025-11-26

### Added

- **Comment translation:** Added an "Always do not translate the following languages" option.

### Fixed

- **Comment translation:** Fixed an issue where the target language setting did not take effect.
- **Comment translation:** Fixed an issue where extra expand/collapse buttons appeared when showing translated content.

## [1.1.1] - 2025-11-25

### Fixed

- **Playback speed buttons:** Fixed an issue where some playback speed buttons were not displayed.

## [1.1.0] - 2025-11-24

### Updated

- **Playback speed buttons:** Provided more selectable speeds.

### Added

- **Player time tag:** The floating time tag now supports custom font size, position, and offset distance.
- **Video progress bar:** Added an option to customize the progress bar height.
- **i18n:** Added Arabic (ar-SA) translation.
- **i18n:** Added Bengali (bn-BD) translation.
- **i18n:** Added German (de-DE) translation.
- **i18n:** Added Spanish (es-ES) translation.
- **i18n:** Added Persian (fa-IR) translation.
- **i18n:** Added Hindi (hi-IN) translation.
- **i18n:** Added Indonesian (id-ID) translation.
- **i18n:** Added Italian (it-IT) translation.
- **i18n:** Added Korean (ko-KR) translation.
- **i18n:** Added Marathi (mr-IN) translation.
- **i18n:** Added Malay (ms-MY) translation.
- **i18n:** Added Punjabi (pa-PK) translation.
- **i18n:** Added Portuguese (pt-BR) translation.
- **i18n:** Added Russian (ru-RU) translation.
- **i18n:** Added Tamil (ta-IN) translation.
- **i18n:** Added Telugu (te-IN) translation.
- **i18n:** Added Thai (th-TH) translation.
- **i18n:** Added Turkish (tr-TR) translation.
- **i18n:** Added Ukrainian (uk-UA) translation.
- **i18n:** Added Vietnamese (vi-VN) translation.

## [1.0.9] - 2025-11-22

### Fixed

- **Player**: Fixed the time floating tag display issue in live mode.
- **Comment translation**: Similar languages (for example, en_US and en_UK) will not be translated repeatedly.

### Added

- **Check for updates**: Click the version number in the popup window to manually check for updates.
- **Comment translation**: Added a target language selection option for the comment translation feature.
- **Comment translation**: Added a button to manually trigger translation.
- **Player function buttons**: Added two new function buttons: mirror video and rotate video.

## [1.0.8] - 2025-11-14

### Updated

- Videos per row: Increased the maximum value of the `每行视频数量` option from `10` to `15`.

### Added

- Video progress bar: Added always showing the progress bar below the video.
- Video time: Added showing the video `当前时间/长度` in the bottom-left corner.

## [1.0.7] - 2025-11-12

### Added

- Playback speed buttons: Added more options `(2.25x, 2.5x)` and rewrote the related UI.
- Hide Shorts: After checking Hide Shorts on the homepage, it will also hide `搜索结果中的Shorts视频`.
- Ad blocking: After checking "Block creator product recommendations", it will hide, inside the `播放器`, the `“推荐商品”悬浮按钮`.
- Ad blocking: After checking "Block creator product recommendations", it will hide `演出门票信息` below the video description.

### Fixed

- Show comment nicknames: Fixed abnormal comment nickname colors in `暗色模式`.
- Hide Shorts: Fixed an issue where Shorts still appeared in `推荐视频` on the playback page.
- Popup window: Fixed abnormal `弹出窗口` width in some browsers.
