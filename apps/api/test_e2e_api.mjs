// Comprehensive E2E API & Integration Test
async function runE2ETests() {
  const baseUrl = 'http://localhost:4000';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Health endpoint reports ok');

    // 2. Auth - Register
    const email = `test_${Date.now()}@studio.design`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jordan Lee', email, password: 'password123' }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.token, 'Auth: Register user and receives token');

    const token = regData.token;
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 3. Auth - Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.user.email === email, 'Auth: Login returns valid user object');

    // 4. Auth - Me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.name === 'Jordan Lee', 'Auth: Me endpoint authenticates session');

    // 5. Projects - Create
    const pCreateRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Design System 2026' }),
    });
    const project = await pCreateRes.json();
    assert(pCreateRes.status === 201 && project.title === 'Design System 2026', 'Projects: Create project');

    // 6. Projects - List
    const pListRes = await fetch(`${baseUrl}/api/projects`, { headers: authHeaders });
    const pList = await pListRes.json();
    assert(pList.some(p => p.id === project.id), 'Projects: List projects includes created project');

    // 7. Projects - Rename
    const pRenameRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Design System Enterprise' }),
    });
    const pRenamed = await pRenameRes.json();
    assert(pRenamed.title === 'Design System Enterprise', 'Projects: Rename project');

    // 8. Projects - Duplicate
    const pDupRes = await fetch(`${baseUrl}/api/projects/${project.id}/duplicate`, {
      method: 'POST',
      headers: authHeaders,
    });
    const pDuplicated = await pDupRes.json();
    assert(pDuplicated.title.includes('(Copy)'), 'Projects: Duplicate project');

    // 9. Projects - Delete (Soft Delete)
    const pDelRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const pDelData = await pDelRes.json();
    assert(pDelData.success === true, 'Projects: Delete project');

    // 10. Projects - Restore
    const pRestoreRes = await fetch(`${baseUrl}/api/projects/${project.id}/restore`, {
      method: 'POST',
      headers: authHeaders,
    });
    const pRestoreData = await pRestoreRes.json();
    assert(pRestoreData.success === true, 'Projects: Restore project');

    // 11. Documents - Get demo-doc
    const docRes = await fetch(`${baseUrl}/api/documents/demo-doc`, { headers: authHeaders });
    const docData = await docRes.json();
    assert(docRes.status === 200 && docData.document.id === 'demo-doc', 'Documents: Fetch demo document');

    // 12. Documents - Create new document
    const newDocRes = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Mobile App Wireframes' }),
    });
    const newDocData = await newDocRes.json();
    assert(newDocRes.status === 201 && newDocData.document.title === 'Mobile App Wireframes', 'Documents: Create document');

    // 13. Comments - Add anchored comment
    const commentRes = await fetch(`${baseUrl}/api/documents/${newDocData.document.id}/comments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        pageId: 'page_1',
        authorName: 'Jordan Lee',
        authorColor: '#3b82f6',
        position: { x: 120, y: 240 },
        content: 'Check button contrast here.',
      }),
    });
    const comment = await commentRes.json();
    assert(commentRes.status === 201 && comment.content === 'Check button contrast here.', 'Comments: Add anchored comment');

    // 14. Comments - List comments
    const listCommentsRes = await fetch(`${baseUrl}/api/documents/${newDocData.document.id}/comments`, { headers: authHeaders });
    const commentsList = await listCommentsRes.json();
    assert(commentsList.length === 1 && commentsList[0].id === comment.id, 'Comments: Retrieve comments list');

    // 15. Comments - Resolve comment
    const resolveRes = await fetch(`${baseUrl}/api/documents/${newDocData.document.id}/comments/${comment.id}/resolve`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    const resolveData = await resolveRes.json();
    assert(resolveData.success === true, 'Comments: Resolve comment');

    // 16. Auth - Logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders,
    });
    const logoutData = await logoutRes.json();
    assert(logoutData.success === true, 'Auth: Logout session');

    // Verify session revoked
    const postLogoutMe = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
    assert(postLogoutMe.status === 401, 'Auth: Token invalid after logout');

    console.log(`\n========================================`);
    console.log(`E2E API Test Suite: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('E2E Test Execution Error:', err);
    process.exit(1);
  }
}

runE2ETests();
