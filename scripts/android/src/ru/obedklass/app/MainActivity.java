package ru.obedklass.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private static final String SITE =
            "https://school-canteen--makaravdalyan23.replit.app/";
    private static final String SITE_HOST_SUFFIX = "replit.app";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setBackgroundColor(Color.parseColor("#FFF7ED"));

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri u = Uri.parse(url);
                String scheme = u.getScheme() == null ? "" : u.getScheme();
                String host = u.getHost() == null ? "" : u.getHost();
                if (scheme.equals("http") || scheme.equals("https")) {
                    if (host.equals(SITE_HOST_SUFFIX) || host.endsWith("." + SITE_HOST_SUFFIX)) {
                        return false; // наш сайт — открываем внутри приложения
                    }
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true; // всё внешнее — через браузер
            }

            @Override
            public void onReceivedError(WebView view, int errorCode,
                                        String description, String failingUrl) {
                if (failingUrl != null && failingUrl.startsWith(SITE)) {
                    showOffline();
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient());

        setContentView(web);

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(SITE);
        }
    }

    private void showOffline() {
        String html = "<!doctype html><html><head><meta charset='utf-8'>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "</head><body style='margin:0;background:#FFF7ED;"
                + "font-family:sans-serif;display:flex;align-items:center;"
                + "justify-content:center;min-height:90vh;'>"
                + "<div style='text-align:center;color:#7C2D12;padding:24px;'>"
                + "<div style='font-size:44px;'>&#127869;</div>"
                + "<h2 style='margin:8px 0;'>Нет подключения</h2>"
                + "<p style='color:#9A3412;'>Проверьте интернет и попробуйте снова.</p>"
                + "<button onclick=\"location.href='" + SITE + "'\" "
                + "style='margin-top:12px;padding:12px 28px;font-size:16px;"
                + "background:#EA580C;color:#fff;border:none;border-radius:10px;'>"
                + "Обновить</button></div></body></html>";
        web.loadData(html, "text/html; charset=utf-8", "utf-8");
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
