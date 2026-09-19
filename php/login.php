<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conexion = new mysqli("localhost", "root", "", "velvet_health2");

    if ($conexion->connect_error) {
        die("Error de conexión: " . $conexion->connect_error);
    }

    $correo     = $_POST['correo'] ?? '';
    $contraseña = $_POST['contraseña'] ?? '';

    $sql = "SELECT nombre, contraseña FROM usuarios WHERE correo = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 1) {
        $usuario = $resultado->fetch_assoc();

        if (password_verify($contraseña, $usuario['contraseña'])) {
            $_SESSION['nombre'] = $usuario['nombre'];
            header("Location: bienvenida.php");
            exit;
        } else {
            echo "❌ Contraseña incorrecta.";
        }
    } else {
        echo "❌ Usuario no encontrado.";
    }

    $stmt->close();
    $conexion->close();
} else {
    echo "❌ Este archivo solo acepta solicitudes POST.";
}
