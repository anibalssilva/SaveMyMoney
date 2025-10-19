/**
 * Test OpenAI API Key
 * Run this script to verify if your OpenAI API key is working
 *
 * Usage:
 *   node test-openai-key.js
 *
 * Or with explicit key:
 *   OPENAI_API_KEY=sk-proj-your-key node test-openai-key.js
 */

// Load environment variables from .env file
require('dotenv').config();

const OpenAI = require('openai');

async function testOpenAIKey() {
  console.log('\n🧪 Testing OpenAI API Key...\n');
  console.log('═'.repeat(50));

  // Check if API key is set
  const apiKey = process.env.OPENAI_API_KEY;

  console.log('📋 Environment Check:');
  console.log(`   API Key present: ${!!apiKey}`);
  console.log(`   API Key length: ${apiKey ? apiKey.length : 0}`);
  console.log(`   API Key preview: ${apiKey ? `${apiKey.substring(0, 15)}...` : 'NONE'}`);
  console.log('═'.repeat(50));

  if (!apiKey) {
    console.error('\n❌ ERROR: OPENAI_API_KEY not found!');
    console.error('\n💡 Solution:');
    console.error('   1. Get your key: https://platform.openai.com/api-keys');
    console.error('   2. Set it in your .env file:');
    console.error('      OPENAI_API_KEY=sk-proj-your-key-here');
    console.error('   3. Or run: OPENAI_API_KEY=sk-proj-your-key node test-openai-key.js');
    process.exit(1);
  }

  // Initialize OpenAI client
  console.log('\n🔧 Initializing OpenAI client...');
  const openai = new OpenAI({ apiKey });
  console.log('✓ Client initialized\n');

  // Test 1: List models (basic authentication test)
  console.log('═'.repeat(50));
  console.log('TEST 1: Basic Authentication');
  console.log('═'.repeat(50));
  try {
    console.log('Fetching available models...');
    const models = await openai.models.list();
    const modelNames = models.data.map(m => m.id);

    console.log(`✅ SUCCESS! Found ${models.data.length} models`);

    // Check for GPT-4o
    const hasGPT4o = modelNames.some(name => name.includes('gpt-4o'));
    console.log(`   GPT-4o available: ${hasGPT4o ? '✅ YES' : '❌ NO'}`);

    if (hasGPT4o) {
      console.log('   ✓ Your account has access to GPT-4o Vision!');
    } else {
      console.log('   ⚠️  GPT-4o not found. Available models:');
      modelNames.slice(0, 5).forEach(name => {
        console.log(`      - ${name}`);
      });
    }
  } catch (error) {
    console.error('❌ FAILED: Authentication error');
    console.error(`   Error: ${error.message}`);

    if (error.status === 401) {
      console.error('\n💡 Solution: Invalid API key');
      console.error('   1. Generate a new key: https://platform.openai.com/api-keys');
      console.error('   2. Make sure you copied the entire key (starts with sk-proj- or sk-)');
    } else if (error.code === 'insufficient_quota') {
      console.error('\n💡 Solution: No credits available');
      console.error('   1. Add payment method: https://platform.openai.com/settings/organization/billing');
      console.error('   2. Purchase credits (minimum $5)');
    }
    process.exit(1);
  }

  // Test 2: Simple completion (test if API works)
  console.log('\n═'.repeat(50));
  console.log('TEST 2: API Functionality');
  console.log('═'.repeat(50));
  try {
    console.log('Sending test request to GPT-4o...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'Say "API test successful" in JSON format: {"status": "success"}' }
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0].message.content;
    console.log('✅ SUCCESS! GPT-4o responded:');
    console.log(`   ${response}`);
    console.log(`   Tokens used: ${completion.usage.total_tokens}`);
  } catch (error) {
    console.error('❌ FAILED: API request error');
    console.error(`   Error: ${error.message}`);

    if (error.code === 'insufficient_quota') {
      console.error('\n💡 Solution: No credits/quota available');
      console.error('   1. Check usage: https://platform.openai.com/usage');
      console.error('   2. Add credits: https://platform.openai.com/settings/organization/billing');
    } else if (error.status === 429) {
      console.error('\n💡 Solution: Rate limit exceeded');
      console.error('   Wait a moment and try again');
    }
    process.exit(1);
  }

  // Test 3: Vision capability (what we actually use for receipts)
  console.log('\n═'.repeat(50));
  console.log('TEST 3: Vision Capability (Receipt OCR)');
  console.log('═'.repeat(50));
  try {
    console.log('Testing GPT-4o Vision with a sample image...');

    // Simple 1x1 pixel base64 image (tiny test)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What color is this pixel? Reply in one word.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImage}`,
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    const visionResult = visionResponse.choices[0].message.content;
    console.log('✅ SUCCESS! GPT-4o Vision works:');
    console.log(`   Response: ${visionResult}`);
    console.log(`   Tokens used: ${visionResponse.usage.total_tokens}`);
  } catch (error) {
    console.error('❌ FAILED: Vision API error');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }

  // All tests passed!
  console.log('\n═'.repeat(50));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('═'.repeat(50));
  console.log('✅ Your OpenAI API key is working correctly');
  console.log('✅ GPT-4o is available');
  console.log('✅ Vision capability is functional');
  console.log('\n💡 You can now use this key in your Render environment:');
  console.log(`   OPENAI_API_KEY=${apiKey.substring(0, 15)}...`);
  console.log('\n📖 See OPENAI_SETUP.md for deployment instructions\n');
}

// Run the test
testOpenAIKey().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
