#!/usr/bin/env node

/**
 * Load questions from TSV file into PocketBase
 *
 * This script reads questions.tsv and loads the data into PocketBase
 * using the REST API.
 */

const fs = require('fs');
const path = require('path');

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password123';

/**
 * Authenticate with PocketBase and get admin token
 */
async function authenticate() {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Parse a TSV line handling quoted fields
 */
function parseTsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && nextChar !== '"') {
      inQuotes = false;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '\t' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current); // Add last field

  return fields;
}

/**
 * Create a question record in PocketBase
 */
async function createQuestion(token, questionData) {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/questions/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify(questionData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create question: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Check if questions collection already has data
 */
async function hasExistingData(token) {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/questions/records?perPage=1`, {
    headers: {
      'Authorization': token,
    },
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.totalItems > 0;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔐 Authenticating with PocketBase...');
    const token = await authenticate();
    console.log('✅ Authenticated successfully');

    // Check if data already exists
    console.log('🔍 Checking for existing data...');
    const hasData = await hasExistingData(token);
    if (hasData) {
      console.log('⚠️  Questions collection already has data. Skipping import.');
      console.log('   To reimport, delete existing questions first.');
      return;
    }

    // Read TSV file
    const tsvPath = path.join(__dirname, 'questions.tsv');
    console.log(`📖 Reading questions from ${tsvPath}...`);
    const tsvContent = fs.readFileSync(tsvPath, 'utf-8');

    // Parse TSV (skip header row)
    const lines = tsvContent.trim().split('\n').slice(1);
    console.log(`📦 Found ${lines.length} questions to import`);

    let successCount = 0;
    let errorCount = 0;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const fields = parseTsvLine(line);
      const [id, category, subcategory, difficulty, question, a, b, c, d, level, metadata] = fields;

      try {
        const questionData = {
          category: category,
          subcategory: subcategory || '',
          difficulty: difficulty,
          question: question,
          a: a,
          b: b,
          c: c,
          d: d,
          level: level || '',
        };

        // Only add metadata if it's not empty
        if (metadata && metadata.trim()) {
          try {
            questionData.metadata = JSON.parse(metadata);
          } catch (e) {
            // If metadata is not valid JSON, store as null
            questionData.metadata = null;
          }
        }

        await createQuestion(token, questionData);
        successCount++;

        if ((successCount) % 100 === 0) {
          console.log(`  ✓ Loaded ${successCount} questions...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error loading question ${i + 1}: ${error.message}`);

        // Stop if too many errors
        if (errorCount > 10) {
          throw new Error('Too many errors, aborting import');
        }
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Successfully loaded: ${successCount} questions`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
