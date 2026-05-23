<?php
class Database {
    private $host = "localhost";
    private $user = "root";
    private $password = "";
    private $database = "blood_bank";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        $this->conn = new mysqli($this->host, $this->user, $this->password, $this->database);
        
        if ($this->conn->connect_error) {
            die(json_encode(["success" => false, "message" => "Database connection failed."]));
        }
        return $this->conn;
    }
}
?>