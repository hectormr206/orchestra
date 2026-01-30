#!/bin/bash
# ============================================================================
# AI-CORE TEST RUNNER
# ============================================================================
# Main test runner for all ai-core test suites.
# Runs integration, unit, and validation tests with comprehensive reporting.
#
# Usage:
#   ./run-all-tests.sh [options]
#
# Options:
#   --suite SUITE     Run specific test suite (integration|unit|validation)
#   --verbose         Enable verbose output
#   --keep-artifacts  Keep test artifacts for debugging
#   --xml-output DIR  Generate JUnit XML reports in DIR
#   --help            Show this help message
#
# Environment variables:
#   AI_CORE_PATH     - Path to ai-core directory (default: script/..)
#   TEST_TMP_DIR     - Temporary directory for test artifacts
#   VERBOSE          - Enable verbose output (default: false)
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_CORE_PATH="${AI_CORE_PATH:-$(dirname "$SCRIPT_DIR")}"
TESTS_DIR="$SCRIPT_DIR"
REPORTS_DIR="$TESTS_DIR/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Test suites
declare -A TEST_SUITES=(
    ["integration"]="$TESTS_DIR/integration/agent-tests.test.sh"
    ["unit"]="$TESTS_DIR/unit/install-scripts.test.sh"
    ["validation"]="$TESTS_DIR/validation/installation-validation.test.sh"
)

# Global counters
TOTAL_RUN=0
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0
SUITE_RESULTS=()

# Options
RUN_SUITE=""
VERBOSE="${VERBOSE:-false}"
KEEP_ARTIFACTS="${KEEP_ARTIFACTS:-false}"
XML_OUTPUT=""

# ============================================================================
# UTILITIES
# ============================================================================

