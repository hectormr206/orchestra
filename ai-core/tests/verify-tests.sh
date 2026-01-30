#!/bin/bash
# ============================================================================
# AI-CORE TESTS VERIFICATION SCRIPT
# ============================================================================
# Quick verification that all test files are properly set up.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_CORE_PATH="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           AI-CORE TESTS VERIFICATION                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
    local name="$1"
    local command="$2"

    echo -ne "Checking $name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

# Check directory structure
echo "Directory Structure:"
check "tests directory exists" "[ -d '$SCRIPT_DIR' ]"
check "integration directory exists" "[ -d '$SCRIPT_DIR/integration' ]"
check "unit directory exists" "[ -d '$SCRIPT_DIR/unit' ]"
check "validation directory exists" "[ -d '$SCRIPT_DIR/validation' ]"
check "fixtures directory exists" "[ -d '$SCRIPT_DIR/fixtures' ]"
check "reports directory exists" "[ -d '$SCRIPT_DIR/reports' ]"
echo ""

# Check test files
echo "Test Files:"
check "agent-tests.test.sh exists" "[ -f '$SCRIPT_DIR/integration/agent-tests.test.sh' ]"
check "install-scripts.test.sh exists" "[ -f '$SCRIPT_DIR/unit/install-scripts.test.sh' ]"
check "installation-validation.test.sh exists" "[ -f '$SCRIPT_DIR/validation/installation-validation.test.sh' ]"
check "test-agent.md fixture exists" "[ -f '$SCRIPT_DIR/fixtures/test-agent.md' ]"
echo ""

# Check executability
echo "Executability:"
check "agent-tests.test.sh is executable" "[ -x '$SCRIPT_DIR/integration/agent-tests.test.sh' ]"
check "install-scripts.test.sh is executable" "[ -x '$SCRIPT_DIR/unit/install-scripts.test.sh' ]"
check "installation-validation.test.sh is executable" "[ -x '$SCRIPT_DIR/validation/installation-validation.test.sh' ]"
check "run-all-tests.sh is executable" "[ -x '$SCRIPT_DIR/run-all-tests.sh' ]"
echo ""

# Check documentation
echo "Documentation:"
check "README.md exists" "[ -f '$SCRIPT_DIR/README.md' ]"
check "TESTING.md exists" "[ -f '$SCRIPT_DIR/TESTING.md' ]"
echo ""

# Check support files
echo "Support Files:"
check "test.mk exists" "[ -f '$SCRIPT_DIR/test.mk' ]"
check "Makefile.test exists" "[ -f '$AI_CORE_PATH/Makefile.test' ]"
echo ""

# Check test runner
echo "Test Runner:"
check "run-all-tests.sh has help" "grep -q 'help' '$SCRIPT_DIR/run-all-tests.sh'"
check "run-all-tests.sh has suite option" "grep -q 'suite' '$SCRIPT_DIR/run-all-tests.sh'"
check "run-all-tests.sh has verbose option" "grep -q 'verbose' '$SCRIPT_DIR/run-all-tests.sh'"
check "run-all-tests.sh has xml option" "grep -q 'xml-output' '$SCRIPT_DIR/run-all-tests.sh'"
echo ""

# Test syntax
echo "Test Syntax:"
check "agent-tests.test.sh has valid syntax" "bash -n '$SCRIPT_DIR/integration/agent-tests.test.sh'"
check "install-scripts.test.sh has valid syntax" "bash -n '$SCRIPT_DIR/unit/install-scripts.test.sh'"
check "installation-validation.test.sh has valid syntax" "bash -n '$SCRIPT_DIR/validation/installation-validation.test.sh'"
check "run-all-tests.sh has valid syntax" "bash -n '$SCRIPT_DIR/run-all-tests.sh'"
echo ""

# Summary
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "Verification Summary:"
echo -e "  ${GREEN}Passed:${NC} $CHECKS_PASSED"
echo -e "  ${RED}Failed:${NC} $CHECKS_FAILED"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

if [[ $CHECKS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You can now run tests with:"
    echo "  ./tests/run-all-tests.sh"
    echo "  make test"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the output above.${NC}"
    exit 1
fi
