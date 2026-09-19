<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conexion = new mysqli("localhost", "root", "", "velvet_health2");

    if ($conexion->connect_error) {
        die("Error de conexión: " . $conexion->connect_error);
    }

    $nombre     = $_POST['nombre'] ?? '';
    $apellidos  = $_POST['apellidos'] ?? '';
    $profesion  = $_POST['profesion'] ?? '';
    $edad       = intval($_POST['edad'] ?? 0);
    $correo     = $_POST['correo'] ?? '';
    $contraseña = password_hash($_POST['contraseña'] ?? '', PASSWORD_DEFAULT);

    $sql = "INSERT INTO usuarios (nombre, apellidos, profesion, edad, correo, contraseña) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("sssiss", $nombre, $apellidos, $profesion, $edad, $correo, $contraseña);

    if ($stmt->execute()) {
        $_SESSION['nombre'] = $nombre;

        // Esta es la línea que redirige a index.php
        header("Location: index.php");
        exit;
    } else {
        echo "Error al registrar: " . $stmt->error;
    }

    $stmt->close();
    $conexion->close();
} else {
    echo "Solo se aceptan solicitudes POST.";
}
?>
