package com.stottly.deeds;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

public class HealthPermissionRationaleActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://p-n-p.vercel.app/privacy")));
        finish();
    }
}
