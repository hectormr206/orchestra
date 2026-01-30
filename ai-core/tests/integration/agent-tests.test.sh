#!/bin/bash
# ============================================================================
# AI-CORE AGENT INTEGRATION TESTS
# ============================================================================
# Tests for validating agent files, their metadata, and references.
#
# Usage:
#   ./agent-tests.test.sh
#
# Environment variables:
#   AI_CORE_PATH - Path to ai-core directory (default: script/../..)
#   VERBOSE      - Enable verbose output (default: false)
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(dirname "$SCRIPT_DIR")"
AI_CORE_PATH="${AI_CORE_PATH:-$(dirname "$TESTS_DIR")}"
SUBAGENTS_DIR="$AI_CORE_PATH/SUBAGENTS"
UNIVERSAL_DIR="$SUBAGENTS_DIR/universal"
WORKFLOW_DIR="$SUBAGENTS_DIR/workflow"

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

# Valid ai-core skills (from AGENTS.md)
VALID_SKILLS=(
    "security" "testing" "frontend" "backend" "mobile" "database" "api-design"
    "git-workflow" "ci-cd" "infrastructure" "disaster-recovery" "finops"
    "observability" "logging" "error-handling" "performance" "scalability"
    "compliance" "audit-logging" "accessibility" "i18n"
    "architecture" "documentation" "dependency-management" "realtime"
    "ai-ml" "data-analytics"
    "code-quality" "developer-experience" "feature-flags"
    "skill-authoring" "toolkit-maintenance"
)

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

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# ============================================================================
# YAML PARSING FUNCTIONS
# ============================================================================

# Extract YAML frontmatter from markdown file
extract_yaml_frontmatter() {
    local file="$1"
    awk '/^---/{flag++;next} flag==1' "$file"
}

# Parse YAML value by key
parse_yaml_value() {
    local yaml="$1"
    local key="$2"

    # Handle simple key: value pairs
    echo "$yaml" | grep "^${key}:" | sed "s/^${key}: *//" | sed 's/^["'"'"']//' | sed 's/["'"'"']$//'
}

# Parse YAML array
parse_yaml_array() {
    local yaml="$1"
    local key="$2"

    # Extract array values (handles - item format)
    echo "$yaml" | sed -n "/^${key}:/,/^[a-z]/p" | grep "^  -" | sed 's/^  - //' | sed 's/^["'"'"']//' | sed 's/["'"'"']$//'
}

