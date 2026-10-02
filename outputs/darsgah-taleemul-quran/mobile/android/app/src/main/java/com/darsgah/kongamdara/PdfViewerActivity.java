package com.darsgah.kongamdara;

import android.app.DownloadManager;
import android.graphics.Bitmap;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** A small native PDF reader for documents opened from the Capacitor WebView. */
public class PdfViewerActivity extends AppCompatActivity {
    public static final String EXTRA_URL = "document_url";
    public static final String EXTRA_TITLE = "document_title";
    public static final String EXTRA_TOKEN = "document_token";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private ImageView pageImage;
    private TextView pageLabel;
    private ProgressBar progress;
    private PdfRenderer renderer;
    private ParcelFileDescriptor fileDescriptor;
    private int pageIndex = 0;
    private float zoom = 1f;
    private String sourceUrl;
    private String token;
    private String displayTitle;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        sourceUrl = getIntent().getStringExtra(EXTRA_URL);
        token = getIntent().getStringExtra(EXTRA_TOKEN);
        displayTitle = getIntent().getStringExtra(EXTRA_TITLE);
        if (sourceUrl == null || !(sourceUrl.startsWith("https://") || sourceUrl.startsWith("http://"))) {
            Toast.makeText(this, "Invalid document link", Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        buildLayout();
        loadPdf();
    }

    private void buildLayout() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(12), dp(12), dp(12), dp(12));
        root.setBackgroundColor(0xFFF8FAF8);

        TextView heading = new TextView(this);
        heading.setText(displayTitle == null || displayTitle.trim().isEmpty() ? "Darsgah document" : displayTitle);
        heading.setTextSize(18);
        heading.setTypeface(null, 1);
        heading.setTextColor(0xFF064E3B);
        heading.setMaxLines(2);
        root.addView(heading, new LinearLayout.LayoutParams(-1, -2));

        progress = new ProgressBar(this);
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(-2, -2);
        progressParams.gravity = Gravity.CENTER_HORIZONTAL;
        progressParams.topMargin = dp(24);
        root.addView(progress, progressParams);

        pageImage = new ImageView(this);
        pageImage.setAdjustViewBounds(true);
        pageImage.setScaleType(ImageView.ScaleType.FIT_CENTER);
        pageImage.setContentDescription("PDF page");
        LinearLayout.LayoutParams imageParams = new LinearLayout.LayoutParams(-1, 0, 1f);
        imageParams.topMargin = dp(10);
        root.addView(pageImage, imageParams);

        pageLabel = new TextView(this);
        pageLabel.setGravity(Gravity.CENTER);
        pageLabel.setTextColor(0xFF065F46);
        pageLabel.setPadding(0, dp(8), 0, dp(8));
        root.addView(pageLabel, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout actions = new LinearLayout(this);
        actions.setGravity(Gravity.CENTER);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        Button previous = button("Previous");
        previous.setOnClickListener(v -> changePage(-1));
        Button zoomOut = button("-");
        zoomOut.setOnClickListener(v -> changeZoom(-0.2f));
        Button zoomIn = button("+");
        zoomIn.setOnClickListener(v -> changeZoom(0.2f));
        Button next = button("Next");
        next.setOnClickListener(v -> changePage(1));
        actions.addView(previous);
        actions.addView(zoomOut);
        actions.addView(zoomIn);
        actions.addView(next);
        root.addView(actions, new LinearLayout.LayoutParams(-1, -2));

        Button save = button("Save to Downloads");
        LinearLayout.LayoutParams saveParams = new LinearLayout.LayoutParams(-1, -2);
        saveParams.topMargin = dp(10);
        save.setOnClickListener(v -> saveToDownloads());
        root.addView(save, saveParams);
        setContentView(root);
    }

    private Button button(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setAllCaps(false);
        button.setMinHeight(dp(48));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, -2, 1f);
        params.setMargins(dp(3), 0, dp(3), 0);
        button.setLayoutParams(params);
        return button;
    }

    private void loadPdf() {
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(sourceUrl).openConnection();
                connection.setConnectTimeout(20_000);
                connection.setReadTimeout(30_000);
                connection.setRequestProperty("Accept", "application/pdf,*/*");
                if (token != null && !token.isEmpty()) connection.setRequestProperty("Authorization", "Bearer " + token);
                if (connection.getResponseCode() < 200 || connection.getResponseCode() >= 300) throw new IllegalStateException("Document is unavailable");
                if (connection.getContentLengthLong() > 50L * 1024L * 1024L) throw new IllegalStateException("Document is too large");

                File output = new File(getCacheDir(), "darsgah-reader.pdf");
                try (BufferedInputStream input = new BufferedInputStream(connection.getInputStream()); FileOutputStream stream = new FileOutputStream(output)) {
                    byte[] buffer = new byte[8192];
                    int count;
                    while ((count = input.read(buffer)) != -1) stream.write(buffer, 0, count);
                }
                fileDescriptor = ParcelFileDescriptor.open(output, ParcelFileDescriptor.MODE_READ_ONLY);
                renderer = new PdfRenderer(fileDescriptor);
                runOnUiThread(() -> {
                    progress.setVisibility(View.GONE);
                    renderPage();
                });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    progress.setVisibility(View.GONE);
                    pageLabel.setText("Unable to open this document. You can still save it to Downloads.");
                    Toast.makeText(PdfViewerActivity.this, "Document could not be opened", Toast.LENGTH_LONG).show();
                });
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private void changePage(int change) {
        if (renderer == null) return;
        int next = pageIndex + change;
        if (next < 0 || next >= renderer.getPageCount()) return;
        pageIndex = next;
        renderPage();
    }

    private void changeZoom(float change) {
        zoom = Math.max(0.6f, Math.min(2.5f, zoom + change));
        renderPage();
    }

    private void renderPage() {
        if (renderer == null || renderer.getPageCount() == 0) return;
        try (PdfRenderer.Page page = renderer.openPage(pageIndex)) {
            int width = Math.max(720, Math.round(page.getWidth() * zoom));
            int height = Math.max(960, Math.round(page.getHeight() * zoom));
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            bitmap.eraseColor(0xFFFFFFFF);
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            pageImage.setImageBitmap(bitmap);
            pageLabel.setText("Page " + (pageIndex + 1) + " of " + renderer.getPageCount());
        }
    }

    private void saveToDownloads() {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(sourceUrl));
            request.setTitle(safeFilename(displayTitle) + ".pdf");
            request.setDescription("Darsgah document");
            request.setMimeType("application/pdf");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, safeFilename(displayTitle) + "-" + System.currentTimeMillis() + ".pdf");
            if (token != null && !token.isEmpty()) request.addRequestHeader("Authorization", "Bearer " + token);
            ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            Toast.makeText(this, "Download failed. Please try again.", Toast.LENGTH_LONG).show();
        }
    }

    private String safeFilename(String value) {
        String safe = value == null ? "darsgah-document" : value.replaceAll("[\\\\/:*?\"<>|\\r\\n]+", "-").trim();
        return safe.isEmpty() ? "darsgah-document" : safe;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onDestroy() {
        if (renderer != null) renderer.close();
        if (fileDescriptor != null) try { fileDescriptor.close(); } catch (Exception ignored) { }
        executor.shutdownNow();
        super.onDestroy();
    }
}
