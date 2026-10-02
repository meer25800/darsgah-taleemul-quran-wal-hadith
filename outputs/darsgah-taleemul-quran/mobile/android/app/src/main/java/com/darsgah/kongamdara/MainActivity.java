package com.darsgah.kongamdara;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;

import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {
    private final Map<Long, DownloadRecord> activeDownloads = new HashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(new AndroidDownloader(), "AndroidDownloader");
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            String filename = URLUtil.guessFileName(url, contentDisposition, mimeType);
            enqueueDownload(url, filename, mimeType, "", userAgent);
        });

        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(downloadReceiver, filter);
        }
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(downloadReceiver);
        } catch (IllegalArgumentException ignored) {
        }
        super.onDestroy();
    }

    private void enqueueDownload(String url, String requestedName, String mimeType, String token, String userAgent) {
        runOnUiThread(() -> {
            try {
                String filename = uniqueFilename(sanitizeFilename(requestedName, url, mimeType));
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setTitle(filename);
                request.setDescription(getString(com.darsgah.kongamdara.R.string.app_name));
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setAllowedOverMetered(true);
                request.setAllowedOverRoaming(false);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                if (mimeType != null && !mimeType.isEmpty()) request.setMimeType(mimeType);
                if (token != null && !token.isEmpty()) request.addRequestHeader("Authorization", "Bearer " + token);
                String cookies = CookieManager.getInstance().getCookie(url);
                if (cookies != null && !cookies.isEmpty()) request.addRequestHeader("Cookie", cookies);
                if (userAgent != null && !userAgent.isEmpty()) request.addRequestHeader("User-Agent", userAgent);

                DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                long id = manager.enqueue(request);
                activeDownloads.put(id, new DownloadRecord(filename, mimeType));
                Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
            } catch (Exception error) {
                Toast.makeText(this, "Download failed. Please try again.", Toast.LENGTH_LONG).show();
            }
        });
    }

    private String sanitizeFilename(String value, String url, String mimeType) {
        String fallback = URLUtil.guessFileName(url, null, mimeType);
        String source = value == null || value.trim().isEmpty() ? fallback : value;
        String safe = source.replaceAll("[\\\\/:*?\"<>|\\r\\n]+", "-").trim();
        return safe.isEmpty() ? "darsgah-document.pdf" : safe;
    }

    private String uniqueFilename(String filename) {
        // DownloadManager owns the public Downloads directory on modern Android.
        // A timestamp prevents collisions without relying on legacy file access.
        int dot = filename.lastIndexOf('.');
        String base = dot > 0 ? filename.substring(0, dot) : filename;
        String extension = dot > 0 ? filename.substring(dot) : "";
        return base + "-" + System.currentTimeMillis() + extension;
    }

    private final BroadcastReceiver downloadReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            DownloadRecord record = activeDownloads.remove(id);
            if (record == null) return;

            DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            try (Cursor cursor = manager.query(new DownloadManager.Query().setFilterById(id))) {
                if (cursor == null || !cursor.moveToFirst()) return;
                int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                if (status != DownloadManager.STATUS_SUCCESSFUL) {
                    Toast.makeText(MainActivity.this, "Download failed", Toast.LENGTH_LONG).show();
                    return;
                }
            }
            Toast.makeText(MainActivity.this, "Saved to Downloads. Opening document...", Toast.LENGTH_LONG).show();
            openDownloadedFile(manager, id, record);
        }
    };

    private void openDownloadedFile(DownloadManager manager, long downloadId, DownloadRecord record) {
        try {
            Uri uri = manager.getUriForDownloadedFile(downloadId);
            if (uri == null) throw new IllegalStateException("Download URI missing");
            String mime = record.mimeType;
            if (mime == null || mime.isEmpty()) {
                String extension = MimeTypeMap.getFileExtensionFromUrl(record.filename);
                mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            }
            Intent view = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, mime == null ? "*/*" : mime)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (view.resolveActivity(getPackageManager()) != null) startActivity(view);
        } catch (Exception ignored) {
            Toast.makeText(this, "Downloaded file is available in Downloads", Toast.LENGTH_LONG).show();
        }
    }

    /** Public so JavaScript running in the remote Capacitor WebView can call it reliably. */
    public final class AndroidDownloader {
        @JavascriptInterface
        public void download(String url, String filename, String mimeType, String token) {
            enqueueDownload(url, filename, mimeType, token, getBridge().getWebView().getSettings().getUserAgentString());
        }

        @JavascriptInterface
        public void open(String url, String title, String token) {
            runOnUiThread(() -> {
                Intent intent = new Intent(MainActivity.this, PdfViewerActivity.class);
                intent.putExtra(PdfViewerActivity.EXTRA_URL, url);
                intent.putExtra(PdfViewerActivity.EXTRA_TITLE, title);
                intent.putExtra(PdfViewerActivity.EXTRA_TOKEN, token);
                startActivity(intent);
            });
        }
    }

    private static class DownloadRecord {
        final String filename;
        final String mimeType;

        DownloadRecord(String filename, String mimeType) {
            this.filename = filename;
            this.mimeType = mimeType;
        }
    }
}