# Check if YAML key exists
yaml_has_key() {
    local yaml="$1"
    local key="$2"
    echo "$yaml" | grep -q "^${key}:"
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

# Validate required fields in agent YAML
validate_required_fields() {
    local yaml="$1"
    local file="$2"
    local missing=()

    # Required top-level fields
    local required_fields=("name" "description" "tools" "model" "platforms" "metadata")

    for field in "${required_fields[@]}"; do
        if ! yaml_has_key "$yaml" "$field"; then
            missing+=("$field")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        test_fail "Missing required fields in $file: ${missing[*]}"
        return 1
    fi

    return 0
}

# Validate tools array
validate_tools() {
    local yaml="$1"
    local file="$2"

    local tools
    tools=$(parse_yaml_array "$yaml" "tools")

    if [[ -z "$tools" ]]; then
        test_fail "No tools defined in $file"
        return 1
    fi

    # Check for required tools
    local tool_count
    tool_count=$(echo "$tools" | wc -l)
    if [[ $tool_count -lt 1 ]]; then
        test_fail "At least one tool required in $file"
        return 1
    fi

    return 0
}

# Validate platforms configuration
validate_platforms() {
    local yaml="$1"
    local file="$2"

    # Check if platforms key exists
    if ! yaml_has_key "$yaml" "platforms"; then
        test_fail "Missing 'platforms' key in $file"
        return 1
    fi

    return 0
}

# Validate skills reference valid ai-core skills
validate_skills() {
    local yaml="$1"
    local file="$2"

    local skills
    skills=$(parse_yaml_array "$yaml" "skills" 2>/dev/null || true)

    if [[ -z "$skills" ]]; then
        # Skills are optional in metadata
        return 0
    fi

    local invalid_skills=()
    while IFS= read -r skill; do
        # Skip empty lines
        [[ -z "$skill" ]] && continue

        # Check if skill is in valid skills list
        local found=false
        for valid_skill in "${VALID_SKILLS[@]}"; do
            if [[ "$skill" == "$valid_skill" ]]; then
                found=true
                break
            fi
        done

        if [[ "$found" == "false" ]]; then
            invalid_skills+=("$skill")
        fi
    done <<< "$skills"

    if [[ ${#invalid_skills[@]} -gt 0 ]]; then
        test_fail "Invalid skills in $file: ${invalid_skills[*]}"
        return 1
    fi

    return 0
}

# Validate metadata fields
validate_metadata() {
    local yaml="$1"
    local file="$2"

    # Check for required metadata fields
    local metadata_required=("author" "version" "type")

    for field in "${metadata_required[@]}"; do
        if ! echo "$yaml" | grep -q "^metadata:"; then
            test_fail "Missing 'metadata' section in $file"
            return 1
        fi
    done

    return 0
}

# Validate agent type
validate_agent_type() {
    local yaml="$1"
    local file="$2"
    local expected_type="$2"

    local agent_type
    agent_type=$(echo "$yaml" | grep -A 10 "^metadata:" | grep "^  type:" | sed 's/^  type: *//' | sed 's/["'"'"']//g')

    if [[ -z "$agent_type" ]]; then
        test_fail "No type specified in metadata for $file"
        return 1
    fi

    # Valid types
    local valid_types=("specialist" "workflow")
    local valid=false

    for type in "${valid_types[@]}"; do
        if [[ "$agent_type" == "$type" ]]; then
            valid=true
            break
        fi
    done

    if [[ "$valid" == "false" ]]; then
        test_fail "Invalid agent type '$agent_type' in $file (must be: ${valid_types[*]})"
        return 1
    fi

    return 0
}

# ============================================================================
# TEST CASES
# ============================================================================

test_agent_file_valid_yaml() {
    local file="$1"

    test_start "Valid YAML frontmatter: $(basename "$file")"

    # Check if file exists
    if [[ ! -f "$file" ]]; then
        test_fail "File not found: $file"
        return 1
    fi

    # Extract YAML frontmatter
    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    if [[ -z "$yaml" ]]; then
        test_fail "No YAML frontmatter found in $file"
        return 1
    fi

    # Check if YAML starts with ---
    if ! head -n 1 "$file" | grep -q "^---"; then
        test_fail "YAML frontmatter must start with --- in $file"
        return 1
    fi

    test_pass
    return 0
}

test_agent_required_fields() {
    local file="$1"

    test_start "Required fields present: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    if validate_required_fields "$yaml" "$file"; then
        test_pass
        return 0
    else
        return 1
    fi
}

test_agent_tools_valid() {
    local file="$1"

    test_start "Tools array valid: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    if validate_tools "$yaml" "$file"; then
        test_pass
        return 0
    else
        return 1
    fi
}

test_agent_platforms_configured() {
    local file="$1"

    test_start "Platforms configured: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    if validate_platforms "$yaml" "$file"; then
        test_pass
        return 0
    else
        return 1
    fi
}

test_agent_skills_valid() {
    local file="$1"

    test_start "Skills reference valid ai-core skills: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    if validate_skills "$yaml" "$file"; then
        test_pass
        return 0
    else
        return 1
    fi
}

test_agent_metadata_valid() {
    local file="$1"

    test_start "Metadata valid: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    if validate_metadata "$yaml" "$file"; then
        test_pass
        return 0
    else
        return 1
    fi
}

test_agent_type_valid() {
    local file="$1"

    test_start "Agent type valid: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    if validate_agent_type "$yaml" "$file"; then
        test_pass
        return 0
    else
        return 1
    fi
}

test_workflow_agent_skills_exist() {
    local file="$1"

    test_start "Workflow agent skills exist: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    local skills
    skills=$(parse_yaml_array "$yaml" "skills" 2>/dev/null || true)

    if [[ -z "$skills" ]]; then
        test_fail "Workflow agent must have skills defined: $file"
        return 1
    fi

    # Verify each skill has a corresponding SKILL.md
    while IFS= read -r skill; do
        [[ -z "$skill" ]] && continue

        local skill_path="$AI_CORE_PATH/SKILLS/$skill/SKILL.md"
        if [[ ! -f "$skill_path" ]]; then
            test_fail "Skill file not found: $skill_path"
            return 1
        fi
    done <<< "$skills"

    test_pass
    return 0
}

test_specialist_agent_skills_exist() {
    local file="$1"

    test_start "Specialist agent skills exist: $(basename "$file")"

    local yaml
    yaml=$(extract_yaml_frontmatter "$file")

    local skills
    skills=$(parse_yaml_array "$yaml" "skills" 2>/dev/null || true)

    if [[ -z "$skills" ]]; then
        # Skills are optional for specialist agents
        test_pass
        return 0
    fi

    # Verify each skill has a corresponding SKILL.md
    while IFS= read -r skill; do
        [[ -z "$skill" ]] && continue

        local skill_path="$AI_CORE_PATH/SKILLS/$skill/SKILL.md"
        if [[ ! -f "$skill_path" ]]; then
            test_fail "Skill file not found: $skill_path"
            return 1
        fi
    done <<< "$skills"

    test_pass
    return 0
}

# ============================================================================
# TEST RUNNER
# ============================================================================

run_all_tests() {
    local agent_files=()

    info "Running agent integration tests..."
    info "AI_CORE_PATH: $AI_CORE_PATH"
    echo ""

    # Find all agent files
    if [[ -d "$UNIVERSAL_DIR" ]]; then
        while IFS= read -r file; do
            agent_files+=("$file")
        done < <(find "$UNIVERSAL_DIR" -name "*.md" -type f)
    fi

    if [[ -d "$WORKFLOW_DIR" ]]; then
        while IFS= read -r file; do
            agent_files+=("$file")
        done < <(find "$WORKFLOW_DIR" -name "*.md" -type f)
    fi

    if [[ ${#agent_files[@]} -eq 0 ]]; then
        warn "No agent files found"
        return 1
    fi

    info "Found ${#agent_files[@]} agent files"
    echo ""

    # Run tests for each agent file
    for file in "${agent_files[@]}"; do
        # Determine if workflow or specialist agent
        local agent_type=""
        if [[ "$file" =~ workflow ]]; then
            agent_type="workflow"
        else
            agent_type="specialist"
        fi

        # Common tests for all agents
        test_agent_file_valid_yaml "$file"
        test_agent_required_fields "$file"
        test_agent_tools_valid "$file"
        test_agent_platforms_configured "$file"
        test_agent_skills_valid "$file"
        test_agent_metadata_valid "$file"
        test_agent_type_valid "$file"

        # Type-specific tests
        if [[ "$agent_type" == "workflow" ]]; then
            test_workflow_agent_skills_exist "$file"
        else
            test_specialist_agent_skills_exist "$file"
        fi
    done
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           AI-CORE AGENT INTEGRATION TESTS                 ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if ai-core directory exists
    if [[ ! -d "$AI_CORE_PATH" ]]; then
        echo -e "${RED}Error: AI_CORE_PATH not found: $AI_CORE_PATH${NC}"
        exit 1
    fi

    # Check if SUBAGENTS directory exists
    if [[ ! -d "$SUBAGENTS_DIR" ]]; then
        echo -e "${RED}Error: SUBAGENTS directory not found: $SUBAGENTS_DIR${NC}"
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
