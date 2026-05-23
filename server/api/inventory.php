<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

include_once '../config/db.php';

class Inventory {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getPublicInventory() {
        $query = "SELECT i.id as inventory_id, i.blood_group, i.units, u.id as hospital_id, u.name as hospital_name, u.address 
                  FROM blood_inventory i 
                  JOIN users u ON i.hospital_id = u.id 
                  WHERE i.units > 0 AND u.role = 'hospital'";
        $result = $this->conn->query($query);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        return ["success" => true, "data" => $data];
    }

    public function getHospitalInventory($hospital_id) {
        $hospital_id = $this->conn->real_escape_string($hospital_id);
        $query = "SELECT * FROM blood_inventory WHERE hospital_id = '$hospital_id'";
        $result = $this->conn->query($query);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        return ["success" => true, "data" => $data];
    }

    public function addOrUpdateUnits($hospital_id, $blood_group, $units) {
        $hospital_id = $this->conn->real_escape_string($hospital_id);
        $blood_group = $this->conn->real_escape_string($blood_group);
        $units = (int)$units;

        $check_query = "SELECT id, units FROM blood_inventory WHERE hospital_id = '$hospital_id' AND blood_group = '$blood_group'";
        $result = $this->conn->query($check_query);

        if ($result->num_rows > 0) {
            $query = "UPDATE blood_inventory SET units = units + $units WHERE hospital_id = '$hospital_id' AND blood_group = '$blood_group'";
        } else {
            $query = "INSERT INTO blood_inventory (hospital_id, blood_group, units) VALUES ('$hospital_id', '$blood_group', $units)";
        }

        if ($this->conn->query($query)) {
            return ["success" => true, "message" => "Inventory updated successfully."];
        }
        return ["success" => false, "message" => "Failed to update inventory: " . $this->conn->error];
    }
}

$database = new Database();
$db = $database->getConnection();
$inventory = new Inventory($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['hospital_id'])) {
        echo json_encode($inventory->getHospitalInventory($_GET['hospital_id']));
    } else {
        echo json_encode($inventory->getPublicInventory());
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data['hospital_id']) && !empty($data['blood_group']) && isset($data['units'])) {
        echo json_encode($inventory->addOrUpdateUnits($data['hospital_id'], $data['blood_group'], $data['units']));
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input."]);
    }
}
?>