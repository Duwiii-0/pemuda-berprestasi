<?php

namespace App\Http\Controllers;

use App\Models\Akun;
use App\Models\Pelatih;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new pelatih.
     */
    public function register(RegisterRequest $request)
    {
        $validatedData = $request->validated();

        try {
            $userResponse = null;

            DB::transaction(function () use ($validatedData, &$userResponse) {
                // Create Akun
                $akun = Akun::create([
                    'email' => $validatedData['email'],
                    'password_hash' => Hash::make($validatedData['password']),
                    'role' => 'PELATIH',
                ]);

                // Create Pelatih
                $pelatih = Pelatih::create([
                    'nama_pelatih' => $validatedData['nama_pelatih'],
                    'nik' => $validatedData['nik'],
                    'no_telp' => $validatedData['no_telp'] ?? null,
                    'id_akun' => $akun->id_akun,
                    'id_dojang' => $validatedData['id_dojang'],
                ]);

                $token = $akun->createToken('auth_token')->plainTextToken;

                $userResponse = [
                    'token' => $token,
                    'user' => [
                        'id_akun' => $akun->id_akun,
                        'email' => $akun->email,
                        'role' => $akun->role,
                        'pelatih' => $pelatih,
                    ]
                ];
            });

            return response()->json($userResponse, 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Authenticate a user and return a token.
     */
    public function login(LoginRequest $request)
    {
        $credentials = [
            'email' => $request->email,
            'password' => $request->password
        ];

        // We use Auth::attempt with a custom guard 'akuns'
        if (!Auth::guard('akuns')->attempt($credentials)) {
             throw ValidationException::withMessages([
                'email' => ['Invalid credentials'],
            ]);
        }
        
        $akun = Auth::guard('akuns')->user();

        // Eager load relationships
        $akun->load(['pelatih.dojang', 'admin', 'adminKompetisi']);

        $token = $akun->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $akun,
        ]);
    }

    /**
     * Log the user out.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function getProfile(Request $request)
    {
        // The $request->user() from sanctum middleware already provides the logged-in user.
        return response()->json($request->user()->load(['pelatih.dojang', 'admin', 'adminKompetisi']));
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->getAuthPassword())) {
            return response()->json(['message' => 'Current password is incorrect'], 400);
        }

        $user->password_hash = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }

    /**
     * Reset the user's password.
     */
    public function resetPassword(Request $request)
    {
        // This is a simplified version. A full implementation would involve sending a token via email.
        $request->validate([
            'email' => 'required|email|exists:tb_akun,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $akun = Akun::where('email', $request->email)->first();
        $akun->password_hash = Hash::make($request->password);
        $akun->save();

        return response()->json(['message' => 'Password reset successfully']);
    }
}
