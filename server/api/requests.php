<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

include_once '../config/db.php';

class RequestManager {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getRequests($user_id, $role) {
        $user_id = $this->conn->real_escape_string($user_id);
        if ($role === 'hospital') {
            $query = "SELECT r.*, u.name as receiver_name, u.blood_group as receiver_blood_group 
                      FROM blood_requests r 
                      JOIN users u ON r.receiver_id = u.id 
                      WHERE r.hospital_id = '$user_id'";
        } else {
            $query = "SELECT r.*, u.name as hospital_name 
                      FROM blood_requests r 
                      JOIN users u ON r.hospital_id = u.id 
                      WHERE r.receiver_id = '$user_id'";
        }
        
        $result = $this->conn->query($query);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        return ["success" => true, "data" => $data];
    }

    public function makeRequest($receiver_id, $hospital_id, $blood_group) {
        $receiver_id = $this->conn->real_escape_string($receiver_id);
        $hospital_id = $this->conn->real_escape_string($hospital_id);
        $blood_group = $this->conn->real_escape_string($blood_group);

        // Receiver cannot request for same blood sample from the same hospital multiple times if pending/approved
        $check = $this->conn->query("SELECT id FROM blood_requests WHERE receiver_id='$receiver_id' AND hospital_id='$hospital_id' AND blood_group='$blood_group' AND status IN ('pending', 'approved')");
        if ($check->num_rows > 0) {
            return ["success" => false, "message" => "You have already requested this blood group from this hospital."];
        }

        $query = "INSERT INTO blood_requests (receiver_id, hospital_id, blood_group) VALUES ('$receiver_id', '$hospital_id', '$blood_group')";
        if ($this->conn->query($query)) {
            return ["success" => true, "message" => "Request sent successfully."];
        }
        return ["success" => false, "message" => "Failed to send request: " . $this->conn->error];
    }

    public function updateStatus($request_id, $status) {
        $request_id = $this->conn->real_escape_string($request_id);
        $status = $this->conn->real_escape_string($status);

        $query = "UPDATE blood_requests SET status = '$status' WHERE id = '$request_id'";
        if ($this->conn->query($query)) {
            return ["success" => true, "message" => "Status updated to $status."];
        }
        return ["success" => false, "message" => "Failed to update status."];
    }
}

$database = new Database();
$db = $database->getConnection();
$requestManager = new RequestManager($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!empty($_GET['user_id']) && !empty($_GET['role'])) {
        echo json_encode($requestManager->getRequests($_GET['user_id'], $_GET['role']));
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing parameters."]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data['receiver_id']) && !empty($data['hospital_id']) && !empty($data['blood_group'])) {
        echo json_encode($requestManager->makeRequest($data['receiver_id'], $data['hospital_id'], $data['blood_group']));
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input."]);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data['id']) && !empty($data['status'])) {
        echo json_encode($requestManager->updateStatus($data['id'], $data['status']));
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input."]);
    }
}
?>