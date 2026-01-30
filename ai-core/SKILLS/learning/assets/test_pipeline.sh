#!/bin/bash
#
# Complete end-to-end test of Actor-Critic pipeline
#
# This script:
# 1. Generates synthetic test data
# 2. Trains the model
# 3. Evaluates the model
# 4. Compares with baseline
# 5. Generates monitoring report
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_CORE_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
DATA_DIR="$AI_CORE_ROOT/data/experience_buffer"
MODELS_DIR="$AI_CORE_ROOT/data/models"
METRICS_DIR="$AI_CORE_ROOT/data/metrics"

# Test data file
TEST_DATA="$DATA_DIR/test_experiences.jsonl"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI-CORE ACTOR-CRITIC PIPELINE TEST${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "This will test the complete Actor-Critic pipeline:"
echo "  1. Generate synthetic test data"
echo "  2. Train Actor-Critic model"
echo "  3. Evaluate trained model"
echo "  4. Compare with baseline"
echo "  5. Generate monitoring report"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create directories
echo -e "\n${BLUE}Creating directories...${NC}"
mkdir -p "$DATA_DIR"
mkdir -p "$MODELS_DIR"
mkdir -p "$METRICS_DIR"
echo -e "${GREEN}✓ Directories created${NC}"

# Step 1: Generate test data
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}STEP 1: Generating Test Data${NC}"
echo -e "${BLUE}========================================${NC}"

python3 "$SCRIPT_DIR/generate_test_data.py" \
    --count 1000 \
    --output "$TEST_DATA" \
    --seed 42

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to generate test data${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Test data generated${NC}"

# Step 2: Train model
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}STEP 2: Training Model${NC}"
echo -e "${BLUE}========================================${NC}"

python3 "$SCRIPT_DIR/train.py" \
    --data "$TEST_DATA" \
    --epochs 50 \
    --batch-size 64 \
    --output-dir "$MODELS_DIR"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Training failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Model trained${NC}"

# Step 3: Evaluate model
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}STEP 3: Evaluating Model${NC}"
echo -e "${BLUE}========================================${NC}"

MODEL_FILE="$MODELS_DIR/actor_checkpoint_v1.0.pt"
if [ ! -f "$MODEL_FILE" ]; then
    MODEL_FILE="$MODELS_DIR/actor_checkpoint_best.pt"
fi

python3 "$SCRIPT_DIR/evaluate.py" \
    --model "$MODEL_FILE" \
    --test-data "$TEST_DATA" \
    --output "$METRICS_DIR/evaluation_report.json"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Evaluation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Model evaluated${NC}"

# Step 4: Compare with baseline
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}STEP 4: Comparing with Baseline${NC}"
echo -e "${BLUE}========================================${NC}"

python3 "$SCRIPT_DIR/compare_policies.py" \
    --learned "$MODEL_FILE" \
    --test-data "$TEST_DATA" \
    --output "$METRICS_DIR/comparison_report.json"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Comparison failed (non-critical)${NC}"
else
    echo -e "${GREEN}✓ Comparison completed${NC}"
fi

# Step 5: Generate monitoring report
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}STEP 5: Monitoring Report${NC}"
echo -e "${BLUE}========================================${NC}"

python3 "$SCRIPT_DIR/monitor.py" \
    --data "$TEST_DATA" \
    --output "$METRICS_DIR/monitoring_report.json"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Monitoring failed (non-critical)${NC}"
else
    echo -e "${GREEN}✓ Monitoring report generated${NC}"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"

echo ""
echo -e "${GREEN}✓ All tests completed successfully!${NC}"
echo ""
echo "Generated files:"
echo "  - Test data: $TEST_DATA"
echo "  - Model: $MODEL_FILE"
echo "  - Training history: $MODELS_DIR/training_history.json"
echo "  - Evaluation report: $METRICS_DIR/evaluation_report.json"
echo "  - Comparison report: $METRICS_DIR/comparison_report.json"
echo "  - Monitoring report: $METRICS_DIR/monitoring_report.json"
echo ""
echo "To view results:"
echo "  cat $METRICS_DIR/evaluation_report.json | python3 -m json.tool"
echo "  cat $METRICS_DIR/comparison_report.json | python3 -m json.tool"
echo ""
echo -e "${BLUE}========================================${NC}"