print_banner() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                  AI-CORE TEST SUITE                       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_suite_banner() {
    local suite="$1"
    echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  Running: $suite${NC}"
    echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Show help message
show_help() {
    print_banner
    cat << EOF
Usage: $0 [options]

Options:
    --suite SUITE     Run specific test suite
                     Available: ${!TEST_SUITES[*]}
    --verbose         Enable verbose output
    --keep-artifacts  Keep test artifacts for debugging
    --xml-output DIR  Generate JUnit XML reports in DIR
    --help            Show this help message

Environment variables:
    AI_CORE_PATH      Path to ai-core directory (default: ..)
    TEST_TMP_DIR      Temporary directory for test artifacts
    VERBOSE           Enable verbose output (default: false)

Examples:
    # Run all test suites
    $0

    # Run only integration tests
    $0 --suite integration

    # Run with verbose output and keep artifacts
    $0 --verbose --keep-artifacts

    # Generate JUnit XML reports
    $0 --xml-output ./reports

EOF
}

# Generate JUnit XML report
generate_junit_xml() {
    local suite_name="$1"
    local test_file="$2"
    local run="$3"
    local passed="$4"
    local failed="$5"
    local output_file="$6"

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S")
    local time="0.000"  # We don't track individual test times

    cat > "$output_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="ai-core-tests" timestamp="$timestamp">
  <testsuite name="$suite_name" tests="$run" failures="$failed" errors="0" skipped="0" time="$time">
    <testcase name="$suite_name" classname="ai-core.$suite_name" time="$time">
EOF

    if [[ $failed -gt 0 ]]; then
        cat >> "$output_file" << EOF
      <failure message="$failed test(s) failed" type="Failure">
        <![CDATA[See test output above for details]]>
      </failure>
EOF
    fi

    cat >> "$output_file" << EOF
    </testcase>
  </testsuite>
</testsuites>
EOF
}

# Run a single test suite
run_test_suite() {
    local suite_name="$1"
    local test_file="$2"

    # Check if test file exists
    if [[ ! -f "$test_file" ]]; then
        error "Test file not found: $test_file"
        return 1
    fi

    # Make sure it's executable
    chmod +x "$test_file"

    print_suite_banner "$suite_name suite"

    # Set environment variables
    export AI_CORE_PATH="$AI_CORE_PATH"
    export VERBOSE="$VERBOSE"
    export KEEP_TEST_ARTIFACTS="$KEEP_ARTIFACTS"

    # Run the test suite and capture output
    local output_file="$REPORTS_DIR/${suite_name}_${TIMESTAMP}.log"
    local exit_code=0

    if [[ "$VERBOSE" == "true" ]]; then
        # Run with output to console
        bash "$test_file" 2>&1 | tee "$output_file"
        exit_code=${PIPESTATUS[0]}
    else
        # Run and capture output
        bash "$test_file" > "$output_file" 2>&1
        exit_code=$?
    fi

    # Parse results from output
    local run=$(grep -o "Total tests:.*" "$output_file" | grep -o "[0-9]*" | head -1)
    local passed=$(grep -o "Passed:.*" "$output_file" | grep -o "[0-9]*" | head -1)
    local failed=$(grep -o "Failed:.*" "$output_file" | grep -o "[0-9]*" | head -1)

    # Default to 0 if not found
    run=${run:-0}
    passed=${passed:-0}
    failed=${failed:-0}

    # Store results
    SUITE_RESULTS["$suite_name"]="run:$run passed:$passed failed:$failed exit:$exit_code"

    TOTAL_RUN=$((TOTAL_RUN + run))
    TOTAL_PASSED=$((TOTAL_PASSED + passed))
    TOTAL_FAILED=$((TOTAL_FAILED + failed))

    # Generate JUnit XML if requested
    if [[ -n "$XML_OUTPUT" ]]; then
        mkdir -p "$XML_OUTPUT"
        local xml_file="$XML_OUTPUT/${suite_name}_${TIMESTAMP}.xml"
        generate_junit_xml "$suite_name" "$test_file" "$run" "$passed" "$failed" "$xml_file"
        info "JUnit XML report: $xml_file"
    fi

    echo ""

    # Return exit code
    return $exit_code
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    print_banner

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --suite)
                RUN_SUITE="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --keep-artifacts)
                KEEP_ARTIFACTS=true
                shift
                ;;
            --xml-output)
                XML_OUTPUT="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Create reports directory
    mkdir -p "$REPORTS_DIR"

    # Show configuration
    info "Configuration:"
    echo "  AI_CORE_PATH: $AI_CORE_PATH"
    echo "  VERBOSE: $VERBOSE"
    echo "  KEEP_ARTIFACTS: $KEEP_ARTIFACTS"
    echo "  XML_OUTPUT: ${XML_OUTPUT:-none}"
    echo ""

    # Check if ai-core directory exists
    if [[ ! -d "$AI_CORE_PATH" ]]; then
        error "AI_CORE_PATH not found: $AI_CORE_PATH"
        exit 1
    fi

    # Run test suites
    local overall_exit_code=0

    if [[ -n "$RUN_SUITE" ]]; then
        # Run specific suite
        if [[ -n "${TEST_SUITES[$RUN_SUITE]}" ]]; then
            run_test_suite "$RUN_SUITE" "${TEST_SUITES[$RUN_SUITE]}"
            overall_exit_code=$?
        else
            error "Unknown test suite: $RUN_SUITE"
            echo "Available suites: ${!TEST_SUITES[*]}"
            exit 1
        fi
    else
        # Run all suites
        for suite in "${!TEST_SUITES[@]}"; do
            run_test_suite "$suite" "${TEST_SUITES[$suite]}"
            local exit_code=$?
            if [[ $exit_code -ne 0 ]]; then
                overall_exit_code=$exit_code
            fi
        done
    fi

    # Print summary
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}                    TEST SUMMARY                             ${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Print per-suite results
    for suite in "${!SUITE_RESULTS[@]}"; do
        local result="${SUITE_RESULTS[$suite]}"
        local run=$(echo "$result" | grep -o "run:[0-9]*" | grep -o "[0-9]*")
        local passed=$(echo "$result" | grep -o "passed:[0-9]*" | grep -o "[0-9]*")
        local failed=$(echo "$result" | grep -o "failed:[0-9]*" | grep -o "[0-9]*")
        local exit=$(echo "$result" | grep -o "exit:[0-9]*" | grep -o "[0-9]*")

        local status="${GREEN}✓${NC}"
        if [[ $exit -ne 0 ]]; then
            status="${RED}✗${NC}"
        fi

        echo -e "  $status ${BOLD}$suite${NC}: $passed/$run passed"
    done

    echo ""
    echo -e "${BOLD}Total:${NC}   $TOTAL_RUN tests"
    echo -e "  ${GREEN}Passed:${NC}   $TOTAL_PASSED"
    echo -e "  ${RED}Failed:${NC}   $TOTAL_FAILED"
    echo -e "  ${YELLOW}Skipped:${NC} $TOTAL_SKIPPED"
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"

    # Print report location
    if [[ -d "$REPORTS_DIR" ]]; then
        info "Test logs saved to: $REPORTS_DIR"
    fi

    # Exit with appropriate code
    if [[ $TOTAL_FAILED -gt 0 ]]; then
        echo ""
        error "Some tests failed!"
        exit 1
    elif [[ $overall_exit_code -ne 0 ]]; then
        echo ""
        error "Test execution failed!"
        exit 1
    else
        echo ""
        success "All tests passed!"
        exit 0
    fi
}

# Run main
main "$@"
