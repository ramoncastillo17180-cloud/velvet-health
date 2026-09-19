let selectedCourses = {};

function toggleCourse(card) {
  const name = card.dataset.name;

  if (selectedCourses[name]) {
    delete selectedCourses[name];
    card.classList.remove('selected');
  } else {
    selectedCourses[name] = 1;
    card.classList.add('selected');
  }

  updateSelectedList();
}

function updateSelectedList() {
  const list = document.getElementById('selectedList');
  list.innerHTML = '';

  let total = 0;
  for (const [course, count] of Object.entries(selectedCourses)) {
    const li = document.createElement('li');
    li.textContent = `${course}`;
    list.appendChild(li);
    total += count;
  }

  if (total > 0) {
    const totalLi = document.createElement('li');
    totalLi.innerHTML = `<strong>Total</strong> ${total}`;
    list.appendChild(totalLi);
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById('dropdownMenu');
  dropdown.classList.toggle('show');
}

window.onclick = function(event) {
  if (!event.target.closest('.profile-dropdown')) {
    document.getElementById('dropdownMenu').classList.remove('show');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const userName = localStorage.getItem('usuarioRegistrado');
  const userNameDiv = document.getElementById('userName');
  const menuNoLogin = document.getElementById('menuNoLogin');
  const menuLogged = document.getElementById('menuLogged');

  if (userName) {
    userNameDiv.textContent = userName;
    userNameDiv.style.display = 'block';
    menuNoLogin.style.display = 'none';
    menuLogged.style.display = 'block';
  } else {
    userNameDiv.style.display = 'none';
    menuNoLogin.style.display = 'block';
    menuLogged.style.display = 'none';
  }

  const btnLogout = document.getElementById('btnLogout');
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('usuarioRegistrado');
    userNameDiv.style.display = 'none';
    menuNoLogin.style.display = 'block';
    menuLogged.style.display = 'none';
    toggleDropdown(); 
  });
});
