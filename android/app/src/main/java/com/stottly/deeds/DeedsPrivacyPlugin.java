package com.stottly.deeds;

import android.os.Build;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "DeedsPrivacy")
public class DeedsPrivacyPlugin extends Plugin {
    private static final String PREFERENCES = "deeds_privacy";
    private static final String ENABLED_KEY = "privacy_lock_enabled";
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
}
