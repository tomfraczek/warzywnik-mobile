import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// This screen exists solely to complete the OAuth redirect loop on Android.
// The custom URL scheme (warzywnikmobile://oauth-native-callback) deep-links
// here after the user authenticates in the browser. Calling
// maybeCompleteAuthSession() above signals expo-auth-session to resolve the
// pending browser session, which unblocks startSSOFlow in sign-in/sign-up.
// AuthBootstrapGate then handles navigation to the correct tab screen
// because this file lives inside the (auth) group (segments[0] === "(auth)").
export default function OAuthNativeCallback() {
  return null;
}
