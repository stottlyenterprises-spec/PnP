package com.stottlyenterprises.progressnotperfection.deeds;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.Executor;
import java.util.UUID;

@CapacitorPlugin(name = "DeedsPrivacy")
public class DeedsPrivacyPlugin extends Plugin {
    private static final String PREFERENCES = "deeds_privacy";
    private static final String ENABLED_KEY = "privacy_lock_enabled";
    private static final String SECURE_PREFERENCES = "deeds_secure_storage";
    private static final String CAPTURE_QUEUE_KEY = "offline_capture_queue";
    private static final int MAX_CAPTURE_QUEUE = 50;

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(currentState());
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        if (enabled && !isAvailable()) {
            call.reject("Device authentication is not available.");
            return;
        }
        getContext().getSharedPreferences(PREFERENCES, 0).edit().putBoolean(ENABLED_KEY, enabled).apply();
        call.resolve(currentState());
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        if (!isAvailable()) {
            call.reject("Device authentication is not available.");
            return;
        }

        Executor executor = ContextCompat.getMainExecutor(getContext());
        BiometricPrompt prompt = new BiometricPrompt(
            (FragmentActivity) getActivity(),
            executor,
            new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                    JSObject response = new JSObject();
                    response.put("authenticated", true);
                    call.resolve(response);
                }

                @Override
                public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                    call.reject(errString.toString());
                }
            }
        );

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock D.E.E.D.S.")
            .setSubtitle(call.getString("reason", "Protect your private information"))
            .setAllowedAuthenticators(authenticators())
            .build();
        prompt.authenticate(promptInfo);
    }

    @PluginMethod
    public void secureSet(PluginCall call) {
        String key = call.getString("key", "").trim();
        String value = call.getString("value", "");
        if (key.isEmpty()) {
            call.reject("A storage key is required.");
            return;
        }
        securePreferences(getContext()).edit().putString(key, value).apply();
        call.resolve();
    }

    @PluginMethod
    public void secureGet(PluginCall call) {
        String key = call.getString("key", "").trim();
        if (key.isEmpty()) {
            call.reject("A storage key is required.");
            return;
        }
        JSObject result = new JSObject();
        result.put("value", securePreferences(getContext()).getString(key, null));
        call.resolve(result);
    }

    @PluginMethod
    public void secureRemove(PluginCall call) {
        String key = call.getString("key", "").trim();
        if (!key.isEmpty()) securePreferences(getContext()).edit().remove(key).apply();
        call.resolve();
    }

    @PluginMethod
    public void queueCapture(PluginCall call) {
        String text = call.getString("text", "").trim();
        String kind = call.getString("kind", "Task");
        if (text.isEmpty()) {
            call.reject("Capture text is required.");
            return;
        }
        enqueueCapture(getContext(), kind, text);
        call.resolve(queueStatus());
    }

    @PluginMethod
    public void nextCapture(PluginCall call) {
        JSObject result = queueStatus();
        JSONArray queue = readQueue(getContext());
        if (queue.length() > 0) {
            try {
                result.put("capture", JSObject.fromJSONObject(queue.getJSONObject(0)));
            } catch (JSONException ignored) {
                result.put("capture", JSObject.NULL);
            }
        } else {
            result.put("capture", JSObject.NULL);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void acknowledgeCapture(PluginCall call) {
        String id = call.getString("id", "");
        JSONArray queue = readQueue(getContext());
        JSONArray remaining = new JSONArray();
        for (int index = 0; index < queue.length(); index++) {
            JSONObject item = queue.optJSONObject(index);
            if (item != null && !id.equals(item.optString("queueId"))) remaining.put(item);
        }
        writeQueue(getContext(), remaining);
        call.resolve(queueStatus());
    }

    private boolean isAvailable() {
        return BiometricManager.from(getContext()).canAuthenticate(authenticators())
            == BiometricManager.BIOMETRIC_SUCCESS;
    }

    private int authenticators() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return BiometricManager.Authenticators.BIOMETRIC_STRONG |
                BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        }
        return BiometricManager.Authenticators.BIOMETRIC_WEAK;
    }

    private JSObject currentState() {
        JSObject state = new JSObject();
        state.put("available", isAvailable());
        state.put(
            "enabled",
            getContext().getSharedPreferences(PREFERENCES, 0).getBoolean(ENABLED_KEY, false)
        );
        state.put("biometricType", "Device authentication");
        return state;
    }

    private JSObject queueStatus() {
        JSObject result = new JSObject();
        result.put("pending", readQueue(getContext()).length());
        return result;
    }

    public static void enqueueCapture(Context context, String kind, String text) {
        JSONArray queue = readQueue(context);
        JSONObject item = new JSONObject();
        try {
            item.put("queueId", UUID.randomUUID().toString());
            item.put("kind", "Journal".equals(kind) || "Note".equals(kind) ? kind : "Task");
            item.put("text", text);
            SimpleDateFormat timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            timestamp.setTimeZone(TimeZone.getTimeZone("UTC"));
            item.put("createdAt", timestamp.format(new java.util.Date()));
            queue.put(item);
            while (queue.length() > MAX_CAPTURE_QUEUE) queue.remove(0);
            writeQueue(context, queue);
        } catch (JSONException ignored) {
            // A malformed capture is never allowed to prevent the app from opening.
        }
    }

    private static JSONArray readQueue(Context context) {
        try {
            return new JSONArray(securePreferences(context).getString(CAPTURE_QUEUE_KEY, "[]"));
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    private static void writeQueue(Context context, JSONArray queue) {
        securePreferences(context).edit().putString(CAPTURE_QUEUE_KEY, queue.toString()).apply();
    }

    private static SharedPreferences securePreferences(Context context) {
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
            return EncryptedSharedPreferences.create(
                context,
                SECURE_PREFERENCES,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception error) {
            throw new IllegalStateException("Secure device storage is unavailable.", error);
        }
    }
}
