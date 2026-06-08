<?php

namespace App;

class Inertia
{
    private static $sharedProps = [];

    public static function share($key, $value = null)
    {
        if (is_array($key)) {
            self::$sharedProps = array_merge(self::$sharedProps, $key);
        } else {
            self::$sharedProps[$key] = $value;
        }
    }

    public static function getShared()
    {
        return self::$sharedProps;
    }

    public static function render($component, $props = [])
    {
        // Generate CSRF Token jika belum ada (agar selalu sinkron meski redirect via AJAX/Inertia)
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        // Set Cookie XSRF-TOKEN agar dibaca otomatis oleh Axios/Inertia frontend
        setcookie('XSRF-TOKEN', $_SESSION['csrf_token'], time() + 3600 * 2, '/', '', false, false);

        // Gabungkan props yang di-pass dengan props global (shared)
        $allProps = array_merge(self::$sharedProps, $props);

        // Pastikan session sudah menyertakan user login saat ini (jika ada)
        if (!isset($allProps['auth']['user'])) {
            $allProps['auth']['user'] = Auth::user();
        }

        // Pastikan flash message ikut terkirim
        if (!isset($allProps['flash'])) {
            $allProps['flash'] = [
                'success' => $_SESSION['flash_success'] ?? null,
                'error' => $_SESSION['flash_error'] ?? null,
            ];
            // Hapus flash message setelah dibaca
            unset($_SESSION['flash_success'], $_SESSION['flash_error']);
        }

        $url = $_SERVER['REQUEST_URI'];
        
        // Buat objek page Inertia
        $page = [
            'component' => $component,
            'props'     => $allProps,
            'url'       => $url,
            'version'   => '1.0'
        ];

        // Deteksi apakah ini request dari Inertia (via AJAX/Axios)
        $isInertia = isset($_SERVER['HTTP_X_INERTIA']) && $_SERVER['HTTP_X_INERTIA'] === 'true';

        if ($isInertia) {
            header('Content-Type: application/json');
            header('X-Inertia: true');
            echo json_encode($page);
            exit;
        }

        // Jika request pertama (bukan ajax Inertia), render HTML layout utama
        $viewPath = __DIR__ . '/views/app.php';
        if (file_exists($viewPath)) {
            require $viewPath;
            exit;
        }

        die("Error: Root view 'src/views/app.php' not found.");
    }

    /**
     * Helper untuk memuat aset JS/CSS dari Vite (development / production)
     */
    public static function viteAssets()
    {
        $publicPath = defined('PUBLIC_PATH') ? PUBLIC_PATH : __DIR__ . '/../public';
        $hotPath = $publicPath . '/hot';

        // 1. Mode Development (Vite dev server berjalan)
        if (file_exists($hotPath)) {
            $devServer = trim(file_get_contents($hotPath));
            return '
                <script type="module">
                    import RefreshRuntime from "' . $devServer . '/@react-refresh"
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.$RefreshReg$ = () => {}
                    window.$RefreshSig$ = () => (type) => type
                    window.__vite_plugin_react_preamble_installed__ = true
                </script>
                <script type="module" src="' . $devServer . '/@vite/client"></script>
                <script type="module" src="' . $devServer . '/resources/js/app.jsx"></script>
            ';
        }

        // 2. Mode Production (Aset sudah di-build ke public/build)
        $manifestPath = $publicPath . '/build/manifest.json';
        if (file_exists($manifestPath)) {
            $manifest = json_encode([]);
            try {
                $manifest = json_decode(file_get_contents($manifestPath), true);
            } catch (\Exception $e) {}

            $jsFile = $manifest['resources/js/app.jsx']['file'] ?? '';
            $cssFiles = $manifest['resources/js/app.jsx']['css'] ?? [];

            $tags = '';
            foreach ($cssFiles as $css) {
                $tags .= '<link rel="stylesheet" href="/build/' . $css . '">';
            }
            if ($jsFile) {
                $tags .= '<script type="module" src="/build/' . $jsFile . '"></script>';
            }
            return $tags;
        }

        return '<!-- Vite assets not found. Run npm run dev or npm run build -->';
    }
}
