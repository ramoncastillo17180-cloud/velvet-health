<?php session_start(); ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Velvet Health - Cursos</title>
  <link rel="stylesheet" href="styles.css" />
  <script defer src="script.js"></script>
</head>
<body>
  <header>
    <div class="left-space"></div>
    <div class="logo-container">
      <img src="logo2.png" alt="Velvet Health Logo" class="logo-img" />
    </div>

    <div class="profile-dropdown">
      <button class="profile-btn" onclick="toggleDropdown()">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="black" stroke-width="2"/>
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="black" stroke-width="2"/>
        </svg>
      </button>

      <!-- Mostrar nombre usuario si hay sesión -->
      <?php if (isset($_SESSION['nombre'])): ?>
        <div class="user-name" style="text-align:center; font-weight:bold; color:#2b8b61; margin-top: 5px;">
          <?= htmlspecialchars($_SESSION['nombre']) ?>
        </div>
      <?php endif; ?>

      <div class="dropdown-menu" id="dropdownMenu">
        <?php if (isset($_SESSION['nombre'])): ?>
          <a href="logout.php" class="dropdown-btn primary">Cerrar sesión</a>
        <?php else: ?>
          <a href="login.html" class="dropdown-btn primary">Iniciar sesión</a>
          <a href="registro.html" class="dropdown-btn secondary">Registrarse</a>
        <?php endif; ?>
      </div>
    </div>
  </header>

  <main>
    <h1>Cursos</h1>
    <div class="content">
      <div class="courses-container">
        <div class="course-card" data-name="RCP" onclick="toggleCourse(this)">
          <div class="course-info">
            <img src="reanimacion.png" alt="RCP" />
            <div>
              <div class="course-title">Reanimación Cardiopulmonar</div>
              <div class="course-minutes">Mínimo 70% — Minutos 20</div>
            </div>
          </div>
        </div>

        <div class="course-card" data-name="Hemorragias" onclick="toggleCourse(this)">
          <div class="course-info">
            <img src="hemorragia.png" alt="Hemorragias" />
            <div>
              <div class="course-title">Hemorragias Externas</div>
              <div class="course-minutes">Mínimo 70% — Minutos 60</div>
            </div>
          </div>
        </div>

        <div class="course-card" data-name="Heimlich" onclick="toggleCourse(this)">
          <div class="course-info">
            <img src="heimich.png" alt="Heimlich" />
            <div>
              <div class="course-title">Maniobra de Heimlich</div>
              <div class="course-minutes">Mínimo 70% — Minutos 15</div>
            </div>
          </div>
        </div>
      </div>

      <aside>
        <h3>Cursos seleccionados</h3>
        <ul class="order-list" id="selectedList"></ul>
        <a href="practicas.html" class="btn-start">Comenzar tus prácticas</a>
      </aside>
    </div>
  </main>

  <script>
    function toggleDropdown() {
      document.getElementById("dropdownMenu").classList.toggle("show");
    }

    window.onclick = function(event) {
      if (!event.target.closest(".profile-dropdown")) {
        document.getElementById("dropdownMenu").classList.remove("show");
      }
    };
  </script>
</body>
</html>
