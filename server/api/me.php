<?php
require_once __DIR__ . '/../config/auth.php';

$user = current_user();
json_response(['success' => (bool)$user, 'user' => $user]);
