# MUMMS Mobile Release Notes

## What is already set up

- Capacitor wraps the Vite React app for native Android and iOS.
- Android project: `android/`
- iOS project: `ios/`
- Shared native config: `capacitor.config.json`
- Local notification plugin: `@capacitor/local-notifications`

## Common commands

```bash
npm run mobile:sync
```

Builds the web app and syncs `dist/` into Android and iOS.

```bash
npm run android:open
```

Opens the Android project in Android Studio.

```bash
npm run android:build
```

Builds a debug APK after Android Studio/JDK tooling is installed.

```bash
npm run ios:open
```

Opens the iOS project in Xcode. This command must be run on macOS with Xcode.

## Android release path

1. Install Android Studio.
2. Open the project with `npm run android:open`.
3. Let Android Studio install the Android SDK and Gradle dependencies.
4. Set app icon, version name, and signing key.
5. Build either:
   - Debug APK for internal testing.
   - Signed APK/AAB for distribution.

## iOS release path

1. Use a Mac with Xcode.
2. Run `npm install`.
3. Run `npm run mobile:sync`.
4. Run `npm run ios:open`.
5. In Xcode, set the Apple Developer Team, bundle signing, app icon, and version.
6. Test on a real iPhone.
7. Archive and upload through Xcode / App Store Connect.

### What if you don't have a Mac?

Apple restricts iOS app compilation to macOS. If you do not have a physical Mac, consider these alternatives:
- **Rent a Cloud Mac:** Services like [MacinCloud](https://www.macincloud.com/) allow you to rent a macOS machine by the hour/month. You can remote into it and use Xcode normally.
- **Cloud CI/CD Services:** Use services like [Ionic Appflow](https://ionic.io/appflow), GitHub Actions (with macOS runners), Codemagic, or Bitrise to build the app in the cloud.
- **Borrow a Mac:** You only strictly need the Mac for compiling, signing, and submitting the app to App Store Connect.

## Important notification note

The current system creates assignment records in Firestore and shows local/native notifications when the assigned member opens the app and has granted notification permission. If you need notifications to arrive while the app is fully closed, add Firebase Cloud Messaging or another push notification backend.
