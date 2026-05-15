<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class CourierController extends Controller
{
    public function index()
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'staff') return abort(403);

        $couriers = User::where('branch_id', $admin->branch_id)
                        ->where('role', 'courier')
                        ->get();

        return Inertia::render('admin/couriers', [
            'couriers' => $couriers
        ]);
    }

    public function store(Request $request)
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'staff') return abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'courier',
            'branch_id' => $admin->branch_id,
        ]);

        return redirect()->back()->with('success', 'Kurir berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'staff') return abort(403);

        $courier = User::where('branch_id', $admin->branch_id)
                       ->where('role', 'courier')
                       ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
        ]);

        $courier->name = $validated['name'];
        $courier->email = $validated['email'];
        if (!empty($validated['password'])) {
            $courier->password = Hash::make($validated['password']);
        }
        $courier->save();

        return redirect()->back()->with('success', 'Data kurir berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'staff') return abort(403);

        $courier = User::where('branch_id', $admin->branch_id)
                       ->where('role', 'courier')
                       ->findOrFail($id);
                       
        $courier->delete();

        return redirect()->back()->with('success', 'Kurir berhasil dihapus.');
    }
}
