/**
 * Multi-Tenant Education Platform - Swagger UI Header & Auth Automation Script
 *
 * Capabilities:
 * 1. Automatically intercepts POST /api/v1/auth/login and /auth/* responses, extracting
 *    accessToken and user institute context and setting them into Swagger UI's internal auth.
 * 2. Intercepts all outgoing fetch & XMLHttpRequest calls to /api/v1/* to ensure
 *    'Authorization: Bearer <token>' and 'X-Institute-Id: <id>' are attached.
 * 3. Persists authentication state and active tenant across browser refreshes in localStorage.
 * 4. Mounts an interactive Multi-Tenant Auth Control Bar at the top of Swagger UI.
 * 5. Pre-populates 'X-Institute-Id' parameter fields when expanding 'Try it out' on routes.
 */

(function () {
  console.log("[Swagger Automation] Multi-Tenant Auth & Header Controller loaded.");

  const STORAGE_KEY_TOKEN = "ep_auth_token";
  const STORAGE_KEY_INSTITUTE = "ep_institute_id";
  const STORAGE_KEY_USER = "ep_user_email";
  const DEFAULT_INSTITUTE = "8f047731-26b7-43ea-92a3-9d0e35e970ab";

  // Ensure default institute exists in storage
  if (!localStorage.getItem(STORAGE_KEY_INSTITUTE)) {
    localStorage.setItem(STORAGE_KEY_INSTITUTE, DEFAULT_INSTITUTE);
  }

  // -------------------------------------------------------------------------
  // 1. Toast Notification Helper
  // -------------------------------------------------------------------------
  function showToast(message, type = "success") {
    let container = document.getElementById("swagger-custom-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "swagger-custom-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `swagger-custom-toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === "success" ? "✅" : type === "info" ? "ℹ️" : "⚠️"}</div>
      <div class="toast-body">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // -------------------------------------------------------------------------
  // 2. Synchronize with Swagger UI window.ui.authActions
  // -------------------------------------------------------------------------
  function syncSwaggerUIAuth(token, instituteId) {
    if (!window.ui || !window.ui.authActions) return;

    const cleanToken = (token || "").replace(/^Bearer\s+/i, "").trim();
    const instId = (instituteId || "").trim();

    try {
      const authPayload = {};

      if (cleanToken) {
        authPayload.bearerAuth = {
          name: "bearerAuth",
          schema: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          value: cleanToken,
        };
      }

      if (instId && instId !== "NONE") {
        authPayload.tenantAuth = {
          name: "tenantAuth",
          schema: {
            type: "apiKey",
            in: "header",
            name: "X-Institute-Id",
          },
          value: instId,
        };
      }

      if (Object.keys(authPayload).length > 0) {
        window.ui.authActions.authorize(authPayload);
      }

      if (typeof window.ui.preauthorizeApiKey === "function") {
        if (cleanToken) {
          window.ui.preauthorizeApiKey("bearerAuth", "Bearer " + cleanToken);
        }
        if (instId && instId !== "NONE") {
          window.ui.preauthorizeApiKey("tenantAuth", instId);
        }
      }
    } catch (err) {
      console.warn("[Swagger Automation] Syncing authActions warning:", err);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Handle Login/Auth Responses
  // -------------------------------------------------------------------------
  function handleAuthResponse(data) {
    if (!data || !data.success) return;

    const payload = data.data || {};
    const token = payload.accessToken || payload.token || (payload.tokens && payload.tokens.accessToken);
    if (!token) return;

    const user = payload.user || {};
    let instituteId =
      user.instituteId ||
      (user.memberships && user.memberships[0] && (user.memberships[0].instituteId || (user.memberships[0].institute && user.memberships[0].institute.id)));

    if (!instituteId) {
      instituteId = localStorage.getItem(STORAGE_KEY_INSTITUTE) || DEFAULT_INSTITUTE;
    }

    const email = user.email || "Authenticated User";

    localStorage.setItem(STORAGE_KEY_TOKEN, token.replace(/^Bearer\s+/i, "").trim());
    localStorage.setItem(STORAGE_KEY_INSTITUTE, instituteId);
    localStorage.setItem(STORAGE_KEY_USER, email);

    syncSwaggerUIAuth(token, instituteId);
    updateToolbarDOM();

    showToast(`🎉 Auto-Authorized as <strong>${email}</strong>!<br>Token & Tenant ID (<code>${instituteId}</code>) attached to all routes.`);
  }

  // -------------------------------------------------------------------------
  // 4. Request Interception: window.fetch
  // -------------------------------------------------------------------------
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let url = typeof input === "string" ? input : input && input.url ? input.url : "";
    init = init || {};

    if (url.includes("/api/v1")) {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      const instituteId = localStorage.getItem(STORAGE_KEY_INSTITUTE) || DEFAULT_INSTITUTE;

      let headersObj;
      if (init.headers instanceof Headers) {
        headersObj = init.headers;
      } else if (Array.isArray(init.headers)) {
        headersObj = new Headers(init.headers);
      } else if (typeof init.headers === "object" && init.headers !== null) {
        headersObj = new Headers(init.headers);
      } else {
        headersObj = new Headers();
      }

      // 1. Authorization header auto-attachment
      if (token) {
        const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
        if (!headersObj.has("Authorization") && !headersObj.has("authorization")) {
          headersObj.set("Authorization", "Bearer " + cleanToken);
        } else {
          // Normalize if user entered Bearer Bearer
          let currentAuth = headersObj.get("Authorization") || headersObj.get("authorization");
          if (currentAuth.match(/^Bearer\s+Bearer\s+/i)) {
            headersObj.set("Authorization", currentAuth.replace(/^Bearer\s+Bearer\s+/i, "Bearer "));
          } else if (!currentAuth.toLowerCase().startsWith("bearer ") && !currentAuth.toLowerCase().startsWith("basic ")) {
            headersObj.set("Authorization", "Bearer " + currentAuth.trim());
          }
        }
      }

      // 2. X-Institute-Id header auto-attachment
      if (instituteId && instituteId !== "NONE" && !url.endsWith("/health")) {
        if (!headersObj.has("X-Institute-Id") && !headersObj.has("x-institute-id")) {
          headersObj.set("X-Institute-Id", instituteId);
        }
      }

      init.headers = headersObj;
    }

    const response = await originalFetch(input, init);

    // Auto-capture login/token responses
    try {
      if (
        url.includes("/api/v1/auth/login") ||
        url.includes("/api/v1/auth/register") ||
        url.includes("/api/v1/auth/refresh-token") ||
        url.includes("/api/v1/saas/institutes")
      ) {
        const clone = response.clone();
        clone
          .json()
          .then((data) => {
            if (url.includes("/api/v1/auth/login") || url.includes("/api/v1/auth/register")) {
              handleAuthResponse(data);
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn("[Swagger Automation] Fetch interceptor response inspection failed:", e);
    }

    return response;
  };

  // -------------------------------------------------------------------------
  // 5. Request Interception: XMLHttpRequest
  // -------------------------------------------------------------------------
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;
    this._reqHeaders = {};
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    if (!this._reqHeaders) this._reqHeaders = {};
    this._reqHeaders[header.toLowerCase()] = value;
    return originalSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (this._url && this._url.includes("/api/v1")) {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      const instituteId = localStorage.getItem(STORAGE_KEY_INSTITUTE) || DEFAULT_INSTITUTE;

      if (token && !this._reqHeaders["authorization"]) {
        const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
        originalSetRequestHeader.call(this, "Authorization", "Bearer " + cleanToken);
      }

      if (instituteId && instituteId !== "NONE" && !this._reqHeaders["x-institute-id"] && !this._url.endsWith("/health")) {
        originalSetRequestHeader.call(this, "X-Institute-Id", instituteId);
      }
    }
    return originalSend.apply(this, arguments);
  };

  // -------------------------------------------------------------------------
  // 6. Interactive Multi-Tenant Control Toolbar
  // -------------------------------------------------------------------------
  function renderToolbar() {
    if (document.getElementById("swagger-custom-toolbar")) return;

    const topBar = document.querySelector(".swagger-ui .topbar") || document.querySelector(".swagger-ui");
    if (!topBar) return;

    const toolbar = document.createElement("div");
    toolbar.id = "swagger-custom-toolbar";
    toolbar.innerHTML = `
      <div class="sct-header">
        <div class="sct-title">
          <span class="sct-icon">🛡️</span>
          <strong>Multi-Tenant Auth & Header Controller</strong>
          <span class="sct-tag">Auto-Sync Active</span>
        </div>
        <div class="sct-status-badges" id="sct-badges">
          <!-- Populated dynamically -->
        </div>
      </div>

      <div class="sct-controls">
        <div class="sct-field sct-token-field">
          <label>🔑 Bearer Token</label>
          <div class="sct-input-wrap">
            <input type="password" id="sct-token-input" placeholder="Paste JWT token or click 1-Click Login" autocomplete="off" />
            <button type="button" id="sct-toggle-token" title="Show/Hide token">👁️</button>
            <button type="button" id="sct-copy-token" title="Copy token">📋</button>
          </div>
        </div>

        <div class="sct-field sct-tenant-field">
          <label>🏛️ Tenant Context (<code>X-Institute-Id</code>)</label>
          <div class="sct-input-wrap">
            <input type="text" id="sct-tenant-input" placeholder="Institute UUID (e.g. 8f047731-...)" />
            <select id="sct-tenant-presets" title="Select pre-configured Bangladeshi institute">
              <option value="">⚡ Presets</option>
              <option value="8f047731-26b7-43ea-92a3-9d0e35e970ab">🏫 Test Institute (Active Seed)</option>
              <option value="5e16477f-90c4-438b-9913-29add6076bdb">🏢 Chittagong Campus</option>
              <option value="cly01inst_dhaka2026">🎓 Dhaka City College (Demo)</option>
              <option value="NONE">🌐 Platform Super Admin (Global / No Tenant)</option>
            </select>
          </div>
        </div>

        <div class="sct-actions">
          <button type="button" id="sct-btn-apply" class="sct-btn sct-btn-primary">
            💾 Apply to All Routes
          </button>
          <button type="button" id="sct-btn-login" class="sct-btn sct-btn-success">
            ⚡ 1-Click Super Admin Login
          </button>
          <button type="button" id="sct-btn-clear" class="sct-btn sct-btn-danger">
            🗑️ Clear Auth
          </button>
        </div>
      </div>
    `;

    topBar.parentNode.insertBefore(toolbar, topBar.nextSibling);

    // Event listeners
    document.getElementById("sct-toggle-token").addEventListener("click", () => {
      const input = document.getElementById("sct-token-input");
      input.type = input.type === "password" ? "text" : "password";
    });

    document.getElementById("sct-copy-token").addEventListener("click", () => {
      const input = document.getElementById("sct-token-input");
      if (input.value) {
        navigator.clipboard.writeText(input.value);
        showToast("📋 Token copied to clipboard!", "info");
      }
    });

    document.getElementById("sct-tenant-presets").addEventListener("change", (e) => {
      if (e.target.value) {
        document.getElementById("sct-tenant-input").value = e.target.value;
      }
    });

    document.getElementById("sct-btn-apply").addEventListener("click", () => {
      const token = document.getElementById("sct-token-input").value.trim();
      const tenant = document.getElementById("sct-tenant-input").value.trim();

      if (token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token.replace(/^Bearer\s+/i, ""));
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }

      if (tenant) {
        localStorage.setItem(STORAGE_KEY_INSTITUTE, tenant);
      }

      syncSwaggerUIAuth(token, tenant);
      updateToolbarDOM();
      showToast("💾 Saved! Headers are active across all 347 routes.");
    });

    document.getElementById("sct-btn-clear").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      document.getElementById("sct-token-input").value = "";
      if (window.ui && window.ui.authActions) {
        window.ui.authActions.logout(["bearerAuth", "tenantAuth"]);
      }
      updateToolbarDOM();
      showToast("🗑️ Credentials cleared.", "info");
    });

    document.getElementById("sct-btn-login").addEventListener("click", async () => {
      const btn = document.getElementById("sct-btn-login");
      btn.disabled = true;
      btn.innerText = "⏳ Logging in...";

      try {
        const res = await originalFetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "admin@example.com",
            password: "admin123456",
          }),
        });
        const data = await res.json();
        if (data.success) {
          handleAuthResponse(data);
        } else {
          showToast("❌ Login failed: " + (data.message || "Unknown error"), "warning");
        }
      } catch (err) {
        showToast("❌ Connection error: " + err.message, "warning");
      } finally {
        btn.disabled = false;
        btn.innerText = "⚡ 1-Click Super Admin Login";
      }
    });

    updateToolbarDOM();
  }

  function updateToolbarDOM() {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN) || "";
    const instituteId = localStorage.getItem(STORAGE_KEY_INSTITUTE) || DEFAULT_INSTITUTE;
    const userEmail = localStorage.getItem(STORAGE_KEY_USER) || "";

    const tokenInput = document.getElementById("sct-token-input");
    if (tokenInput && document.activeElement !== tokenInput) {
      tokenInput.value = token;
    }

    const tenantInput = document.getElementById("sct-tenant-input");
    if (tenantInput && document.activeElement !== tenantInput) {
      tenantInput.value = instituteId;
    }

    const badgesContainer = document.getElementById("sct-badges");
    if (badgesContainer) {
      badgesContainer.innerHTML = `
        <span class="sct-badge ${token ? "badge-success" : "badge-inactive"}">
          ${token ? `🟢 Auth: Active (${userEmail || "JWT Token"})` : "⚪ Auth: Missing (Use 1-Click Login)"}
        </span>
        <span class="sct-badge ${instituteId && instituteId !== "NONE" ? "badge-tenant" : "badge-global"}">
          🏛️ Tenant: <strong>${instituteId === "NONE" ? "Global (All)" : instituteId.substring(0, 18) + "..."}</strong>
        </span>
      `;
    }
  }

  // -------------------------------------------------------------------------
  // 7. Auto-fill parameter input on "Try It Out" expansion
  // -------------------------------------------------------------------------
  function observeTryItOutButtons() {
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;

      // When "Try it out" is clicked
      if (target.classList && target.classList.contains("try-out__btn")) {
        setTimeout(() => {
          const instituteId = localStorage.getItem(STORAGE_KEY_INSTITUTE) || DEFAULT_INSTITUTE;
          if (!instituteId || instituteId === "NONE") return;

          const opblock = target.closest(".opblock");
          if (!opblock) return;

          // Find parameter inputs for X-Institute-Id
          const inputs = opblock.querySelectorAll("input");
          inputs.forEach((inp) => {
            const placeholder = (inp.placeholder || "").toLowerCase();
            const ariaLabel = (inp.getAttribute("aria-label") || "").toLowerCase();
            const parentRow = inp.closest("tr");
            const rowText = parentRow ? parentRow.innerText.toLowerCase() : "";

            if (
              (placeholder.includes("x-institute-id") ||
                ariaLabel.includes("x-institute-id") ||
                rowText.includes("x-institute-id")) &&
              !inp.value
            ) {
              inp.value = instituteId;
              inp.dispatchEvent(new Event("input", { bubbles: true }));
              inp.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
        }, 150);
      }
    });
  }

  // -------------------------------------------------------------------------
  // 8. Initialization & Ready Watcher
  // -------------------------------------------------------------------------
  let initAttempts = 0;
  const readyChecker = setInterval(() => {
    initAttempts++;

    // Try rendering toolbar
    renderToolbar();

    // Check if Swagger UI is ready
    if (window.ui && window.ui.authActions) {
      clearInterval(readyChecker);
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      const instituteId = localStorage.getItem(STORAGE_KEY_INSTITUTE) || DEFAULT_INSTITUTE;
      if (token) {
        syncSwaggerUIAuth(token, instituteId);
      }
      console.log("[Swagger Automation] Synchronized with window.ui successfully.");
    }

    if (initAttempts > 50) {
      clearInterval(readyChecker);
    }
  }, 250);

  // Initialize listeners
  observeTryItOutButtons();
})();
