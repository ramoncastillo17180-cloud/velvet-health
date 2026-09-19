<?php
session_start();
if (!isset($_SESSION['nombre'])) {
    header("Location: registro.html");
    exit;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bienvenido - Velvet Health</title>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .welcome-container {
      background: white;
      padding: 2rem 3rem;
      border-radius: 16px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    h1 {
      color: #2b8b61;
      margin-bottom: 1rem;
    }
    a {
      display: inline-block;
      margin-top: 1.5rem;
      background-color: #3cb371;
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
    a:hover {
      background-color: #2a9659;
    }
  </style>
</head>
<body>
  <div class="welcome-container">
    <h1>🎉 ¡Bienvenido, <?php echo htmlspecialchars($_SESSION['nombre']); ?>!</h1>
    <p>Gracias por registrarte en Velvet Health.</p>
    <a href="index.html">Ir a la página principal</a>
  </div>
</body>
</html>
