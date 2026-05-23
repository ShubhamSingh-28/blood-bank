<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

include_once '../config/db.php';

class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function register($data) {
        $name = $this->conn->real_escape_string($data['name']);
        $email = $this->conn->real_escape_string($data['email']);
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $role = $this->conn->real_escape_string($data['role']);
        $blood_group = isset($data['blood_group']) ? $this->conn->real_escape_string($data['blood_group']) : null;
        $address = isset($data['address']) ? $this->conn->real_escape_string($data['address']) : null;

        // Check if email exists
        $check_query = "SELECT id FROM " . $this->table_name . " WHERE email = '$email'";
        $result = $this->conn->query($check_query);
        if ($result->num_rows > 0) {
            return ["success" => false, "message" => "Email already registered."];
        }

        $query = "INSERT INTO " . $this->table_name . " (name, email, password, role, blood_group, address) 
                  VALUES ('$name', '$email', '$password', '$role', '$blood_group', '$address')";

        if ($this->conn->query($query)) {
            return ["success" => true, "message" => "Registration successful."];
        }
        return ["success" => false, "message" => "Registration failed: " . $this->conn->error];
    }
}

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['name']) && !empty($data['email']) && !empty($data['password']) && !empty($data['role'])) {
    $response = $user->register($data);
    if ($response['success']) {
        http_response_code(201);
    } else {
        http_response_code(400);
    }
    echo json_encode($response);
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete data."]);
}
?>