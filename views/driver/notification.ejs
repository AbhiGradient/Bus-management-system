<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Notifications | Smart College Bus</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />
  <link href="/css/style.css" rel="stylesheet" />
</head>
<body>

  <nav class="navbar navbar-dark bg-dark px-3">
    <a class="navbar-brand" href="/driver/dashboard"><i class="bi bi-bus-front"></i> College Bus <span>Driver</span></a>
    <div class="d-flex align-items-center text-white">
      <span class="me-3"><i class="bi bi-person-circle"></i> <%= user.name %></span>
      <a href="/logout" class="btn btn-outline-light btn-sm"><i class="bi bi-box-arrow-right"></i> Logout</a>
    </div>
  </nav>

  <div class="d-flex">
    <div class="sidebar" style="width: 230px;">
      <ul class="nav flex-column">
        <li class="nav-item"><a class="nav-link" href="/driver/dashboard"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
        <li class="nav-item"><a class="nav-link" href="/driver/today-route"><i class="bi bi-signpost-split"></i> Today's Route</a></li>
        <li class="nav-item"><a class="nav-link" href="/driver/trip-start"><i class="bi bi-play-circle"></i> Start Trip</a></li>
        <li class="nav-item"><a class="nav-link" href="/driver/trip-end"><i class="bi bi-stop-circle"></i> End Trip</a></li>
        <li class="nav-item"><a class="nav-link" href="/driver/attendence"><i class="bi bi-clipboard-check"></i> Attendance</a></li>
        <li class="nav-item"><a class="nav-link" href="/driver/live-location"><i class="bi bi-geo-alt"></i> Live Location</a></li>
        <li class="nav-item"><a class="nav-link active" href="/driver/notifications"><i class="bi bi-bell"></i> Notifications</a></li>
        <li class="nav-item"><a class="nav-link" href="/driver/driver-profile"><i class="bi bi-person-badge"></i> Profile</a></li>
      </ul>
    </div>

    <div class="main-content flex-grow-1">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 class="mb-0">
          <i class="bi bi-bell"></i> Notifications
          <% const unreadCount = notifications.filter(n => !n.is_read).length; %>
          <% if (unreadCount > 0) { %>
            <span class="badge bg-danger rounded-pill align-middle"><%= unreadCount %> new</span>
          <% } %>
        </h3>
        <% if (notifications.length > 0) { %>
          <form action="/driver/notifications/read-all?_method=PUT" method="POST">
            <button type="submit" class="btn btn-secondary btn-sm"><i class="bi bi-check2-all"></i> Mark All as Read</button>
          </form>
        <% } %>
      </div>

      <div class="card p-3">
        <% if (notifications.length === 0) { %>
          <p class="text-muted text-center py-4 mb-0">You have no notifications yet.</p>
        <% } else { %>
          <ul class="list-group list-group-flush">
            <% notifications.forEach(n => { %>
              <li class="list-group-item d-flex justify-content-between align-items-start <%= !n.is_read ? 'bg-light' : '' %>">
                <div class="me-3">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi <%= n.is_read ? 'bi-bell' : 'bi-bell-fill text-warning' %>"></i>
                    <strong><%= n.title %></strong>
                    <% if (!n.is_read) { %><span class="badge badge-status bg-warning text-dark">Unread</span><% } %>
                  </div>
                  <p class="mb-1 mt-1 text-muted"><%= n.message %></p>
                  <small class="text-muted"><%= new Date(n.created_at).toLocaleString() %></small>
                </div>
              </li>
            <% }) %>
          </ul>
        <% } %>
      </div>

    </div>
  </div>

   <%- include('footer') %>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/script.js"></script>
</body>
</html>
