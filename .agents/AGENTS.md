## Strict Working Rules (Highest Priority)

### 1. Core Directives & Preservation

- **Comment Out Original Code:** Before replacing or changing code that existed prior to the current session, comment out the original code. Do not comment out code added or modified by the agent during the current session. Never delete original code outright.
- **Minimal Edits Only:** Make the smallest possible change required to satisfy the request. Do not rewrite working code, refactor unrelated components, or optimize unrelated logic.
- **No Unnecessary Modifications:** Do not modify CSS, reorganize project structures/folders, or introduce new architectural patterns unless strictly necessary for the requested change.
- **No Side Effects & Scope:** Ensure changes in one component do not affect its normal behavior elsewhere. Preserve existing UI, functionality, responsive behavior, and project structure unless explicitly asked otherwise.

### 2. Code Style & Standards

- **Exact Style Matching:** Match existing indentation, quote styles, naming conventions, comment styles, and formatting. Do not reformat unrelated code.
- **Reuse Existing Code:** Reuse existing components, functions, hooks, APIs, utilities, and styles whenever possible.
- **Dependencies:** Do not add dependencies or install new packages unless strictly necessary.
- **Framework Guidelines:**
  - **React:** Use clean standard JSX and hooks.
  - **Node.js/Express:** Follow the existing backend structure and API patterns.
  - **Tailwind:** Use valid existing utility patterns.
  - **Bootstrap:** Use correct Bootstrap classes and verify spelling. If both Tailwind and Bootstrap are present, follow the framework already used in that component.
- **No Unnecessary Comments:** Do not add explanatory comments inside code blocks. Only comment out original code when required by Section 1.
- **Root Cause Focus:** Fix the actual root cause instead of introducing workarounds.

### 3. Verification Checklist

Before completing any task, verify:

- Syntax correctness and proper imports/exports
- Absence of undefined variables and functions
- Proper execution of React hooks, JSX, and API handling
- Accurate Bootstrap and Tailwind class application
- Mobile and desktop responsive behavior
- No unintended changes to surrounding functionality

### 4. Workflow & Output

- **Direct Execution:** If the change is small and obvious, implement it directly. If it is large or could affect architecture, explain the planned approach first.
- **Output Format:** Return the requested code and a brief 1–2 line summary. Do not provide lengthy explanations unless requested.
- **Execution Flow:** Always follow: **UNDERSTAND → MINIMAL CHANGE → VERIFY**.
- **Professional Standard:** Write clean, maintainable, production-standard code that looks manually authored by an experienced developer.
