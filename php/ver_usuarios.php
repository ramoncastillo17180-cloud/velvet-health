<?php
$conexion = new mysqli("localhost", "root", "", "velvet_health2");

if ($conexion->connect_error) {
    die("❌ Error de conexión: " . $conexion->connect_error);
}

$sql = "SELECT id, nombre, apellidos, profesion, edad, correo FROM usuarios";
$resultado = $conexion->query($sql);
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Usuarios Registrados</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    h1 {
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Usuarios Registrados</h1>

  <table>
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Apellidos</th>
      <th>Profesión</th>
      <th>Edad</th>
      <th>Correo</th>
    </tr>

    <?php while ($fila = $resultado->fetch_assoc()): ?>
    <tr>
      <td><?= $fila['id'] ?></td>
      <td><?= htmlspecialchars($fila['nombre']) ?></td>
      <td><?= htmlspecialchars($fila['apellidos']) ?></td>
      <td><?= htmlspecialchars($fila['profesion']) ?></td>
      <td><?= $fila['edad'] ?></td>
      <td><?= htmlspecialchars($fila['correo']) ?></td>
    </tr>
    <?php endwhile; ?>
  </table>
</body>
</html>

<?php
$conexion->close();
?>
