<?php
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/db.php';

class Requests {
    private $conn;
    public function __construct($db) { $this->conn = $db; }

    private static array $compatibility = [
        'O-'  => ['O-'],
        'O+'  => ['O+', 'O-'],
        'A-'  => ['A-', 'O-'],
        'A+'  => ['A+', 'A-', 'O+', 'O-'],
        'B-'  => ['B-', 'O-'],
        'B+'  => ['B+', 'B-', 'O+', 'O-'],
        'AB-' => ['AB-', 'A-', 'B-', 'O-'],
        'AB+' => ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
    ];

    public static function isEligible(?string $receiverBg, string $sampleBg): bool {
        return $receiverBg !== null
            && isset(self::$compatibility[$receiverBg])
            && in_array($sampleBg, self::$compatibility[$receiverBg], true);
    }

    public function listForHospital(int $hospitalId): array {
        $stmt = $this->conn->prepare(
            "SELECT r.id, r.blood_group, r.status, r.request_date,
                    u.name AS receiver_name, u.email AS receiver_email, u.blood_group AS receiver_blood_group
             FROM blood_requests r
             JOIN users u ON u.id = r.receiver_id
             WHERE r.hospital_id = ?
             ORDER BY r.request_date DESC"
        );
        $stmt->bind_param("i", $hospitalId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function listForReceiver(int $receiverId): array {
        $stmt = $this->conn->prepare(
            "SELECT r.id, r.blood_group, r.status, r.request_date, u.name AS hospital_name
             FROM blood_requests r
             JOIN users u ON u.id = r.hospital_id
             WHERE r.receiver_id = ?
             ORDER BY r.request_date DESC"
        );
        $stmt->bind_param("i", $receiverId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function hasActiveRequest(int $receiverId, int $hospitalId, string $bloodGroup): bool {
        $stmt = $this->conn->prepare(
            "SELECT id FROM blood_requests
             WHERE receiver_id = ? AND hospital_id = ? AND blood_group = ?
               AND status IN ('pending','approved')"
        );
        $stmt->bind_param("iis", $receiverId, $hospitalId, $bloodGroup);
        $stmt->execute();
        return $stmt->get_result()->num_rows > 0;
    }

    public function create(int $receiverId, int $hospitalId, string $bloodGroup): bool {
        $stmt = $this->conn->prepare(
            "INSERT INTO blood_requests (receiver_id, hospital_id, blood_group) VALUES (?, ?, ?)"
        );
        $stmt->bind_param("iis", $receiverId, $hospitalId, $bloodGroup);
        return $stmt->execute();
    }

    public function approve(int $requestId, int $hospitalId): array {
        $this->conn->begin_transaction();
        try {
            $stmt = $this->conn->prepare(
                "SELECT hospital_id, blood_group, status FROM blood_requests WHERE id = ? FOR UPDATE"
            );
            $stmt->bind_param("i", $requestId);
            $stmt->execute();
            $req = $stmt->get_result()->fetch_assoc();
            if (!$req)                                   throw new Exception('Request not found.');
            if ((int)$req['hospital_id'] !== $hospitalId) throw new Exception('Not your request.');
            if ($req['status'] !== 'pending')             throw new Exception('Request already processed.');

            $stmt = $this->conn->prepare(
                "SELECT id, units FROM blood_inventory WHERE hospital_id = ? AND blood_group = ? FOR UPDATE"
            );
            $stmt->bind_param("is", $hospitalId, $req['blood_group']);
            $stmt->execute();
            $inv = $stmt->get_result()->fetch_assoc();
            if (!$inv || (int)$inv['units'] < 1) throw new Exception('No units available to fulfill request.');

            $stmt = $this->conn->prepare("UPDATE blood_inventory SET units = units - 1 WHERE id = ?");
            $stmt->bind_param("i", $inv['id']);
            $stmt->execute();

            $stmt = $this->conn->prepare("UPDATE blood_requests SET status = 'approved' WHERE id = ?");
            $stmt->bind_param("i", $requestId);
            $stmt->execute();

            $this->conn->commit();
            return ['success' => true, 'message' => 'Request approved.'];
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function reject(int $requestId, int $hospitalId): bool {
        $stmt = $this->conn->prepare(
            "UPDATE blood_requests SET status = 'rejected'
             WHERE id = ? AND hospital_id = ? AND status = 'pending'"
        );
        $stmt->bind_param("ii", $requestId, $hospitalId);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$db     = (new Database())->getConnection();
$repo   = new Requests($db);

if ($method === 'GET') {
    $user = require_auth();
    $data = $user['role'] === 'hospital'
        ? $repo->listForHospital($user['id'])
        : $repo->listForReceiver($user['id']);
    json_response(['success' => true, 'data' => $data]);
}

if ($method === 'POST') {
    $user        = require_role('receiver');
    $data        = read_json_body();
    $hospitalId  = (int)($data['hospital_id'] ?? 0);
    $bloodGroup  = $data['blood_group'] ?? '';

    if ($hospitalId <= 0 || $bloodGroup === '') {
        json_response(['success' => false, 'message' => 'Invalid input.'], 400);
    }
    if (!Requests::isEligible($user['blood_group'], $bloodGroup)) {
        json_response(['success' => false, 'message' => 'You are not eligible for this blood group.'], 403);
    }
    if ($repo->hasActiveRequest($user['id'], $hospitalId, $bloodGroup)) {
        json_response(['success' => false, 'message' => 'You have already requested this blood group from this hospital.'], 409);
    }
    if ($repo->create($user['id'], $hospitalId, $bloodGroup)) {
        json_response(['success' => true, 'message' => 'Request sent successfully.']);
    }
    json_response(['success' => false, 'message' => 'Failed to send request.'], 500);
}

if ($method === 'PUT') {
    $user   = require_role('hospital');
    $data   = read_json_body();
    $id     = (int)($data['id']     ?? 0);
    $status = $data['status']       ?? '';
    if ($id <= 0) json_response(['success' => false, 'message' => 'Invalid request id.'], 400);

    if ($status === 'approved') {
        $res = $repo->approve($id, $user['id']);
        json_response($res, $res['success'] ? 200 : 400);
    }
    if ($status === 'rejected') {
        if ($repo->reject($id, $user['id'])) {
            json_response(['success' => true, 'message' => 'Request rejected.']);
        }
        json_response(['success' => false, 'message' => 'Could not reject request.'], 400);
    }
    json_response(['success' => false, 'message' => 'Invalid status.'], 400);
}

json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
