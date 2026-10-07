const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginButton = document.getElementById('login-button');
const dashboardError = document.getElementById('dashboard-error');
const globalStatus = document.getElementById('global-status');

const formatNumber = value => new Intl.NumberFormat().format(Number(value) || 0);
const formatDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const showLogin = () => {
  dashboardView.hidden = true;
  loginView.hidden = false;
  document.getElementById('admin-password').value = '';
};

const showDashboard = () => {
  loginView.hidden = true;
  dashboardView.hidden = false;
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const result = await response.json().catch(() => null);
  if (response.status === 401) {
    showLogin();
    throw new Error('Your administrator session expired. Sign in again.');
  }
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string' ? result.error : `Request failed (${response.status}).`);
  }
  return result;
};

const createCountryRow = (country, largestCount) => {
  const row = document.createElement('div');
  row.className = 'country-row';
  const name = document.createElement('span');
  name.className = 'country-name';
  name.textContent = country.country || 'Unknown';
  const track = document.createElement('span');
  track.className = 'country-track';
  const fill = document.createElement('span');
  fill.className = 'country-fill';
  fill.style.display = 'block';
  fill.style.width = `${Math.max(3, Math.min(100, (country.total / largestCount) * 100))}%`;
  track.append(fill);
  const count = document.createElement('span');
  count.className = 'country-count';
  count.textContent = formatNumber(country.total);
  row.append(name, track, count);
  return row;
};

const createUserRow = user => {
  const row = document.createElement('tr');
  const personCell = document.createElement('td');
  const person = document.createElement('div');
  person.className = 'person-cell';
  let avatar;
  if (user.avatar_path) {
    avatar = document.createElement('img');
    avatar.className = 'person-avatar';
    avatar.src = `/api/admin/avatar/${encodeURIComponent(user.id)}`;
    avatar.alt = '';
    avatar.loading = 'lazy';
    avatar.onerror = () => {
      const fallback = document.createElement('span');
      fallback.className = 'person-avatar';
      fallback.textContent = (user.display_name || user.full_name || '?').trim().slice(0, 1).toUpperCase();
      avatar.replaceWith(fallback);
    };
  } else {
    avatar = document.createElement('span');
    avatar.className = 'person-avatar';
    avatar.textContent = (user.display_name || user.full_name || '?').trim().slice(0, 1).toUpperCase();
  }
  const personCopy = document.createElement('span');
  personCopy.className = 'person-copy';
  const name = document.createElement('strong');
  name.textContent = user.display_name || user.full_name || 'Unnamed user';
  const email = document.createElement('small');
  email.textContent = user.email || '';
  personCopy.append(name, email);
  person.append(avatar, personCopy);
  personCell.append(person);

  const usernameCell = document.createElement('td');
  usernameCell.className = 'username';
  usernameCell.textContent = user.username ? `@${user.username}` : '—';

  const locationCell = document.createElement('td');
  const location = document.createElement('span');
  location.className = 'location-cell';
  const locationName = document.createElement('span');
  locationName.textContent = [user.region, user.country].filter(Boolean).join(', ') || 'Unavailable';
  location.append(locationName);
  if (user.country_code) {
    const code = document.createElement('span');
    code.className = 'location-code';
    code.textContent = user.country_code;
    location.append(code);
  }
  locationCell.append(location);

  const joinedCell = document.createElement('td');
  joinedCell.textContent = formatDate(user.created_at);
  row.append(personCell, usernameCell, locationCell, joinedCell);
  return row;
};

const renderDashboard = data => {
  const summary = data.summary || {};
  const users = Array.isArray(data.users) ? data.users : [];
  document.getElementById('metric-users').textContent = formatNumber(summary.total_users);

  if (data.github) {
    document.getElementById('metric-downloads').textContent = formatNumber(data.github.releaseDownloads);
    document.getElementById('metric-download-note').textContent = `${data.github.releasesIncluded} latest releases`;
    document.getElementById('metric-stars').textContent = formatNumber(data.github.stars);
    document.getElementById('github-link').href = data.github.repositoryUrl;
    document.getElementById('github-updated').textContent = `Updated ${formatDate(data.github.fetchedAt)} · refreshed every 10 minutes`;
  } else {
    document.getElementById('metric-downloads').textContent = '—';
    document.getElementById('metric-stars').textContent = '—';
    document.getElementById('github-updated').textContent = data.githubError || 'GitHub metrics are unavailable right now.';
  }

  const countries = Array.isArray(summary.countries) ? summary.countries : [];
  document.getElementById('country-total').textContent = `${countries.length} ${countries.length === 1 ? 'country' : 'countries'}`;
  const countryList = document.getElementById('country-list');
  countryList.replaceChildren();
  if (countries.length) {
    const largestCount = Math.max(...countries.map(country => Number(country.total) || 0), 1);
    countries.slice(0, 8).forEach(country => countryList.append(createCountryRow(country, largestCount)));
  } else {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Location insights appear when opted-in profiles are available.';
    countryList.append(empty);
  }

  const rows = document.getElementById('user-rows');
  rows.replaceChildren();
  if (users.length) users.forEach(user => rows.append(createUserRow(user)));
  else {
    const emptyRow = document.createElement('tr');
    const empty = document.createElement('td');
    empty.colSpan = 4;
    empty.className = 'empty-state';
    empty.textContent = 'No opted-in profiles yet.';
    emptyRow.append(empty);
    rows.append(emptyRow);
  }
  document.getElementById('user-count-label').textContent = `Latest ${users.length}`;
  document.getElementById('last-updated').textContent = `Updated ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date())}`;
  globalStatus.textContent = 'Dashboard updated.';
};

const loadDashboard = async () => {
  dashboardError.hidden = true;
  try {
    const data = await requestJson('/api/admin/dashboard');
    renderDashboard(data);
  } catch (error) {
    dashboardError.textContent = error.message || 'Could not load project analytics.';
    dashboardError.hidden = false;
  }
};

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.hidden = true;
  loginButton.disabled = true;
  loginButton.textContent = 'Signing in…';
  const formData = new FormData(loginForm);
  try {
    await requestJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    });
    showDashboard();
    await loadDashboard();
  } catch (error) {
    loginError.textContent = error.message || 'Sign-in failed.';
    loginError.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = 'Sign in <span aria-hidden="true">→</span>';
  }
});

document.getElementById('refresh-button').addEventListener('click', () => void loadDashboard());
document.getElementById('logout-button').addEventListener('click', async () => {
  try {
    await requestJson('/api/admin/logout', { method: 'POST', body: '{}' });
    showLogin();
  } catch (error) {
    dashboardError.textContent = error.message || 'Could not sign out.';
    dashboardError.hidden = false;
  }
});

requestJson('/api/admin/session')
  .then(session => {
    if (!session.authenticated) {
      showLogin();
      return;
    }
    showDashboard();
    void loadDashboard();
  })
  .catch(error => {
    showLogin();
    loginError.textContent = error.message || 'Could not check administrator access.';
    loginError.hidden = false;
  });
