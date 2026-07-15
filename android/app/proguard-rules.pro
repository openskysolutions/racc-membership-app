# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve line numbers for crash stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ---- Capacitor Core ----
# Required for the JavaScript bridge (WebView <-> Java reflection)
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ---- Firebase / Google Play Services ----
# Required for @capacitor/push-notifications (FCM token registration)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.messaging.FirebaseMessagingService { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ---- Capacitor Push Notifications Plugin ----
-keep class com.getcapacitor.plugin.push.** { *; }

# ---- Prevent stripping of classes accessed via reflection ----
-keepclassmembers class ** {
    @com.getcapacitor.annotation.PluginMethod public *;
}
