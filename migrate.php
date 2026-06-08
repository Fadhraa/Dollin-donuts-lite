<?php

require_once __DIR__ . '/src/Config.php';

use App\Config;

echo "Starting migration...\n";

// Inisialisasi Environment
Config::loadEnv();

$dbName = getenv('DB_DATABASE') ?: 'dollin_donuts';

try {
    // Koneksi ke Database (akan otomatis membuat DB jika belum ada)
    $pdo = Config::db();
    echo "Connected to database '$dbName' successfully.\n";

    // Baca file database.sql
    $sqlFile = __DIR__ . '/database.sql';
    if (!file_exists($sqlFile)) {
        die("Error: database.sql not found in " . __DIR__ . "\n");
    }

    $sqlContent = file_get_contents($sqlFile);
    
    // Pecah perintah SQL berdasarkan tanda ;
    // Agar aman dengan comment/spasi, kita bersihkan
    $queries = preg_split('/;\s*$/m', $sqlContent);

    $count = 0;
    foreach ($queries as $query) {
        $query = trim($query);
        if (empty($query)) {
            continue;
        }

        $pdo->exec($query);
        $count++;
    }

    echo "Migration completed successfully! Imported $count queries.\n";

} catch (Exception $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
