# AI-CORE TEST MAKEFILE
# ============================================================================
# Makefile for running ai-core tests
# ============================================================================
#
# Usage:
#   make test           # Run all tests
#   make test-integration  # Run integration tests only
#   make test-unit         # Run unit tests only
#   make test-validation   # Run validation tests only
#   make test-verbose      # Run with verbose output
#   make test-ci           # Generate JUnit XML reports
#
# ============================================================================

.PHONY: help test test-integration test-unit test-validation test-verbose test-ci test-quick test-debug

# Default target
help:
	@echo "AI-Core Test Commands"
	@echo ""
	@echo "Available targets:"
	@echo ""
	@echo "  make test              - Run all tests"
	@echo "  make test-integration  - Run integration tests only"
	@echo "  make test-unit         - Run unit tests only"
	@echo "  make test-validation   - Run validation tests only"
	@echo "  make test-verbose      - Run with verbose output"
	@echo "  make test-debug        - Run and keep artifacts for debugging"
	@echo "  make test-ci           - Generate JUnit XML reports (CI/CD)"
	@echo "  make test-quick        - Run quick tests (unit only)"
	@echo ""
	@echo "Examples:"
	@echo ""
	@echo "  make test                   # Run all tests"
	@echo "  make test-integration       # Run integration tests"
	@echo "  make test-verbose           # Verbose output"
	@echo "  make test-ci                # Generate XML reports"
	@echo ""

# Run all tests
test:
	@bash ./tests/run-all-tests.sh

# Run integration tests only
test-integration:
	@bash ./tests/run-all-tests.sh --suite integration

# Run unit tests only
test-unit:
	@bash ./tests/run-all-tests.sh --suite unit

# Run validation tests only
test-validation:
	@bash ./tests/run-all-tests.sh --suite validation

# Run tests with verbose output
test-verbose:
	@bash ./tests/run-all-tests.sh --verbose

# Run tests and keep artifacts for debugging
test-debug:
	@KEEP_TEST_ARTIFACTS=true bash ./tests/run-all-tests.sh --verbose

# Run tests and generate JUnit XML reports
test-ci:
	@mkdir -p ./tests/reports/xml
	@bash ./tests/run-all-tests.sh --xml-output ./tests/reports/xml

# Quick test (run only fast unit tests)
test-quick:
	@bash ./tests/run-all-tests.sh --suite unit

# Full test suite with verbose output and artifacts
test-full:
	@KEEP_TEST_ARTIFACTS=true bash ./tests/run-all-tests.sh --verbose

# Watch mode (run tests when files change)
test-watch:
	@echo "Watch mode not yet implemented. Use:"
	@echo "  fswatch -o tests/ | xargs -n1 -I{} make test"
