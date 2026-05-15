<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function Login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            
            $role = Auth::user()->role;
            if ($role === 'super_admin') {
                return redirect()->intended('/owner/dashboard');
            } elseif ($role === 'courier') {
                return redirect()->intended('/courier/dashboard');
            }
            
            return redirect()->intended('/admin/dashboard');
        }

        return back()->withErrors([
            'email' => 'Email atau password salah',
        ]);
    }
    public function Logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }
}
