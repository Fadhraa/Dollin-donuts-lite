<?php

namespace App\Controllers;

use App\Auth;
use App\Inertia;

class AuthController
{
    public function showLogin()
    {
        if (Auth::check()) {
            $this->redirectByRole(Auth::user()['role']);
        }
        return Inertia::render('Login');
    }

    public function login()
    {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            $_SESSION['flash_error'] = 'Email dan password harus diisi.';
            return Inertia::render('Login', ['errors' => ['email' => 'Email dan password harus diisi.']]);
        }

        if (Auth::attempt($email, $password)) {
            // Regenerate session ID untuk keamanan
            session_regenerate_id(true);

            $user = Auth::user();
            return $this->redirectByRole($user['role']);
        }

        return Inertia::render('Login', [
            'errors' => [
                'email' => 'Email atau password salah.'
            ]
        ]);
    }

    public function logout()
    {
        Auth::logout();
        http_response_code(303);
        header('Location: /login');
        exit;
    }

    private function redirectByRole($role)
    {
        http_response_code(303);
        if ($role === 'super_admin') {
            header('Location: /owner/dashboard');
        } elseif ($role === 'courier') {
            header('Location: /courier/dashboard');
        } else {
            header('Location: /admin/dashboard');
        }
        exit;
    }
}
