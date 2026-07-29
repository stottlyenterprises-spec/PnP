package com.stottly.deeds;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeedsPrivacyPlugin.class);
        registerPlugin(DeedsHealthPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        routeSharedText(intent);
    }

    private void routeSharedText(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction()) || intent.getType() == null || !intent.getType().startsWith("text/")) {
            return;
        }

        CharSequence subject = intent.getCharSequenceExtra(Intent.EXTRA_SUBJECT);
        CharSequence sharedText = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        String title = subject == null ? "" : subject.toString().trim();
        String body = sharedText == null ? "" : sharedText.toString().trim();
        String capture = title.isEmpty() ? body : body.isEmpty() || body.equals(title) ? title : title + "\n\n" + body;
        if (capture.isEmpty() || getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        DeedsPrivacyPlugin.enqueueCapture(this, "Task", capture);
        Uri captureUrl = Uri.parse("https://p-n-p.vercel.app/").buildUpon()
            .appendQueryParameter("view", "today")
            .build();

        getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(captureUrl.toString()));
        intent.removeExtra(Intent.EXTRA_SUBJECT);
        intent.removeExtra(Intent.EXTRA_TEXT);
        intent.setAction(null);
    }
}
