<?php
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/db.php';

class Inventory {
    private $conn;
    public function __construct($db) { $this->conn = $db; }

    public function publicList(): array {
        $sql = "SELECT i.id AS inventory_id, i.blood_group, i.units,
                       u.id AS hospital_id, u.name AS hospital_name, u.address
                FROM blood_inventory i
                JOIN users u ON u.id = i.hospital_id
                WHERE i.units > 0 AND u.role = 'hospital'
                ORDER BY u.name ASC, i.blood_group ASC";
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function forHospital(int $hospitalId): array {
        $stmt = $this->conn->prepare(
            "SELECT id, blood_group, units FROM blood_inventory WHERE hospital_id = ? ORDER BY blood_group ASC"
        );
        $stmt->bind_param("i", $hospitalId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function addUnits(int $hospitalId, string $bloodGroup, int $units): bool {
        $stmt = $this->conn->prepare(
            "INSERT INTO blood_inventory (hospital_id, blood_group, units)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE units = units + VALUES(units)"
        );
        $stmt->bind_param("isi", $hospitalId, $bloodGroup, $units);
        return $stmt->execute();
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$db     = (new Database())->getConnection();
$inv    = new Inventory($db);

$validBloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

if ($method === 'GET') {
    if (isset($_GET['mine'])) {
        $user = require_role('hospital');
        json_response(['success' => true, 'data' => $inv->forHospital($user['id'])]);
    }
    json_response(['success' => true, 'data' => $inv->publicList()]);
}

if ($method === 'POST') {
    $user  = require_role('hospital');
    $data  = read_json_body();
    $bg    = $data['blood_group'] ?? '';
    $units = (int)($data['units'] ?? 0);

    if (!in_array($bg, $validBloodGroups, true)) {
        json_response(['success' => false, 'message' => 'Invalid blood group.'], 400);
    }
    if ($units < 1) {
        json_response(['success' => false, 'message' => 'Units must be at least 1.'], 400);
    }

    if ($inv->addUnits($user['id'], $bg, $units)) {
        json_response(['success' => true, 'message' => 'Inventory updated.']);
    }
    json_response(['success' => false, 'message' => 'Failed to update inventory.'], 500);
}

json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
