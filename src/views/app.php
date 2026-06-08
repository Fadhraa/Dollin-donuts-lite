<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia><?= $_ENV['APP_NAME'] ?? $_SERVER['APP_NAME'] ?? getenv('APP_NAME') ?: 'Dollin Donuts' ?></title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

    <!-- CSRF Token -->
    <meta name="csrf-token" content="<?= $_SESSION['csrf_token'] ?? '' ?>">

    <!-- Midtrans Snap JS -->
    <script type="text/javascript"
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="<?= $_ENV['MIDTRANS_CLIENT_KEY'] ?? $_SERVER['MIDTRANS_CLIENT_KEY'] ?? getenv('MIDTRANS_CLIENT_KEY') ?: 'SB-Mid-client-7v0L39m3qMRP8adc' ?>"></script>

    <!-- Vite Assets -->
    <?= \App\Inertia::viteAssets() ?>
</head>

<body class="font-sans antialiased">
    <div id="app" data-page="<?= htmlspecialchars(json_encode($page), ENT_QUOTES, 'UTF-8') ?>"></div>
</body>

</html>
