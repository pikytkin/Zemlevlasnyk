const sourceBaseUrl = (process.env.SOURCE_GAME_URL || "https://zemlevlasnyk.com").replace(/\/$/, "");
const targetBaseUrl = (process.env.LOCAL_GAME_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const username = process.env.LOCAL_ADMIN_USERNAME || "";
const password = process.env.LOCAL_ADMIN_PASSWORD || "";
const dryRun = process.argv.includes("--dry-run");

async function readJson(response, action) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${action}: ${payload.error || `${response.status} ${response.statusText}`}`);
  }
  return payload;
}

function sessionCookie(response) {
  const value = response.headers.get("set-cookie");
  if (!value) throw new Error("Local login did not return a session cookie.");
  return value.split(";")[0];
}

async function main() {
  const sourceResponse = await fetch(`${sourceBaseUrl}/api/settings`, {
    headers: { accept: "application/json" }
  });
  const settings = await readJson(sourceResponse, "Could not download production settings");

  const machineryCount = Array.isArray(settings.assets?.machineryItems) ? settings.assets.machineryItems.length : 0;
  const buildingCount = Array.isArray(settings.assets?.elevatorItems) ? settings.assets.elevatorItems.length : 0;
  console.log(`Downloaded settings: ${machineryCount} machinery items, ${buildingCount} building items.`);

  if (dryRun) {
    console.log("Dry run completed. Local settings were not changed.");
    return;
  }

  if (!username || !password) {
    throw new Error("Set LOCAL_ADMIN_USERNAME and LOCAL_ADMIN_PASSWORD before importing settings.");
  }

  const loginResponse = await fetch(`${targetBaseUrl}/api/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  await readJson(loginResponse, "Could not sign in to the local game");
  const cookie = sessionCookie(loginResponse);

  try {
    const saveResponse = await fetch(`${targetBaseUrl}/api/admin/settings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ settings })
    });
    await readJson(saveResponse, "Could not save settings to the local game");
    console.log("Production settings were imported into the local storage successfully.");
  } finally {
    await fetch(`${targetBaseUrl}/api/logout`, { method: "POST", headers: { cookie } }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(`Settings sync failed: ${error.message}`);
  process.exitCode = 1;
});
