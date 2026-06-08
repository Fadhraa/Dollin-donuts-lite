<?php

namespace App;

class Auth
{
    private static $currentUser = null;

    public static function init()
    {
        if (session_status() === PHP_SESSION_NONE) {
            // Gunakan folder sessions lokal untuk mengatasi hilangnya session di hosting InfinityFree
            $sessionPath = dirname(__DIR__) . '/sessions';
            if (!file_exists($sessionPath)) {
                @mkdir($sessionPath, 0777, true);
            }
            if (is_writable($sessionPath)) {
                @session_save_path($sessionPath);
            }
            session_start();
        }
    }

    public static function check()
    {
        self::init();
        return isset($_SESSION['user_id']);
    }

    public static function user()
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        self::init();
        if (!isset($_SESSION['user_id'])) {
            return null;
        }

        $db = Config::db();
        $stmt = $db->prepare("SELECT id, name, email, role, branch_id FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();

        if ($user) {
            self::$currentUser = $user;
            return $user;
        }

        // Jika user id di session tidak ada di DB (misal didelete)
        self::logout();
        return null;
    }

    public static function attempt($email, $password)
    {
        self::init();
        $db = Config::db();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            self::$currentUser = $user;
            return true;
        }

        return false;
    }

    public static function logout()
    {
        self::init();
        unset($_SESSION['user_id']);
        unset($_SESSION['user_role']);
        self::$currentUser = null;
        session_destroy();
    }

    public static function requireAuth()
    {
        if (!self::check()) {
            $_SESSION['flash_error'] = 'Silakan login terlebih dahulu.';
            header('Location: /login');
            exit;
        }
    }

    public static function requireRole($allowedRoles)
    {
        self::requireAuth();
        $user = self::user();
        if (!$user || !in_array($user['role'], (array)$allowedRoles)) {
            http_response_code(403);
            die("403 Forbidden: Akses ditolak.");
        }
    }

    /**
     * Verifikasi CSRF Token untuk request modifying (POST, PUT, PATCH, DELETE)
     */
    public static function verifyCsrf()
    {
        self::init();
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Kita juga perhitungkan method override (seperti _method di form data)
        if (isset($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }

        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $headers = getallheaders();
            // Normalisasi key header menjadi uppercase untuk menghindari isu case-sensitivity di server hosting
            $headersUpper = array_change_key_case($headers, CASE_UPPER);
            $token = '';

            // Coba ambil token dari header X-XSRF-TOKEN atau X-CSRF-TOKEN
            if (isset($headersUpper['X-XSRF-TOKEN'])) {
                $token = urldecode($headersUpper['X-XSRF-TOKEN']);
            } elseif (isset($headersUpper['X-CSRF-TOKEN'])) {
                $token = $headersUpper['X-CSRF-TOKEN'];
            } elseif (isset($_POST['_token'])) {
                $token = $_POST['_token'];
            }

            $sessionToken = $_SESSION['csrf_token'] ?? '';

            if (empty($sessionToken) || $token !== $sessionToken) {
                http_response_code(419);
                header('Content-Type: application/json');
                echo json_encode([
                    'status' => 'error',
                    'message' => 'CSRF Token mismatch / Page expired.'
                ]);
                exit;
            }
        }
    }
}

// polyfill untuk getallheaders jika berjalan di php-fpm non-apache
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
