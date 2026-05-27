<?php
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/db.php';

class UserRepo {
    private $conn;
    public function __construct($db) { $this->conn = $db; }

    public function emailExists(string $email): bool {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        return $stmt->get_result()->num_rows > 0;
    }

    public function create(string $name, string $email, string $password, string $role, ?string $bloodGroup, ?string $address): bool {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->conn->prepare(
            "INSERT INTO users (name, email, password, role, blood_group, address) VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssssss", $name, $email, $hash, $role, $bloodGroup, $address);
        return $stmt->execute();
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data        = read_json_body();
$name        = trim($data['name']        ?? '');
$email       = trim($data['email']       ?? '');
$password    = $data['password']         ?? '';
$role        = $data['role']             ?? '';
$bloodGroup  = $data['blood_group']      ?? null;
$address     = trim($data['address']     ?? '');

$validBloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

if ($name === '' || $email === '' || $password === '' || $role === '') {
    json_response(['success' => false, 'message' => 'All required fields must be filled.'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['success' => false, 'message' => 'Invalid email format.'], 400);
}
if (strlen($password) < 6) {
    json_response(['success' => false, 'message' => 'Password must be at least 6 characters.'], 400);
}
if (!in_array($role, ['hospital', 'receiver'], true)) {
    json_response(['success' => false, 'message' => 'Invalid role.'], 400);
}
if ($role === 'receiver') {
    if (!in_array($bloodGroup, $validBloodGroups, true)) {
        json_response(['success' => false, 'message' => 'Invalid blood group.'], 400);
    }
} else {
    $bloodGroup = null;
}

$db   = (new Database())->getConnection();
$repo = new UserRepo($db);

if ($repo->emailExists($email)) {
    json_response(['success' => false, 'message' => 'Email already registered.'], 409);
}

if ($repo->create($name, $email, $password, $role, $bloodGroup, $address ?: null)) {
    json_response(['success' => true, 'message' => 'Registration successful.'], 201);
}
json_response(['success' => false, 'message' => 'Registration failed.'], 500);
