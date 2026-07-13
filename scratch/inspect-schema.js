const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    if (!res.ok) {
      console.error("HTTP error:", res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log("Tables found in OpenAPI schema:");
    if (data.definitions) {
      Object.keys(data.definitions).forEach(tableName => {
        console.log(`- ${tableName}`);
        console.log("  Columns:");
        const properties = data.definitions[tableName].properties;
        if (properties) {
          Object.keys(properties).forEach(colName => {
            const col = properties[colName];
            console.log(`    * ${colName}: ${col.type} (${col.format || ''})`);
          });
        }
      });
    } else {
      console.log("No definitions found in response:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
