<?php

define('PUBLIC_PATH', __DIR__);

// 1. Definisikan Autoloader Kelas PSR-4 Sederhana
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';
    $len = strlen($prefix);
    
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require_once $file;
    }
});

// 2. Register Composer Autoloader (untuk library pihak ketiga seperti Midtrans)
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
}

use App\Config;
use App\Auth;

// 3. Inisialisasi Session & Environment
Auth::init();
Config::loadEnv();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Parsing JSON input jika request memiliki Content-Type: application/json
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $json = json_decode(file_get_contents('php://input'), true);
    if (is_array($json)) {
        $_POST = array_merge($_POST, $json);
    }
}

// 4. Verifikasi CSRF Token untuk request modifikasi (POST, PUT, PATCH, DELETE)
// Lewati verifikasi CSRF untuk callback webhook Midtrans karena dikirim oleh server luar
if ($uri !== '/api/midtrans-callback') {
    Auth::verifyCsrf();
}

// 5. Ambil Metode Request (Mendukung override method dari form data dan header)
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$headers = getallheaders();

if ($method === 'POST') {
    if (isset($_POST['_method'])) {
        $method = strtoupper($_POST['_method']);
    } else {
        $json = json_decode(file_get_contents('php://input'), true);
        if (isset($json['_method'])) {
            $method = strtoupper($json['_method']);
        }
    }
}

if (isset($headers['X-HTTP-Method-Override'])) {
    $method = strtoupper($headers['X-HTTP-Method-Override']);
} elseif (isset($headers['x-http-method-override'])) {
    $method = strtoupper($headers['x-http-method-override']);
}

// 6. Path URL saat ini sudah didefinisikan di bagian atas untuk bypass CSRF

// 7. Tabel Routing
$routes = [
    'GET' => [
        '/' => 'LandingController@index',
        '/login' => 'AuthController@showLogin',
        '/Pesanan' => function() {
            $db = Config::db();
            $stmt = $db->query("SELECT * FROM branches WHERE is_active = 1");
            $branches = $stmt->fetchAll();
            foreach ($branches as &$b) {
                $b['is_active'] = (bool)$b['is_active'];
            }
            return \App\Inertia::render('Status_Pesanan', ['branches' => $branches]);
        },
        '/admin/dashboard' => 'OrderController@dashboard',
        '/admin/products' => 'ProductController@index',
        '/admin/orders' => 'OrderController@orders',
        '/admin/transaction' => 'OrderController@transaction',
        '/admin/ordermanagement' => 'OrderController@management',
        '/admin/couriers' => 'CourierController@index',
        '/courier/dashboard' => 'CourierController@dashboard',
        '/owner/dashboard' => 'OwnerController@dashboard',
        '/owner/branches' => 'OwnerController@branches',
        '/owner/reports' => 'OwnerController@reports',
        '/owner/products' => 'ProductController@index',
    ],
    'POST' => [
        '/login' => 'AuthController@login',
        '/logout' => 'AuthController@logout',
        '/checkout' => 'CheckoutController@process',
        '/api/midtrans-callback' => 'WebhookController@handler',
        '/api/cek-pesanan' => 'OrderController@cekPesanan',
        '/admin/couriers' => 'CourierController@store',
        '/owner/branches' => 'OwnerController@storeBranch',
        '/owner/products' => 'ProductController@store',
    ],
    'PATCH' => [
        '/admin/products/(\d+)/stock' => 'ProductController@updateStock',
        '/admin/ordermanagement/(\d+)/status' => 'OrderController@updateStatus',
        '/courier/take/(\d+)' => 'CourierController@takeOrder',
        '/courier/complete/(\d+)' => 'CourierController@completeOrder',
    ],
    'PUT' => [
        '/admin/couriers/(\d+)' => 'CourierController@update',
        '/owner/branches/(\d+)' => 'OwnerController@updateBranch',
        '/owner/products/(\d+)' => 'ProductController@update',
    ],
    'DELETE' => [
        '/admin/couriers/(\d+)' => 'CourierController@destroy',
        '/owner/branches/(\d+)' => 'OwnerController@destroyBranch',
        '/owner/products/(\d+)' => 'ProductController@destroy',
    ]
];

// 8. Pencocokan Rute (Matching Routes)
$routeFound = false;
$routesForMethod = $routes[$method] ?? [];

foreach ($routesForMethod as $routePath => $target) {
    // Ubah format string /path/(\d+) menjadi regex ^/path/(\d+)$
    $pattern = '#^' . $routePath . '$#';
    
    if (preg_match($pattern, $uri, $matches)) {
        $routeFound = true;
        array_shift($matches); // Buang indeks pertama (match string penuh)

        if (is_callable($target)) {
            // Jalankan callback inline jika target adalah fungsi anonim
            call_user_func_array($target, $matches);
        } else {
            // Instansiasi Controller secara dinamis
            list($controllerName, $action) = explode('@', $target);
            $fullControllerClass = '\\App\\Controllers\\' . $controllerName;
            
            if (class_exists($fullControllerClass)) {
                $controllerInstance = new $fullControllerClass();
                if (method_exists($controllerInstance, $action)) {
                    call_user_func_array([$controllerInstance, $action], $matches);
                } else {
                    http_response_code(500);
                    die("500 Internal Server Error: Method $action not found in controller $controllerName.");
                }
            } else {
                http_response_code(500);
                die("500 Internal Server Error: Controller class $fullControllerClass not found.");
            }
        }
        break;
    }
}

// 9. Jika Rute Tidak Ditemukan
if (!$routeFound) {
    http_response_code(404);
    echo "404 Not Found: Halaman yang Anda cari tidak dapat ditemukan di server kami.";
}
