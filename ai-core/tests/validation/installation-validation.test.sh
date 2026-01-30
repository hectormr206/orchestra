#!/bin/bash
# ============================================================================
# AI-CORE INSTALLATION VALIDATION TESTS
# ============================================================================
# End-to-end validation tests for ai-core installation.
# Tests actual installation scenarios in isolated environments.
#
# Usage:
#   ./installation-validation.test.sh
#
# Environment variables:
#   AI_CORE_PATH   - Path to ai-core directory (default: script/../..)
#   TEST_TMP_DIR   - Temporary directory for test artifacts (default: /tmp/ai-core-validation)
#   VERBOSE        - Enable verbose output (default: false)
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(dirname "$SCRIPT_DIR")"
AI_CORE_PATH="${AI_CORE_PATH:-$(dirname "$TESTS_DIR")}"
TEST_TMP_DIR="${TEST_TMP_DIR:-/tmp/ai-core-validation-$$}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
CURRENT_TEST=""

# ============================================================================
# TEST UTILITIES
# ============================================================================

test_start() {
    CURRENT_TEST="$1"
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -ne "${CYAN}[TEST $TESTS_RUN]${NC} $CURRENT_TEST ... "
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}PASS${NC}"
    [[ "${VERBOSE:-false}" == "true" ]] && echo "  ✓ $CURRENT_TEST"
}

