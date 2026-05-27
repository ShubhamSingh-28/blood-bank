<?php
class Database {
    private $host     = "localhost";
    private $user     = "root";
    private $password = "";
    private $database = "blood_bank";
    public  $conn;

    public function getConnection(): mysqli {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        try {
            $this->conn = new mysqli($this->host, $this->user, $this->password, $this->database);
            $this->conn->set_charset('utf8mb4');
        } catch (mysqli_sql_exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
