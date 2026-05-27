<?php
// CORS — must run before any output
// Echo back the request Origin so any frontend can call the API while keeping
// credentialed requests working (the spec forbids "*" with credentials).
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}
header("Vary: Origin");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function json_response($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

set_exception_handler(function (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
    ], 500);
});

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function current_user(): ?array {
    if (empty($_SESSION['user_id'])) return null;
    return [
        'id'          => (int)$_SESSION['user_id'],
        'role'        => $_SESSION['role'],
        'name'        => $_SESSION['name']        ?? null,
        'email'       => $_SESSION['email']       ?? null,
        'blood_group' => $_SESSION['blood_group'] ?? null,
        'address'     => $_SESSION['address']     ?? null,
    ];
}

function require_auth(): array {
    $user = current_user();
    if (!$user) json_response(['success' => false, 'message' => 'Authentication required.'], 401);
    return $user;
}

function require_role(string $role): array {
    $user = require_auth();
    if ($user['role'] !== $role) {
        json_response(['success' => false, 'message' => 'Forbidden.'], 403);
    }
    return $user;
}
