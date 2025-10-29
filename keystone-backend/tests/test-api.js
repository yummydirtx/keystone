// test-api.js

// Define the URL for your backend API
const apiUrl = 'http://api.gokeystone.org:3001/';

async function testApiEndpoint() {
  console.log(`Pinging your API at: ${apiUrl}`);

  try {
    // Attempt to make a GET request to the root of your API
    // The 'family: 4' hint forces fetch to use IPv4, fixing the localhost issue.
    const response = await fetch(apiUrl, { family: 4 });

    // If we get here, it means we received *any* kind of response from the server.
    // This is a SUCCESS because it proves the network path is open.
    console.log('✅ SUCCESS: Connected to the server.');
    console.log(
      `   -> Server responded with status code: ${response.status} (${response.statusText})`
    );

    // A 404 "Not Found" is the expected success case if you haven't defined a root route yet.
    if (response.status === 404) {
      console.log('   -> This is the expected result for a new Express server!');
    } else {
      // If you get a 200, it means your root route is working!
      const body = await response.text();
      console.log(`   -> Server returned: "${body}"`);
    }
  } catch (error) {
    // If we get here, it means there was a network-level failure.
    console.log('❌ FAILURE: Could not connect to the server.');
    console.log(`   -> Error: ${error.message}`);
    console.log('\n   Possible Causes:');
    console.log("   1. Your backend server isn't running on the VM (`npm start`).");
    console.log("   2. The Oracle Cloud firewall isn't open on port 3001 for TCP.");
    console.log("   3. Your Cloudflare DNS records haven't updated yet (wait a few more minutes).");
  }
}

// Run the test
testApiEndpoint();