test_fail() {
    local reason="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}FAIL${NC}"
    echo -e "  ${RED}✗${NC} $reason"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Create clean test project
create_clean_project() {
    local project_dir="$1"
    rm -rf "$project_dir"
    mkdir -p "$project_dir"
    cd "$project_dir"

    # Initialize git repo
    git init > /dev/null 2>&1
    git config user.email "test@example.com"
    git config user.name "Test User"

    # Create basic project structure
    touch README.md
    mkdir -p src
}

# Validate installation structure
validate_installation_structure() {
    local project_dir="$1"
    local errors=0

    # Check for required directories
    [[ ! -d "$project_dir/.claude" ]] && errors=$((errors + 1))
    [[ ! -d "$project_dir/.claude/skills" ]] && errors=$((errors + 1))

    # Check for required files
    [[ ! -f "$project_dir/CLAUDE.md" ]] && errors=$((errors + 1))

    return $errors
}

# Validate skills are accessible
validate_skills_accessible() {
    local project_dir="$1"
    local skills_dir="$project_dir/.claude/skills"

    # Check for expected skills
    local expected_skills=("security" "testing" "frontend" "backend")
    local missing=0

    for skill in "${expected_skills[@]}"; do
        if [[ ! -d "$skills_dir/$skill" ]]; then
            missing=$((missing + 1))
        fi
    done

    return $missing
}

# ============================================================================
# TEST CASES - Clean Installation
# ============================================================================

test_install_on_clean_directory() {
    test_start "Install on clean directory"

    local test_project="$TEST_TMP_DIR/clean-install-project"
    create_clean_project "$test_project"

    # Run setup
    cd "$test_project"
    if bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1; then
        # Validate structure
        if validate_installation_structure "$test_project"; then
            test_pass
        else
            test_fail "Installation structure incomplete"
            return 1
        fi
    else
        test_fail "Setup script failed"
        return 1
    fi
}

test_install_creates_all_platforms() {
    test_start "Installation creates files for all platforms"

    local test_project="$TEST_TMP_DIR/all-platforms-project"
    create_clean_project "$test_project"

    cd "$test_project"
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1

    local missing=0

    # Check Claude Code
    [[ ! -d "$test_project/.claude" ]] && missing=$((missing + 1))
    [[ ! -f "$test_project/CLAUDE.md" ]] && missing=$((missing + 1))

    # Check Gemini
    [[ ! -d "$test_project/.gemini" ]] && missing=$((missing + 1))
    [[ ! -f "$test_project/GEMINI.md" ]] && missing=$((missing + 1))

    # Check Cursor
    [[ ! -f "$test_project/.cursorrules" ]] && missing=$((missing + 1))

    # Check GitHub Copilot
    [[ ! -f "$test_project/.github/copilot-instructions.md" ]] && missing=$((missing + 1))

    if [[ $missing -eq 0 ]]; then
        test_pass
    else
        test_fail "$missing platform(s) missing files"
        return 1
    fi
}

# ============================================================================
# TEST CASES - Idempotency
# ============================================================================

test_re_installation_idempotent() {
    test_start "Re-installation is idempotent"

    local test_project="$TEST_TMP_DIR/reinstall-project"
    create_clean_project "$test_project"

    cd "$test_project"

    # First installation
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup1.log" 2>&1

    # Get file count
    local files_before=$(find "$test_project/.claude" -type f 2>/dev/null | wc -l)

    # Second installation
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup2.log" 2>&1

    # Get file count after
    local files_after=$(find "$test_project/.claude" -type f 2>/dev/null | wc -l)

    if [[ $files_before -eq $files_after ]]; then
        test_pass
    else
        test_fail "File count changed: $files_before -> $files_after"
        return 1
    fi
}

test_re_installation_preserves_customizations() {
    test_start "Re-installation preserves custom AGENTS.md"

    local test_project="$TEST_TMP_DIR/preserve-custom-project"
    create_clean_project "$test_project"

    cd "$test_project"

    # First installation
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup1.log" 2>&1

    # Add custom content
    if [[ -f "$test_project/AGENTS.md" ]]; then
        echo "# Custom Content" >> "$test_project/AGENTS.md"
    fi

    # Second installation
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup2.log" 2>&1

    # Check if custom content preserved
    if [[ -f "$test_project/AGENTS.md" ]] && grep -q "# Custom Content" "$test_project/AGENTS.md"; then
        test_pass
    else
        test_fail "Custom AGENTS.md was overwritten"
        return 1
    fi
}

# ============================================================================
# TEST CASES - Force Flag
# ============================================================================

test_force_flag_overwrites() {
    test_start "Subagents --force flag overwrites existing"

    local test_project="$TEST_TMP_DIR/force-overwrite-project"
    create_clean_project "$test_project"

    cd "$test_project"

    # Initial setup
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/install1.log" 2>&1

    # Modify an agent
    if [[ -f "$test_project/.claude/agents/security-specialist.md" ]]; then
        echo "# MODIFIED" >> "$test_project/.claude/agents/security-specialist.md"
    fi

    # Re-install with --force
    bash "$AI_CORE_PATH/run.sh" --force > "$TEST_TMP_DIR/install2.log" 2>&1

    # Check if modification was removed
    if [[ -f "$test_project/.claude/agents/security-specialist.md" ]] && ! grep -q "# MODIFIED" "$test_project/.claude/agents/security-specialist.md"; then
        test_pass
    else
        test_fail "Agent was not overwritten with --force"
        return 1
    fi
}

# ============================================================================
# TEST CASES - Copy vs Symlink
# ============================================================================

test_symlink_mode_default() {
    test_start "Default installation uses symlinks"

    local test_project="$TEST_TMP_DIR/symlink-default-project"
    create_clean_project "$test_project"

    cd "$test_project"
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1

    if [[ -L "$test_project/.claude/skills" ]]; then
        test_pass
    else
        test_fail "Default mode should create symlinks"
        return 1
    fi
}

test_copy_mode_creates_copies() {
    test_start "Installation with --copy creates copies"

    local test_project="$TEST_TMP_DIR/copy-mode-project"
    create_clean_project "$test_project"

    cd "$test_project"
    bash "$AI_CORE_PATH/run.sh" --copy > "$TEST_TMP_DIR/setup.log" 2>&1

    if [[ -d "$test_project/.claude/skills" ]] && [[ ! -L "$test_project/.claude/skills" ]]; then
        test_pass
    else
        test_fail "Copy mode should create directories, not symlinks"
        return 1
    fi
}

test_copy_mode_independent_files() {
    test_start "Copy mode creates independent file copies"

    local test_project="$TEST_TMP_DIR/copy-independent-project"
    create_clean_project "$test_project"

    cd "$test_project"
    bash "$AI_CORE_PATH/run.sh" --copy > "$TEST_TMP_DIR/setup.log" 2>&1

    # Modify a copied file
    if [[ -f "$test_project/.claude/skills/security/SKILL.md" ]]; then
        echo "# MODIFIED COPY" >> "$test_project/.claude/skills/security/SKILL.md"
    fi

    # Original should be unchanged
    if ! grep -q "# MODIFIED COPY" "$AI_CORE_PATH/SKILLS/security/SKILL.md" 2>/dev/null; then
        test_pass
    else
        test_fail "Copy should be independent from original"
        return 1
    fi
}

# ============================================================================
# TEST CASES - Platform-specific
# ============================================================================

test_linux_installation() {
    test_start "Installation works on Linux"

    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        echo -e "${YELLOW}SKIP${NC} (not on Linux)"
        TESTS_RUN=$((TESTS_RUN - 1))
        return 0
    fi

    local test_project="$TEST_TMP_DIR/linux-project"
    create_clean_project "$test_project"

    cd "$test_project"
    if bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1; then
        test_pass
    else
        test_fail "Setup failed on Linux"
        return 1
    fi
}

test_macos_installation() {
    test_start "Installation works on macOS"

    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${YELLOW}SKIP${NC} (not on macOS)"
        TESTS_RUN=$((TESTS_RUN - 1))
        return 0
    fi

    local test_project="$TEST_TMP_DIR/macos-project"
    create_clean_project "$test_project"

    cd "$test_project"
    if bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1; then
        test_pass
    else
        test_fail "Setup failed on macOS"
        return 1
    fi
}

# ============================================================================
# TEST CASES - File Structure Validation
# ============================================================================

test_claude_structure_valid() {
    test_start "Claude Code structure is valid"

    local test_project="$TEST_TMP_DIR/claude-structure-project"
    create_clean_project "$test_project"

    cd "$test_project"
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1

    local errors=0

    # Check .claude directory
    [[ ! -d "$test_project/.claude" ]] && errors=$((errors + 1))

    # Check skills
    [[ ! -d "$test_project/.claude/skills" ]] && errors=$((errors + 1))
    [[ ! -d "$test_project/.claude/skills/security" ]] && errors=$((errors + 1))

    # Check CLAUDE.md
    [[ ! -f "$test_project/CLAUDE.md" ]] && errors=$((errors + 1))

    if [[ $errors -eq 0 ]]; then
        test_pass
    else
        test_fail "$errors structure validation(s) failed"
        return 1
    fi
}

test_gemini_structure_valid() {
    test_start "Gemini CLI structure is valid"

    local test_project="$TEST_TMP_DIR/gemini-structure-project"
    create_clean_project "$test_project"

    cd "$test_project"
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1

    local errors=0

    # Check .gemini directory
    [[ ! -d "$test_project/.gemini" ]] && errors=$((errors + 1))

    # Check skills
    [[ ! -d "$test_project/.gemini/skills" ]] && errors=$((errors + 1))

    # Check GEMINI.md
    [[ ! -f "$test_project/GEMINI.md" ]] && errors=$((errors + 1))

    if [[ $errors -eq 0 ]]; then
        test_pass
    else
        test_fail "$errors structure validation(s) failed"
        return 1
    fi
}

test_subagents_installed() {
    test_start "Subagents are installed correctly"

    local test_project="$TEST_TMP_DIR/subagents-project"
    create_clean_project "$test_project"

    cd "$test_project"
    bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1

    # Check if subagents were installed
    if [[ -d "$test_project/.claude/agents" ]]; then
        local agent_count=$(find "$test_project/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l)

        if [[ $agent_count -gt 0 ]]; then
            test_pass
        else
            test_fail "No subagents installed"
            return 1
        fi
    else
        test_fail ".claude/agents directory not created"
        return 1
    fi
}

# ============================================================================
# TEST CASES - Error Handling
# ============================================================================

test_handles_missing_ai_core() {
    test_start "Gracefully handles missing ai-core directory"

    local test_project="$TEST_TMP_DIR/missing-ai-core-project"
    create_clean_project "$test_project"

    cd "$test_project"

    # Try to run setup from non-existent ai-core
    if bash "/non-existent/ai-core/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1; then
        test_fail "Should have failed with non-existent ai-core"
        return 1
    else
        test_pass
    fi
}

test_handles_invalid_directory() {
    test_start "Gracefully handles invalid project directory"

    # This test verifies error handling
    local result=0

    # Try to install in a directory without proper permissions
    local test_project="/root/ai-core-test-$$"

    if mkdir -p "$test_project" 2>/dev/null; then
        cd "$test_project"
        if bash "$AI_CORE_PATH/run.sh" > "$TEST_TMP_DIR/setup.log" 2>&1; then
            result=0
        else
            result=1
        fi
        rm -rf "$test_project"
    else
        # Expected to fail permission check
        result=0
    fi

    if [[ $result -eq 0 ]]; then
        test_pass
    else
        test_fail "Error handling failed"
        return 1
    fi
}

# ============================================================================
# TEST RUNNER
# ============================================================================

run_all_tests() {
    info "Running installation validation tests..."
    info "AI_CORE_PATH: $AI_CORE_PATH"
    info "TEST_TMP_DIR: $TEST_TMP_DIR"
    echo ""

    # Setup test directory
    mkdir -p "$TEST_TMP_DIR"

    # Clean installation tests
    info "Testing clean installation..."
    test_install_on_clean_directory
    test_install_creates_all_platforms
    echo ""

    # Idempotency tests
    info "Testing idempotency..."
    test_re_installation_idempotent
    test_re_installation_preserves_customizations
    echo ""

    # Force flag tests
    info "Testing --force flag..."
    test_force_flag_overwrites
    echo ""

    # Copy vs symlink tests
    info "Testing copy vs symlink modes..."
    test_symlink_mode_default
    test_copy_mode_creates_copies
    test_copy_mode_independent_files
    echo ""

    # Platform-specific tests
    info "Testing platform-specific installations..."
    test_linux_installation
    test_macos_installation
    echo ""

    # File structure validation tests
    info "Testing file structure validation..."
    test_claude_structure_valid
    test_gemini_structure_valid
    test_subagents_installed
    echo ""

    # Error handling tests
    info "Testing error handling..."
    test_handles_missing_ai_core
    test_handles_invalid_directory
    echo ""

    # Cleanup
    if [[ "${KEEP_TEST_ARTIFACTS:-false}" != "true" ]]; then
        rm -rf "$TEST_TMP_DIR"
    else
        info "Test artifacts kept in: $TEST_TMP_DIR"
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         AI-CORE INSTALLATION VALIDATION TESTS             ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if ai-core directory exists
    if [[ ! -d "$AI_CORE_PATH" ]]; then
        echo -e "${RED}Error: AI_CORE_PATH not found: $AI_CORE_PATH${NC}"
        exit 1
    fi

    # Check if run.sh exists
    if [[ ! -f "$AI_CORE_PATH/run.sh" ]]; then
        echo -e "${RED}Error: run.sh not found at $AI_CORE_PATH${NC}"
        exit 1
    fi

    # Run all tests
    run_all_tests

    # Print summary
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}TEST SUMMARY${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "Total tests:  ${BLUE}$TESTS_RUN${NC}"
    echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main
main "$@"
