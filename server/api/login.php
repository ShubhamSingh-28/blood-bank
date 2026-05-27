<?php
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data     = read_json_body();
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';

if ($email === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Email and password are required.'], 400);
}

$db   = (new Database())->getConnection();
$stmt = $db->prepare("SELECT id, name, email, password, role, blood_group, address FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Invalid credentials.'], 401);
}

$user = $result->fetch_assoc();
if (!password_verify($password, $user['password'])) {
    json_response(['success' => false, 'message' => 'Invalid credentials.'], 401);
}

session_regenerate_id(true);
$_SESSION['user_id']     = (int)$user['id'];
$_SESSION['role']        = $user['role'];
$_SESSION['name']        = $user['name'];
$_SESSION['email']       = $user['email'];
$_SESSION['blood_group'] = $user['blood_group'];
$_SESSION['address']     = $user['address'];

unset($user['password']);
$user['id'] = (int)$user['id'];
json_response(['success' => true, 'user' => $user]);
